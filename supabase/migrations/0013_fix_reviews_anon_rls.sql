-- 0013_fix_reviews_anon_rls.sql
-- Ensure anon visitors can read approved reviews without evaluating private.* helpers

create policy "hotel_reviews_select_public_approved"
  on public.hotel_reviews
  for select
  to anon
  using (status = 'approved');

alter policy "hotel_reviews_select_policy"
  on public.hotel_reviews
  to authenticated;
