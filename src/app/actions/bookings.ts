"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { buildWhatsAppUrl, normalizeNigerianPhone } from "@/lib/phone";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  initializePaystackTransaction,
  isPaystackConfigured,
} from "@/lib/paystack";
import { formatNaira, formatTimeShort, type BookingType } from "@/types/database";

export interface BookingConfirmation {
  bookingId: string;
  hotelName: string;
  roomName: string;
  guestName: string;
  guestPhone: string;
  linkedToUser: boolean;
  bookingType: BookingType;
  checkInDate: string;
  checkOutDate: string | null;
  nights: number;
  amountNgn: number;
  dayStart: string;
  dayEnd: string;
  whatsappUrl: string;
}

export type BookingActionResult =
  | { ok: true; mode: "paystack"; authorizationUrl: string; reference: string }
  | { ok: true; mode: "direct"; confirmation: BookingConfirmation }
  | { ok: false; error: string };

export interface SubmitBookingInput {
  hotelId: string;
  roomTypeId: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  bookingType: BookingType;
  checkInDate: string;
  checkOutDate?: string | null;
  notes?: string;
}

export async function submitBookingRequest(
  input: SubmitBookingInput
): Promise<BookingActionResult> {
  const guestName = input.guestName?.trim() ?? "";
  if (guestName.length < 2) {
    return { ok: false, error: "Please enter your full name." };
  }

  const normalizedPhone = normalizeNigerianPhone(input.guestPhone ?? "");
  if (!normalizedPhone) {
    return {
      ok: false,
      error: "Enter a valid Nigerian WhatsApp number (e.g. 0803 123 4567 or +2348031234567).",
    };
  }

  // Rate limit by client IP and by normalised phone number
  const hdrs = await headers();
  const forwarded = hdrs.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "local";

  const ipLimit = checkRateLimit(`booking:ip:${ip}`, 8, 10 * 60 * 1000);
  if (!ipLimit.allowed) {
    return {
      ok: false,
      error: "Too many booking requests right now. Please wait a few minutes and try again.",
    };
  }

  const phoneLimit = checkRateLimit(`booking:phone:${normalizedPhone}`, 5, 10 * 60 * 1000);
  if (!phoneLimit.allowed) {
    return {
      ok: false,
      error: "You have sent several requests recently. Please wait a few minutes before trying again.",
    };
  }

  if (input.bookingType !== "day" && input.bookingType !== "night") {
    return { ok: false, error: "Please select either Day Stay or Night Stay." };
  }

  if (!input.checkInDate) {
    return { ok: false, error: "Please select your check-in date." };
  }

  if (input.bookingType === "night" && !input.checkOutDate) {
    return { ok: false, error: "Please select your check-out date for a night stay." };
  }

  const guestEmail = input.guestEmail?.trim().toLowerCase() ?? "";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(guestEmail)) {
    return { ok: false, error: "Please enter a valid email address for your payment receipt." };
  }

  const supabase = await createClient();

  // Stage 2B: When Paystack test secret key is configured, hold slot for 15 min & redirect to Paystack Checkout
  if (isPaystackConfigured()) {
    const { data, error } = await supabase.rpc("create_pending_payment_booking", {
      p_hotel_id: input.hotelId,
      p_room_type_id: input.roomTypeId,
      p_guest_name: guestName,
      p_guest_phone: normalizedPhone,
      p_guest_email: guestEmail,
      p_booking_type: input.bookingType,
      p_check_in_date: input.checkInDate,
      p_check_out_date: input.bookingType === "night" ? input.checkOutDate : null,
      p_notes: input.notes?.trim() || null,
    });

    if (error) {
      return { ok: false, error: "Could not reserve your room slot. Please try again." };
    }

    const res = data as {
      ok: boolean;
      error?: string;
      booking_id?: string;
      reference?: string;
      amount_kobo?: number;
    };

    if (!res?.ok || !res.booking_id || !res.reference || !res.amount_kobo) {
      return { ok: false, error: res?.error ?? "Unable to initialize booking payment." };
    }

    const origin =
      hdrs.get("origin") ||
      (process.env.NEXT_PUBLIC_ROOT_DOMAIN?.startsWith("localhost")
        ? `http://${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`
        : `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000"}`);

    const init = await initializePaystackTransaction({
      email: guestEmail,
      amountKobo: res.amount_kobo,
      reference: res.reference,
      callbackUrl: `${origin}/bookings/callback`,
      metadata: {
        booking_id: res.booking_id,
        guest_name: guestName,
      },
    });

    if (!init.ok) {
      return { ok: false, error: init.error };
    }

    return {
      ok: true,
      mode: "paystack",
      authorizationUrl: init.authorizationUrl,
      reference: init.reference,
    };
  }

  // Fallback when PAYSTACK_SECRET_KEY is not yet added to .env.local (Stage 2 direct request mode)
  const { data, error } = await supabase.rpc("create_guest_booking_request", {
    p_hotel_id: input.hotelId,
    p_room_type_id: input.roomTypeId,
    p_guest_name: guestName,
    p_guest_phone: normalizedPhone,
    p_booking_type: input.bookingType,
    p_check_in_date: input.checkInDate,
    p_check_out_date: input.bookingType === "night" ? input.checkOutDate : null,
    p_notes: input.notes?.trim() || null,
  });

  if (error) {
    return { ok: false, error: "Could not submit your booking request. Please try again." };
  }

  const res = data as {
    ok: boolean;
    error?: string;
    booking_id?: string;
    amount_ngn?: number;
    nights?: number;
    hotel_name?: string;
    hotel_whatsapp?: string;
    room_name?: string;
    day_start?: string;
    day_end?: string;
  };

  if (!res?.ok || !res.booking_id) {
    return { ok: false, error: res?.error ?? "Unable to complete booking request." };
  }

  const shortRef = res.booking_id.slice(0, 8).toUpperCase();
  const stayDesc =
    input.bookingType === "day"
      ? `Day Stay (${formatTimeShort(res.day_start ?? "10:00")}–${formatTimeShort(res.day_end ?? "16:00")}) on ${input.checkInDate}`
      : `Night Stay (${res.nights} night${res.nights === 1 ? "" : "s"}: ${input.checkInDate} to ${input.checkOutDate})`;

  const waMessage = [
    `Hello ${res.hotel_name},`,
    `I just sent a booking request on Stayside (Ref: #${shortRef}).`,
    `• Name: ${guestName}`,
    `• Room: ${res.room_name}`,
    `• Stay: ${stayDesc}`,
    `• Total: ${formatNaira(res.amount_ngn ?? 0)}`,
    input.notes?.trim() ? `• Notes: ${input.notes.trim()}` : null,
    `Please confirm availability. Thank you!`,
  ]
    .filter(Boolean)
    .join("\n");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    ok: true,
    mode: "direct",
    confirmation: {
      bookingId: res.booking_id,
      hotelName: res.hotel_name ?? "",
      roomName: res.room_name ?? "",
      guestName,
      guestPhone: normalizedPhone,
      linkedToUser: Boolean(user),
      bookingType: input.bookingType,
      checkInDate: input.checkInDate,
      checkOutDate: input.bookingType === "night" ? (input.checkOutDate ?? null) : null,
      nights: res.nights ?? 1,
      amountNgn: res.amount_ngn ?? 0,
      dayStart: res.day_start ?? "10:00",
      dayEnd: res.day_end ?? "16:00",
      whatsappUrl: buildWhatsAppUrl(res.hotel_whatsapp ?? "", waMessage),
    },
  };
}

export async function claimGuestBookingAction(
  bookingId: string,
  guestPhone: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const normalizedPhone = normalizeNigerianPhone(guestPhone);
  if (!normalizedPhone) {
    return { ok: false, error: "Invalid phone number." };
  }

  const { data, error } = await supabase.rpc("claim_guest_booking", {
    p_booking_id: bookingId,
    p_guest_phone: normalizedPhone,
  });

  if (error) {
    return { ok: false, error: "Could not link booking to your account." };
  }

  const res = data as { ok: boolean; error?: string };
  return res?.ok ? { ok: true } : { ok: false, error: res?.error };
}
