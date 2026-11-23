"use client";

import { useState, useTransition } from "react";
import { moderateHotelReviewAction } from "@/app/actions/reviews";
import { StarFilledIcon } from "@/components/Icons";
import type { ReviewStatus } from "@/types/database";

export interface SuperAdminReviewRow {
  id: string;
  hotel_id: string;
  hotel_name: string;
  guest_name: string;
  rating: number;
  comment: string;
  stay_type: "day" | "night";
  status: ReviewStatus;
  created_at: string;
}

export function AdminReviewsTab({
  initialReviews,
}: {
  initialReviews: SuperAdminReviewRow[];
}) {
  const [reviews, setReviews] = useState<SuperAdminReviewRow[]>(initialReviews);
  const [filter, setFilter] = useState<"all" | ReviewStatus>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered =
    filter === "all" ? reviews : reviews.filter((r) => r.status === filter);

  const pendingCount = reviews.filter((r) => r.status === "pending").length;

  function handleModerate(
    reviewId: string,
    status: "approved" | "rejected"
  ) {
    setBusyId(reviewId);
    startTransition(async () => {
      const res = await moderateHotelReviewAction({ reviewId, status });
      setBusyId(null);
      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) => (r.id === reviewId ? { ...r, status } : r))
        );
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-jakarta text-lg font-extrabold text-brand-ink">
            Guest Reviews Moderation
          </h2>
          <p className="text-xs text-brand-muted">
            All verified-guest reviews arrive unapproved until you approve or
            reject them here.
          </p>
        </div>

        <div className="flex items-center gap-1.5 rounded-full bg-white p-1 shadow-xs ring-1 ring-brand-border">
          {(["pending", "approved", "rejected", "all"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-bold capitalize transition ${
                filter === key
                  ? "bg-brand-primary text-white"
                  : "text-brand-muted hover:text-brand-ink"
              }`}
            >
              {key}
              {key === "pending" && pendingCount > 0 ? ` (${pendingCount})` : ""}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-brand-border bg-white p-10 text-center">
          <p className="text-sm font-bold text-brand-ink">
            No {filter === "all" ? "" : filter} reviews right now
          </p>
          <p className="mt-1 text-xs text-brand-muted">
            New reviews from confirmed hotel guests will appear here for
            approval.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((review) => (
            <div
              key={review.id}
              className="flex flex-col justify-between gap-4 rounded-2xl border border-brand-border/80 bg-white p-5 shadow-xs sm:flex-row sm:items-start"
            >
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-jakarta text-sm font-bold text-brand-ink">
                    {review.guest_name}
                  </span>
                  <span className="text-xs text-brand-muted">for</span>
                  <span className="rounded-full bg-night-bg px-2.5 py-0.5 text-xs font-bold text-brand-primary">
                    {review.hotel_name}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                      review.status === "approved"
                        ? "bg-emerald-50 text-emerald-700"
                        : review.status === "rejected"
                          ? "bg-red-50 text-red-700"
                          : "bg-amber-50 text-amber-800"
                    }`}
                  >
                    {review.status}
                  </span>
                </div>

                <div className="flex items-center gap-1">
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
                  <span className="ml-1.5 text-[11px] text-brand-muted">
                    {review.stay_type === "day" ? "Day Stay" : "Night Stay"} ·{" "}
                    {new Date(review.created_at).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <p className="text-sm leading-relaxed text-brand-ink/90">
                  {review.comment}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {review.status !== "approved" && (
                  <button
                    type="button"
                    disabled={isPending && busyId === review.id}
                    onClick={() => handleModerate(review.id, "approved")}
                    className="cursor-pointer rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                  >
                    Approve
                  </button>
                )}
                {review.status !== "rejected" && (
                  <button
                    type="button"
                    disabled={isPending && busyId === review.id}
                    onClick={() => handleModerate(review.id, "rejected")}
                    className="cursor-pointer rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
