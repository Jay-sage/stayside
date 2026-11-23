"use client";

import { useMemo, useState } from "react";
import { AdminHotelsTab } from "@/components/super-admin/AdminHotelsTab";
import {
  AdminBookingsTab,
  type SuperAdminBookingRow,
} from "@/components/super-admin/AdminBookingsTab";
import {
  AdminReviewsTab,
  type SuperAdminReviewRow,
} from "@/components/super-admin/AdminReviewsTab";
import {
  AdminFinanceTab,
  AdminSitesTab,
  type HotelSiteRow,
  type PayoutRow,
  type RefundPaymentRow,
} from "@/components/super-admin/AdminFinanceAndSitesTabs";
import {
  BuildingIcon,
  CalendarIcon,
  CheckCircleIcon,
  HomeIcon,
  StarFilledIcon,
  SunIcon,
} from "@/components/Icons";
import { formatNaira, type Hotel } from "@/types/database";

type AdminTab =
  | "overview"
  | "hotels"
  | "bookings"
  | "reviews"
  | "finance"
  | "sites";

const NAV_ITEMS: { id: AdminTab; label: string; icon: typeof HomeIcon }[] = [
  { id: "overview", label: "Overview", icon: HomeIcon },
  { id: "hotels", label: "Hotels & Plans", icon: BuildingIcon },
  { id: "bookings", label: "All Bookings", icon: CalendarIcon },
  { id: "reviews", label: "Reviews", icon: StarFilledIcon },
  { id: "finance", label: "Commissions", icon: CheckCircleIcon },
  { id: "sites", label: "Hotel Sites", icon: SunIcon },
];

export function SuperAdminClient({
  hotels,
  bookings,
  payouts,
  refunds,
  sites,
  reviews,
  currentMonth,
  rootDomain,
}: {
  hotels: Hotel[];
  bookings: SuperAdminBookingRow[];
  payouts: PayoutRow[];
  refunds: RefundPaymentRow[];
  sites: HotelSiteRow[];
  reviews: SuperAdminReviewRow[];
  currentMonth: string;
  rootDomain: string;
}) {
  const [tab, setTab] = useState<AdminTab>("overview");
  const pendingReviewsCount = reviews.filter(
    (r) => r.status === "pending"
  ).length;

  const stats = useMemo(() => {
    const thisMonthBookings = bookings.filter(
      (b) => b.created_at.slice(0, 7) === currentMonth
    );
    const dayCount = bookings.filter((b) => b.booking_type === "day").length;
    const nightCount = bookings.filter((b) => b.booking_type === "night").length;
    const total = Math.max(1, dayCount + nightCount);
    const dayPct = Math.round((dayCount / total) * 100);
    const nightPct = 100 - dayPct;

    const earnedCommission = bookings
      .filter(
        (b) =>
          ["confirmed", "completed"].includes(b.status) ||
          b.payment_status === "success"
      )
      .reduce((sum, b) => sum + b.commission_ngn, 0);

    const topHotels = hotels
      .map((h) => {
        const hb = bookings.filter((b) => b.hotel_id === h.id);
        const rev = hb.reduce((sum, b) => sum + b.amount_ngn, 0);
        return { hotel: h, count: hb.length, revenue: rev };
      })
      .sort((a, b) => b.count - a.count || b.revenue - a.revenue)
      .slice(0, 5);

    const pendingHotels = hotels.filter((h) => h.status === "pending").length;

    return {
      approvedCount: hotels.filter((h) => h.status === "approved").length,
      pendingHotels,
      thisMonthCount: thisMonthBookings.length,
      dayCount,
      nightCount,
      dayPct,
      nightPct,
      earnedCommission,
      topHotels,
    };
  }, [hotels, bookings, currentMonth]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-brand-bg/60">
      <div className="mx-auto flex max-w-7xl flex-col lg:flex-row">
        {/* Left Sidebar */}
        <aside className="hidden w-60 shrink-0 border-r border-brand-border/80 bg-white p-5 lg:block">
          <div className="mb-6">
            <span className="inline-block rounded-full bg-day-bg px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-day-text">
              Super Admin · Xlay
            </span>
            <h2 className="mt-2 font-jakarta text-sm font-bold text-brand-ink">
              Stayside Control
            </h2>
          </div>

          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-xs font-semibold transition ${
                    active
                      ? "bg-night-bg text-brand-primary"
                      : "text-brand-muted hover:bg-brand-bg hover:text-brand-ink"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  {item.id === "hotels" && stats.pendingHotels > 0 && (
                    <span className="rounded-full bg-brand-accent px-2 py-0.5 text-[10px] font-bold text-white">
                      {stats.pendingHotels}
                    </span>
                  )}
                  {item.id === "reviews" && pendingReviewsCount > 0 && (
                    <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                      {pendingReviewsCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {/* Mobile Tab Bar */}
          <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`shrink-0 cursor-pointer rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                  tab === item.id
                    ? "bg-brand-primary text-white"
                    : "bg-white text-brand-muted shadow-xs"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-jakarta text-xl font-bold text-brand-ink sm:text-2xl">
                {tab === "overview"
                  ? "Platform Overview"
                  : NAV_ITEMS.find((i) => i.id === tab)?.label}
              </h1>
              <p className="mt-0.5 text-xs text-brand-muted">
                Stayside Lagos · Built by Xlay
              </p>
            </div>
            <span className="rounded-xl bg-white px-3.5 py-2 text-xs font-medium text-brand-muted shadow-xs">
              Period: {currentMonth}
            </span>
          </div>

          {tab === "overview" && (
            <div className="space-y-6">
              {/* 4 KPI Cards */}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl bg-white p-5 shadow-[0_2px_20px_rgba(23,36,58,0.05)]">
                  <div className="text-xs text-brand-muted">Partner Hotels</div>
                  <div className="mt-2 font-jakarta text-3xl font-bold text-brand-ink">
                    {hotels.length}
                  </div>
                  <div className="mt-1 text-[11px] text-emerald-600">
                    {stats.approvedCount} approved · {stats.pendingHotels} pending
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-[0_2px_20px_rgba(23,36,58,0.05)]">
                  <div className="text-xs text-brand-muted">Bookings This Month</div>
                  <div className="mt-2 font-jakarta text-3xl font-bold text-brand-primary">
                    {stats.thisMonthCount}
                  </div>
                  <div className="mt-1 text-[11px] text-brand-muted">
                    {bookings.length} total all-time
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-[0_2px_20px_rgba(23,36,58,0.05)]">
                  <div className="text-xs text-brand-muted">Day vs. Night Split</div>
                  <div className="mt-2 font-jakarta text-2xl font-bold text-brand-ink">
                    {stats.dayPct}%{" "}
                    <span className="text-sm font-medium text-brand-muted">Day</span>
                  </div>
                  <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-night-bg">
                    <div
                      className="h-full bg-brand-accent"
                      style={{ width: `${stats.dayPct}%` }}
                    />
                  </div>
                  <div className="mt-1 text-[11px] text-brand-muted">
                    {stats.dayCount} day · {stats.nightCount} night
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-[0_2px_20px_rgba(23,36,58,0.05)]">
                  <div className="text-xs text-brand-muted">Commission Earned</div>
                  <div className="mt-2 font-jakarta text-2xl font-bold text-brand-ink">
                    {formatNaira(stats.earnedCommission)}
                  </div>
                  <div className="mt-1 text-[11px] text-brand-muted">
                    Confirmed, paid &amp; completed
                  </div>
                </div>
              </div>

              {/* Top Hotels Leaderboard */}
              <div className="rounded-2xl bg-white p-5 shadow-[0_2px_20px_rgba(23,36,58,0.05)]">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-brand-ink">Top Hotels</h2>
                  <button
                    type="button"
                    onClick={() => setTab("hotels")}
                    className="cursor-pointer text-xs font-semibold text-brand-primary hover:underline"
                  >
                    Manage all hotels →
                  </button>
                </div>
                <div className="divide-y divide-brand-border/70 text-xs">
                  {stats.topHotels.map((item, idx) => (
                    <div
                      key={item.hotel.id}
                      className="flex items-center justify-between py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-bg font-bold text-brand-ink">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-brand-ink">
                            {item.hotel.name}
                          </div>
                          <div className="text-[11px] text-brand-muted">
                            {item.hotel.area} · {item.hotel.plan} plan
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-brand-primary">
                          {formatNaira(item.revenue)}
                        </div>
                        <div className="text-[11px] text-brand-muted">
                          {item.count} booking{item.count === 1 ? "" : "s"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "hotels" && <AdminHotelsTab hotels={hotels} />}
          {tab === "bookings" && (
            <AdminBookingsTab hotels={hotels} bookings={bookings} />
          )}
          {tab === "reviews" && <AdminReviewsTab initialReviews={reviews} />}
          {tab === "finance" && (
            <AdminFinanceTab
              hotels={hotels}
              bookings={bookings}
              payouts={payouts}
              refunds={refunds}
              defaultMonth={currentMonth}
            />
          )}
          {tab === "sites" && (
            <AdminSitesTab
              hotels={hotels}
              sites={sites}
              rootDomain={rootDomain}
            />
          )}
        </div>
      </div>
    </div>
  );
}
