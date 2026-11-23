-- 0010_amenities.sql
-- Structured hotel & room amenities (Pool Access, Free Breakfast, Coffee & Tea, Free Wi-Fi, etc.)

alter table public.hotels
  add column if not exists amenities text[] not null default '{}';

alter table public.room_types
  add column if not exists amenities text[] not null default '{}';

-- Seed realistic amenities on the 3 Lagos partner hotels
update public.hotels
set amenities = array['Free Wi-Fi', 'Pool Access', 'Coffee & Tea', '24/7 Power', 'Free Parking', 'Workspace']
where slug = 'the-palms-ikoyi';

update public.hotels
set amenities = array['Free Wi-Fi', 'Free Breakfast', 'Coffee & Tea', '24/7 Power', 'Workspace', 'Restaurant & Bar']
where slug = 'marigold-vi';

update public.hotels
set amenities = array['Free Wi-Fi', 'Pool Access', 'Coffee & Tea', '24/7 Power', 'Free Parking']
where slug = 'azure-courtyard-lekki';

-- Seed room-level perks
update public.room_types
set amenities = array['Free Wi-Fi', 'Pool Access', 'Coffee & Tea', 'Air Conditioning']
where id = '33333333-3333-4333-8333-333333333301';

update public.room_types
set amenities = array['Free Wi-Fi', 'Pool Access', 'Free Breakfast', 'Coffee & Tea', 'Workspace']
where id = '33333333-3333-4333-8333-333333333302';

update public.room_types
set amenities = array['Free Wi-Fi', 'Coffee & Tea', 'Workspace', 'Air Conditioning']
where id = '33333333-3333-4333-8333-333333333303';

update public.room_types
set amenities = array['Free Wi-Fi', 'Free Breakfast', 'Coffee & Tea', 'Workspace']
where id = '33333333-3333-4333-8333-333333333304';

update public.room_types
set amenities = array['Free Wi-Fi', 'Pool Access', 'Air Conditioning']
where id = '33333333-3333-4333-8333-333333333305';

update public.room_types
set amenities = array['Free Wi-Fi', 'Pool Access', 'Coffee & Tea', 'Workspace']
where id = '33333333-3333-4333-8333-333333333306';
