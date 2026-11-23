-- 0002_rls_policies.sql
-- Private RLS helper functions and Row Level Security policies for Stayside

create schema if not exists private;

-- Helper: check if the current authenticated user is a super_admin
create or replace function private.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'super_admin'
  );
$$;

-- Helper: check if the current authenticated user owns a given hotel
create or replace function private.owns_hotel(p_hotel_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.hotels h
    where h.id = p_hotel_id
      and h.owner_id = (select auth.uid())
  );
$$;

revoke all on schema private from public;
grant usage on schema private to authenticated;
revoke all on function private.is_super_admin() from public;
revoke all on function private.owns_hotel(uuid) from public;
grant execute on function private.is_super_admin() to authenticated;
grant execute on function private.owns_hotel(uuid) to authenticated;

-- Enable RLS on every public table
alter table public.profiles enable row level security;
alter table public.hotels enable row level security;
alter table public.room_types enable row level security;
alter table public.blackout_dates enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;
alter table public.hotel_sites enable row level security;
alter table public.payouts enable row level security;

-- ============================================================================
-- PROFILES
-- ============================================================================
create policy "profiles_select_own_or_super_admin"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()) or private.is_super_admin());

create policy "profiles_update_own_or_super_admin"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()) or private.is_super_admin())
  with check (
    private.is_super_admin()
    or (
      id = (select auth.uid())
      and role = (select p.role from public.profiles p where p.id = (select auth.uid()))
    )
  );

create policy "profiles_insert_super_admin"
  on public.profiles for insert
  to authenticated
  with check (private.is_super_admin());

create policy "profiles_delete_super_admin"
  on public.profiles for delete
  to authenticated
  using (private.is_super_admin());

-- ============================================================================
-- HOTELS
-- ============================================================================
-- Public (anon & authenticated) can read approved hotels
create policy "hotels_select_public_approved"
  on public.hotels for select
  to anon, authenticated
  using (status = 'approved');

-- Hotel admins can read their own hotels (even if pending or suspended); super admin reads all
create policy "hotels_select_owner_or_super_admin"
  on public.hotels for select
  to authenticated
  using (owner_id = (select auth.uid()) or private.is_super_admin());

-- Hotel admins can create a pending hotel for themselves; super admin can create any
create policy "hotels_insert_owner_or_super_admin"
  on public.hotels for insert
  to authenticated
  with check (
    private.is_super_admin()
    or (owner_id = (select auth.uid()) and status = 'pending')
  );

-- Hotel admins can update their own hotel (cannot self-approve or change owner/plan/commission)
create policy "hotels_update_owner_or_super_admin"
  on public.hotels for update
  to authenticated
  using (owner_id = (select auth.uid()) or private.is_super_admin())
  with check (
    private.is_super_admin()
    or (owner_id = (select auth.uid()))
  );

create policy "hotels_delete_super_admin"
  on public.hotels for delete
  to authenticated
  using (private.is_super_admin());

-- ============================================================================
-- ROOM TYPES
-- ============================================================================
create policy "room_types_select_public_approved_hotel"
  on public.room_types for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.hotels h
      where h.id = room_types.hotel_id
        and h.status = 'approved'
    )
  );

create policy "room_types_select_owner_or_super_admin"
  on public.room_types for select
  to authenticated
  using (private.owns_hotel(hotel_id) or private.is_super_admin());

create policy "room_types_insert_owner_or_super_admin"
  on public.room_types for insert
  to authenticated
  with check (private.owns_hotel(hotel_id) or private.is_super_admin());

create policy "room_types_update_owner_or_super_admin"
  on public.room_types for update
  to authenticated
  using (private.owns_hotel(hotel_id) or private.is_super_admin())
  with check (private.owns_hotel(hotel_id) or private.is_super_admin());

create policy "room_types_delete_owner_or_super_admin"
  on public.room_types for delete
  to authenticated
  using (private.owns_hotel(hotel_id) or private.is_super_admin());

-- ============================================================================
-- BLACKOUT DATES
-- ============================================================================
create policy "blackout_dates_select_public_approved_hotel"
  on public.blackout_dates for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.hotels h
      where h.id = blackout_dates.hotel_id
        and h.status = 'approved'
    )
  );

create policy "blackout_dates_select_owner_or_super_admin"
  on public.blackout_dates for select
  to authenticated
  using (private.owns_hotel(hotel_id) or private.is_super_admin());

create policy "blackout_dates_insert_owner_or_super_admin"
  on public.blackout_dates for insert
  to authenticated
  with check (private.owns_hotel(hotel_id) or private.is_super_admin());

create policy "blackout_dates_update_owner_or_super_admin"
  on public.blackout_dates for update
  to authenticated
  using (private.owns_hotel(hotel_id) or private.is_super_admin())
  with check (private.owns_hotel(hotel_id) or private.is_super_admin());

create policy "blackout_dates_delete_owner_or_super_admin"
  on public.blackout_dates for delete
  to authenticated
  using (private.owns_hotel(hotel_id) or private.is_super_admin());

-- ============================================================================
-- BOOKINGS (no direct public/anon access; guests book via server actions only)
-- ============================================================================
create policy "bookings_select_owner_or_super_admin"
  on public.bookings for select
  to authenticated
  using (private.owns_hotel(hotel_id) or private.is_super_admin());

create policy "bookings_update_owner_or_super_admin"
  on public.bookings for update
  to authenticated
  using (private.owns_hotel(hotel_id) or private.is_super_admin())
  with check (private.owns_hotel(hotel_id) or private.is_super_admin());

create policy "bookings_insert_super_admin"
  on public.bookings for insert
  to authenticated
  with check (private.is_super_admin());

create policy "bookings_delete_super_admin"
  on public.bookings for delete
  to authenticated
  using (private.is_super_admin());

-- ============================================================================
-- PAYMENTS (no direct public/anon access)
-- ============================================================================
create policy "payments_select_owner_or_super_admin"
  on public.payments for select
  to authenticated
  using (
    private.is_super_admin()
    or exists (
      select 1
      from public.bookings b
      where b.id = payments.booking_id
        and private.owns_hotel(b.hotel_id)
    )
  );

create policy "payments_manage_super_admin"
  on public.payments for all
  to authenticated
  using (private.is_super_admin())
  with check (private.is_super_admin());

-- ============================================================================
-- HOTEL SITES
-- ============================================================================
create policy "hotel_sites_select_public_published"
  on public.hotel_sites for select
  to anon, authenticated
  using (
    published = true
    and exists (
      select 1 from public.hotels h
      where h.id = hotel_sites.hotel_id
        and h.status = 'approved'
    )
  );

create policy "hotel_sites_select_owner_or_super_admin"
  on public.hotel_sites for select
  to authenticated
  using (private.owns_hotel(hotel_id) or private.is_super_admin());

create policy "hotel_sites_insert_owner_or_super_admin"
  on public.hotel_sites for insert
  to authenticated
  with check (private.owns_hotel(hotel_id) or private.is_super_admin());

create policy "hotel_sites_update_owner_or_super_admin"
  on public.hotel_sites for update
  to authenticated
  using (private.owns_hotel(hotel_id) or private.is_super_admin())
  with check (private.owns_hotel(hotel_id) or private.is_super_admin());

create policy "hotel_sites_delete_super_admin"
  on public.hotel_sites for delete
  to authenticated
  using (private.is_super_admin());

-- ============================================================================
-- PAYOUTS (hotel admin reads own payouts; super admin manages all)
-- ============================================================================
create policy "payouts_select_owner_or_super_admin"
  on public.payouts for select
  to authenticated
  using (private.owns_hotel(hotel_id) or private.is_super_admin());

create policy "payouts_manage_super_admin"
  on public.payouts for all
  to authenticated
  using (private.is_super_admin())
  with check (private.is_super_admin());

-- Guard trigger: prevent non-super-admins from changing restricted hotel fields
create or replace function private.guard_hotel_restricted_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null and not private.is_super_admin() then
    if new.status is distinct from old.status
      or new.plan is distinct from old.plan
      or new.commission_rate is distinct from old.commission_rate
      or new.owner_id is distinct from old.owner_id then
      raise exception 'Only super admins can modify status, plan, commission_rate, or owner_id';
    end if;
  end if;
  return new;
end;
$$;

create trigger guard_hotel_restricted_fields_trigger
  before update on public.hotels
  for each row execute function private.guard_hotel_restricted_fields();
