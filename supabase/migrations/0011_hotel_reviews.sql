-- 0011_hotel_reviews.sql
-- Verified-guest hotel ratings & reviews with mandatory moderation (pending by default)

create table if not exists public.hotel_reviews (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  guest_user_id uuid not null references auth.users(id) on delete cascade,
  guest_name text not null,
  rating int not null check (rating between 1 and 5),
  comment text not null check (char_length(trim(comment)) >= 4 and char_length(comment) <= 800),
  stay_type text not null default 'day' check (stay_type in ('day', 'night')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  constraint hotel_reviews_one_per_booking unique (booking_id)
);

create index if not exists idx_hotel_reviews_hotel_status_created
  on public.hotel_reviews (hotel_id, status, created_at desc);

create index if not exists idx_hotel_reviews_guest_user_id
  on public.hotel_reviews (guest_user_id);

alter table public.hotel_reviews enable row level security;

-- Public & authenticated users can read approved reviews;
-- guests can also see their own pending/rejected reviews;
-- hotel owners can view reviews for their hotel; super admins see all.
create policy "hotel_reviews_select_policy"
  on public.hotel_reviews
  for select
  to anon, authenticated
  using (
    status = 'approved'
    or guest_user_id = (select auth.uid())
    or private.owns_hotel(hotel_id)
    or private.is_super_admin()
  );

-- Only the authenticated guest who actually booked this hotel (confirmed/completed)
-- can insert a review, and it MUST start as 'pending' (unapproved).
create policy "hotel_reviews_insert_verified_guest"
  on public.hotel_reviews
  for insert
  to authenticated
  with check (
    guest_user_id = (select auth.uid())
    and status = 'pending'
    and exists (
      select 1
      from public.bookings b
      where b.id = booking_id
        and b.hotel_id = hotel_reviews.hotel_id
        and b.guest_user_id = (select auth.uid())
        and b.status in ('confirmed', 'completed')
    )
  );

-- Only super admins can approve or reject reviews
create policy "hotel_reviews_update_super_admin"
  on public.hotel_reviews
  for update
  to authenticated
  using (private.is_super_admin())
  with check (private.is_super_admin());

create policy "hotel_reviews_delete_super_admin"
  on public.hotel_reviews
  for delete
  to authenticated
  using (private.is_super_admin());
