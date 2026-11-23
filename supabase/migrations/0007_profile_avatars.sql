-- 0007_profile_avatars.sql
-- Store the user's chosen free profile avatar icon id

alter table public.profiles
  add column if not exists avatar_id text not null default 'classic';
