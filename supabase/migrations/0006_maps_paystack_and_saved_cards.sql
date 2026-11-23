-- 0006_maps_paystack_and_saved_cards.sql
-- 1. Hotel coordinates (Lagos) for interactive map & Get Directions
-- 2. Saved masked cards table (Paystack reusable authorizations — never raw PAN/CVV)
-- 3. Atomic pending_payment booking + 15-minute slot hold + expiry + idempotent payment confirmation RPCs

alter table public.hotels
  add column if not exists lat double precision,
  add column if not exists lng double precision;

-- Populate accurate Lagos coordinates for seeded hotels
update public.hotels set lat = 6.4519, lng = 3.4357 where slug = 'the-palms-ikoyi';
update public.hotels set lat = 6.4281, lng = 3.4219 where slug = 'marigold-vi';
update public.hotels set lat = 6.4474, lng = 3.4723 where slug = 'azure-courtyard-lekki';

-- Saved cards (stores ONLY Paystack authorization_code + masked display metadata)
create table if not exists public.saved_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  authorization_code text not null,
  brand text not null default 'visa',
  last4 text not null,
  exp_month text not null,
  exp_year text not null,
  bank text not null default '',
  cardholder_name text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, authorization_code)
);

create index if not exists idx_saved_cards_user_id on public.saved_cards(user_id);

alter table public.saved_cards enable row level security;

create policy "saved_cards_select_own"
  on public.saved_cards for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "saved_cards_delete_own"
  on public.saved_cards for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- Expire stale pending_payment bookings (Rule 8: 15-minute slot hold)
create or replace function public.expire_stale_pending_bookings()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  update public.bookings
  set status = 'expired'
  where status = 'pending_payment'
    and expires_at is not null
    and expires_at <= now();

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.expire_stale_pending_bookings() from public;
grant execute on function public.expire_stale_pending_bookings() to anon, authenticated;

-- Atomic Stage 2B booking initializer: enforces rules 1-8, holds slot for 15 minutes, creates payments row with DB price * 100 kobo
create or replace function public.create_pending_payment_booking(
  p_hotel_id uuid,
  p_room_type_id uuid,
  p_guest_name text,
  p_guest_phone text,
  p_guest_email text,
  p_booking_type text,
  p_check_in_date date,
  p_check_out_date date default null,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hotel public.hotels%rowtype;
  v_room public.room_types%rowtype;
  v_nights integer;
  v_amount_ngn integer;
  v_amount_kobo bigint;
  v_commission_ngn integer;
  v_day_count integer;
  v_night_overlap integer;
  v_total_on_day integer;
  v_blackout_reason text;
  v_stack_exists boolean;
  v_check_date date;
  v_booking_id uuid;
  v_reference text;
  v_expires_at timestamptz := now() + interval '15 minutes';
  v_today_lagos date := (now() at time zone 'Africa/Lagos')::date;
  v_uid uuid := (select auth.uid());
begin
  -- First sweep any expired holds
  perform public.expire_stale_pending_bookings();

  if trim(coalesce(p_guest_name, '')) = '' then
    return jsonb_build_object('ok', false, 'error', 'Please enter your full name.');
  end if;

  if trim(coalesce(p_guest_email, '')) !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    return jsonb_build_object('ok', false, 'error', 'Please enter a valid email address for your receipt.');
  end if;

  if p_guest_phone !~ '^\+234[789][01]\d{8}$' then
    return jsonb_build_object('ok', false, 'error', 'Please enter a valid Nigerian WhatsApp number.');
  end if;

  if p_booking_type not in ('day', 'night') then
    return jsonb_build_object('ok', false, 'error', 'Booking type must be day or night.');
  end if;

  if p_check_in_date is null or p_check_in_date < v_today_lagos then
    return jsonb_build_object('ok', false, 'error', 'Check-in date cannot be in the past.');
  end if;

  select * into v_room
  from public.room_types
  where id = p_room_type_id and hotel_id = p_hotel_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Selected room type was not found for this hotel.');
  end if;

  select * into v_hotel
  from public.hotels
  where id = p_hotel_id and status = 'approved';

  if not found then
    return jsonb_build_object('ok', false, 'error', 'This hotel is currently not accepting bookings.');
  end if;

  if p_booking_type = 'day' then
    if v_room.day_price_ngn is null or v_room.day_rooms_per_day <= 0 then
      return jsonb_build_object('ok', false, 'error', 'This room type does not offer day stays.');
    end if;
    p_check_out_date := null;
    v_nights := 1;
    v_amount_ngn := v_room.day_price_ngn;
  else
    if p_check_out_date is null or p_check_out_date <= p_check_in_date then
      return jsonb_build_object('ok', false, 'error', 'Check-out date must be after check-in date.');
    end if;
    v_nights := (p_check_out_date - p_check_in_date);
    if v_nights > 30 then
      return jsonb_build_object('ok', false, 'error', 'Night stays cannot exceed 30 nights per request.');
    end if;
    v_amount_ngn := v_room.night_price_ngn * v_nights;
  end if;

  v_amount_kobo := v_amount_ngn::bigint * 100;
  v_commission_ngn := round(v_amount_ngn * (v_hotel.commission_rate / 100.0))::integer;

  -- Rule 3: Blackout dates
  if p_booking_type = 'day' then
    select reason into v_blackout_reason
    from public.blackout_dates
    where hotel_id = p_hotel_id
      and (room_type_id is null or room_type_id = p_room_type_id)
      and date = p_check_in_date
      and applies_to in ('day', 'both')
    limit 1;

    if found then
      return jsonb_build_object('ok', false, 'error', coalesce('Day stays are unavailable: ' || v_blackout_reason, 'Day stays are blocked on this date.'));
    end if;
  else
    select reason into v_blackout_reason
    from public.blackout_dates
    where hotel_id = p_hotel_id
      and (room_type_id is null or room_type_id = p_room_type_id)
      and date >= p_check_in_date
      and date < p_check_out_date
      and applies_to in ('night', 'both')
    limit 1;

    if found then
      return jsonb_build_object('ok', false, 'error', coalesce('Selected dates include a blackout date: ' || v_blackout_reason, 'One or more selected dates are unavailable.'));
    end if;
  end if;

  -- Rule 5: No stacking
  if p_booking_type = 'day' then
    select exists (
      select 1 from public.bookings b
      where b.hotel_id = p_hotel_id
        and b.guest_phone = p_guest_phone
        and b.booking_type = 'night'
        and (
          b.status in ('requested', 'confirmed')
          or (b.status = 'pending_payment' and (b.expires_at is null or b.expires_at > now()))
        )
        and p_check_in_date >= b.check_in_date
        and p_check_in_date < b.check_out_date
    ) into v_stack_exists;

    if v_stack_exists then
      return jsonb_build_object('ok', false, 'error', 'You already have an overlapping night stay at this hotel on that date.');
    end if;
  else
    select exists (
      select 1 from public.bookings b
      where b.hotel_id = p_hotel_id
        and b.guest_phone = p_guest_phone
        and b.booking_type = 'day'
        and (
          b.status in ('requested', 'confirmed')
          or (b.status = 'pending_payment' and (b.expires_at is null or b.expires_at > now()))
        )
        and b.check_in_date >= p_check_in_date
        and b.check_in_date < p_check_out_date
    ) into v_stack_exists;

    if v_stack_exists then
      return jsonb_build_object('ok', false, 'error', 'You already have an overlapping day stay at this hotel during those dates.');
    end if;
  end if;

  -- Rules 2, 6, 7: Availability
  if p_booking_type = 'day' then
    select count(*) into v_day_count
    from public.bookings b
    where b.room_type_id = p_room_type_id
      and b.booking_type = 'day'
      and b.check_in_date = p_check_in_date
      and (
        b.status in ('requested', 'confirmed')
        or (b.status = 'pending_payment' and (b.expires_at is null or b.expires_at > now()))
      );

    if v_day_count >= v_room.day_rooms_per_day then
      return jsonb_build_object('ok', false, 'error', 'Day-stay allotment for this room is full on the selected date.');
    end if;

    if v_hotel.check_in_time <= v_hotel.day_end then
      select count(*) into v_night_overlap
      from public.bookings b
      where b.room_type_id = p_room_type_id
        and b.booking_type = 'night'
        and p_check_in_date >= b.check_in_date
        and p_check_in_date < b.check_out_date
        and (
          b.status in ('requested', 'confirmed')
          or (b.status = 'pending_payment' and (b.expires_at is null or b.expires_at > now()))
        );

      if (v_day_count + v_night_overlap) >= v_room.total_rooms then
        return jsonb_build_object('ok', false, 'error', 'No rooms are available for a day stay on that date.');
      end if;
    end if;
  else
    v_check_date := p_check_in_date;
    while v_check_date < p_check_out_date loop
      select count(*) into v_night_overlap
      from public.bookings b
      where b.room_type_id = p_room_type_id
        and b.booking_type = 'night'
        and v_check_date >= b.check_in_date
        and v_check_date < b.check_out_date
        and (
          b.status in ('requested', 'confirmed')
          or (b.status = 'pending_payment' and (b.expires_at is null or b.expires_at > now()))
        );

      if v_hotel.check_in_time <= v_hotel.day_end then
        select count(*) into v_day_count
        from public.bookings b
        where b.room_type_id = p_room_type_id
          and b.booking_type = 'day'
          and b.check_in_date = v_check_date
          and (
            b.status in ('requested', 'confirmed')
            or (b.status = 'pending_payment' and (b.expires_at is null or b.expires_at > now()))
          );
        v_total_on_day := v_night_overlap + v_day_count;
      else
        v_total_on_day := v_night_overlap;
      end if;

      if v_total_on_day >= v_room.total_rooms then
        return jsonb_build_object('ok', false, 'error', 'This room type is sold out on ' || to_char(v_check_date, 'Mon DD, YYYY') || '.');
      end if;

      v_check_date := v_check_date + 1;
    end loop;
  end if;

  insert into public.bookings (
    hotel_id,
    room_type_id,
    guest_user_id,
    guest_name,
    guest_phone,
    guest_email,
    booking_type,
    check_in_date,
    check_out_date,
    amount_ngn,
    commission_ngn,
    status,
    expires_at,
    notes
  )
  values (
    p_hotel_id,
    p_room_type_id,
    v_uid,
    trim(p_guest_name),
    p_guest_phone,
    lower(trim(p_guest_email)),
    p_booking_type,
    p_check_in_date,
    p_check_out_date,
    v_amount_ngn,
    v_commission_ngn,
    'pending_payment',
    v_expires_at,
    nullif(trim(coalesce(p_notes, '')), '')
  )
  returning id into v_booking_id;

  v_reference := 'STY-' || upper(replace(left(v_booking_id::text, 8), '-', '')) || '-' || floor(extract(epoch from now()))::text;

  insert into public.payments (
    booking_id,
    reference,
    amount_kobo,
    currency,
    status
  )
  values (
    v_booking_id,
    v_reference,
    v_amount_kobo,
    'NGN',
    'pending'
  );

  return jsonb_build_object(
    'ok', true,
    'booking_id', v_booking_id,
    'reference', v_reference,
    'amount_ngn', v_amount_ngn,
    'amount_kobo', v_amount_kobo,
    'nights', v_nights,
    'expires_at', v_expires_at,
    'hotel_name', v_hotel.name,
    'hotel_slug', v_hotel.slug,
    'hotel_whatsapp', v_hotel.whatsapp,
    'room_name', v_room.name,
    'day_start', v_hotel.day_start::text,
    'day_end', v_hotel.day_end::text
  );
end;
$$;

revoke all on function public.create_pending_payment_booking(uuid, uuid, text, text, text, text, date, date, text) from public;
grant execute on function public.create_pending_payment_booking(uuid, uuid, text, text, text, text, date, date, text) to anon, authenticated;

-- Idempotent payment completion RPC (called by verified Paystack webhook or verified callback)
create or replace function public.confirm_paystack_payment(
  p_reference text,
  p_paystack_transaction_id text,
  p_amount_kobo bigint,
  p_raw_event jsonb default null,
  p_auth_code text default null,
  p_card_brand text default null,
  p_card_last4 text default null,
  p_card_exp_month text default null,
  p_card_exp_year text default null,
  p_card_bank text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment public.payments%rowtype;
  v_booking public.bookings%rowtype;
  v_hotel public.hotels%rowtype;
  v_room public.room_types%rowtype;
begin
  select * into v_payment
  from public.payments
  where reference = p_reference
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Payment reference not found.');
  end if;

  if v_payment.amount_kobo <> p_amount_kobo then
    return jsonb_build_object('ok', false, 'error', 'Payment amount mismatch.');
  end if;

  select * into v_booking from public.bookings where id = v_payment.booking_id for update;
  select * into v_hotel from public.hotels where id = v_booking.hotel_id;
  select * into v_room from public.room_types where id = v_booking.room_type_id;

  -- Idempotency: if already succeeded, return summary without double-processing
  if v_payment.status = 'success' then
    return jsonb_build_object(
      'ok', true,
      'already_processed', true,
      'booking_id', v_booking.id,
      'hotel_name', v_hotel.name,
      'hotel_slug', v_hotel.slug,
      'hotel_whatsapp', v_hotel.whatsapp,
      'room_name', v_room.name,
      'guest_name', v_booking.guest_name,
      'guest_phone', v_booking.guest_phone,
      'linked_to_user', (v_booking.guest_user_id is not null),
      'booking_type', v_booking.booking_type,
      'check_in_date', v_booking.check_in_date,
      'check_out_date', v_booking.check_out_date,
      'amount_ngn', v_booking.amount_ngn,
      'day_start', v_hotel.day_start::text,
      'day_end', v_hotel.day_end::text
    );
  end if;

  update public.payments
  set
    status = 'success',
    paystack_transaction_id = p_paystack_transaction_id,
    paid_at = now(),
    raw_event = coalesce(p_raw_event, raw_event)
  where id = v_payment.id;

  update public.bookings
  set status = 'requested'
  where id = v_booking.id
    and status in ('pending_payment', 'expired');

  -- Save masked card authorization if user is signed in and card is reusable
  if v_booking.guest_user_id is not null
     and coalesce(p_auth_code, '') <> ''
     and coalesce(p_card_last4, '') <> '' then
    insert into public.saved_cards (
      user_id, authorization_code, brand, last4, exp_month, exp_year, bank, cardholder_name
    )
    values (
      v_booking.guest_user_id,
      p_auth_code,
      coalesce(lower(p_card_brand), 'visa'),
      p_card_last4,
      coalesce(p_card_exp_month, '12'),
      coalesce(p_card_exp_year, '2030'),
      coalesce(p_card_bank, ''),
      v_booking.guest_name
    )
    on conflict (user_id, authorization_code) do nothing;
  end if;

  return jsonb_build_object(
    'ok', true,
    'already_processed', false,
    'booking_id', v_booking.id,
    'hotel_name', v_hotel.name,
    'hotel_slug', v_hotel.slug,
    'hotel_whatsapp', v_hotel.whatsapp,
    'room_name', v_room.name,
    'guest_name', v_booking.guest_name,
    'guest_phone', v_booking.guest_phone,
    'linked_to_user', (v_booking.guest_user_id is not null),
    'booking_type', v_booking.booking_type,
    'check_in_date', v_booking.check_in_date,
    'check_out_date', v_booking.check_out_date,
    'amount_ngn', v_booking.amount_ngn,
    'day_start', v_hotel.day_start::text,
    'day_end', v_hotel.day_end::text
  );
end;
$$;

revoke all on function public.confirm_paystack_payment(text, text, bigint, jsonb, text, text, text, text, text, text) from public;
grant execute on function public.confirm_paystack_payment(text, text, bigint, jsonb, text, text, text, text, text, text) to anon, authenticated;
