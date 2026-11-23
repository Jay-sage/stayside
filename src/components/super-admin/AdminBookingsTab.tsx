"use client";

import { useMemo, useState } from "react";
import { formatNaira, type Hotel } from "@/types/database";

export interface SuperAdminBookingRow {
  id: string;
  hotel_id: string;
  hotel_name: string;
  room_name: string;
  guest_name: string;
  guest_phone: string;
  booking_type: string;
  check_in_date: string;
  check_out_date: string | null;
  amount_ngn: number;
  commission_ngn: number;
  status: string;
  payment_status: string | null;
  created_at: string;
}

function escapeCsvCell(value: string | number | null | undefined): string {
  const str = String(value ?? "");
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function AdminBookingsTab({
  hotels,
  bookings,
}: {
  hotels: Hotel[];
  bookings: SuperAdminBookingRow[];
}) {
  const [hotelId, setHotelId] = useState("all");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (hotelId !== "all" && b.hotel_id !== hotelId) return false;
      if (status !== "all" && b.status !== status) return false;
      if (type !== "all" && b.booking_type !== type) return false;
      if (fromDate && b.check_in_date < fromDate) return false;
      if (toDate && b.check_in_date > toDate) return false;
      return true;
    });
  }, [bookings, hotelId, status, type, fromDate, toDate]);

  function handleExportCsv() {
    const headers = [
      "Booking Ref",
      "Hotel",
      "Room",
      "Guest Name",
      "Guest Phone",
      "Stay Type",
      "Check-In",
      "Check-Out",
      "Amount (NGN)",
      "Commission (NGN)",
      "Status",
      "Payment Status",
      "Created At",
    ];

    const rows = filtered.map((b) => [
      b.id.slice(0, 8).toUpperCase(),
      b.hotel_name,
      b.room_name,
      b.guest_name,
      b.guest_phone,
      b.booking_type,
      b.check_in_date,
      b.check_out_date ?? "",
      b.amount_ngn,
      b.commission_ngn,
      b.status,
      b.payment_status ?? "none",
      b.created_at,
    ]);

    const csvContent =
      "\uFEFF" +
      [headers, ...rows]
        .map((row) => row.map(escapeCsvCell).join(","))
        .join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stayside-bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 rounded-2xl bg-white p-4 shadow-[0_2px_20px_rgba(23,36,58,0.05)] sm:grid-cols-2 lg:grid-cols-6">
        <select
          value={hotelId}
          onChange={(e) => setHotelId(e.target.value)}
          className="rounded-xl border border-brand-border bg-brand-bg/50 px-3 py-2 text-xs text-brand-ink"
        >
          <option value="all">All Hotels</option>
          {hotels.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-brand-border bg-brand-bg/50 px-3 py-2 text-xs text-brand-ink"
        >
          <option value="all">All Statuses</option>
          <option value="pending_payment">Pending Payment</option>
          <option value="requested">Requested</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="declined">Declined</option>
          <option value="cancelled">Cancelled</option>
          <option value="expired">Expired</option>
        </select>

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="rounded-xl border border-brand-border bg-brand-bg/50 px-3 py-2 text-xs text-brand-ink"
        >
          <option value="all">All Types</option>
          <option value="day">Day Stay</option>
          <option value="night">Night Stay</option>
        </select>

        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          aria-label="From date"
          className="rounded-xl border border-brand-border bg-brand-bg/50 px-3 py-2 text-xs text-brand-ink"
        />

        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          aria-label="To date"
          className="rounded-xl border border-brand-border bg-brand-bg/50 px-3 py-2 text-xs text-brand-ink"
        />

        <button
          type="button"
          onClick={handleExportCsv}
          className="cursor-pointer rounded-xl bg-brand-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-primary-hover"
        >
          Export CSV ({filtered.length})
        </button>
      </div>

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
                  <th className="px-4 py-3 font-semibold">Ref &amp; Hotel</th>
                  <th className="px-4 py-3 font-semibold">Guest</th>
                  <th className="px-4 py-3 font-semibold">Stay</th>
                  <th className="px-4 py-3 font-semibold">Amount / Comm.</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/70">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-brand-bg/30">
                    <td className="px-4 py-3">
                      <div className="font-bold text-brand-ink">{b.hotel_name}</div>
                      <div className="text-[11px] text-brand-muted">
                        #{b.id.slice(0, 8).toUpperCase()} · {b.room_name}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-brand-ink">{b.guest_name}</div>
                      <div className="text-[11px] text-brand-muted">{b.guest_phone}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          b.booking_type === "day"
                            ? "bg-day-bg text-day-text"
                            : "bg-night-bg text-brand-primary"
                        }`}
                      >
                        {b.booking_type}
                      </span>
                      <div className="mt-0.5 text-[11px] text-brand-muted">
                        {b.check_in_date}
                        {b.check_out_date ? ` → ${b.check_out_date}` : ""}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-brand-ink">
                        {formatNaira(b.amount_ngn)}
                      </div>
                      <div className="text-[11px] text-brand-primary">
                        Comm: {formatNaira(b.commission_ngn)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-full bg-brand-bg px-2.5 py-0.5 text-[11px] font-semibold capitalize text-brand-ink">
                        {b.status.replace("_", " ")}
                      </span>
                      {b.payment_status && (
                        <div className="mt-0.5 text-[10px] capitalize text-brand-muted">
                          Pay: {b.payment_status}
                        </div>
                      )}
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
