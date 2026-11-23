"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { updateBookingStatusAction } from "@/app/actions/hotel-admin";
import { formatNaira } from "@/types/database";

export interface HotelAdminBooking {
  id: string;
  guest_name: string;
  guest_phone: string;
  guest_email: string | null;
  booking_type: string;
  check_in_date: string;
  check_out_date: string | null;
  amount_ngn: number;
  status: string;
  notes: string | null;
  created_at: string;
  room_name: string;
  payment_status: string | null;
}

const STATUS_FILTERS = [
  "all",
  "requested",
  "confirmed",
  "completed",
  "declined",
  "pending_payment",
] as const;

function badgeForStatus(status: string) {
  switch (status) {
    case "confirmed":
      return "bg-emerald-50 text-emerald-700";
    case "requested":
      return "bg-night-bg text-brand-primary";
    case "pending_payment":
      return "bg-day-bg text-day-text";
    case "completed":
      return "bg-brand-ink text-white";
    case "declined":
    case "cancelled":
      return "bg-red-50 text-red-700";
    default:
      return "bg-brand-bg text-brand-muted";
  }
}

export function BookingsInboxTab({
  bookings,
}: {
  bookings: HotelAdminBooking[];
}) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (dateFilter && b.check_in_date !== dateFilter) return false;
      return true;
    });
  }, [bookings, statusFilter, dateFilter]);

  async function handleAction(
    bookingId: string,
    nextStatus: "confirmed" | "declined" | "completed"
  ) {
    setFeedback(null);
    setBusyId(bookingId);
    const res = await updateBookingStatusAction(bookingId, nextStatus);
    setBusyId(null);

    if (!res.ok) {
      setFeedback(res.error ?? "Action failed.");
      return;
    }

    if (nextStatus === "declined" && res.refunded) {
      setFeedback("Booking declined and Paystack refund initiated.");
    } else {
      setFeedback(`Booking marked as ${nextStatus}.`);
    }
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-[0_2px_20px_rgba(23,36,58,0.05)]">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${
                statusFilter === s
                  ? "bg-brand-primary text-white"
                  : "bg-brand-bg text-brand-muted hover:text-brand-ink"
              }`}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-xl border border-brand-border bg-brand-bg/50 px-3 py-1.5 text-xs text-brand-ink outline-none focus:border-brand-primary"
          />
          {dateFilter && (
            <button
              type="button"
              onClick={() => setDateFilter("")}
              className="cursor-pointer text-xs font-semibold text-brand-primary hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div className="rounded-xl bg-night-bg px-4 py-2.5 text-xs font-medium text-brand-primary">
          {feedback}
        </div>
      )}

      {/* Bookings Table / Cards */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_20px_rgba(23,36,58,0.05)]">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-brand-muted">
            No bookings match these filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-brand-border bg-brand-bg/60 text-brand-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Guest</th>
                  <th className="px-4 py-3 font-semibold">Room &amp; Stay</th>
                  <th className="px-4 py-3 font-semibold">Dates</th>
                  <th className="px-4 py-3 font-semibold">Amount / Pay</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/70">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-brand-bg/30">
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-brand-ink">{b.guest_name}</div>
                      <div className="text-[11px] text-brand-muted">{b.guest_phone}</div>
                      {b.notes && (
                        <div className="mt-0.5 max-w-[180px] truncate text-[11px] italic text-brand-muted">
                          &ldquo;{b.notes}&rdquo;
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-brand-ink">{b.room_name}</div>
                      <span
                        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          b.booking_type === "day"
                            ? "bg-day-bg text-day-text"
                            : "bg-night-bg text-brand-primary"
                        }`}
                      >
                        {b.booking_type} stay
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-brand-ink">
                      <div>{b.check_in_date}</div>
                      {b.check_out_date && (
                        <div className="text-[11px] text-brand-muted">
                          → {b.check_out_date}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-brand-ink">
                        {formatNaira(b.amount_ngn)}
                      </div>
                      <div className="text-[11px] capitalize text-brand-muted">
                        {b.payment_status ? `Pay: ${b.payment_status}` : "Pay on request"}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${badgeForStatus(
                          b.status
                        )}`}
                      >
                        {b.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex justify-end gap-1.5">
                        {b.status === "requested" && (
                          <>
                            <button
                              type="button"
                              disabled={busyId === b.id}
                              onClick={() => handleAction(b.id, "confirmed")}
                              className="cursor-pointer rounded-lg bg-brand-primary px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-brand-primary-hover disabled:opacity-50"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              disabled={busyId === b.id}
                              onClick={() => handleAction(b.id, "declined")}
                              className="cursor-pointer rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                            >
                              Decline
                            </button>
                          </>
                        )}
                        {b.status === "confirmed" && (
                          <>
                            <button
                              type="button"
                              disabled={busyId === b.id}
                              onClick={() => handleAction(b.id, "completed")}
                              className="cursor-pointer rounded-lg bg-brand-ink px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-brand-primary disabled:opacity-50"
                            >
                              Complete
                            </button>
                            <button
                              type="button"
                              disabled={busyId === b.id}
                              onClick={() => handleAction(b.id, "declined")}
                              className="cursor-pointer rounded-lg border border-red-200 px-2.5 py-1.5 text-[11px] font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
