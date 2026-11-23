import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HotelDashboardClient } from "@/components/hotel-admin/HotelDashboardClient";
import type { HotelAdminBooking } from "@/components/hotel-admin/BookingsInboxTab";
import type { BlackoutDateRow } from "@/components/hotel-admin/SettingsAndBlackoutsTabs";
import type { Hotel, RoomType } from "@/types/database";

export default async function HotelPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>;
}) {
  const { branch } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/hotel");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role === "super_admin") redirect("/admin");
  if (profile?.role !== "hotel_admin") redirect("/account");

  const { data: ownedHotels } = await supabase
    .from("hotels")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true });

  const branches = (ownedHotels ?? []) as Hotel[];
  const hotel =
    branches.find((h) => h.id === branch) ?? branches[0] ?? null;

  if (!hotel) {
    return (
      <div className="mx-auto max-w-lg px-5 py-16 text-center">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="font-jakarta text-xl font-bold text-brand-ink">
            No hotel linked yet
          </h1>
          <p className="mt-2 text-xs text-brand-muted">
            Contact Stayside support to connect your partner hotel to this account.
          </p>
        </div>
      </div>
    );
  }

  const [{ data: rooms }, { data: rawBookings }, { data: blackouts }, { data: site }] =
    await Promise.all([
      supabase
        .from("room_types")
        .select("*")
        .eq("hotel_id", hotel.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("bookings")
        .select(
          "id, guest_name, guest_phone, guest_email, booking_type, check_in_date, check_out_date, amount_ngn, status, notes, created_at, room_types(name), payments(status)"
        )
        .eq("hotel_id", hotel.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("blackout_dates")
        .select("id, room_type_id, date, applies_to, reason")
        .eq("hotel_id", hotel.id)
        .order("date", { ascending: true }),
      supabase
        .from("hotel_sites")
        .select("subdomain, published, content")
        .eq("hotel_id", hotel.id)
        .maybeSingle(),
    ]);

  const bookings: HotelAdminBooking[] = (rawBookings ?? []).map((b) => {
    const room = Array.isArray(b.room_types) ? b.room_types[0] : b.room_types;
    const payment = Array.isArray(b.payments) ? b.payments[0] : b.payments;
    return {
      id: b.id,
      guest_name: b.guest_name,
      guest_phone: b.guest_phone,
      guest_email: b.guest_email,
      booking_type: b.booking_type,
      check_in_date: b.check_in_date,
      check_out_date: b.check_out_date,
      amount_ngn: b.amount_ngn,
      status: b.status,
      notes: b.notes,
      created_at: b.created_at,
      room_name: room?.name ?? "Room",
      payment_status: payment?.status ?? null,
    };
  });

  // Africa/Lagos today string
  const now = new Date();
  const lagos = new Date(now.getTime() + 60 * 60 * 1000);
  const todayIso = lagos.toISOString().slice(0, 10);

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";

  return (
    <HotelDashboardClient
      hotel={hotel}
      branches={branches}
      rooms={(rooms ?? []) as RoomType[]}
      bookings={bookings}
      blackouts={(blackouts ?? []) as BlackoutDateRow[]}
      site={
        site
          ? {
              subdomain: site.subdomain,
              published: site.published,
              content: (site.content ?? {}) as {
                tagline?: string;
                featured_photos?: string[];
              },
            }
          : null
      }
      rootDomain={rootDomain}
      todayIso={todayIso}
    />
  );
}
