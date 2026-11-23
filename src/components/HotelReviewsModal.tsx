"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { submitHotelReviewAction } from "@/app/actions/reviews";
import { CheckCircleIcon, StarFilledIcon } from "@/components/Icons";
import type { EligibleReviewBooking, HotelReview } from "@/types/database";

type SortOption = "recent" | "highest" | "lowest";

const AVATAR_BG = [
  "bg-[#EAF0FF] text-[#2457D6]",
  "bg-[#FFF0E8] text-[#D9551E]",
  "bg-[#ECFDF5] text-[#059669]",
  "bg-[#FEF3C7] text-[#B45309]",
  "bg-[#F3E8FF] text-[#7E22CE]",
];

function getAvatarTone(name: string): string {
  let sum = 0;
  for (let i = 0; i < name.length; i += 1) sum += name.charCodeAt(i);
  return AVATAR_BG[sum % AVATAR_BG.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "SG";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function formatReviewDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const day = d.getDate();
  const suffix =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
        ? "nd"
        : day % 10 === 3 && day !== 13
          ? "rd"
          : "th";
  const month = d.toLocaleString("en-US", { month: "long" });
  return `${month} ${day}${suffix}, ${d.getFullYear()}`;
}

export function HotelReviewsModal({
  hotelId,
  hotelSlug,
  hotelName,
  initialApprovedReviews,
  initialOwnPendingReviews,
  eligibleBookings,
  isSignedIn,
  onClose,
  onJumpToBook,
}: {
  hotelId: string;
  hotelSlug: string;
  hotelName: string;
  initialApprovedReviews: HotelReview[];
  initialOwnPendingReviews: HotelReview[];
  eligibleBookings: EligibleReviewBooking[];
  isSignedIn: boolean;
  onClose: () => void;
  onJumpToBook: () => void;
}) {
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [showWriteForm, setShowWriteForm] = useState(false);
  const [pendingReviews, setPendingReviews] = useState<HotelReview[]>(
    initialOwnPendingReviews
  );
  const [availableBookings, setAvailableBookings] =
    useState<EligibleReviewBooking[]>(eligibleBookings);

  const [selectedBookingId, setSelectedBookingId] = useState<string>(
    eligibleBookings[0]?.id ?? ""
  );
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalApproved = initialApprovedReviews.length;

  const averageRating = useMemo(() => {
    if (totalApproved === 0) return 0;
    const sum = initialApprovedReviews.reduce((acc, r) => acc + r.rating, 0);
    return Number((sum / totalApproved).toFixed(1));
  }, [initialApprovedReviews, totalApproved]);

  const distribution = useMemo(() => {
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const r of initialApprovedReviews) {
      if (counts[r.rating] !== undefined) counts[r.rating] += 1;
    }
    return counts;
  }, [initialApprovedReviews]);

  const sortedReviews = useMemo(() => {
    const list = [...initialApprovedReviews];
    if (sortBy === "highest") {
      list.sort(
        (a, b) =>
          b.rating - a.rating ||
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (sortBy === "lowest") {
      list.sort(
        (a, b) =>
          a.rating - b.rating ||
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else {
      list.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    return list;
  }, [initialApprovedReviews, sortBy]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedBookingId) {
      setErrorMsg("No eligible confirmed booking found for this hotel.");
      return;
    }

    startTransition(async () => {
      const res = await submitHotelReviewAction({
        hotelId,
        hotelSlug,
        bookingId: selectedBookingId,
        rating,
        comment,
      });

      if (!res.ok) {
        setErrorMsg(res.error);
        return;
      }

      setPendingReviews((prev) => [res.review, ...prev]);
      const remaining = availableBookings.filter(
        (b) => b.id !== selectedBookingId
      );
      setAvailableBookings(remaining);
      setSelectedBookingId(remaining[0]?.id ?? "");
      setComment("");
      setRating(5);
      setShowWriteForm(false);
      setSuccessMsg(
        "Thanks! Your review was submitted and is awaiting approval before going live."
      );
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reviews-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/55 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header — Chowdeck-style crisp title + circular close */}
        <div className="flex items-center justify-between border-b border-brand-border/70 px-6 py-5">
          <div>
            <h3
              id="reviews-modal-title"
              className="font-jakarta text-xl font-extrabold tracking-tight text-brand-ink sm:text-2xl"
            >
              Ratings and Reviews
            </h3>
            <p className="mt-0.5 text-xs text-brand-muted">
              {hotelName} · Verified guest stays only
            </p>
          </div>
          <button
            type="button"
            aria-label="Close reviews"
            onClick={onClose}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-brand-bg text-sm font-bold text-brand-ink transition hover:bg-brand-primary/10 hover:text-brand-primary"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Rating Summary + 5-to-1 Bar Breakdown (Exact Chowdeck Anatomy) */}
          <div className="flex flex-col items-center gap-6 border-b border-brand-border/70 pb-6 sm:flex-row sm:items-center sm:gap-8">
            <div className="flex shrink-0 flex-col items-center text-center sm:w-36">
              <div className="font-jakarta text-5xl font-black leading-none tracking-tight text-brand-ink">
                {totalApproved > 0 ? averageRating.toFixed(1) : "—"}
              </div>
              <div className="mt-2.5 flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarFilledIcon
                    key={star}
                    className={`h-5 w-5 ${
                      star <= Math.round(averageRating)
                        ? "text-[#FFD33C]"
                        : "text-brand-border"
                    }`}
                  />
                ))}
              </div>
              <p className="mt-1.5 text-xs font-bold text-brand-ink">
                {totalApproved} {totalApproved === 1 ? "Rating" : "Ratings"}
              </p>
            </div>

            {/* 5-to-1 Horizontal Bars */}
            <div className="w-full flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = distribution[star] ?? 0;
                const pct =
                  totalApproved > 0 ? Math.round((count / totalApproved) * 100) : 0;
                return (
                  <div key={star} className="flex items-center gap-3 text-xs">
                    <span className="w-3 font-jakarta font-bold text-brand-ink">
                      {star}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-brand-bg">
                      <div
                        className="h-full rounded-full bg-brand-primary transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-7 text-right text-[11px] font-medium text-brand-muted">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* All Reviews Header + Write Review + Sort By Pill */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <h4 className="font-jakarta text-base font-extrabold text-brand-ink">
              All Reviews{" "}
              <span className="font-semibold text-brand-muted">
                ({totalApproved})
              </span>
            </h4>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowWriteForm((v) => !v);
                  setErrorMsg(null);
                }}
                className="cursor-pointer rounded-full bg-brand-primary px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-brand-primary-hover"
              >
                {showWriteForm ? "Cancel" : "Write a review"}
              </button>

              <label className="relative inline-flex items-center">
                <span className="sr-only">Sort reviews</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="cursor-pointer appearance-none rounded-full border border-brand-border bg-white py-2 pr-8 pl-3.5 text-xs font-bold text-brand-ink outline-none transition hover:border-brand-primary/40"
                >
                  <option value="recent">⇅ Sort by: Recent</option>
                  <option value="highest">⇅ Sort by: Highest</option>
                  <option value="lowest">⇅ Sort by: Lowest</option>
                </select>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute right-3 text-[10px] text-brand-muted"
                >
                  ▾
                </span>
              </label>
            </div>
          </div>

          {/* Feedback Banner after submitting */}
          {successMsg && (
            <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-900">
              <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Write a Review Drawer (Verified Bookers Only) */}
          {showWriteForm && (
            <div className="mt-4 rounded-2xl border border-brand-border bg-brand-bg/60 p-4 sm:p-5">
              {!isSignedIn ? (
                <div className="space-y-2.5 text-center">
                  <p className="font-jakarta text-sm font-bold text-brand-ink">
                    Verified Guest Reviews Only
                  </p>
                  <p className="text-xs text-brand-muted">
                    Sign in to the account you used to book {hotelName} so we
                    can verify your stay before you leave a review.
                  </p>
                  <Link
                    href="/login"
                    className="mt-1 inline-flex rounded-full bg-brand-primary px-5 py-2 text-xs font-bold text-white hover:bg-brand-primary-hover"
                  >
                    Sign in to Review
                  </Link>
                </div>
              ) : availableBookings.length === 0 ? (
                <div className="space-y-2.5 text-center">
                  <p className="font-jakarta text-sm font-bold text-brand-ink">
                    Book a stay to leave a review
                  </p>
                  <p className="text-xs text-brand-muted">
                    Only guests with a confirmed booking at {hotelName} can
                    submit a review (1 review per stay).
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onJumpToBook();
                    }}
                    className="mt-1 cursor-pointer rounded-full bg-brand-primary px-5 py-2 text-xs font-bold text-white hover:bg-brand-primary-hover"
                  >
                    Book a Day Stay
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary">
                      <CheckCircleIcon className="h-4 w-4" />
                      Verified booking found
                    </span>

                    {availableBookings.length > 1 ? (
                      <select
                        value={selectedBookingId}
                        onChange={(e) => setSelectedBookingId(e.target.value)}
                        className="rounded-lg border border-brand-border bg-white px-2.5 py-1 text-xs font-semibold text-brand-ink outline-none"
                      >
                        {availableBookings.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.booking_type === "day" ? "Day Stay" : "Night Stay"}{" "}
                            · {b.check_in_date}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-[11px] font-medium text-brand-muted">
                        {availableBookings[0].booking_type === "day"
                          ? "Day Stay"
                          : "Night Stay"}{" "}
                        · {availableBookings[0].check_in_date}
                      </span>
                    )}
                  </div>

                  {/* Star Picker */}
                  <div>
                    <p className="text-xs font-semibold text-brand-ink">
                      Your rating
                    </p>
                    <div className="mt-1.5 flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          aria-label={`Rate ${star} stars`}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(star)}
                          className="cursor-pointer p-0.5 transition hover:scale-110"
                        >
                          <StarFilledIcon
                            className={`h-7 w-7 ${
                              star <= (hoverRating || rating)
                                ? "text-[#FFD33C]"
                                : "text-brand-border"
                            }`}
                          />
                        </button>
                      ))}
                      <span className="ml-2 text-xs font-bold text-brand-ink">
                        {rating}.0 / 5
                      </span>
                    </div>
                  </div>

                  {/* Comment Box */}
                  <div>
                    <label
                      htmlFor="review-comment"
                      className="block text-xs font-semibold text-brand-ink"
                    >
                      How was your stay?
                    </label>
                    <textarea
                      id="review-comment"
                      rows={3}
                      required
                      minLength={4}
                      maxLength={800}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share how check-in, room cleanliness, Wi-Fi, or pool access went..."
                      className="mt-1.5 w-full rounded-xl border border-brand-border bg-white px-3.5 py-2.5 text-sm text-brand-ink outline-none placeholder:text-brand-muted focus:border-brand-primary"
                    />
                  </div>

                  {errorMsg && (
                    <p className="text-xs font-semibold text-red-600">
                      {errorMsg}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-[11px] text-brand-muted">
                      Reviews go through quick approval before appearing
                      publicly.
                    </p>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="cursor-pointer rounded-full bg-brand-primary px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-brand-primary-hover disabled:opacity-60"
                    >
                      {isPending ? "Submitting..." : "Submit Review"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Guest's Own Pending Reviews (visible only to them until approved) */}
          {pendingReviews.length > 0 && (
            <div className="mt-5 space-y-3">
              {pendingReviews.map((r) => (
                <div
                  key={r.id}
                  className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full font-jakarta text-xs font-extrabold ${getAvatarTone(
                          r.guest_name
                        )}`}
                      >
                        {getInitials(r.guest_name)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-brand-ink">
                          {r.guest_name}{" "}
                          <span className="ml-1 rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                            Pending approval
                          </span>
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] text-brand-muted">
                      {formatReviewDate(r.created_at)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <StarFilledIcon
                        key={s}
                        className={`h-3.5 w-3.5 ${
                          s <= r.rating ? "text-[#FFD33C]" : "text-brand-border"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-brand-ink">
                    {r.comment}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Approved Public Reviews List */}
          <div className="mt-4 divide-y divide-brand-border/70">
            {sortedReviews.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm font-semibold text-brand-ink">
                  No published reviews yet
                </p>
                <p className="mt-1 text-xs text-brand-muted">
                  Be the first verified guest to review {hotelName}.
                </p>
              </div>
            ) : (
              sortedReviews.map((review) => (
                <article key={review.id} className="py-5 first:pt-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-jakarta text-xs font-extrabold ${getAvatarTone(
                          review.guest_name
                        )}`}
                      >
                        {getInitials(review.guest_name)}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-brand-ink">
                            {review.guest_name}
                          </span>
                          <span className="rounded-full bg-brand-bg px-2 py-0.5 text-[10px] font-semibold text-brand-primary">
                            Verified{" "}
                            {review.stay_type === "day"
                              ? "Day Stay"
                              : "Night Stay"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <time className="shrink-0 text-xs text-brand-muted">
                      {formatReviewDate(review.created_at)}
                    </time>
                  </div>

                  <div className="mt-2.5 flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <StarFilledIcon
                        key={s}
                        className={`h-4 w-4 ${
                          s <= review.rating
                            ? "text-[#FFD33C]"
                            : "text-brand-border"
                        }`}
                      />
                    ))}
                  </div>

                  <p className="mt-2.5 text-sm leading-relaxed text-brand-ink/90">
                    {review.comment}
                  </p>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
