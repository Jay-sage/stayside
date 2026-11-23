"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizeNigerianPhone } from "@/lib/phone";
import {
  isPaystackConfigured,
  refundPaystackTransaction,
} from "@/lib/paystack";

async function requireOwnedHotel(hotelId?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, error: "Not signed in." };
  }

  let query = supabase
    .from("hotels")
    .select("id, slug, owner_id, status")
    .eq("owner_id", user.id);

  if (hotelId) {
    query = query.eq("id", hotelId);
  }

  const { data: hotel } = await query.limit(1).single();
  if (!hotel) {
    return { ok: false as const, error: "Hotel not found or access denied." };
  }

  return { ok: true as const, supabase, user, hotel };
}

function revalidateHotelRoutes(slug?: string) {
  revalidatePath("/hotel");
  revalidatePath("/");
  revalidatePath("/hotels");
  if (slug) revalidatePath(`/hotels/${slug}`);
}

export async function updateBookingStatusAction(
  bookingId: string,
  nextStatus: "confirmed" | "declined" | "completed"
): Promise<{ ok: boolean; error?: string; refunded?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, hotel_id, status, payments(id, status, reference, paystack_transaction_id, amount_kobo)")
    .eq("id", bookingId)
    .single();

  if (!booking) {
    return { ok: false, error: "Booking not found for your hotel." };
  }

  const auth = await requireOwnedHotel(booking.hotel_id);
  if (!auth.ok) return { ok: false, error: auth.error };

  const { hotel } = auth;

  let refunded = false;

  // Stage 3 rule: declining a paid booking triggers a refund through the Paystack Refund API
  if (nextStatus === "declined") {
    const payments = Array.isArray(booking.payments)
      ? booking.payments
      : booking.payments
      ? [booking.payments]
      : [];
    const paidPayment = payments.find((p) => p.status === "success");

    if (paidPayment) {
      if (isPaystackConfigured()) {
        const txId = paidPayment.paystack_transaction_id || paidPayment.reference;
        const refundRes = await refundPaystackTransaction({
          transaction: txId,
          amountKobo: paidPayment.amount_kobo,
          merchantNote: "Booking declined by hotel on Stayside",
        });

        if (!refundRes.ok) {
          return {
            ok: false,
            error: `Paystack refund failed: ${refundRes.error}`,
          };
        }
        refunded = true;
      }

      // Mark payment refunded (requires service role if hotel_admin cannot update payments directly)
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const { createClient: createAdminClient } = await import("@supabase/supabase-js");
        const admin = createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        await admin
          .from("payments")
          .update({ status: "refunded" })
          .eq("id", paidPayment.id);
      }
    }
  }

  const { error } = await supabase
    .from("bookings")
    .update({ status: nextStatus })
    .eq("id", booking.id)
    .eq("hotel_id", hotel.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidateHotelRoutes(hotel.slug);
  return { ok: true, refunded };
}

export interface UpsertRoomInput {
  id?: string;
  hotelId: string;
  name: string;
  description: string;
  nightPriceNgn: number;
  dayPriceNgn: number | null;
  capacity: number;
  totalRooms: number;
  dayRoomsPerDay: number;
  photos: string[];
  amenities: string[];
}

export async function upsertRoomTypeAction(
  input: UpsertRoomInput
): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireOwnedHotel(input.hotelId);
  if (!auth.ok) return { ok: false, error: auth.error };

  const { supabase, hotel } = auth;

  if (!input.name.trim()) return { ok: false, error: "Room name is required." };
  if (input.nightPriceNgn <= 0) return { ok: false, error: "Night price must be greater than 0." };
  if (input.dayPriceNgn !== null && input.dayPriceNgn <= 0) {
    return { ok: false, error: "Day price must be greater than 0." };
  }
  if (input.totalRooms <= 0) return { ok: false, error: "Total rooms must be at least 1." };
  if (input.dayRoomsPerDay < 0) {
    return { ok: false, error: "Day rooms per day cannot be negative." };
  }

  const payload = {
    hotel_id: hotel.id,
    name: input.name.trim(),
    description: input.description.trim(),
    night_price_ngn: Math.round(input.nightPriceNgn),
    day_price_ngn: input.dayPriceNgn ? Math.round(input.dayPriceNgn) : null,
    capacity: Math.max(1, Math.round(input.capacity)),
    total_rooms: Math.round(input.totalRooms),
    day_rooms_per_day: Math.round(input.dayRoomsPerDay),
    photos: input.photos.filter(Boolean),
    amenities: input.amenities.filter(Boolean),
  };

  if (input.id) {
    const { error } = await supabase
      .from("room_types")
      .update(payload)
      .eq("id", input.id)
      .eq("hotel_id", hotel.id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("room_types").insert(payload);
    if (error) return { ok: false, error: error.message };
  }

  revalidateHotelRoutes(hotel.slug);
  return { ok: true };
}

export async function deleteRoomTypeAction(
  hotelId: string,
  roomTypeId: string
): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireOwnedHotel(hotelId);
  if (!auth.ok) return { ok: false, error: auth.error };

  const { supabase, hotel } = auth;
  const { error } = await supabase
    .from("room_types")
    .delete()
    .eq("id", roomTypeId)
    .eq("hotel_id", hotel.id);

  if (error) {
    if (error.code === "23503") {
      return {
        ok: false,
        error: "Cannot delete this room type because existing bookings reference it.",
      };
    }
    return { ok: false, error: error.message };
  }

  revalidateHotelRoutes(hotel.slug);
  return { ok: true };
}

export async function updateDayStaySettingsAction(input: {
  hotelId: string;
  dayStart: string;
  dayEnd: string;
  checkInTime: string;
  checkOutTime: string;
}): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireOwnedHotel(input.hotelId);
  if (!auth.ok) return { ok: false, error: auth.error };

  if (input.dayEnd <= input.dayStart) {
    return { ok: false, error: "Day-stay end time must be after start time." };
  }

  const { supabase, hotel } = auth;
  const { error } = await supabase
    .from("hotels")
    .update({
      day_start: input.dayStart,
      day_end: input.dayEnd,
      check_in_time: input.checkInTime,
      check_out_time: input.checkOutTime,
    })
    .eq("id", hotel.id);

  if (error) return { ok: false, error: error.message };

  revalidateHotelRoutes(hotel.slug);
  return { ok: true };
}

export async function addBlackoutDateAction(input: {
  hotelId: string;
  roomTypeId: string | null;
  date: string;
  appliesTo: "day" | "night" | "both";
  reason: string;
}): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireOwnedHotel(input.hotelId);
  if (!auth.ok) return { ok: false, error: auth.error };

  if (!input.date) return { ok: false, error: "Please pick a date to block." };

  const { supabase, hotel } = auth;
  const { error } = await supabase.from("blackout_dates").insert({
    hotel_id: hotel.id,
    room_type_id: input.roomTypeId || null,
    date: input.date,
    applies_to: input.appliesTo,
    reason: input.reason.trim() || null,
  });

  if (error) return { ok: false, error: error.message };

  revalidateHotelRoutes(hotel.slug);
  return { ok: true };
}

export async function deleteBlackoutDateAction(
  hotelId: string,
  blackoutId: string
): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireOwnedHotel(hotelId);
  if (!auth.ok) return { ok: false, error: auth.error };

  const { supabase, hotel } = auth;
  const { error } = await supabase
    .from("blackout_dates")
    .delete()
    .eq("id", blackoutId)
    .eq("hotel_id", hotel.id);

  if (error) return { ok: false, error: error.message };

  revalidateHotelRoutes(hotel.slug);
  return { ok: true };
}

export async function updateHotelProfileAction(input: {
  hotelId: string;
  name: string;
  area: string;
  address: string;
  description: string;
  phone: string;
  whatsapp: string;
  photos: string[];
  amenities: string[];
}): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireOwnedHotel(input.hotelId);
  if (!auth.ok) return { ok: false, error: auth.error };

  if (!input.name.trim()) return { ok: false, error: "Hotel name is required." };

  const normalizedWa = normalizeNigerianPhone(input.whatsapp);
  if (!normalizedWa) {
    return {
      ok: false,
      error: "Please enter a valid Nigerian WhatsApp number (e.g. 0803 123 4567).",
    };
  }

  const normalizedPhone = input.phone.trim()
    ? normalizeNigerianPhone(input.phone) ?? normalizedWa
    : normalizedWa;

  const { supabase, hotel } = auth;
  const { error } = await supabase
    .from("hotels")
    .update({
      name: input.name.trim(),
      area: input.area.trim(),
      address: input.address.trim(),
      description: input.description.trim(),
      phone: normalizedPhone,
      whatsapp: normalizedWa,
      photos: input.photos.filter(Boolean),
      amenities: input.amenities.filter(Boolean),
    })
    .eq("id", hotel.id);

  if (error) return { ok: false, error: error.message };

  revalidateHotelRoutes(hotel.slug);
  return { ok: true };
}

export async function updateHotelSiteContentAction(input: {
  hotelId: string;
  tagline: string;
  featuredPhotos: string[];
}): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireOwnedHotel(input.hotelId);
  if (!auth.ok) return { ok: false, error: auth.error };

  const { supabase, hotel } = auth;
  const content = {
    tagline: input.tagline.trim(),
    featured_photos: input.featuredPhotos.filter(Boolean),
  };

  const { data: existing } = await supabase
    .from("hotel_sites")
    .select("id")
    .eq("hotel_id", hotel.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("hotel_sites")
      .update({ content })
      .eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("hotel_sites").insert({
      hotel_id: hotel.id,
      subdomain: hotel.slug,
      content,
      published: true,
    });
    if (error) return { ok: false, error: error.message };
  }

  revalidateHotelRoutes(hotel.slug);
  revalidatePath(`/sites/${hotel.slug}`);
  return { ok: true };
}

function slugifyBranch(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 52);
}

export async function createHotelBranchAction(input: {
  sourceHotelId: string;
  name: string;
  branchLabel: string;
  area: string;
  address: string;
  description: string;
  phone: string;
  whatsapp: string;
}): Promise<{ ok: true; branchId: string } | { ok: false; error: string }> {
  const auth = await requireOwnedHotel(input.sourceHotelId);
  if (!auth.ok) return { ok: false, error: auth.error };

  const { supabase, user } = auth;

  if (!input.name.trim()) return { ok: false, error: "Branch hotel name is required." };
  if (!input.branchLabel.trim()) return { ok: false, error: "Branch label is required (e.g. Lekki Phase 1)." };
  if (!input.area.trim()) return { ok: false, error: "Lagos area is required." };
  if (!input.address.trim()) return { ok: false, error: "Branch street address is required." };

  const normalizedWa = normalizeNigerianPhone(input.whatsapp);
  if (!normalizedWa) {
    return {
      ok: false,
      error: "Please enter a valid Nigerian WhatsApp number (e.g. 0803 123 4567).",
    };
  }
  const normalizedPhone = input.phone.trim()
    ? normalizeNigerianPhone(input.phone) ?? normalizedWa
    : normalizedWa;

  // Fetch flagship/source hotel to inherit parent_hotel_id, photos, amenities, hours
  const { data: sourceHotel } = await supabase
    .from("hotels")
    .select("id, parent_hotel_id, photos, amenities, day_start, day_end, check_in_time, check_out_time")
    .eq("id", input.sourceHotelId)
    .single();

  const rootParentId = sourceHotel?.parent_hotel_id ?? input.sourceHotelId;
  const baseSlug = slugifyBranch(`${input.name}-${input.branchLabel}`) || "stayside-branch";
  const uniqueSlug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

  const { data: created, error } = await supabase
    .from("hotels")
    .insert({
      owner_id: user.id,
      parent_hotel_id: rootParentId,
      branch_label: input.branchLabel.trim(),
      name: input.name.trim(),
      slug: uniqueSlug,
      area: input.area.trim(),
      address: input.address.trim(),
      description:
        input.description.trim() ||
        `Verified Lagos day-stay branch in ${input.area.trim()}.`,
      phone: normalizedPhone,
      whatsapp: normalizedWa,
      photos: sourceHotel?.photos ?? [],
      amenities: sourceHotel?.amenities ?? ["Free Wi-Fi", "24/7 Power", "Air Conditioning"],
      day_start: sourceHotel?.day_start ?? "10:00:00",
      day_end: sourceHotel?.day_end ?? "16:00:00",
      check_in_time: sourceHotel?.check_in_time ?? "14:00:00",
      check_out_time: sourceHotel?.check_out_time ?? "12:00:00",
      status: "pending",
    })
    .select("id, slug")
    .single();

  if (error || !created) {
    return { ok: false, error: error?.message ?? "Could not create branch." };
  }

  revalidateHotelRoutes(created.slug);
  revalidatePath("/admin");
  return { ok: true, branchId: created.id };
}
