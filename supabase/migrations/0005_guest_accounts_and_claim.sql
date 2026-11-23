-- 0005_guest_accounts_and_claim.sql
-- Support guest user accounts, linking bookings to guest_user_id, and claiming a booking after signup/signin.

-- 1. Allow 'guest' role in public.profiles and default new signups to 'guest'
alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('guest', 'hotel_admin', 'super_admin'));

alter table public.profiles
  alter column role set default 'guest';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role, full_name, phone)
  values (
    new.id,
    'guest',
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

-- 2. Add guest_user_id to public.bookings
alter table public.bookings
  add column if not exists guest_user_id uuid references auth.users(id) on delete set null;

create index if not exists idx_bookings_guest_user_id on public.bookings(guest_user_id);

-- 3. Allow authenticated guests to read their own bookings
create policy "bookings_select_own_guest"
  on public.bookings for select
  to authenticated
  using (guest_user_id = (select auth.uid()));

-- 4. Update create_guest_booking_request to automatically attach auth.uid() when signed in
create or replace function public.create_guest_booking_request(
  p_hotel_id uuid,
  p_room_type_id uuid,
  p_guest_name text,
  p_guest_phone text,
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
  v_commission_ngn integer;
  v_day_count integer;
  v_night_overlap integer;
  v_total_on_day integer;
  v_blackout_reason text;
  v_stack_exists boolean;
  v_check_date date;
  v_booking_id uuid;
  v_today_lagos date := (now() at time zone 'Africa/Lagos')::date;
  v_uid uuid := (select auth.uid());
begin
  if trim(coalesce(p_guest_name, '')) = '' then
    return jsonb_build_object('ok', false, 'error', 'Please enter your full name.');
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

  v_commission_ngn := round(v_amount_ngn * (v_hotel.commission_rate / 100.0))::integer;

  if p_booking_type = 'day' then
    select reason into v_blackout_reason
    from public.blackout_dates
    where hotel_id = p_hotel_id
      and (room_type_id is null or room_type_id = p_room_type_id)
      and date = p_check_in_date
      and applies_to in ('day', 'both')
    limit 1;

    if found then
      return jsonb_build_object(
        'ok', false,
        'error', coalesce('Day stays are unavailable on this date: ' || v_blackout_reason, 'Day stays are blocked on this date.')
      );
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
      return jsonb_build_object(
        'ok', false,
        'error', coalesce('Selected dates include a blackout date: ' || v_blackout_reason, 'One or more selected dates are unavailable.')
      );
    end if;
  end if;

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
        return jsonb_build_object(
          'ok', false,
          'error', 'This room type is sold out on ' || to_char(v_check_date, 'Mon DD, YYYY') || '.'
        );
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
    booking_type,
    check_in_date,
    check_out_date,
    amount_ngn,
    commission_ngn,
    status,
    notes
  )
  values (
    p_hotel_id,
    p_room_type_id,
    v_uid,
    trim(p_guest_name),
    p_guest_phone,
    p_booking_type,
    p_check_in_date,
    p_check_out_date,
    v_amount_ngn,
    v_commission_ngn,
    'requested',
    nullif(trim(coalesce(p_notes, '')), '')
  )
  returning id into v_booking_id;

  return jsonb_build_object(
    'ok', true,
    'booking_id', v_booking_id,
    'amount_ngn', v_amount_ngn,
    'nights', v_nights,
    'hotel_name', v_hotel.name,
    'hotel_whatsapp', v_hotel.whatsapp,
    'room_name', v_room.name,
    'day_start', v_hotel.day_start::text,
    'day_end', v_hotel.day_end::text
  );
end;
$$;

-- 5. Post-booking claim RPC: lets a newly signed-in/signed-up user link their unclaimed booking (verified by booking_id + phone)
create or replace function public.claim_guest_booking(
  p_booking_id uuid,
  p_guest_phone text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_updated integer;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'Please sign in first.');
  end if;

  update public.bookings
  set guest_user_id = v_uid
  where id = p_booking_id
    and guest_phone = p_guest_phone
    and guest_user_id is null;

  get diagnostics v_updated = row_count;

  if v_updated = 0 then
    return jsonb_build_object('ok', false, 'error', 'Booking not found or already linked.');
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.claim_guest_booking(uuid, text) from public, anon;
grant execute on function public.claim_guest_booking(uuid, text) to authenticated;
