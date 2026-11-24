"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  submitBookingRequest,
  type BookingConfirmation,
} from "@/app/actions/bookings";
import {
  CheckCircleIcon,
  ClockIcon,
  MoonIcon,
  SunIcon,
} from "@/components/Icons";
import { HotelCalendar } from "@/components/HotelCalendar";
import {
  formatNaira,
  formatTimeShort,
  type BookingType,
  type Hotel,
  type RoomType,
} from "@/types/database";

function getLagosDateOffset(daysOffset: number): string {
  const now = new Date();
  const lagos = new Date(now.getTime() + 60 * 60 * 1000);
  lagos.setUTCDate(lagos.getUTCDate() + daysOffset);
  return lagos.toISOString().slice(0, 10);
}

export function BookingRequestForm({
  hotel,
  rooms,
  selectedRoomId,
  onSelectRoom,
  initialGuest,
}: {
  hotel: Hotel;
  rooms: RoomType[];
  selectedRoomId: string;
  onSelectRoom: (id: string) => void;
  initialGuest?: {
    isSignedIn: boolean;
    fullName: string;
    phone: string;
    email: string;
  };
}) {
  const selectedRoom = useMemo(
    () => rooms.find((r) => r.id === selectedRoomId) ?? rooms[0],
    [rooms, selectedRoomId]
  );

  const [roomMenuOpen, setRoomMenuOpen] = useState(false);
  const roomMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!roomMenuOpen) return;
    function handleOutside(e: MouseEvent) {
      if (
        roomMenuRef.current &&
        !roomMenuRef.current.contains(e.target as Node)
      ) {
        setRoomMenuOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setRoomMenuOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [roomMenuOpen]);

  const canDayStay = Boolean(
    selectedRoom && selectedRoom.day_price_ngn && selectedRoom.day_rooms_per_day > 0
  );

  const [bookingType, setBookingType] = useState<BookingType>(
    canDayStay ? "day" : "night"
  );
  const [checkInDate, setCheckInDate] = useState<string>(() => getLagosDateOffset(1));
  const [checkOutDate, setCheckOutDate] = useState<string>(() => getLagosDateOffset(2));
  const [guestName, setGuestName] = useState(initialGuest?.fullName ?? "");
  const [guestPhone, setGuestPhone] = useState(initialGuest?.phone ?? "");
  const [guestEmail, setGuestEmail] = useState(initialGuest?.email ?? "");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);

  const todayStr = useMemo(() => getLagosDateOffset(0), []);

  const nights = useMemo(() => {
    if (bookingType === "day") return 1;
    const d1 = new Date(`${checkInDate}T00:00:00Z`);
    const d2 = new Date(`${checkOutDate}T00:00:00Z`);
    const diff = Math.round((d2.getTime() - d1.getTime()) / (24 * 60 * 60 * 1000));
    return diff > 0 ? diff : 0;
  }, [bookingType, checkInDate, checkOutDate]);

  const estimatedTotal = useMemo(() => {
    if (!selectedRoom) return 0;
    if (bookingType === "day") return selectedRoom.day_price_ngn ?? 0;
    return selectedRoom.night_price_ngn * nights;
  }, [selectedRoom, bookingType, nights]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRoom) return;

    setError(null);
    setSubmitting(true);

    try {
      const res = await submitBookingRequest({
        hotelId: hotel.id,
        roomTypeId: selectedRoom.id,
        guestName,
        guestPhone,
        guestEmail,
        bookingType,
        checkInDate,
        checkOutDate: bookingType === "night" ? checkOutDate : null,
        notes,
      });

      if (!res.ok) {
        setError(res.error);
        document
          .getElementById("booking-form")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (res.mode === "paystack") {
        window.location.href = res.authorizationUrl;
        return;
      } else {
        setConfirmation(res.confirmation);
      }
    } catch {
      setError("Something went wrong sending your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmation) {
    const shortRef = confirmation.bookingId.slice(0, 8).toUpperCase();
    return (
      <div className="rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-[0_10px_30px_rgba(23,76,67,0.08)]">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-night-bg text-brand-primary">
            <CheckCircleIcon className="h-6 w-6" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-secondary">
              Request Sent · #{shortRef}
            </p>
            <h3 className="text-lg font-bold text-brand-ink">Booking Request Received</h3>
          </div>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-brand-muted">
          Your request for <strong className="text-brand-ink">{confirmation.hotelName}</strong> has been saved. Message the hotel on WhatsApp below to speed up confirmation.
        </p>

        <div className="mt-4 space-y-2 rounded-xl bg-brand-bg p-4 text-xs">
          <div className="flex justify-between">
            <span className="text-brand-muted">Guest</span>
            <span className="font-semibold text-brand-ink">{confirmation.guestName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-brand-muted">Room</span>
            <span className="font-semibold text-brand-ink">{confirmation.roomName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-brand-muted">Stay type</span>
            <span className="font-semibold capitalize text-brand-ink">
              {confirmation.bookingType === "day"
                ? `Day Stay (${formatTimeShort(confirmation.dayStart)}–${formatTimeShort(confirmation.dayEnd)})`
                : `Night Stay (${confirmation.nights} night${confirmation.nights === 1 ? "" : "s"})`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-brand-muted">Date</span>
            <span className="font-semibold text-brand-ink">
              {confirmation.bookingType === "day"
                ? confirmation.checkInDate
                : `${confirmation.checkInDate} → ${confirmation.checkOutDate}`}
            </span>
          </div>
          <div className="flex justify-between border-t border-brand-border pt-2">
            <span className="font-semibold text-brand-ink">Total</span>
            <span className="text-sm font-bold text-brand-primary">
              {formatNaira(confirmation.amountNgn)}
            </span>
          </div>
        </div>

        <div className="mt-5 space-y-2.5">
          <a
            href={confirmation.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary-hover"
          >
            Message the hotel on WhatsApp
          </a>

          {confirmation.linkedToUser ? (
            <Link
              href="/account"
              className="flex w-full items-center justify-center rounded-full bg-night-bg px-4 py-2.5 text-xs font-semibold text-brand-primary transition hover:bg-brand-primary/15"
            >
              Saved to your account · View My Bookings
            </Link>
          ) : (
            <div className="rounded-2xl bg-brand-bg p-3.5 text-xs">
              <p className="font-semibold text-brand-ink">
                Save this booking to a Stayside account
              </p>
              <p className="mt-0.5 text-[11px] text-brand-muted">
                Sign in or create an account now to track your stay and rebook faster.
              </p>
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <Link
                  href={`/signup?claim=${encodeURIComponent(confirmation.bookingId)}&phone=${encodeURIComponent(confirmation.guestPhone)}&name=${encodeURIComponent(confirmation.guestName)}`}
                  className="flex items-center justify-center rounded-full bg-brand-ink py-2 text-xs font-semibold text-white transition hover:bg-brand-primary"
                >
                  Create Account
                </Link>
                <Link
                  href={`/login?claim=${encodeURIComponent(confirmation.bookingId)}&phone=${encodeURIComponent(confirmation.guestPhone)}`}
                  className="flex items-center justify-center rounded-full border border-brand-border bg-white py-2 text-xs font-semibold text-brand-ink transition hover:bg-brand-bg"
                >
                  Sign In
                </Link>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-1 text-xs">
            <button
              type="button"
              onClick={() => setConfirmation(null)}
              className="cursor-pointer font-semibold text-brand-primary hover:underline"
            >
              Make another request
            </button>
            <Link href="/hotels" className="font-medium text-brand-muted hover:text-brand-ink">
              Browse more hotels
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      id="booking-form"
      onSubmit={handleSubmit}
      className="dark-card-surface rounded-[16px] bg-white p-5 shadow-[0_4px_36px_rgba(19,32,48,0.08)] sm:p-6"
    >
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-brand-ink">
            {bookingType === "day" ? "Book a Day Stay" : "Book a Full Night Stay"}
          </h2>
          <p className="mt-0.5 text-xs text-brand-muted">
            {initialGuest?.isSignedIn
              ? "Signed in · This booking will be saved to your account."
              : "Book as a guest or sign in before/after."}
          </p>
        </div>
        {!initialGuest?.isSignedIn && (
          <Link
            href={`/login?next=${encodeURIComponent(`/hotels/${hotel.slug}`)}`}
            className="shrink-0 rounded-full bg-night-bg px-3 py-1 text-[11px] font-semibold text-brand-primary transition hover:bg-brand-primary/15"
          >
            Sign in
          </Link>
        )}
      </div>

      {bookingType === "day" ? (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-day-bg px-3 py-2 text-xs text-day-text">
          <ClockIcon className="h-4 w-4 shrink-0" />
          <span>
            Day-stay window:{" "}
            <strong>
              {formatTimeShort(hotel.day_start)} – {formatTimeShort(hotel.day_end)}
            </strong>
          </span>
        </div>
      ) : (
        <div className="mb-4 flex items-center justify-between gap-2 rounded-xl bg-night-bg px-3 py-2 text-xs text-brand-primary">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <MoonIcon className="h-4 w-4 shrink-0" />
            Overnight stay · Check-in {formatTimeShort(hotel.check_in_time)}
          </span>
          {canDayStay && (
            <button
              type="button"
              onClick={() => setBookingType("day")}
              className="cursor-pointer font-semibold underline"
            >
              Back to Day Stay
            </button>
          )}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700"
        >
          {error}
        </div>
      )}

      <div className="space-y-3.5">
        {/* Custom In-App Room Type Picker (replaces native browser select) */}
        <div ref={roomMenuRef} className="relative">
          <label className="mb-1.5 block text-xs font-semibold text-brand-ink">
            Room type
          </label>
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={roomMenuOpen}
            onClick={() => setRoomMenuOpen((v) => !v)}
            className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border px-3.5 py-3 text-left transition ${
              roomMenuOpen
                ? "border-brand-primary bg-white ring-2 ring-brand-primary/15"
                : "border-brand-border bg-brand-bg/50 hover:border-brand-primary/40"
            }`}
          >
            <div className="min-w-0">
              <p className="truncate font-jakarta text-sm font-bold text-brand-ink">
                {selectedRoom?.name ?? "Select a room"}
              </p>
              {selectedRoom && (
                <p className="mt-0.5 text-[11px] text-brand-muted">
                  Up to {selectedRoom.capacity} guests ·{" "}
                  <span className="font-bold text-brand-primary">
                    {bookingType === "day" && selectedRoom.day_price_ngn
                      ? `${formatNaira(selectedRoom.day_price_ngn)}/day`
                      : `${formatNaira(selectedRoom.night_price_ngn)}/night`}
                  </span>
                </p>
              )}
            </div>
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`h-4 w-4 shrink-0 text-brand-muted transition-transform duration-200 ${
                roomMenuOpen ? "rotate-180 text-brand-primary" : ""
              }`}
              aria-hidden="true"
            >
              <path d="m5 7.5 5 5 5-5" />
            </svg>
          </button>

          {roomMenuOpen && (
            <div
              role="listbox"
              aria-label="Choose a room type"
              className="dark-card-surface absolute right-0 left-0 z-30 mt-2 overflow-hidden rounded-2xl border border-brand-border bg-white p-1.5 shadow-[0_14px_40px_rgba(19,32,48,0.16)]"
            >
              {rooms.map((room) => {
                const isActive = room.id === selectedRoom?.id;
                const priceLabel =
                  bookingType === "day" && room.day_price_ngn
                    ? `${formatNaira(room.day_price_ngn)}/day`
                    : `${formatNaira(room.night_price_ngn)}/night`;

                return (
                  <button
                    key={room.id}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => {
                      onSelectRoom(room.id);
                      if (
                        bookingType === "day" &&
                        (!room.day_price_ngn || room.day_rooms_per_day <= 0)
                      ) {
                        setBookingType("night");
                      }
                      setRoomMenuOpen(false);
                    }}
                    className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                      isActive
                        ? "bg-night-bg text-brand-primary"
                        : "text-brand-ink hover:bg-brand-bg/70"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-jakarta text-xs font-bold">
                        {room.name}
                      </p>
                      <p className="mt-0.5 text-[11px] text-brand-muted">
                        Up to {room.capacity} guests
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="font-jakarta text-xs font-extrabold text-brand-primary">
                        {priceLabel}
                      </span>
                      {isActive && (
                        <CheckCircleIcon className="h-4 w-4 text-brand-primary" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Custom HotelIQ-style Calendar */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-brand-ink">
            {bookingType === "day" ? "Select day-stay date" : "Select check-in & check-out"}
          </label>
          <HotelCalendar
            mode={bookingType}
            minDate={todayStr}
            checkInDate={checkInDate}
            checkOutDate={bookingType === "night" ? checkOutDate : null}
            onChange={(nextIn, nextOut) => {
              setCheckInDate(nextIn);
              if (nextOut) setCheckOutDate(nextOut);
            }}
          />
        </div>

        {/* Guest Name */}
        <div>
          <label htmlFor="guestName" className="mb-1 block text-xs font-semibold text-brand-ink">
            Your full name
          </label>
          <input
            id="guestName"
            type="text"
            required
            placeholder="e.g. Tobi Adesina"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="w-full rounded-xl border border-brand-border bg-brand-bg/40 px-3.5 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-primary focus:bg-white"
          />
        </div>

        {/* Email Address (required by Paystack) */}
        <div>
          <label htmlFor="guestEmail" className="mb-1 block text-xs font-semibold text-brand-ink">
            Email address
          </label>
          <input
            id="guestEmail"
            type="email"
            required
            placeholder="you@example.com"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            className="w-full rounded-xl border border-brand-border bg-brand-bg/40 px-3.5 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-primary focus:bg-white"
          />
        </div>

        {/* WhatsApp Number */}
        <div>
          <label htmlFor="guestPhone" className="mb-1 block text-xs font-semibold text-brand-ink">
            WhatsApp number (Nigeria)
          </label>
          <input
            id="guestPhone"
            type="tel"
            required
            placeholder="0803 123 4567"
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
            className="w-full rounded-xl border border-brand-border bg-brand-bg/40 px-3.5 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-primary focus:bg-white"
          />
          <p className="mt-1 text-[11px] text-brand-muted">
            Automatically saved in +234 format. Never shown publicly.
          </p>
        </div>

        {/* Optional notes */}
        <div>
          <label htmlFor="notes" className="mb-1 block text-xs font-semibold text-brand-ink">
            Special requests <span className="font-normal text-brand-muted">(optional)</span>
          </label>
          <textarea
            id="notes"
            rows={2}
            placeholder="Early arrival, extra pillows..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full resize-none rounded-xl border border-brand-border bg-brand-bg/40 px-3.5 py-2 text-sm text-brand-ink outline-none focus:border-brand-primary focus:bg-white"
          />
        </div>

        {/* Price Summary */}
        <div className="rounded-xl bg-brand-bg p-3.5 text-xs">
          <div className="flex items-center justify-between text-brand-muted">
            <span>
              {bookingType === "day"
                ? "Fixed day-stay rate"
                : `${nights} night${nights === 1 ? "" : "s"} × ${formatNaira(selectedRoom?.night_price_ngn ?? 0)}`}
            </span>
            <span className="text-base font-bold text-brand-primary">
              {estimatedTotal > 0 ? formatNaira(estimatedTotal) : "—"}
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || !selectedRoom || (bookingType === "night" && nights <= 0)}
          className="w-full cursor-pointer rounded-xl bg-brand-primary py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting
            ? "Checking availability..."
            : bookingType === "day"
            ? "Book Day Stay"
            : "Book Night Stay"}
        </button>

        {/* Secondary Night Booking section — only visible when scrolling down */}
        {bookingType === "day" && (
          <div className="mt-4 border-t border-brand-border/80 pt-4 text-center">
            <p className="text-xs text-brand-muted">
              Staying overnight instead?
            </p>
            <button
              type="button"
              onClick={() => setBookingType("night")}
              className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-brand-bg px-4 py-2 text-xs font-semibold text-brand-ink transition hover:bg-night-bg hover:text-brand-primary"
            >
              <MoonIcon className="h-3.5 w-3.5" />
              Switch to Full Night Booking ({formatNaira(selectedRoom?.night_price_ngn ?? 0)}/night)
            </button>
          </div>
        )}
      </div>
    </form>
  );
}
