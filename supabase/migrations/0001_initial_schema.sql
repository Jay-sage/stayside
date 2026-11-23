-- 0001_initial_schema.sql
-- Stayside initial Postgres schema

create extension if not exists pgcrypto;

-- 1. Profiles (1:1 with auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'hotel_admin' check (role in ('hotel_admin', 'super_admin')),
  full_name text not null default '',
  phone text,
  created_at timestamptz not null default now()
);

-- 2. Hotels
create table public.hotels (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  name text not null,
  slug text not null unique,
  area text not null,
  address text not null default '',
  description text not null default '',
  photos text[] not null default '{}',
  phone text not null default '',
  whatsapp text not null default '',
  check_in_time time not null default '14:00',
  check_out_time time not null default '12:00',
  day_start time not null default '10:00',
  day_end time not null default '17:00',
  status text not null default 'pending' check (status in ('pending', 'approved', 'suspended')),
  plan text not null default 'free' check (plan in ('free', 'paid')),
  commission_rate numeric(5, 2) not null default 10.00 check (commission_rate >= 0 and commission_rate <= 100),
  created_at timestamptz not null default now(),
  constraint hotels_day_window_valid check (day_end > day_start)
);

create index idx_hotels_owner_id on public.hotels(owner_id);
create index idx_hotels_status on public.hotels(status);
create index idx_hotels_area on public.hotels(area);

-- 3. Room types
create table public.room_types (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  name text not null,
  description text not null default '',
  night_price_ngn integer not null check (night_price_ngn > 0),
  day_price_ngn integer check (day_price_ngn is null or day_price_ngn > 0),
  capacity integer not null default 2 check (capacity > 0),
  total_rooms integer not null default 1 check (total_rooms > 0),
  day_rooms_per_day integer not null default 0 check (day_rooms_per_day >= 0),
  photos text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index idx_room_types_hotel_id on public.room_types(hotel_id);

-- 4. Blackout dates
create table public.blackout_dates (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  room_type_id uuid references public.room_types(id) on delete cascade,
  date date not null,
  applies_to text not null default 'both' check (applies_to in ('night', 'day', 'both')),
  reason text,
  created_at timestamptz not null default now()
);

create index idx_blackout_dates_hotel_date on public.blackout_dates(hotel_id, date);
create index idx_blackout_dates_room_type_id on public.blackout_dates(room_type_id);

-- 5. Bookings
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels(id) on delete restrict,
  room_type_id uuid not null references public.room_types(id) on delete restrict,
  guest_name text not null,
  guest_phone text not null,
  guest_email text,
  booking_type text not null check (booking_type in ('night', 'day')),
  check_in_date date not null,
  check_out_date date,
  amount_ngn integer not null check (amount_ngn > 0),
  commission_ngn integer not null default 0 check (commission_ngn >= 0),
  status text not null default 'pending_payment' check (
    status in (
      'pending_payment',
      'requested',
      'confirmed',
      'declined',
      'cancelled',
      'completed',
      'expired'
    )
  ),
  expires_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  constraint bookings_dates_valid check (
    (booking_type = 'day' and check_out_date is null)
    or (booking_type = 'night' and check_out_date is not null and check_out_date > check_in_date)
  )
);

create index idx_bookings_hotel_status_date on public.bookings(hotel_id, status, check_in_date);
create index idx_bookings_room_type_date on public.bookings(room_type_id, check_in_date);
create index idx_bookings_guest_phone on public.bookings(guest_phone);

-- 6. Payments
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  reference text not null unique,
  amount_kobo bigint not null check (amount_kobo > 0),
  currency text not null default 'NGN',
  status text not null default 'pending' check (status in ('pending', 'success', 'failed', 'refunded')),
  paystack_transaction_id text,
  paid_at timestamptz,
  raw_event jsonb,
  created_at timestamptz not null default now()
);

create index idx_payments_booking_id on public.payments(booking_id);

-- 7. Hotel one-pager sites
create table public.hotel_sites (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null unique references public.hotels(id) on delete cascade,
  subdomain text not null unique,
  content jsonb not null default '{}'::jsonb,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

-- 8. Manual monthly payouts (Stage 4 super admin)
create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  period_month text not null check (period_month ~ '^\d{4}-\d{2}$'),
  amount_ngn integer not null check (amount_ngn >= 0),
  paid_out_at timestamptz not null default now(),
  notes text,
  unique (hotel_id, period_month)
);

create index idx_payouts_hotel_id on public.payouts(hotel_id);

-- Auto-create profile row when a new auth user signs up
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
    'hotel_admin',
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
