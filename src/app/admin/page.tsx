import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SuperAdminClient } from "@/components/super-admin/SuperAdminClient";
import type { SuperAdminBookingRow } from "@/components/super-admin/AdminBookingsTab";
import type { SuperAdminReviewRow } from "@/components/super-admin/AdminReviewsTab";
import type {
  HotelSiteRow,
  PayoutRow,
  RefundPaymentRow,
} from "@/components/super-admin/AdminFinanceAndSitesTabs";
import type { Hotel } from "@/types/database";

export default async function SuperAdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin") {
    redirect(profile?.role === "hotel_admin" ? "/hotel" : "/account");
  }

  const [
    { data: hotels },
    { data: rawBookings },
    { data: payouts },
    { data: rawRefunds },
    { data: sites },
    { data: rawReviews },
  ] = await Promise.all([
    supabase.from("hotels").select("*").order("created_at", { ascending: true }),
    supabase
      .from("bookings")
      .select(
        "id, hotel_id, guest_name, guest_phone, booking_type, check_in_date, check_out_date, amount_ngn, commission_ngn, status, created_at, hotels(name), room_types(name), payments(status)"
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("payouts")
      .select("id, hotel_id, period_month, amount_ngn, paid_out_at")
      .order("paid_out_at", { ascending: false }),
    supabase
      .from("payments")
      .select(
        "id, reference, amount_kobo, status, created_at, bookings(guest_name, hotels(name))"
      )
      .eq("status", "refunded")
      .order("created_at", { ascending: false }),
    supabase
      .from("hotel_sites")
      .select("id, hotel_id, subdomain, published"),
    supabase
      .from("hotel_reviews")
      .select("id, hotel_id, guest_name, rating, comment, stay_type, status, created_at, hotels(name)")
      .order("created_at", { ascending: false }),
  ]);

  const bookings: SuperAdminBookingRow[] = (rawBookings ?? []).map((b) => {
    const hotel = Array.isArray(b.hotels) ? b.hotels[0] : b.hotels;
    const room = Array.isArray(b.room_types) ? b.room_types[0] : b.room_types;
    const payment = Array.isArray(b.payments) ? b.payments[0] : b.payments;
    return {
      id: b.id,
      hotel_id: b.hotel_id,
      hotel_name: hotel?.name ?? "Hotel",
      room_name: room?.name ?? "Room",
      guest_name: b.guest_name,
      guest_phone: b.guest_phone,
      booking_type: b.booking_type,
      check_in_date: b.check_in_date,
      check_out_date: b.check_out_date,
      amount_ngn: b.amount_ngn,
      commission_ngn: b.commission_ngn,
      status: b.status,
      payment_status: payment?.status ?? null,
      created_at: b.created_at,
    };
  });

  const refunds: RefundPaymentRow[] = (rawRefunds ?? []).map((r) => {
    const booking = Array.isArray(r.bookings) ? r.bookings[0] : r.bookings;
    const hotel = booking?.hotels
      ? Array.isArray(booking.hotels)
        ? booking.hotels[0]
        : booking.hotels
      : null;
    return {
      id: r.id,
      reference: r.reference,
      amount_kobo: r.amount_kobo,
      status: r.status,
      created_at: r.created_at,
      hotel_name: hotel?.name ?? "Hotel",
      guest_name: booking?.guest_name ?? "Guest",
    };
  });

  const reviews: SuperAdminReviewRow[] = (rawReviews ?? []).map((r) => {
    const hotel = Array.isArray(r.hotels) ? r.hotels[0] : r.hotels;
    return {
      id: r.id,
      hotel_id: r.hotel_id,
      hotel_name: hotel?.name ?? "Hotel",
      guest_name: r.guest_name,
      rating: r.rating,
      comment: r.comment,
      stay_type: r.stay_type,
      status: r.status,
      created_at: r.created_at,
    };
  });

  const now = new Date();
  const lagos = new Date(now.getTime() + 60 * 60 * 1000);
  const currentMonth = lagos.toISOString().slice(0, 7);
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";

  return (
    <SuperAdminClient
      hotels={(hotels ?? []) as Hotel[]}
      bookings={bookings}
      payouts={(payouts ?? []) as PayoutRow[]}
      refunds={refunds}
      sites={(sites ?? []) as HotelSiteRow[]}
      reviews={reviews}
      currentMonth={currentMonth}
      rootDomain={rootDomain}
    />
  );
}
