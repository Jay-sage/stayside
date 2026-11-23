"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  markHotelPaidOutAction,
  toggleHotelSitePublishAction,
} from "@/app/actions/super-admin";
import type { SuperAdminBookingRow } from "@/components/super-admin/AdminBookingsTab";
import { formatNaira, type Hotel } from "@/types/database";

export interface PayoutRow {
  id: string;
  hotel_id: string;
  period_month: string;
  amount_ngn: number;
  paid_out_at: string;
}

export interface RefundPaymentRow {
  id: string;
  reference: string;
  amount_kobo: number;
  status: string;
  created_at: string;
  hotel_name: string;
  guest_name: string;
}

export interface HotelSiteRow {
  id: string;
  hotel_id: string;
  subdomain: string;
  published: boolean;
}

export function AdminFinanceTab({
  hotels,
  bookings,
  payouts,
  refunds,
  defaultMonth,
}: {
  hotels: Hotel[];
  bookings: SuperAdminBookingRow[];
  payouts: PayoutRow[];
  refunds: RefundPaymentRow[];
  defaultMonth: string;
}) {
  const router = useRouter();
  const [month, setMonth] = useState(defaultMonth);
  const [busyHotelId, setBusyHotelId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const summary = useMemo(() => {
    return hotels.map((hotel) => {
      // Stage 4: commission earned on paid, confirmed, and completed bookings by month
      const eligible = bookings.filter(
        (b) =>
          b.hotel_id === hotel.id &&
          b.check_in_date.slice(0, 7) === month &&
          (["confirmed", "completed"].includes(b.status) ||
            b.payment_status === "success")
      );

      const grossNgn = eligible.reduce((sum, b) => sum + b.amount_ngn, 0);
      const commissionNgn = eligible.reduce((sum, b) => sum + b.commission_ngn, 0);
      const owedNgn = Math.max(0, grossNgn - commissionNgn);
      const payout = payouts.find(
        (p) => p.hotel_id === hotel.id && p.period_month === month
      );

      return {
        hotel,
        bookingCount: eligible.length,
        grossNgn,
        commissionNgn,
        owedNgn,
        payout,
      };
    });
  }, [hotels, bookings, payouts, month]);

  const totals = useMemo(
    () =>
      summary.reduce(
        (acc, row) => ({
          gross: acc.gross + row.grossNgn,
          commission: acc.commission + row.commissionNgn,
          owed: acc.owed + (row.payout ? 0 : row.owedNgn),
        }),
        { gross: 0, commission: 0, owed: 0 }
      ),
    [summary]
  );

  async function handleMarkPaid(hotelId: string, amountNgn: number) {
    setMsg(null);
    setBusyHotelId(hotelId);
    const res = await markHotelPaidOutAction({
      hotelId,
      periodMonth: month,
      amountNgn,
    });
    setBusyHotelId(null);
    setMsg(res.ok ? `Marked ${month} payout as paid out.` : res.error ?? "Failed.");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Month selector + summary cards */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-[0_2px_20px_rgba(23,36,58,0.05)]">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-brand-ink">Billing Month:</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-xl border border-brand-border bg-brand-bg/50 px-3 py-1.5 text-xs font-semibold text-brand-ink"
          />
        </div>
        <div className="flex flex-wrap gap-4 text-xs">
          <span>
            Gross: <strong className="text-brand-ink">{formatNaira(totals.gross)}</strong>
          </span>
          <span>
            Commission:{" "}
            <strong className="text-brand-primary">{formatNaira(totals.commission)}</strong>
          </span>
          <span>
            Unpaid Owed:{" "}
            <strong className="text-brand-accent">{formatNaira(totals.owed)}</strong>
          </span>
        </div>
      </div>

      {msg && (
        <div className="rounded-xl bg-night-bg px-4 py-2.5 text-xs font-medium text-brand-primary">
          {msg}
        </div>
      )}

      {/* Commission & Payouts Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_20px_rgba(23,36,58,0.05)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-brand-border bg-brand-bg/60 text-brand-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Hotel</th>
                <th className="px-4 py-3 font-semibold">Bookings</th>
                <th className="px-4 py-3 font-semibold">Gross</th>
                <th className="px-4 py-3 font-semibold">Commission</th>
                <th className="px-4 py-3 font-semibold">Owed to Hotel</th>
                <th className="px-4 py-3 text-right font-semibold">Payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/70">
              {summary.map((row) => (
                <tr key={row.hotel.id} className="hover:bg-brand-bg/30">
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-brand-ink">{row.hotel.name}</div>
                    <div className="text-[11px] text-brand-muted">
                      Rate: {row.hotel.commission_rate}%
                    </div>
                  </td>
                  <td className="px-4 py-3.5">{row.bookingCount}</td>
                  <td className="px-4 py-3.5 font-medium">{formatNaira(row.grossNgn)}</td>
                  <td className="px-4 py-3.5 font-semibold text-brand-primary">
                    {formatNaira(row.commissionNgn)}
                  </td>
                  <td className="px-4 py-3.5 font-bold text-brand-ink">
                    {formatNaira(row.owedNgn)}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {row.payout ? (
                      <span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                        Paid out
                      </span>
                    ) : row.owedNgn > 0 ? (
                      <button
                        type="button"
                        disabled={busyHotelId === row.hotel.id}
                        onClick={() => handleMarkPaid(row.hotel.id, row.owedNgn)}
                        className="cursor-pointer rounded-lg bg-brand-ink px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-brand-primary"
                      >
                        Mark as Paid Out
                      </button>
                    ) : (
                      <span className="text-brand-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refunds List */}
      <div className="rounded-2xl bg-white p-5 shadow-[0_2px_20px_rgba(23,36,58,0.05)]">
        <h3 className="text-sm font-bold text-brand-ink">
          Refunded Payments ({refunds.length})
        </h3>
        {refunds.length === 0 ? (
          <p className="mt-2 text-xs text-brand-muted">No refunded payments yet.</p>
        ) : (
          <div className="mt-3 divide-y divide-brand-border/70 text-xs">
            {refunds.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2.5">
                <div>
                  <span className="font-mono font-semibold text-brand-ink">
                    {r.reference}
                  </span>
                  <span className="text-brand-muted">
                    {" "}
                    · {r.hotel_name} ({r.guest_name})
                  </span>
                </div>
                <span className="font-bold text-red-600">
                  {formatNaira(Math.round(r.amount_kobo / 100))}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminSitesTab({
  hotels,
  sites,
  rootDomain,
}: {
  hotels: Hotel[];
  sites: HotelSiteRow[];
  rootDomain: string;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleToggle(hotel: Hotel, nextPublished: boolean) {
    setBusyId(hotel.id);
    await toggleHotelSitePublishAction(hotel.id, hotel.slug, nextPublished);
    setBusyId(null);
    router.refresh();
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_20px_rgba(23,36,58,0.05)]">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-brand-border bg-brand-bg/60 text-brand-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Hotel</th>
              <th className="px-4 py-3 font-semibold">Subdomain</th>
              <th className="px-4 py-3 font-semibold">Site Status</th>
              <th className="px-4 py-3 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border/70">
            {hotels.map((h) => {
              const site = sites.find((s) => s.hotel_id === h.id);
              const sub = site?.subdomain ?? h.slug;
              const isPublished = Boolean(site?.published);
              return (
                <tr key={h.id} className="hover:bg-brand-bg/30">
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-brand-ink">{h.name}</div>
                    <div className="text-[11px] capitalize text-brand-muted">
                      Hotel: {h.status} · Plan: {h.plan}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-brand-primary">
                    {sub}.{rootDomain}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        isPublished
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-brand-bg text-brand-muted"
                      }`}
                    >
                      {isPublished ? "Published" : "Unpublished"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      type="button"
                      disabled={busyId === h.id}
                      onClick={() => handleToggle(h, !isPublished)}
                      className={`cursor-pointer rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${
                        isPublished
                          ? "border border-brand-border bg-white text-brand-ink hover:bg-brand-bg"
                          : "bg-brand-primary text-white hover:bg-brand-primary-hover"
                      }`}
                    >
                      {isPublished ? "Unpublish" : "Publish"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
