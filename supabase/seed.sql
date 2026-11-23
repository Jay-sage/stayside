-- supabase/seed.sql
-- Idempotent seed script: 1 super admin, 3 Lagos hotel admins, 3 approved Lagos hotels, 6 room types, 3 hotel_sites, and 2 sample bookings for RLS testing.

do $$
declare
  v_super_id uuid := '11111111-1111-4111-8111-111111111101';
  v_admin1_id uuid := '11111111-1111-4111-8111-111111111102';
  v_admin2_id uuid := '11111111-1111-4111-8111-111111111103';
  v_admin3_id uuid := '11111111-1111-4111-8111-111111111104';

  v_hotel1_id uuid := '22222222-2222-4222-8222-222222222201';
  v_hotel2_id uuid := '22222222-2222-4222-8222-222222222202';
  v_hotel3_id uuid := '22222222-2222-4222-8222-222222222203';

  v_room1a_id uuid := '33333333-3333-4333-8333-333333333301';
  v_room1b_id uuid := '33333333-3333-4333-8333-333333333302';
  v_room2a_id uuid := '33333333-3333-4333-8333-333333333303';
  v_room2b_id uuid := '33333333-3333-4333-8333-333333333304';
  v_room3a_id uuid := '33333333-3333-4333-8333-333333333305';
  v_room3b_id uuid := '33333333-3333-4333-8333-333333333306';
begin
  -- Create test auth users (idempotent)
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token,
    email_change_token_new, email_change
  )
  values
    (
      '00000000-0000-0000-0000-000000000000', v_super_id, 'authenticated', 'authenticated',
      'admin@stayside.ng', extensions.crypt('StaysideAdmin123!', extensions.gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Stayside Super Admin","phone":"+2348000000001"}'::jsonb,
      now(), now(), '', '', '', ''
    ),
    (
      '00000000-0000-0000-0000-000000000000', v_admin1_id, 'authenticated', 'authenticated',
      'ikoyi@stayside.ng', extensions.crypt('StaysideHotel123!', extensions.gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Amara Okafor","phone":"+2348031110001"}'::jsonb,
      now(), now(), '', '', '', ''
    ),
    (
      '00000000-0000-0000-0000-000000000000', v_admin2_id, 'authenticated', 'authenticated',
      'vi@stayside.ng', extensions.crypt('StaysideHotel123!', extensions.gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Tunde Adeyemi","phone":"+2348031110002"}'::jsonb,
      now(), now(), '', '', '', ''
    ),
    (
      '00000000-0000-0000-0000-000000000000', v_admin3_id, 'authenticated', 'authenticated',
      'lekki@stayside.ng', extensions.crypt('StaysideHotel123!', extensions.gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Chidinma Eze","phone":"+2348031110003"}'::jsonb,
      now(), now(), '', '', '', ''
    )
  on conflict (id) do nothing;

  -- Create corresponding auth.identities for email login
  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  )
  values
    (gen_random_uuid(), v_super_id, jsonb_build_object('sub', v_super_id::text, 'email', 'admin@stayside.ng'), 'email', v_super_id::text, now(), now(), now()),
    (gen_random_uuid(), v_admin1_id, jsonb_build_object('sub', v_admin1_id::text, 'email', 'ikoyi@stayside.ng'), 'email', v_admin1_id::text, now(), now(), now()),
    (gen_random_uuid(), v_admin2_id, jsonb_build_object('sub', v_admin2_id::text, 'email', 'vi@stayside.ng'), 'email', v_admin2_id::text, now(), now(), now()),
    (gen_random_uuid(), v_admin3_id, jsonb_build_object('sub', v_admin3_id::text, 'email', 'lekki@stayside.ng'), 'email', v_admin3_id::text, now(), now(), now())
  on conflict do nothing;

  -- Promote super admin profile
  update public.profiles
  set role = 'super_admin', full_name = 'Stayside Super Admin', phone = '+2348000000001'
  where id = v_super_id;

  -- Seed 3 Lagos hotels (all with 10:00 - 17:00 day stay windows)
  insert into public.hotels (
    id, owner_id, name, slug, area, address, description, photos,
    phone, whatsapp, check_in_time, check_out_time, day_start, day_end, status, plan, commission_rate
  )
  values
    (
      v_hotel1_id, v_admin1_id,
      'The Palms Boutique Ikoyi', 'the-palms-ikoyi', 'Ikoyi',
      '14 Bourdillon Road, Old Ikoyi, Lagos',
      'Quiet luxury boutique hotel nestled in Old Ikoyi with lush courtyard gardens, an outdoor lap pool, and curated day-stay workspaces.',
      array[
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80'
      ],
      '+2348031110001', '+2348031110001',
      '14:00', '12:00', '10:00', '17:00', 'approved', 'paid', 10.00
    ),
    (
      v_hotel2_id, v_admin2_id,
      'Marigold Suites Victoria Island', 'marigold-vi', 'Victoria Island',
      '28 Adeola Odeku Street, Victoria Island, Lagos',
      'Modern business and leisure hotel in the heart of Victoria Island—minutes from top dining, offices, and the Atlantic waterfront.',
      array[
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80'
      ],
      '+2348031110002', '+2348031110002',
      '15:00', '12:00', '10:00', '17:00', 'approved', 'free', 12.00
    ),
    (
      v_hotel3_id, v_admin3_id,
      'Azure Courtyard Lekki', 'azure-courtyard-lekki', 'Lekki Phase 1',
      '7 Admiralty Way, Lekki Phase 1, Lagos',
      'Sun-drenched contemporary hotel in Lekki Phase 1 designed for relaxed weekend stays, poolside daycations, and remote work.',
      array[
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80'
      ],
      '+2348031110003', '+2348031110003',
      '14:00', '12:00', '10:00', '17:00', 'approved', 'free', 10.00
    )
  on conflict (id) do nothing;

  -- Seed 2 room types per hotel
  insert into public.room_types (
    id, hotel_id, name, description, night_price_ngn, day_price_ngn,
    capacity, total_rooms, day_rooms_per_day, photos
  )
  values
    (
      v_room1a_id, v_hotel1_id, 'Deluxe King Room',
      'King bed, rain shower, high-speed fiber Wi-Fi, and complimentary pool access.',
      95000, 45000, 2, 10, 4,
      array['https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1000&q=80']
    ),
    (
      v_room1b_id, v_hotel1_id, 'Executive Garden Suite',
      'Spacious suite with private lounge, espresso bar, and balcony overlooking the garden.',
      165000, 75000, 3, 4, 2,
      array['https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1000&q=80']
    ),
    (
      v_room2a_id, v_hotel2_id, 'Classic Queen Room',
      'Crisp, quiet room tailored for solo executives and short Victoria Island stays.',
      80000, 38000, 2, 12, 5,
      array['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1000&q=80']
    ),
    (
      v_room2b_id, v_hotel2_id, 'Lagoon View Studio',
      'Open-plan studio with floor-to-ceiling windows, work desk, and smart TV.',
      135000, 62000, 2, 6, 3,
      array['https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1000&q=80']
    ),
    (
      v_room3a_id, v_hotel3_id, 'Courtyard Standard',
      'Bright contemporary room steps away from the courtyard lounge and cafe.',
      65000, 30000, 2, 14, 6,
      array['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=80']
    ),
    (
      v_room3b_id, v_hotel3_id, 'Poolside Loft',
      'Double-height loft with direct pool deck access and private seating area.',
      115000, 52000, 3, 5, 2,
      array['https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1000&q=80']
    )
  on conflict (id) do nothing;

  -- Seed hotel_sites
  insert into public.hotel_sites (hotel_id, subdomain, content, published)
  values
    (v_hotel1_id, 'the-palms-ikoyi', '{"tagline":"Quiet luxury in Old Ikoyi"}'::jsonb, true),
    (v_hotel2_id, 'marigold-vi', '{"tagline":"Effortless stays in Victoria Island"}'::jsonb, true),
    (v_hotel3_id, 'azure-courtyard-lekki', '{"tagline":"Sunlit escapes in Lekki Phase 1"}'::jsonb, true)
  on conflict (hotel_id) do nothing;

  -- Seed 2 sample bookings (one on Hotel 1, one on Hotel 2) for RLS isolation verification
  insert into public.bookings (
    id, hotel_id, room_type_id, guest_name, guest_phone, guest_email,
    booking_type, check_in_date, check_out_date, amount_ngn, commission_ngn, status
  )
  values
    (
      '44444444-4444-4444-8444-444444444401',
      v_hotel1_id, v_room1a_id,
      'Damilola Bello', '+2348095550101', 'damilola@example.com',
      'day', current_date + 2, null, 45000, 4500, 'confirmed'
    ),
    (
      '44444444-4444-4444-8444-444444444402',
      v_hotel2_id, v_room2a_id,
      'Kemi Ogunleye', '+2348095550202', 'kemi@example.com',
      'night', current_date + 3, current_date + 5, 160000, 19200, 'requested'
    )
  on conflict (id) do nothing;
end $$;
