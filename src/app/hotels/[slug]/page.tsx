import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HotelDetailClient } from "@/components/HotelDetailClient";
import {
  formatNaira,
  type EligibleReviewBooking,
  type Hotel,
  type HotelReview,
  type RoomType,
} from "@/types/database";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: hotel } = await supabase
    .from("hotels")
    .select("name, area, description, photos, room_types(day_price_ngn, night_price_ngn)")
    .eq("slug", slug)
    .eq("status", "approved")
    .single();

  if (!hotel) {
    return { title: "Hotel Not Found" };
  }

  const rts = Array.isArray(hotel.room_types) ? hotel.room_types : [];
  const prices = rts
    .map((r: { day_price_ngn: number | null; night_price_ngn: number }) => r.day_price_ngn ?? r.night_price_ngn)
    .filter((p: number) => Number.isFinite(p) && p > 0);
  const fromPrice = prices.length > 0 ? `from ${formatNaira(Math.min(...prices))}/day` : "Day Stays";
  const heroPhoto = Array.isArray(hotel.photos) && hotel.photos[0] ? hotel.photos[0] : "/images/hero-lagos.png";
  const description =
    hotel.description?.slice(0, 155) ||
    `Book a verified day stay at ${hotel.name} in ${hotel.area}, Lagos (${fromPrice}).`;

  return {
    title: `${hotel.name} — ${hotel.area}, Lagos (${fromPrice})`,
    description,
    openGraph: {
      title: `${hotel.name} · ${fromPrice} | Stayside`,
      description,
      type: "website",
      locale: "en_NG",
      images: [{ url: heroPhoto, alt: hotel.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${hotel.name} · ${fromPrice}`,
      description,
      images: [heroPhoto],
    },
  };
}

export default async function HotelDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const [{ data: hotel }, { data: authData }] = await Promise.all([
    supabase
      .from("hotels")
      .select("*, room_types(*)")
      .eq("slug", slug)
      .eq("status", "approved")
      .single(),
    supabase.auth.getUser(),
  ]);

  if (!hotel) {
    notFound();
  }

  let initialGuest: {
    isSignedIn: boolean;
    fullName: string;
    phone: string;
    email: string;
  } = {
    isSignedIn: false,
    fullName: "",
    phone: "",
    email: "",
  };

  // Fetch approved reviews for this hotel (+ own pending reviews if signed in)
  // and any sibling branches belonging to the same hotel brand
  const rootParentId = hotel.parent_hotel_id ?? hotel.id;

  const [{ data: rawReviews }, { data: rawBranches }] = await Promise.all([
    supabase
      .from("hotel_reviews")
      .select("*")
      .eq("hotel_id", hotel.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("hotels")
      .select("id, name, slug, area, branch_label, room_types(day_price_ngn, night_price_ngn)")
      .eq("status", "approved")
      .or(`id.eq.${rootParentId},parent_hotel_id.eq.${rootParentId}`)
      .order("created_at", { ascending: true }),
  ]);

  const siblingBranches = (rawBranches ?? []).map((b) => {
    const rts = Array.isArray(b.room_types) ? b.room_types : [];
    const prices = rts
      .map((r: { day_price_ngn: number | null; night_price_ngn: number }) =>
        r.day_price_ngn ?? r.night_price_ngn
      )
      .filter((p: number) => Number.isFinite(p) && p > 0);
    return {
      id: b.id as string,
      name: b.name as string,
      slug: b.slug as string,
      branchLabel: (b.branch_label || b.area) as string,
      lowestDayNgn: prices.length > 0 ? Math.min(...prices) : null,
    };
  });

  const allVisibleReviews = (rawReviews ?? []) as HotelReview[];
  const approvedReviews = allVisibleReviews.filter(
    (r) => r.status === "approved"
  );
  const ownPendingReviews = authData.user
    ? allVisibleReviews.filter(
        (r) =>
          r.status === "pending" && r.guest_user_id === authData.user?.id
      )
    : [];

  let eligibleBookings: EligibleReviewBooking[] = [];

  if (authData.user) {
    const [{ data: profile }, { data: myBookings }] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", authData.user.id)
        .single(),
      supabase
        .from("bookings")
        .select("id, booking_type, check_in_date")
        .eq("hotel_id", hotel.id)
        .eq("guest_user_id", authData.user.id)
        .in("status", ["confirmed", "completed"])
        .order("check_in_date", { ascending: false }),
    ]);

    initialGuest = {
      isSignedIn: true,
      fullName: profile?.full_name ?? "",
      phone: profile?.phone ?? "",
      email: authData.user.email ?? "",
    };

    const reviewedBookingIds = new Set(
      allVisibleReviews.map((r) => r.booking_id)
    );
    eligibleBookings = ((myBookings ?? []) as EligibleReviewBooking[]).filter(
      (b) => !reviewedBookingIds.has(b.id)
    );
  }

  const typedHotel = hotel as Hotel & { room_types: RoomType[] };

  return (
    <HotelDetailClient
      hotel={typedHotel}
      rooms={typedHotel.room_types ?? []}
      initialGuest={initialGuest}
      approvedReviews={approvedReviews}
      ownPendingReviews={ownPendingReviews}
      eligibleReviewBookings={eligibleBookings}
      siblingBranches={siblingBranches}
    />
  );
}
