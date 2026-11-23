-- 0009_storage_hotel_photos.sql
-- Public bucket for hotel and room photos, with folder-scoped RLS per hotel owner

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'hotel-photos',
  'hotel-photos',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Anyone can view hotel photos
create policy "hotel_photos_public_select"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'hotel-photos');

-- Hotel admins can upload/update/delete files inside their own <hotel_id>/ folder (or super_admin anywhere)
create policy "hotel_photos_owner_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'hotel-photos'
    and (
      private.is_super_admin()
      or private.owns_hotel((storage.foldername(name))[1]::uuid)
    )
  );

create policy "hotel_photos_owner_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'hotel-photos'
    and (
      private.is_super_admin()
      or private.owns_hotel((storage.foldername(name))[1]::uuid)
    )
  )
  with check (
    bucket_id = 'hotel-photos'
    and (
      private.is_super_admin()
      or private.owns_hotel((storage.foldername(name))[1]::uuid)
    )
  );

create policy "hotel_photos_owner_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'hotel-photos'
    and (
      private.is_super_admin()
      or private.owns_hotel((storage.foldername(name))[1]::uuid)
    )
  );
