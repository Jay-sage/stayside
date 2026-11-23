import { createClient } from "@/lib/supabase/server";
import {
  AccountClient,
  type AccountBookingRow,
} from "@/components/AccountClient";
import type { SavedCard, UserRole } from "@/types/database";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <AccountClient user={null} bookings={[]} savedCards={[]} />;
  }

  const [{ data: profile }, { data: rawBookings }, { data: rawCards }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("role, full_name, phone, avatar_id")
        .eq("id", user.id)
        .single(),
      supabase
        .from("bookings")
        .select(
          "id, booking_type, check_in_date, check_out_date, amount_ngn, status, hotels(name, slug, photos), room_types(name)"
        )
        .eq("guest_user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("saved_cards")
        .select("id, brand, last4, exp_month, exp_year, bank, cardholder_name, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

  const bookings: AccountBookingRow[] = (rawBookings ?? []).map((b) => {
    const hotel = Array.isArray(b.hotels) ? b.hotels[0] : b.hotels;
    const room = Array.isArray(b.room_types) ? b.room_types[0] : b.room_types;
    return {
      id: b.id,
      booking_type: b.booking_type,
      check_in_date: b.check_in_date,
      check_out_date: b.check_out_date,
      amount_ngn: b.amount_ngn,
      status: b.status,
      hotel_name: hotel?.name ?? "Hotel",
      hotel_slug: hotel?.slug ?? "",
      hotel_photo: hotel?.photos?.[0] ?? "",
      room_name: room?.name ?? "Room",
    };
  });

  return (
    <AccountClient
      user={{
        id: user.id,
        email: user.email ?? "",
        fullName: profile?.full_name ?? "",
        phone: profile?.phone ?? "",
        avatarId: profile?.avatar_id ?? "classic",
        role: (profile?.role as UserRole) ?? "guest",
      }}
      bookings={bookings}
      savedCards={(rawCards ?? []) as SavedCard[]}
    />
  );
}
