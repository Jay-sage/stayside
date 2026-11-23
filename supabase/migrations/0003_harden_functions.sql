-- 0003_harden_functions.sql
-- Revoke public/anon/authenticated execute on internal auth trigger function

revoke all on function public.handle_new_user() from public, anon, authenticated;
