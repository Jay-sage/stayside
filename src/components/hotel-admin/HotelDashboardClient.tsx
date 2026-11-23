"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createHotelBranchAction } from "@/app/actions/hotel-admin";
import {
  BookingsInboxTab,
  type HotelAdminBooking,
} from "@/components/hotel-admin/BookingsInboxTab";
import { RoomsManagerTab } from "@/components/hotel-admin/RoomsManagerTab";
import {
  BlackoutDatesTab,
  DayStaySettingsTab,
  HotelProfileTab,
  type BlackoutDateRow,
} from "@/components/hotel-admin/SettingsAndBlackoutsTabs";
import {
  BuildingIcon,
  CalendarIcon,
  ClockIcon,
  HomeIcon,
  SunIcon,
  UserIcon,
} from "@/components/Icons";
import { formatNaira, formatTimeShort, type Hotel, type RoomType } from "@/types/database";

type TabId = "overview" | "bookings" | "rooms" | "hours" | "blackouts" | "profile";

const NAV_ITEMS: { id: TabId; label: string; icon: typeof HomeIcon }[] = [
  { id: "overview", label: "Dashboard", icon: HomeIcon },
  { id: "bookings", label: "Bookings", icon: CalendarIcon },
  { id: "rooms", label: "Rooms", icon: BuildingIcon },
  { id: "hours", label: "Day-Stay Hours", icon: SunIcon },
  { id: "blackouts", label: "Blackout Dates", icon: ClockIcon },
  { id: "profile", label: "Hotel Profile", icon: UserIcon },
];

export function HotelDashboardClient({
  hotel,
  branches,
  rooms,
  bookings,
  blackouts,
  site,
  rootDomain,
  todayIso,
}: {
  hotel: Hotel;
  branches: Hotel[];
  rooms: RoomType[];
  bookings: HotelAdminBooking[];
  blackouts: BlackoutDateRow[];
  site: {
    subdomain: string;
    published: boolean;
    content: { tagline?: string; featured_photos?: string[] };
  } | null;
  rootDomain: string;
  todayIso: string;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [branchName, setBranchName] = useState("");
  const [branchLabel, setBranchLabel] = useState("");
  const [branchArea, setBranchArea] = useState("Lekki");
  const [branchAddress, setBranchAddress] = useState("");
  const [branchWhatsapp, setBranchWhatsapp] = useState(hotel.whatsapp ?? "");
  const [branchDesc, setBranchDesc] = useState("");
  const [branchError, setBranchError] = useState<string | null>(null);
  const [creatingBranch, startCreatingBranch] = useTransition();

  function handleBranchSwitch(branchId: string) {
    router.push(`/hotel?branch=${branchId}`);
  }

  function handleCreateBranch(e: React.FormEvent) {
    e.preventDefault();
    setBranchError(null);
    startCreatingBranch(async () => {
      const res = await createHotelBranchAction({
        sourceHotelId: hotel.id,
        name: branchName,
        branchLabel,
        area: branchArea,
        address: branchAddress,
        description: branchDesc,
        phone: branchWhatsapp,
        whatsapp: branchWhatsapp,
      });
      if (!res.ok) {
        setBranchError(res.error);
        return;
      }
      setShowAddBranch(false);
      setBranchName("");
      setBranchLabel("");
      setBranchAddress("");
      setBranchDesc("");
      router.push(`/hotel?branch=${res.branchId}`);
      router.refresh();
    });
  }

  const stats = useMemo(() => {
    const todayCount = bookings.filter((b) => b.check_in_date === todayIso).length;
    const pendingCount = bookings.filter((b) => b.status === "requested").length;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const last30Count = bookings.filter(
      (b) => new Date(b.created_at) >= thirtyDaysAgo
    ).length;

    const totalRoomsCount = rooms.reduce((sum, r) => sum + r.total_rooms, 0);
    const totalDayAllotment = rooms.reduce((sum, r) => sum + r.day_rooms_per_day, 0);

    // 7-day bar chart buckets
    const chartDays: { label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-NG", { weekday: "short" });
      const count = bookings.filter((b) => b.created_at.slice(0, 10) === iso).length;
      chartDays.push({ label, count });
    }
    const maxBar = Math.max(1, ...chartDays.map((c) => c.count));

    return {
      todayCount,
      pendingCount,
      last30Count,
      totalRoomsCount,
      totalDayAllotment,
      chartDays,
      maxBar,
    };
  }, [bookings, rooms, todayIso]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-brand-bg/60">
      <div className="mx-auto flex max-w-7xl flex-col lg:flex-row">
        {/* Left Sidebar — HotelPro aesthetic */}
        <aside className="hidden w-60 shrink-0 border-r border-brand-border/80 bg-white p-5 lg:block">
          <div className="mb-6">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
                Hotel Portal
              </p>
              <span className="rounded-full bg-brand-bg px-2 py-0.5 text-[10px] font-bold text-brand-muted">
                {branches.length} {branches.length === 1 ? "branch" : "branches"}
              </span>
            </div>

            {branches.length > 1 ? (
              <select
                aria-label="Switch hotel branch"
                value={hotel.id}
                onChange={(e) => handleBranchSwitch(e.target.value)}
                className="mt-2 w-full cursor-pointer rounded-xl border border-brand-border bg-brand-bg/70 px-3 py-2 font-jakarta text-xs font-bold text-brand-ink outline-none focus:border-brand-primary"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.branch_label || b.area} — {b.name}
                  </option>
                ))}
              </select>
            ) : (
              <h2 className="mt-1 truncate font-jakarta text-sm font-bold text-brand-ink">
                {hotel.name}
              </h2>
            )}

            <div className="mt-2.5 flex items-center justify-between gap-2">
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${
                  hotel.status === "approved"
                    ? "bg-emerald-50 text-emerald-700"
                    : hotel.status === "pending"
                    ? "bg-day-bg text-day-text"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {hotel.status}
              </span>
              <button
                type="button"
                onClick={() => {
                  setBranchError(null);
                  setShowAddBranch(true);
                }}
                className="cursor-pointer text-[11px] font-bold text-brand-primary hover:underline"
              >
                + Add Branch
              </button>
            </div>
          </div>

          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
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
                  {item.id === "bookings" && stats.pendingCount > 0 && (
                    <span className="rounded-full bg-brand-accent px-2 py-0.5 text-[10px] font-bold text-white">
                      {stats.pendingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {hotel.status === "approved" && (
            <div className="mt-8 border-t border-brand-border/80 pt-4">
              <Link
                href={`/hotels/${hotel.slug}`}
                className="flex w-full items-center justify-center rounded-xl border border-brand-border py-2 text-xs font-semibold text-brand-ink transition hover:bg-brand-bg"
              >
                View Public Page ↗
              </Link>
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {/* Mobile branch switcher + Add Branch */}
          <div className="mb-4 flex items-center gap-2 lg:hidden">
            {branches.length > 1 ? (
              <select
                aria-label="Switch hotel branch"
                value={hotel.id}
                onChange={(e) => handleBranchSwitch(e.target.value)}
                className="min-w-0 flex-1 rounded-xl border border-brand-border bg-white px-3 py-2 text-xs font-bold text-brand-ink outline-none"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.branch_label || b.area} — {b.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="min-w-0 flex-1 truncate text-xs font-bold text-brand-ink">
                {hotel.name}
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                setBranchError(null);
                setShowAddBranch(true);
              }}
              className="shrink-0 cursor-pointer rounded-xl bg-brand-primary px-3 py-2 text-xs font-bold text-white"
            >
              + Branch
            </button>
          </div>

          {/* Mobile horizontal tab bar */}
          <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`shrink-0 cursor-pointer rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                  activeTab === item.id
                    ? "bg-brand-primary text-white"
                    : "bg-white text-brand-muted shadow-xs"
                }`}
              >
                {item.label}
                {item.id === "bookings" && stats.pendingCount > 0
                  ? ` (${stats.pendingCount})`
                  : ""}
              </button>
            ))}
          </div>

          {/* Pending Approval Notice (Stage 3 requirement) */}
          {hotel.status === "pending" && (
            <div className="mb-6 rounded-2xl border border-brand-accent/30 bg-day-bg px-5 py-4 text-xs text-day-text">
              <strong className="font-bold">Waiting for approval:</strong> Your hotel is currently hidden from the public Stayside site until our team reviews and approves it. You can still set up your rooms, day-stay hours, and photos now.
            </div>
          )}

          {/* Top Section Header */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-jakarta text-xl font-bold text-brand-ink sm:text-2xl">
                {activeTab === "overview"
                  ? "Hotel Overview"
                  : NAV_ITEMS.find((i) => i.id === activeTab)?.label}
              </h1>
              <p className="mt-0.5 text-xs text-brand-muted">
                {hotel.name} · Day window {formatTimeShort(hotel.day_start)}–
                {formatTimeShort(hotel.day_end)}
              </p>
            </div>
            <span className="rounded-xl bg-white px-3.5 py-2 text-xs font-medium text-brand-muted shadow-xs">
              Today: {todayIso}
            </span>
          </div>

          {/* TAB: OVERVIEW (HotelPro KPI cards + Room bars + Bar chart) */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* 4 KPI Cards */}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl bg-white p-5 shadow-[0_2px_20px_rgba(23,36,58,0.05)]">
                  <div className="flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-night-bg text-brand-primary">
                      <CalendarIcon className="h-4 w-4" />
                    </span>
                    <span className="text-[11px] font-semibold text-brand-primary">
                      Today
                    </span>
                  </div>
                  <div className="mt-4 font-jakarta text-3xl font-bold text-brand-ink">
                    {stats.todayCount}
                  </div>
                  <div className="mt-1 text-xs font-medium text-brand-ink">
                    Today&apos;s Bookings
                  </div>
                  <div className="text-[11px] text-brand-muted">Expected arrivals</div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab("bookings")}
                  className="cursor-pointer rounded-2xl bg-white p-5 text-left shadow-[0_2px_20px_rgba(23,36,58,0.05)] transition hover:ring-2 hover:ring-brand-accent/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-day-bg text-brand-accent">
                      <ClockIcon className="h-4 w-4" />
                    </span>
                    <span className="text-[11px] font-semibold text-brand-accent">
                      Action needed
                    </span>
                  </div>
                  <div className="mt-4 font-jakarta text-3xl font-bold text-brand-ink">
                    {stats.pendingCount}
                  </div>
                  <div className="mt-1 text-xs font-medium text-brand-ink">
                    Pending Requests
                  </div>
                  <div className="text-[11px] text-brand-muted">Awaiting confirmation</div>
                </button>

                <div className="rounded-2xl bg-white p-5 shadow-[0_2px_20px_rgba(23,36,58,0.05)]">
                  <div className="flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-night-bg text-brand-primary">
                      <SunIcon className="h-4 w-4" />
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-600">
                      30 Days
                    </span>
                  </div>
                  <div className="mt-4 font-jakarta text-3xl font-bold text-brand-ink">
                    {stats.last30Count}
                  </div>
                  <div className="mt-1 text-xs font-medium text-brand-ink">
                    30-Day Requests
                  </div>
                  <div className="text-[11px] text-brand-muted">All stay requests</div>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-[0_2px_20px_rgba(23,36,58,0.05)]">
                  <div className="flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-bg text-brand-ink">
                      <BuildingIcon className="h-4 w-4" />
                    </span>
                    <span className="text-[11px] font-semibold text-brand-muted">
                      {rooms.length} types
                    </span>
                  </div>
                  <div className="mt-4 font-jakarta text-3xl font-bold text-brand-ink">
                    {stats.totalDayAllotment}
                    <span className="text-base font-medium text-brand-muted">
                      /{stats.totalRoomsCount}
                    </span>
                  </div>
                  <div className="mt-1 text-xs font-medium text-brand-ink">
                    Day-Stay Allotment
                  </div>
                  <div className="text-[11px] text-brand-muted">Daily rooms allocated</div>
                </div>
              </div>

              {/* Middle 2-Column HotelPro Analytics Row */}
              <div className="grid gap-6 lg:grid-cols-12">
                {/* Room Types & Day-Stay Allotment Bars */}
                <div className="rounded-2xl bg-white p-5 shadow-[0_2px_20px_rgba(23,36,58,0.05)] lg:col-span-7">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-brand-ink">
                      Room Inventory &amp; Day-Stay Allotment
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab("rooms")}
                      className="cursor-pointer text-xs font-semibold text-brand-primary hover:underline"
                    >
                      Manage rooms
                    </button>
                  </div>

                  <div className="space-y-4">
                    {rooms.map((room) => {
                      const pct = Math.min(
                        100,
                        Math.round((room.day_rooms_per_day / Math.max(1, room.total_rooms)) * 100)
                      );
                      return (
                        <div key={room.id} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-brand-ink">{room.name}</span>
                            <span className="text-brand-muted">
                              {room.day_rooms_per_day} day / {room.total_rooms} total ·{" "}
                              <strong className="text-brand-primary">
                                {room.day_price_ngn ? formatNaira(room.day_price_ngn) : "—"}
                              </strong>
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-brand-bg">
                            <div
                              className="h-full rounded-full bg-brand-primary transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 7-Day Request Activity Bar Chart */}
                <div className="rounded-2xl bg-white p-5 shadow-[0_2px_20px_rgba(23,36,58,0.05)] lg:col-span-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-brand-ink">
                      Request Activity (7 Days)
                    </h2>
                    <span className="text-[11px] text-brand-muted">Daily count</span>
                  </div>

                  <div className="flex h-36 items-end justify-between gap-2 pt-4">
                    {stats.chartDays.map((day, idx) => {
                      const heightPct = Math.max(
                        10,
                        Math.round((day.count / stats.maxBar) * 100)
                      );
                      const isToday = idx === stats.chartDays.length - 1;
                      return (
                        <div
                          key={day.label + idx}
                          className="flex flex-1 flex-col items-center gap-2"
                        >
                          <div className="flex h-28 w-full items-end justify-center">
                            <div
                              title={`${day.label}: ${day.count}`}
                              className={`w-full max-w-[26px] rounded-t-lg transition-all ${
                                isToday ? "bg-brand-primary" : "bg-night-bg"
                              }`}
                              style={{ height: `${heightPct}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-medium text-brand-muted">
                            {day.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Recent Bookings Preview */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-brand-ink">Recent Bookings</h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab("bookings")}
                    className="cursor-pointer text-xs font-semibold text-brand-primary hover:underline"
                  >
                    Open full inbox →
                  </button>
                </div>
                <BookingsInboxTab bookings={bookings.slice(0, 5)} />
              </div>
            </div>
          )}

          {activeTab === "bookings" && <BookingsInboxTab bookings={bookings} />}
          {activeTab === "rooms" && <RoomsManagerTab hotelId={hotel.id} rooms={rooms} />}
          {activeTab === "hours" && <DayStaySettingsTab hotel={hotel} />}
          {activeTab === "blackouts" && (
            <BlackoutDatesTab hotelId={hotel.id} rooms={rooms} blackouts={blackouts} />
          )}
          {activeTab === "profile" && (
            <HotelProfileTab hotel={hotel} site={site} rootDomain={rootDomain} />
          )}
        </div>
      </div>

      {/* Add New Branch Modal */}
      {showAddBranch && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-branch-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/50 p-4 backdrop-blur-xs"
          onClick={() => setShowAddBranch(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3
                  id="add-branch-title"
                  className="font-jakarta text-lg font-extrabold text-brand-ink"
                >
                  Add a New Hotel Branch
                </h3>
                <p className="mt-0.5 text-xs text-brand-muted">
                  Each branch gets its own rooms, custom Naira pricing, hours,
                  and booking inbox.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setShowAddBranch(false)}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-brand-bg text-xs font-bold text-brand-ink"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBranch} className="mt-5 space-y-3.5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-brand-ink">
                    Branch Name
                  </label>
                  <input
                    type="text"
                    required
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder="e.g. The Palms Boutique — Lekki"
                    className="mt-1 w-full rounded-xl border border-brand-border bg-brand-bg/50 px-3 py-2.5 text-xs text-brand-ink outline-none focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-ink">
                    Branch Label
                  </label>
                  <input
                    type="text"
                    required
                    value={branchLabel}
                    onChange={(e) => setBranchLabel(e.target.value)}
                    placeholder="e.g. Lekki Phase 1"
                    className="mt-1 w-full rounded-xl border border-brand-border bg-brand-bg/50 px-3 py-2.5 text-xs text-brand-ink outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-brand-ink">
                    Lagos Area
                  </label>
                  <select
                    value={branchArea}
                    onChange={(e) => setBranchArea(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-brand-border bg-brand-bg/50 px-3 py-2.5 text-xs font-medium text-brand-ink outline-none focus:border-brand-primary"
                  >
                    {[
                      "Ikoyi",
                      "Victoria Island",
                      "Lekki",
                      "Ikeja",
                      "Yaba",
                      "Surulere",
                      "Ajah",
                      "Banana Island",
                    ].map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-ink">
                    Branch WhatsApp
                  </label>
                  <input
                    type="tel"
                    required
                    value={branchWhatsapp}
                    onChange={(e) => setBranchWhatsapp(e.target.value)}
                    placeholder="0803 123 4567"
                    className="mt-1 w-full rounded-xl border border-brand-border bg-brand-bg/50 px-3 py-2.5 text-xs text-brand-ink outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-ink">
                  Street Address
                </label>
                <input
                  type="text"
                  required
                  value={branchAddress}
                  onChange={(e) => setBranchAddress(e.target.value)}
                  placeholder="e.g. 14 Admiralty Way, Lekki Phase 1, Lagos"
                  className="mt-1 w-full rounded-xl border border-brand-border bg-brand-bg/50 px-3 py-2.5 text-xs text-brand-ink outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-ink">
                  Short Description (optional)
                </label>
                <textarea
                  rows={2}
                  value={branchDesc}
                  onChange={(e) => setBranchDesc(e.target.value)}
                  placeholder="What makes this branch stand out for day stays?"
                  className="mt-1 w-full rounded-xl border border-brand-border bg-brand-bg/50 px-3 py-2 text-xs text-brand-ink outline-none focus:border-brand-primary"
                />
              </div>

              {branchError && (
                <p className="text-xs font-semibold text-red-600">
                  {branchError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddBranch(false)}
                  className="cursor-pointer rounded-full px-4 py-2 text-xs font-semibold text-brand-muted hover:text-brand-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingBranch}
                  className="cursor-pointer rounded-full bg-brand-primary px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-brand-primary-hover disabled:opacity-60"
                >
                  {creatingBranch ? "Creating..." : "Create Branch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
