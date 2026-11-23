-- 0008_guest_payments_rls.sql
-- Allow signed-in guests to view payment status for their own bookings

create policy "payments_select_own_guest"
  on public.payments for select
  to authenticated
  using (
    exists (
      select 1
      from public.bookings b
      where b.id = payments.booking_id
        and b.guest_user_id = (select auth.uid())
    )
  );
