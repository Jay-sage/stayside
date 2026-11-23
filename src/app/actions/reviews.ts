"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { HotelReview, ReviewStatus } from "@/types/database";

function formatShortReviewerName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Stayside Guest";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

export async function submitHotelReviewAction(input: {
  hotelId: string;
  hotelSlug: string;
  bookingId: string;
  rating: number;
  comment: string;
}): Promise<{ ok: true; review: HotelReview } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return { ok: false, error: "Please sign in to review your stay." };
  }

  const rating = Math.round(Number(input.rating));
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "Please select a rating between 1 and 5 stars." };
  }

  const comment = input.comment.trim();
  if (comment.length < 4) {
    return { ok: false, error: "Please share a few words about your stay." };
  }
  if (comment.length > 800) {
    return { ok: false, error: "Review must be under 800 characters." };
  }

  // Verify the booking belongs to this guest and this hotel, and is confirmed/completed
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, hotel_id, guest_user_id, guest_name, booking_type, status")
    .eq("id", input.bookingId)
    .eq("hotel_id", input.hotelId)
    .eq("guest_user_id", authData.user.id)
    .in("status", ["confirmed", "completed"])
    .single();

  if (bookingError || !booking) {
    return {
      ok: false,
      error: "Only guests with a confirmed booking at this hotel can leave a review.",
    };
  }

  // Get display name snapshot from profile or booking
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", authData.user.id)
    .single();

  const guestName = formatShortReviewerName(
    profile?.full_name || booking.guest_name || "Stayside Guest"
  );

  // Always insert with status = 'pending' (unapproved until moderated)
  const { data: review, error: insertError } = await supabase
    .from("hotel_reviews")
    .insert({
      hotel_id: input.hotelId,
      booking_id: booking.id,
      guest_user_id: authData.user.id,
      guest_name: guestName,
      rating,
      comment,
      stay_type: booking.booking_type,
      status: "pending",
    })
    .select("*")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return { ok: false, error: "You have already reviewed this booking." };
    }
    return { ok: false, error: insertError.message };
  }

  revalidatePath(`/hotels/${input.hotelSlug}`);
  revalidatePath("/admin");

  return { ok: true, review: review as HotelReview };
}

export async function moderateHotelReviewAction(input: {
  reviewId: string;
  status: Extract<ReviewStatus, "approved" | "rejected">;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return { ok: false, error: "Unauthorized" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", authData.user.id)
    .single();

  if (profile?.role !== "super_admin") {
    return { ok: false, error: "Only Super Admins can moderate reviews." };
  }

  const { error } = await supabase
    .from("hotel_reviews")
    .update({ status: input.status })
    .eq("id", input.reviewId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/hotels");

  return { ok: true };
}
