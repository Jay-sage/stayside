"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookingRequestForm } from "@/components/BookingRequestForm";
import { getHotelDisplayRating } from "@/components/HotelCard";
import { HotelLocationCard } from "@/components/HotelMapSection";
import { HotelReviewsModal } from "@/components/HotelReviewsModal";
import { useWishlist } from "@/lib/wishlist";
import {
  CheckCircleIcon,
  ChevronLeftIcon,
  ClockIcon,
  CoffeeIcon,
  HeartIcon,
  PinIcon,
  SearchIcon,
  StarFilledIcon,
  VerifiedBadgeIcon,
  WifiIcon,
} from "@/components/Icons";
import {
  formatNaira,
  formatTimeShort,
  type EligibleReviewBooking,
  type Hotel,
  type HotelReview,
  type RoomType,
} from "@/types/database";

type StoreTab = "rooms" | "amenities" | "location" | "book";

function getHotelInitials(name: string): string {
  const words = name
    .replace(/^the\s+/i, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "ST";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export interface SiblingBranchSummary {
  id: string;
  name: string;
  slug: string;
  branchLabel: string;
  lowestDayNgn: number | null;
}

export function HotelDetailClient({
  hotel,
  rooms,
  initialGuest,
  approvedReviews = [],
  ownPendingReviews = [],
  eligibleReviewBookings = [],
  siblingBranches = [],
}: {
  hotel: Hotel;
  rooms: RoomType[];
  initialGuest?: {
    isSignedIn: boolean;
    fullName: string;
    phone: string;
    email: string;
  };
  approvedReviews?: HotelReview[];
  ownPendingReviews?: HotelReview[];
  eligibleReviewBookings?: EligibleReviewBooking[];
  siblingBranches?: SiblingBranchSummary[];
}) {
  const gallery = useMemo(() => {
    const urls = [...hotel.photos, ...rooms.flatMap((r) => r.photos)];
    return Array.from(new Set(urls.filter(Boolean)));
  }, [hotel.photos, rooms]);

  const [activePhoto, setActivePhoto] = useState<string>(gallery[0] ?? "");
  const [selectedRoomId, setSelectedRoomId] = useState<string>(rooms[0]?.id ?? "");
  const [roomQuery, setRoomQuery] = useState("");
  const [activeTab, setActiveTab] = useState<StoreTab>("rooms");
  const [showVerifiedModal, setShowVerifiedModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const wishlist = useWishlist();
  const liked = wishlist.has(hotel.id);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) ?? rooms[0];
  const reviewCount = approvedReviews.length;
  const rating =
    reviewCount > 0
      ? (
          approvedReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
        ).toFixed(1)
      : getHotelDisplayRating(hotel.slug);
  const initials = getHotelInitials(hotel.name);

  const filteredRooms = useMemo(() => {
    const q = roomQuery.trim().toLowerCase();
    if (!q) return rooms;
    return rooms.filter((r) => {
      const inName = r.name.toLowerCase().includes(q);
      const inDesc = r.description.toLowerCase().includes(q);
      const inAmenities = (r.amenities ?? []).some((a) =>
        a.toLowerCase().includes(q)
      );
      return inName || inDesc || inAmenities;
    });
  }, [rooms, roomQuery]);

  const hotelAmenities =
    hotel.amenities && hotel.amenities.length > 0
      ? hotel.amenities
      : ["Free Wi-Fi", "Air Conditioning", "24/7 Power"];

  function jumpToSection(tab: StoreTab, id: string) {
    setActiveTab(tab);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function handleSelectRoom(room: RoomType, scrollToBook = false) {
    setSelectedRoomId(room.id);
    if (room.photos[0]) setActivePhoto(room.photos[0]);
    if (scrollToBook) {
      jumpToSection("book", "booking-form");
    }
  }

  async function handleCopyShareLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Clipboard may be unavailable in insecure contexts
    }
  }

  const dayWindow = `${formatTimeShort(hotel.day_start)} – ${formatTimeShort(hotel.day_end)}`;

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-[1440px] lg:flex lg:min-h-[calc(100vh-64px)]">
        {/* =================================================================
            LEFT STICKY HOTEL SIDEBAR (Chowdeck-style storefront rail)
           ================================================================= */}
        <aside className="border-b border-brand-border/70 bg-white px-5 pt-4 pb-6 lg:sticky lg:top-[64px] lg:h-[calc(100vh-64px)] lg:w-[350px] lg:shrink-0 lg:overflow-y-auto lg:border-r lg:border-b-0 lg:px-7 lg:py-7 xl:w-[376px]">
          {/* Mobile top header: circular back button + centered breadcrumb */}
          <div className="relative mb-4 flex items-center justify-center lg:hidden">
            <Link
              href="/hotels"
              aria-label="Back to hotels"
              className="absolute left-0 flex h-10 w-10 items-center justify-center rounded-full border border-brand-border bg-white text-brand-ink shadow-xs transition hover:bg-brand-bg"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </Link>
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-brand-muted uppercase"
            >
              <Link href="/" className="hover:text-brand-ink">
                Home
              </Link>
              <span>›</span>
              <Link href="/hotels" className="text-brand-ink">
                Hotels
              </Link>
            </nav>
          </div>

          {/* Desktop breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="mb-3 hidden items-center gap-1.5 text-[11px] font-semibold tracking-wider text-brand-muted uppercase lg:flex"
          >
            <Link href="/" className="transition hover:text-brand-ink">
              Home
            </Link>
            <span>›</span>
            <Link href="/hotels" className="transition hover:text-brand-ink">
              Hotels
            </Link>
            <span>›</span>
            <span className="truncate text-brand-ink">{hotel.area}</span>
          </nav>

          {/* Rounded Hero Banner with Overlaid Monogram, Day-Stay Window Pill & Heart */}
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-brand-bg shadow-xs">
            {activePhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activePhoto}
                alt={hotel.name}
                className="h-full w-full object-cover transition duration-300"
              />
            ) : null}

            {/* Subtle bottom vignette so white pills stay crisp */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/45 to-transparent"
            />

            {/* Bottom-left circular hotel monogram */}
            <div
              aria-hidden="true"
              className="absolute bottom-3 left-3 flex h-11 w-11 items-center justify-center rounded-full bg-white font-jakarta text-sm font-extrabold text-brand-primary shadow-md ring-2 ring-white/80"
            >
              {initials}
            </div>

            {/* Bottom-right Day-Stay Hours pill + Favourite Heart */}
            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-brand-ink shadow-md">
                <ClockIcon className="h-3.5 w-3.5 text-brand-primary" />
                {dayWindow}
              </span>

              <button
                type="button"
                aria-label={liked ? "Remove from saved" : "Save hotel"}
                onClick={() => wishlist.toggle(hotel.id)}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white text-brand-ink shadow-md transition hover:scale-105"
              >
                <HeartIcon
                  filled={liked}
                  className={`h-[18px] w-[18px] ${
                    liked ? "text-[#E74C3C]" : "text-brand-ink/70"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Hotel Meta Stack — Centered on mobile, Left-aligned on desktop */}
          <div className="mt-4 flex flex-col items-center text-center lg:items-start lg:text-left">
            <h1 className="font-jakarta text-2xl font-extrabold tracking-tight text-brand-ink">
              {hotel.name}
            </h1>

            {/* Verified Badge Button — Tangerine Twitter/Chowdeck-style seal */}
            <button
              type="button"
              onClick={() => setShowVerifiedModal(true)}
              className="mt-1.5 inline-flex cursor-pointer items-center gap-1.5 text-xs font-bold text-[#FF7138] transition hover:opacity-85"
            >
              <VerifiedBadgeIcon className="h-[18px] w-[18px] text-[#FF7138]" />
              <span>Verified</span>
              <span
                aria-hidden="true"
                className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#FF7138]/45 text-[10px] font-semibold text-[#FF7138]"
              >
                i
              </span>
            </button>

            {/* Area + More info trigger */}
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-brand-muted lg:justify-start">
              <span>{hotel.area}, Lagos</span>
              <button
                type="button"
                onClick={() => setShowInfoModal(true)}
                className="cursor-pointer font-semibold text-brand-primary underline underline-offset-2 transition hover:text-brand-primary-hover"
              >
                More info
              </button>
            </div>

            {/* Rating row — opens Chowdeck-style Ratings & Reviews Modal */}
            <button
              type="button"
              onClick={() => setShowReviewsModal(true)}
              className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-xs text-brand-ink transition hover:opacity-80"
            >
              <StarFilledIcon className="h-4 w-4 text-[#FFD33C]" />
              <span className="font-jakarta font-bold">{rating}</span>
              <span className="text-brand-muted">
                ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
              </span>
              <span className="text-brand-muted" aria-hidden="true">
                ›
              </span>
            </button>

            {/* Live Day-Stay Status Line */}
            <p className="mt-2.5 flex items-center gap-1.5 text-[11px] font-bold tracking-wide uppercase">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-emerald-700">Day Stays Open</span>
              <span className="text-brand-muted">·</span>
              <span className="text-brand-ink">{dayWindow}</span>
            </p>

            {/* Branch Switcher (shown whenever this hotel has multiple Lagos branches) */}
            {siblingBranches.length > 1 && (
              <div className="mt-4 w-full text-left">
                <p className="mb-1.5 text-[11px] font-semibold tracking-wider text-brand-muted uppercase">
                  Branches ({siblingBranches.length})
                </p>
                <div className="flex flex-wrap justify-center gap-1.5 lg:justify-start">
                  {siblingBranches.map((b) => {
                    const isCurrent = b.id === hotel.id;
                    return (
                      <Link
                        key={b.id}
                        href={`/hotels/${b.slug}`}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                          isCurrent
                            ? "bg-brand-primary text-white shadow-xs"
                            : "border border-brand-border bg-brand-bg/70 text-brand-ink hover:border-brand-primary/40 hover:bg-white"
                        }`}
                      >
                        <span>{b.branchLabel}</span>
                        {b.lowestDayNgn && (
                          <span
                            className={
                              isCurrent ? "text-white/85" : "text-brand-primary"
                            }
                          >
                            · {formatNaira(b.lowestDayNgn)}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Compact Photo Switcher (Desktop) */}
            {gallery.length > 1 && (
              <div className="mt-5 hidden w-full lg:block">
                <p className="mb-2 text-[11px] font-semibold tracking-wider text-brand-muted uppercase">
                  Photos ({gallery.length})
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {gallery.slice(0, 4).map((url, idx) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setActivePhoto(url)}
                      className={`relative h-14 cursor-pointer overflow-hidden rounded-lg transition ${
                        activePhoto === url
                          ? "ring-2 ring-brand-primary ring-offset-2"
                          : "opacity-80 hover:opacity-100"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`${hotel.name} photo ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Selected Summary Card on Desktop Sidebar */}
            {selectedRoom && (
              <div className="mt-5 hidden w-full rounded-2xl border border-brand-border/80 bg-brand-bg/70 p-3.5 lg:block">
                <p className="text-[11px] font-semibold tracking-wider text-brand-muted uppercase">
                  Selected Room
                </p>
                <p className="mt-0.5 truncate font-jakarta text-sm font-bold text-brand-ink">
                  {selectedRoom.name}
                </p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="font-jakarta text-base font-extrabold text-brand-primary">
                    {formatNaira(
                      selectedRoom.day_price_ngn ?? selectedRoom.night_price_ngn
                    )}
                    <span className="text-xs font-normal text-brand-muted">
                      {" "}
                      / day
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={() => jumpToSection("book", "booking-form")}
                    className="cursor-pointer rounded-full bg-brand-primary px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-brand-primary-hover"
                  >
                    Book now
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* =================================================================
            RIGHT SCROLLABLE STOREFRONT COLUMN
           ================================================================= */}
        <div className="min-w-0 flex-1 bg-white">
          {/* Pinned In-Hotel Search Bar + Category Tabs */}
          <div className="sticky top-[64px] z-20 border-b border-brand-border/70 bg-white/95 px-5 pt-4 backdrop-blur lg:px-10 lg:pt-6">
            {/* Search Input */}
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-brand-primary" />
              <input
                type="text"
                value={roomQuery}
                onChange={(e) => setRoomQuery(e.target.value)}
                placeholder={`Search ${hotel.name} rooms or perks`}
                className="w-full rounded-xl bg-brand-bg py-3.5 pr-20 pl-11 text-sm font-medium text-brand-ink outline-none transition placeholder:text-brand-muted focus:ring-2 focus:ring-brand-primary/25"
              />
              {roomQuery && (
                <button
                  type="button"
                  onClick={() => setRoomQuery("")}
                  className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-ink shadow-xs ring-1 ring-brand-border hover:bg-brand-bg"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Horizontal Category Tabs (or search count bar when searching) */}
            {roomQuery.trim() ? (
              <div className="flex items-center justify-between py-3 text-xs font-semibold text-brand-muted">
                <span>
                  {filteredRooms.length}{" "}
                  {filteredRooms.length === 1 ? "room" : "rooms"} matching &ldquo;
                  {roomQuery.trim()}&rdquo;
                </span>
              </div>
            ) : (
              <div
                role="tablist"
                aria-label="Hotel sections"
                className="no-scrollbar mt-2 flex items-center gap-6 overflow-x-auto"
              >
                {[
                  { id: "rooms" as const, label: "Day Stays", target: "rooms" },
                  {
                    id: "book" as const,
                    label: "Book Room",
                    target: "booking-form",
                  },
                  {
                    id: "amenities" as const,
                    label: "Amenities",
                    target: "amenities",
                  },
                  {
                    id: "location" as const,
                    label: "Location",
                    target: "location",
                  },
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      role="tab"
                      aria-selected={isActive}
                      type="button"
                      onClick={() => jumpToSection(tab.id, tab.target)}
                      className={`relative shrink-0 cursor-pointer py-3 text-sm font-semibold transition ${
                        isActive
                          ? "text-brand-ink"
                          : "text-brand-muted hover:text-brand-ink"
                      }`}
                    >
                      {tab.label}
                      {isActive && (
                        <span className="absolute right-0 bottom-0 left-0 h-[3px] rounded-t-full bg-brand-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Main Right-Column Content */}
          <div className="space-y-10 px-5 py-6 pb-28 lg:px-10 lg:py-8 lg:pb-16">
            {/* 1. ROOMS GRID (Exact Chowdeck 2-col card anatomy) */}
            <section id="rooms" className="scroll-mt-44">
              <div className="mb-4 flex items-baseline justify-between gap-3">
                <h2 className="font-jakarta text-lg font-extrabold text-brand-ink">
                  {roomQuery.trim() ? "Matching Rooms" : "Day-Stay Rooms"}
                </h2>
                <span className="text-xs font-medium text-brand-muted">
                  {filteredRooms.length}{" "}
                  {filteredRooms.length === 1 ? "option" : "options"} ·{" "}
                  {dayWindow}
                </span>
              </div>

              {filteredRooms.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-brand-border bg-brand-bg/50 px-6 py-10 text-center">
                  <p className="text-sm font-semibold text-brand-ink">
                    No rooms match &ldquo;{roomQuery}&rdquo;
                  </p>
                  <p className="mt-1 text-xs text-brand-muted">
                    Try searching for Wi-Fi, pool, breakfast, or clear your
                    search.
                  </p>
                  <button
                    type="button"
                    onClick={() => setRoomQuery("")}
                    className="mt-4 cursor-pointer rounded-full bg-brand-primary px-4 py-2 text-xs font-bold text-white hover:bg-brand-primary-hover"
                  >
                    Show all rooms
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  {filteredRooms.map((room) => {
                    const isSelected = room.id === selectedRoomId;
                    const dayPrice = room.day_price_ngn ?? room.night_price_ngn;

                    return (
                      <div
                        key={room.id}
                        onClick={() => handleSelectRoom(room, false)}
                        className={`group flex cursor-pointer items-stretch justify-between gap-4 rounded-2xl border bg-white p-3.5 transition ${
                          isSelected
                            ? "border-brand-primary/50 shadow-[0_8px_28px_rgba(36,87,214,0.12)] ring-2 ring-brand-primary/20"
                            : "border-brand-border/80 hover:border-brand-primary/35 hover:shadow-sm"
                        }`}
                      >
                        {/* Left Info Stack */}
                        <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="truncate font-jakarta text-[15px] font-bold text-brand-ink">
                                {room.name}
                              </h3>
                            </div>

                            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-brand-muted">
                              {room.description}
                            </p>

                            {/* Compact Room Perks + Capacity */}
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              <span className="rounded-md bg-brand-bg px-2 py-0.5 text-[10px] font-semibold text-brand-muted">
                                Up to {room.capacity} guests
                              </span>
                              {(room.amenities ?? []).slice(0, 2).map((perk) => (
                                <span
                                  key={perk}
                                  className="rounded-md bg-brand-primary/[0.07] px-2 py-0.5 text-[10px] font-semibold text-brand-primary"
                                >
                                  {perk}
                                </span>
                              ))}
                              {(room.amenities?.length ?? 0) > 2 && (
                                <span className="text-[10px] font-medium text-brand-muted">
                                  +{(room.amenities?.length ?? 0) - 2} more
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Bottom-Left Naira Price */}
                          <div className="mt-3 flex items-baseline gap-1.5">
                            <span className="font-jakarta text-base font-extrabold text-brand-ink">
                              {formatNaira(dayPrice)}
                            </span>
                            <span className="text-xs text-brand-muted">
                              / day
                            </span>
                          </div>
                        </div>

                        {/* Right Flush Thumbnail + Overlaid Select + Pill */}
                        <div className="relative h-[126px] w-[126px] shrink-0 overflow-hidden rounded-xl bg-brand-bg sm:h-[136px] sm:w-[136px]">
                          {room.photos[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={room.photos[0]}
                              alt={room.name}
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-brand-muted">
                              {initials}
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectRoom(room, true);
                            }}
                            className={`absolute right-2 bottom-2 inline-flex cursor-pointer items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-bold shadow-md transition ${
                              isSelected
                                ? "bg-brand-primary text-white"
                                : "bg-white text-brand-ink hover:bg-brand-primary hover:text-white"
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <span>Selected</span>
                                <span aria-hidden="true">✓</span>
                              </>
                            ) : (
                              <>
                                <span>Select</span>
                                <span aria-hidden="true">+</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* 2. BOOKING PANEL (Full Day-Stay First Flow + Secondary Night Option) */}
            <section id="booking-form" className="scroll-mt-44">
              <div className="mb-4 flex items-baseline justify-between gap-3">
                <h2 className="font-jakarta text-lg font-extrabold text-brand-ink">
                  Reserve Your Room
                </h2>
                {selectedRoom && (
                  <span className="text-xs font-semibold text-brand-primary">
                    {selectedRoom.name}
                  </span>
                )}
              </div>

              <div className="max-w-2xl">
                <BookingRequestForm
                  hotel={hotel}
                  rooms={rooms}
                  selectedRoomId={selectedRoomId}
                  onSelectRoom={setSelectedRoomId}
                  initialGuest={initialGuest}
                />
              </div>
            </section>

            {/* 3. HOTEL AMENITIES & PERKS */}
            <section
              id="amenities"
              className="scroll-mt-44 border-t border-brand-border/70 pt-8"
            >
              <h2 className="font-jakarta text-lg font-extrabold text-brand-ink">
                Amenities &amp; Included Perks
              </h2>
              <p className="mt-1 text-xs text-brand-muted">
                Included when you book a verified stay at {hotel.name}.
              </p>

              <div className="mt-4 flex flex-wrap gap-2.5">
                <span className="inline-flex items-center gap-2 rounded-xl bg-day-bg px-3.5 py-2 text-xs font-bold text-day-text">
                  <CoffeeIcon className="h-4 w-4" />
                  Day Stay · {dayWindow}
                </span>

                {hotelAmenities.map((amenity) => (
                  <span
                    key={amenity}
                    className="inline-flex items-center gap-2 rounded-xl border border-brand-border/80 bg-brand-bg/60 px-3.5 py-2 text-xs font-semibold text-brand-ink"
                  >
                    {amenity === "Free Wi-Fi" ? (
                      <WifiIcon className="h-4 w-4 text-brand-primary" />
                    ) : (
                      <CheckCircleIcon className="h-4 w-4 text-brand-primary" />
                    )}
                    {amenity}
                  </span>
                ))}
              </div>
            </section>

            {/* 4. LOCATION & LAGOS MAP */}
            <section
              id="location"
              className="scroll-mt-44 border-t border-brand-border/70 pt-8"
            >
              <div className="mb-4 flex items-center justify-between gap-2">
                <div>
                  <h2 className="font-jakarta text-lg font-extrabold text-brand-ink">
                    Location &amp; Directions
                  </h2>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-brand-muted">
                    <PinIcon className="h-3.5 w-3.5 shrink-0 text-brand-primary" />
                    {hotel.address}
                  </p>
                </div>
              </div>
              <HotelLocationCard hotel={hotel} />
            </section>
          </div>
        </div>
      </div>

      {/* =================================================================
          MOBILE STICKY BOTTOM BOOKING BAR
         ================================================================= */}
      {selectedRoom && (
        <div className="fixed inset-x-0 bottom-[64px] z-30 border-t border-brand-border bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(23,36,58,0.08)] backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-brand-muted">
                {selectedRoom.name}
              </p>
              <p className="font-jakarta text-base font-extrabold text-brand-ink">
                {formatNaira(
                  selectedRoom.day_price_ngn ?? selectedRoom.night_price_ngn
                )}
                <span className="text-xs font-normal text-brand-muted">
                  {" "}
                  / day
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => jumpToSection("book", "booking-form")}
              className="shrink-0 cursor-pointer rounded-full bg-brand-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-primary-hover"
            >
              Book Room
            </button>
          </div>
        </div>
      )}

      {/* =================================================================
          MODAL 1: VERIFIED HOTEL BADGE MODAL
         ================================================================= */}
      {showVerifiedModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="verified-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/50 p-4 backdrop-blur-xs"
          onClick={() => setShowVerifiedModal(false)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative overflow-hidden bg-gradient-to-br from-[#FF7138] to-[#E0531A] px-6 py-8 text-center text-white">
              {/* Subtle tonal Lagos Skyline, National Theatre & Ikoyi Link Bridge graphic */}
              <svg
                aria-hidden="true"
                viewBox="0 0 440 190"
                fill="none"
                preserveAspectRatio="xMidYMax slice"
                className="pointer-events-none absolute inset-0 h-full w-full"
              >
                {/* Warm sun halo top-left */}
                <circle cx="72" cy="44" r="34" fill="#FFD33C" fillOpacity="0.22" />
                <circle cx="72" cy="44" r="20" fill="#FFD33C" fillOpacity="0.28" />

                {/* Soft stylized clouds */}
                <path
                  d="M288 46h42a10 10 0 0 0-8-16 14 14 0 0 0-26 3 8 8 0 0 0-8 13Z"
                  fill="#FFFFFF"
                  fillOpacity="0.14"
                />
                <path
                  d="M112 66h28a7 7 0 0 0-5-11 9 9 0 0 0-17 2 6 6 0 0 0-6 9Z"
                  fill="#FFFFFF"
                  fillOpacity="0.12"
                />

                {/* Distant Lagos hotel & VI skyline towers */}
                <rect x="18" y="112" width="26" height="78" rx="3" fill="#B83B0B" fillOpacity="0.28" />
                <rect x="48" y="92" width="32" height="98" rx="3" fill="#B83B0B" fillOpacity="0.34" />
                <rect x="86" y="120" width="24" height="70" rx="3" fill="#B83B0B" fillOpacity="0.24" />
                <rect x="336" y="102" width="30" height="88" rx="3" fill="#B83B0B" fillOpacity="0.32" />
                <rect x="372" y="84" width="34" height="106" rx="3" fill="#B83B0B" fillOpacity="0.38" />
                <rect x="410" y="116" width="24" height="74" rx="3" fill="#B83B0B" fillOpacity="0.26" />

                {/* Subtle glowing hotel windows */}
                <g fill="#FFF7E6" fillOpacity="0.25">
                  <rect x="55" y="102" width="5" height="6" rx="1" />
                  <rect x="65" y="102" width="5" height="6" rx="1" />
                  <rect x="55" y="114" width="5" height="6" rx="1" />
                  <rect x="65" y="114" width="5" height="6" rx="1" />
                  <rect x="380" y="96" width="6" height="6" rx="1" />
                  <rect x="392" y="96" width="6" height="6" rx="1" />
                  <rect x="380" y="108" width="6" height="6" rx="1" />
                  <rect x="392" y="108" width="6" height="6" rx="1" />
                </g>

                {/* Lekki-Ikoyi Link Bridge cable-stayed silhouette */}
                <path
                  d="M110 174 Q 220 152 334 174"
                  stroke="#9C2F06"
                  strokeOpacity="0.36"
                  strokeWidth="3"
                />
                <path
                  d="M222 108 L214 172 M222 108 L230 172"
                  stroke="#9C2F06"
                  strokeOpacity="0.4"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <path
                  d="M222 114 L152 168 M222 122 L176 166 M222 132 L196 164 M222 114 L292 168 M222 122 L268 166 M222 132 L248 164"
                  stroke="#FFFFFF"
                  strokeOpacity="0.22"
                  strokeWidth="1.2"
                />

                {/* Palm tree silhouettes left & right */}
                <path
                  d="M26 190 Q 32 154 38 134"
                  stroke="#8C2A05"
                  strokeOpacity="0.42"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <path
                  d="M38 134 Q 18 124 10 134 M38 134 Q 24 118 32 112 M38 134 Q 54 120 62 130 M38 134 Q 52 134 58 146"
                  stroke="#8C2A05"
                  strokeOpacity="0.42"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M416 190 Q 410 156 404 136"
                  stroke="#8C2A05"
                  strokeOpacity="0.42"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <path
                  d="M404 136 Q 424 126 432 136 M404 136 Q 418 120 410 114 M404 136 Q 388 122 380 132 M404 136 Q 390 136 384 148"
                  stroke="#8C2A05"
                  strokeOpacity="0.42"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Foreground lagoon strip */}
                <path
                  d="M0 172 Q 110 164 220 172 T 440 170 L 440 190 L 0 190 Z"
                  fill="#9C2F06"
                  fillOpacity="0.34"
                />
              </svg>

              <button
                type="button"
                aria-label="Close"
                onClick={() => setShowVerifiedModal(false)}
                className="absolute top-4 right-4 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/15 text-sm font-bold text-white backdrop-blur-xs hover:bg-white/25"
              >
                ✕
              </button>
              <div className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md">
                <VerifiedBadgeIcon className="h-9 w-9 text-[#FF7138]" />
              </div>
              <h3
                id="verified-modal-title"
                className="relative z-10 mt-4 font-jakarta text-xl font-extrabold drop-shadow-xs"
              >
                Verified by Stayside
              </h3>
              <p className="relative z-10 mt-1 text-xs text-white/95">
                {hotel.name} · {hotel.area}, Lagos
              </p>
            </div>

            <div className="space-y-3 p-6 text-sm text-brand-ink">
              <p className="text-xs leading-relaxed text-brand-muted">
                Every verified partner on Stayside is reviewed by our Lagos team
                so you get a smooth, predictable day stay:
              </p>
              <ul className="space-y-2 text-xs font-medium text-brand-ink">
                <li className="flex items-center gap-2">
                  <VerifiedBadgeIcon className="h-4 w-4 shrink-0 text-[#FF7138]" />
                  Verified hotel photos, room types &amp; amenities
                </li>
                <li className="flex items-center gap-2">
                  <VerifiedBadgeIcon className="h-4 w-4 shrink-0 text-[#FF7138]" />
                  Transparent Naira day-stay pricing—no surprise fees
                </li>
                <li className="flex items-center gap-2">
                  <VerifiedBadgeIcon className="h-4 w-4 shrink-0 text-[#FF7138]" />
                  Direct front-desk confirmation for your {dayWindow} slot
                </li>
              </ul>

              <button
                type="button"
                onClick={() => setShowVerifiedModal(false)}
                className="mt-4 w-full cursor-pointer rounded-xl bg-[#FF7138] py-3 text-sm font-bold text-white transition hover:bg-[#E85D25]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================
          MODAL 2: MORE INFO MODAL (Description, Hours, Address & Share)
         ================================================================= */}
      {showInfoModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="info-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/50 p-4 backdrop-blur-xs"
          onClick={() => setShowInfoModal(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-40 w-full overflow-hidden bg-brand-bg">
              {activePhoto && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activePhoto}
                  alt={hotel.name}
                  className="h-full w-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className="cursor-pointer rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-brand-ink shadow-sm hover:bg-brand-bg"
                >
                  {copiedLink ? "Link Copied ✓" : "Share"}
                </button>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setShowInfoModal(false)}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white text-sm font-bold text-brand-ink shadow-sm hover:bg-brand-bg"
                >
                  ✕
                </button>
              </div>
              <div className="absolute bottom-3 left-5 text-white">
                <h3
                  id="info-modal-title"
                  className="font-jakarta text-xl font-extrabold"
                >
                  {hotel.name}
                </h3>
                <p className="text-xs text-white/85">{hotel.area}, Lagos</p>
              </div>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <h4 className="text-xs font-bold tracking-wider text-brand-muted uppercase">
                  About this hotel
                </h4>
                <p className="mt-1.5 text-sm leading-relaxed text-brand-ink/85">
                  {hotel.description}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 rounded-2xl bg-brand-bg p-4 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] font-semibold tracking-wider text-brand-muted uppercase">
                    Day-Stay Hours
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-brand-ink">
                    {dayWindow}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowInfoModal(false);
                    setShowReviewsModal(true);
                  }}
                  className="cursor-pointer text-left transition hover:opacity-80"
                >
                  <p className="text-[11px] font-semibold tracking-wider text-brand-muted uppercase">
                    Ratings &amp; Reviews
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-sm font-bold text-brand-ink">
                    <StarFilledIcon className="h-4 w-4 text-[#FFD33C]" />
                    {rating} ({reviewCount}) ›
                  </p>
                </button>
              </div>

              <div>
                <h4 className="text-xs font-bold tracking-wider text-brand-muted uppercase">
                  Address
                </h4>
                <p className="mt-1 flex items-start gap-1.5 text-sm text-brand-ink">
                  <PinIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" />
                  {hotel.address}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold tracking-wider text-brand-muted uppercase">
                  Hotel Amenities
                </h4>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {hotelAmenities.map((a) => (
                    <span
                      key={a}
                      className="rounded-lg bg-brand-primary/[0.07] px-2.5 py-1 text-xs font-semibold text-brand-ink"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* =================================================================
          MODAL 3: CHOWDECK-STYLE RATINGS & REVIEWS MODAL
         ================================================================= */}
      {showReviewsModal && (
        <HotelReviewsModal
          hotelId={hotel.id}
          hotelSlug={hotel.slug}
          hotelName={hotel.name}
          initialApprovedReviews={approvedReviews}
          initialOwnPendingReviews={ownPendingReviews}
          eligibleBookings={eligibleReviewBookings}
          isSignedIn={Boolean(initialGuest?.isSignedIn)}
          onClose={() => setShowReviewsModal(false)}
          onJumpToBook={() => jumpToSection("book", "booking-form")}
        />
      )}
    </div>
  );
}
