-- 0012_hotel_branches.sql
-- Multi-branch hotel support: one hotel partner can run unlimited branches,
-- each with independent rooms, pricing, hours, photos, amenities, and bookings.

alter table public.hotels
  add column if not exists parent_hotel_id uuid references public.hotels(id) on delete set null,
  add column if not exists branch_label text;

create index if not exists idx_hotels_parent_hotel_id
  on public.hotels (parent_hotel_id);

-- Backfill branch_label from area for existing hotels
update public.hotels
set branch_label = area
where branch_label is null;
