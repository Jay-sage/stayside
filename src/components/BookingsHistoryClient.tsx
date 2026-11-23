"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeftIcon, CalendarIcon } from "@/components/Icons";
import { buildWhatsAppUrl } from "@/lib/phone";
import { formatNaira, formatTimeShort } from "@/types/database";

export interface BookingOrderItem {
  id: string;
  booking_type: string;
  check_in_date: string;
  check_out_date: string | null;
  amount_ngn: number;
  status: string;
  created_at: string;
  notes: string | null;
  hotel_name: string;
  hotel_slug: string;
  hotel_area: string;
  hotel_photo: string;
  hotel_whatsapp: string;
  day_start: string;
  day_end: string;
  room_name: string;
  payment_status: string | null;
  payment_reference: string | null;
}

type TabKey = "all" | "active" | "completed" | "closed";

function statusStyle(status: string): { label: string; cls: string } {
  switch (status) {
    case "confirmed":
      return { label: "Confirmed", cls: "bg-emerald-50 text-emerald-700" };
    case "requested":
      return { label: "Requested", cls: "bg-night-bg text-brand-primary" };
    case "pending_payment":
      return { label: "Pending Payment", cls: "bg-day-bg text-day-text" };
    case "completed":
      return { label: "Completed", cls: "bg-brand-ink text-white" };
    case "declined":
      return { label: "Declined", cls: "bg-red-50 text-red-700" };
    case "cancelled":
      return { label: "Cancelled", cls: "bg-red-50 text-red-700" };
    case "expired":
      return { label: "Expired", cls: "bg-brand-bg text-brand-muted" };
    default:
      return { label: status, cls: "bg-brand-bg text-brand-ink" };
  }
}

export function BookingsHistoryClient({
  orders,
}: {
  orders: BookingOrderItem[];
}) {
  const [tab, setTab] = useState<TabKey>("all");

  const filtered = useMemo(() => {
    if (tab === "all") return orders;
    if (tab === "active") {
      return orders.filter((o) =>
        ["pending_payment", "requested", "confirmed"].includes(o.status)
      );
    }
    if (tab === "completed") {
      return orders.filter((o) => o.status === "completed");
    }
    return orders.filter((o) =>
      ["declined", "cancelled", "expired"].includes(o.status)
    );
  }, [orders, tab]);

  const counts = useMemo(
    () => ({
      all: orders.length,
      active: orders.filter((o) =>
        ["pending_payment", "requested", "confirmed"].includes(o.status)
      ).length,
      completed: orders.filter((o) => o.status === "completed").length,
      closed: orders.filter((o) =>
        ["declined", "cancelled", "expired"].includes(o.status)
      ).length,
    }),
    [orders]
  );

  return (
    <div className="mx-auto max-w-2xl px-5 pt-5 pb-16 md:py-10">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/account"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-border bg-white text-brand-ink transition hover:bg-brand-bg"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="font-jakarta text-lg font-bold text-brand-ink">
          My Bookings
        </h1>
        <span className="w-10 text-right text-xs font-semibold text-brand-muted">
          {orders.length}
        </span>
      </div>

      {/* Order Status Tabs */}
      <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto pb-1">
        {(
          [
            { key: "all", label: `All (${counts.all})` },
            { key: "active", label: `Active (${counts.active})` },
            { key: "completed", label: `Completed (${counts.completed})` },
            { key: "closed", label: `Cancelled (${counts.closed})` },
          ] as const
        ).map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`shrink-0 cursor-pointer rounded-full px-4 py-2 text-xs font-semibold transition ${
              tab === item.key
                ? "bg-brand-primary text-white shadow-xs"
                : "bg-brand-bg text-brand-muted hover:text-brand-ink"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl bg-brand-bg p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand-primary shadow-xs">
            <CalendarIcon className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-sm font-bold text-brand-ink">
            No bookings in this tab yet
          </h2>
          <p className="mt-1 text-xs text-brand-muted">
            Your Lagos night and day stays will appear here like orders so you can track every reservation.
          </p>
          <Link
            href="/hotels"
            className="mt-5 inline-flex rounded-full bg-brand-primary px-6 py-2.5 text-xs font-semibold text-white transition hover:bg-brand-primary-hover"
          >
            Explore Hotels
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => {
            const st = statusStyle(order.status);
            const shortRef = order.id.slice(0, 8).toUpperCase();
            const bookedOn = new Date(order.created_at).toLocaleDateString("en-NG", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            const stayText =
              order.booking_type === "day"
                ? `Day Stay (${formatTimeShort(order.day_start)}–${formatTimeShort(order.day_end)}) · ${order.check_in_date}`
                : `Night Stay · ${order.check_in_date} → ${order.check_out_date}`;

            const waUrl = buildWhatsAppUrl(
              order.hotel_whatsapp,
              `Hello ${order.hotel_name}, following up on my Stayside booking #${shortRef} (${order.room_name}, ${stayText}).`
            );

            return (
              <article
                key={order.id}
                className="overflow-hidden rounded-2xl bg-white p-4 shadow-[0_4px_26px_rgba(23,36,58,0.07)]"
              >
                {/* Order Meta Row */}
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-brand-border/70 pb-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-brand-ink">
                      #{shortRef}
                    </span>
                    <span className="text-brand-muted">· Booked {bookedOn}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {order.payment_status && (
                      <span className="rounded-full bg-brand-bg px-2.5 py-0.5 text-[11px] font-medium capitalize text-brand-muted">
                        Pay: {order.payment_status}
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${st.cls}`}
                    >
                      {st.label}
                    </span>
                  </div>
                </div>

                {/* Hotel & Room Details */}
                <div className="flex items-center gap-3.5">
                  {order.hotel_photo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={order.hotel_photo}
                      alt={order.hotel_name}
                      className="h-20 w-24 shrink-0 rounded-xl object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/hotels/${order.hotel_slug}`}
                        className="truncate text-sm font-bold text-brand-ink hover:text-brand-primary"
                      >
                        {order.hotel_name}
                      </Link>
                      <span className="shrink-0 text-sm font-bold text-brand-primary">
                        {formatNaira(order.amount_ngn)}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-brand-ink">
                      {order.room_name} · {order.hotel_area}
                    </p>
                    <p className="text-xs text-brand-muted">{stayText}</p>
                  </div>
                </div>

                {/* Order Actions */}
                <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-brand-border/70 pt-3">
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-brand-border px-3.5 py-1.5 text-xs font-semibold text-brand-ink transition hover:bg-brand-bg"
                  >
                    WhatsApp Hotel
                  </a>
                  <Link
                    href={`/hotels/${order.hotel_slug}`}
                    className="rounded-full bg-brand-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-primary-hover"
                  >
                    Book Again
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
