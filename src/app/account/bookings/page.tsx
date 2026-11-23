import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  BookingsHistoryClient,
  type BookingOrderItem,
} from "@/components/BookingsHistoryClient";

export default async function AccountBookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/account/bookings");
  }

  const { data: rawOrders } = await supabase
    .from("bookings")
    .select(
      "id, booking_type, check_in_date, check_out_date, amount_ngn, status, created_at, notes, hotels(name, slug, area, photos, whatsapp, day_start, day_end), room_types(name), payments(status, reference)"
    )
    .eq("guest_user_id", user.id)
    .order("created_at", { ascending: false });

  const orders: BookingOrderItem[] = (rawOrders ?? []).map((b) => {
    const hotel = Array.isArray(b.hotels) ? b.hotels[0] : b.hotels;
    const room = Array.isArray(b.room_types) ? b.room_types[0] : b.room_types;
    const payment = Array.isArray(b.payments) ? b.payments[0] : b.payments;
    return {
      id: b.id,
      booking_type: b.booking_type,
      check_in_date: b.check_in_date,
      check_out_date: b.check_out_date,
      amount_ngn: b.amount_ngn,
      status: b.status,
      created_at: b.created_at,
      notes: b.notes,
      hotel_name: hotel?.name ?? "Hotel",
      hotel_slug: hotel?.slug ?? "",
      hotel_area: hotel?.area ?? "Lagos",
      hotel_photo: hotel?.photos?.[0] ?? "",
      hotel_whatsapp: hotel?.whatsapp ?? "",
      day_start: hotel?.day_start ?? "10:00",
      day_end: hotel?.day_end ?? "16:00",
      room_name: room?.name ?? "Room",
      payment_status: payment?.status ?? null,
      payment_reference: payment?.reference ?? null,
    };
  });

  return <BookingsHistoryClient orders={orders} />;
}
