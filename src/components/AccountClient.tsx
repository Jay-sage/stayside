"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { normalizeNigerianPhone } from "@/lib/phone";
import {
  BellIcon,
  ChevronLeftIcon,
  HeartIcon,
  UserIcon,
} from "@/components/Icons";
import { AVATAR_OPTIONS, ProfileAvatar } from "@/components/ProfileAvatar";
import { formatNaira, type SavedCard, type UserRole } from "@/types/database";

export interface AccountBookingRow {
  id: string;
  booking_type: string;
  check_in_date: string;
  check_out_date: string | null;
  amount_ngn: number;
  status: string;
  hotel_name: string;
  hotel_slug: string;
  hotel_photo: string;
  room_name: string;
}

export function AccountClient({
  user,
  bookings,
  savedCards,
}: {
  user: {
    id: string;
    email: string;
    fullName: string;
    phone: string;
    avatarId: string;
    role: UserRole;
  } | null;
  bookings: AccountBookingRow[];
  savedCards: SavedCard[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [avatarId, setAvatarId] = useState(user?.avatarId ?? "classic");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [showAllBookings, setShowAllBookings] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-5 py-12">
        <div className="rounded-[28px] bg-white p-7 text-center shadow-[0_8px_40px_rgba(23,36,58,0.08)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-night-bg text-brand-primary">
            <UserIcon className="h-7 w-7" />
          </div>
          <h1 className="mt-4 font-jakarta text-xl font-bold text-brand-ink">
            Your Stayside Account
          </h1>
          <p className="mt-1.5 text-xs leading-relaxed text-brand-muted">
            Sign in or create an account to view your Lagos bookings, save favorite hotels, and check out faster.
          </p>

          <div className="mt-6 space-y-2.5">
            <Link
              href="/login"
              className="flex w-full items-center justify-center rounded-full bg-brand-ink py-3 text-sm font-semibold text-white transition hover:bg-brand-primary"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="flex w-full items-center justify-center rounded-full border border-brand-border bg-white py-3 text-sm font-semibold text-brand-ink transition hover:bg-brand-bg"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const initials = (fullName || user.email)
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const latestBooking = bookings[0] ?? null;

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaveMsg(null);
    const normalized = phone.trim() ? normalizeNigerianPhone(phone) : null;
    if (phone.trim() && !normalized) {
      setSaveMsg("Please enter a valid Nigerian WhatsApp number.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim(), phone: normalized, avatar_id: avatarId })
      .eq("id", user!.id);

    setSaving(false);
    if (error) {
      setSaveMsg(error.message);
      return;
    }
    setPhone(normalized ?? "");
    setEditing(false);
    router.refresh();
  }

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-xl px-5 pt-5 pb-16 md:py-10">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-border bg-white text-brand-ink transition hover:bg-brand-bg"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="font-jakarta text-lg font-bold text-brand-ink">Account</h1>
        <span className="w-10" />
      </div>

      {/* Profile Header Row (matches Image 5) */}
      <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-[0_4px_28px_rgba(23,36,58,0.06)]">
        <div className="flex min-w-0 items-center gap-3.5">
          <ProfileAvatar avatarId={avatarId} size="lg" />
          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold text-brand-ink">
              {fullName || "Stayside Guest"}
            </h2>
            <p className="truncate text-xs text-brand-muted">{user.email}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="shrink-0 cursor-pointer rounded-full bg-night-bg px-3.5 py-1.5 text-xs font-semibold text-brand-primary transition hover:bg-brand-primary/15"
        >
          {editing ? "Close" : "Edit"}
        </button>
      </div>

      {/* Inline Edit Profile Form */}
      {editing && (
        <form
          onSubmit={handleSaveProfile}
          className="mb-6 space-y-3.5 rounded-2xl bg-brand-bg p-4"
        >
          {saveMsg && <p className="text-xs font-medium text-red-600">{saveMsg}</p>}

          <div>
            <label className="mb-2 block text-xs font-semibold text-brand-ink">
              Choose Profile Icon
            </label>
            <div className="flex items-center gap-3">
              {AVATAR_OPTIONS.map((opt) => {
                const selected = avatarId === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAvatarId(opt.id)}
                    className={`flex cursor-pointer flex-col items-center gap-1 rounded-2xl p-1.5 transition ${
                      selected
                        ? "bg-white ring-2 ring-brand-primary"
                        : "opacity-75 hover:opacity-100"
                    }`}
                  >
                    <ProfileAvatar avatarId={opt.id} size="md" />
                    <span className="text-[10px] font-medium text-brand-muted">
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-brand-ink">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-full bg-white px-4 py-2.5 text-sm text-brand-ink outline-none ring-1 ring-brand-border focus:ring-brand-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-brand-ink">
              WhatsApp Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0803 123 4567"
              className="w-full rounded-full bg-white px-4 py-2.5 text-sm text-brand-ink outline-none ring-1 ring-brand-border focus:ring-brand-primary"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full cursor-pointer rounded-full bg-brand-primary py-2.5 text-xs font-semibold text-white transition hover:bg-brand-primary-hover disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      )}

      {/* Role Portal Shortcut for hotel_admin / super_admin */}
      {(user.role === "hotel_admin" || user.role === "super_admin") && (
        <Link
          href={user.role === "super_admin" ? "/admin" : "/hotel"}
          className="mb-6 flex items-center justify-between rounded-2xl bg-brand-primary px-4 py-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-primary-hover"
        >
          <span>
            {user.role === "super_admin"
              ? "Open Super Admin Dashboard"
              : "Open Hotel Admin Portal"}
          </span>
          <span>→</span>
        </Link>
      )}

      {/* My Booking Section (matches Image 5 hero booking card) */}
      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-brand-ink">My Bookings</h3>
          <Link
            href="/account/bookings"
            className="text-xs font-semibold text-brand-primary hover:underline"
          >
            View All ({bookings.length})
          </Link>
        </div>

        {!latestBooking ? (
          <div className="rounded-2xl bg-brand-bg p-6 text-center text-xs text-brand-muted">
            You haven&apos;t made a booking yet.{" "}
            <Link href="/hotels" className="font-semibold text-brand-primary underline">
              Explore Lagos hotels
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Hero Latest Booking Card */}
            <Link
              href={`/hotels/${latestBooking.hotel_slug}`}
              className="relative block h-40 overflow-hidden rounded-2xl bg-brand-ink shadow-[0_6px_24px_rgba(23,36,58,0.12)]"
            >
              {latestBooking.hotel_photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={latestBooking.hotel_photo}
                  alt={latestBooking.hotel_name}
                  className="h-full w-full object-cover opacity-80"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-brand-ink/90 via-brand-ink/25 to-transparent" />
              <span className="absolute top-3 right-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold capitalize text-brand-primary">
                {latestBooking.status}
              </span>
              <div className="absolute inset-x-4 bottom-4 text-white">
                <p className="text-base font-bold leading-tight">
                  {latestBooking.hotel_name}
                </p>
                <p className="mt-1 text-xs text-white/85">
                  {latestBooking.room_name} ·{" "}
                  {latestBooking.booking_type === "day"
                    ? `Day Stay (${latestBooking.check_in_date})`
                    : `${latestBooking.check_in_date} – ${latestBooking.check_out_date}`}
                </p>
              </div>
            </Link>

            {showAllBookings &&
              bookings.slice(1).map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-2xl bg-white p-3.5 text-xs shadow-[0_2px_18px_rgba(23,36,58,0.06)]"
                >
                  <div>
                    <p className="font-semibold text-brand-ink">{b.hotel_name}</p>
                    <p className="text-brand-muted">
                      {b.room_name} · {b.check_in_date}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-brand-primary">
                      {formatNaira(b.amount_ngn)}
                    </p>
                    <p className="capitalize text-brand-muted">{b.status}</p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>

      {/* Settings List (matches Image 5) */}
      <section className="space-y-2">
        <h3 className="mb-2 text-sm font-bold text-brand-ink">Settings</h3>
        <div className="divide-y divide-brand-border/70 rounded-2xl bg-white shadow-[0_4px_28px_rgba(23,36,58,0.06)]">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex w-full cursor-pointer items-center justify-between px-4 py-3.5 text-left text-sm text-brand-ink transition hover:bg-brand-bg/60"
          >
            <span className="flex items-center gap-3">
              <UserIcon className="h-4 w-4 text-brand-muted" />
              Personal Information
            </span>
            <span className="text-brand-muted">›</span>
          </button>

          <Link
            href="/account/bookings"
            className="flex items-center justify-between px-4 py-3.5 text-sm text-brand-ink transition hover:bg-brand-bg/60"
          >
            <span className="flex items-center gap-3">
              <UserIcon className="h-4 w-4 text-brand-muted" />
              Booking History ({bookings.length})
            </span>
            <span className="text-brand-muted">›</span>
          </Link>

          <Link
            href="/account/payment-methods"
            className="flex items-center justify-between px-4 py-3.5 text-sm text-brand-ink transition hover:bg-brand-bg/60"
          >
            <span className="flex items-center gap-3">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.7}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-brand-muted"
              >
                <rect x="2" y="5" width="20" height="14" rx="2.5" />
                <path d="M2 10h20" />
              </svg>
              Payment Methods
              {savedCards.length > 0 && (
                <span className="rounded-full bg-night-bg px-2 py-0.5 text-[11px] font-semibold text-brand-primary">
                  {savedCards.length}
                </span>
              )}
            </span>
            <span className="text-brand-muted">›</span>
          </Link>

          <Link
            href="/notifications"
            className="flex items-center justify-between px-4 py-3.5 text-sm text-brand-ink transition hover:bg-brand-bg/60"
          >
            <span className="flex items-center gap-3">
              <BellIcon className="h-4 w-4 text-brand-muted" />
              Notifications
            </span>
            <span className="text-brand-muted">›</span>
          </Link>

          <Link
            href="/wishlist"
            className="flex items-center justify-between px-4 py-3.5 text-sm text-brand-ink transition hover:bg-brand-bg/60"
          >
            <span className="flex items-center gap-3">
              <HeartIcon className="h-4 w-4 text-brand-muted" />
              Saved Hotels (Wishlist)
            </span>
            <span className="text-brand-muted">›</span>
          </Link>

          <div className="flex items-center justify-between px-4 py-3.5 text-sm text-brand-ink">
            <span>Currency &amp; Timezone</span>
            <span className="text-xs font-medium text-brand-muted">
              NGN (₦) · Africa/Lagos
            </span>
          </div>

          <button
            type="button"
            onClick={() => setLogoutModalOpen(true)}
            className="flex w-full cursor-pointer items-center justify-between px-4 py-3.5 text-left text-sm font-semibold text-brand-accent transition hover:bg-day-bg/50"
          >
            <span>Logout</span>
            <span>›</span>
          </button>
        </div>
      </section>

      {/* Logout Confirmation Modal (matches Image 5 right) */}
      {logoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/45 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-xs rounded-[24px] bg-white p-6 text-center shadow-2xl">
            <h3 className="font-jakarta text-lg font-bold text-brand-accent">
              Logout
            </h3>
            <p className="mt-2 text-xs text-brand-muted">
              Are you sure you want to logout?
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLogoutModalOpen(false)}
                className="cursor-pointer rounded-full border border-brand-border py-2.5 text-xs font-semibold text-brand-ink transition hover:bg-brand-bg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loggingOut}
                onClick={handleLogout}
                className="cursor-pointer rounded-full bg-brand-ink py-2.5 text-xs font-semibold text-white transition hover:bg-brand-primary disabled:opacity-60"
              >
                {loggingOut ? "..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
