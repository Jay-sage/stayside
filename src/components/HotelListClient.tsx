"use client";

import { useEffect, useMemo, useState } from "react";
import {
  HotelCardFeatured,
  getHotelDisplayRating,
  getHotelPriceSummary,
  type HotelWithRooms,
} from "@/components/HotelCard";
import { ClockIcon, PinIcon, SearchIcon, StarFilledIcon } from "@/components/Icons";
import { HotelsMapExplorer } from "@/components/HotelMapSection";
import { AMENITY_CATALOG } from "@/lib/amenities";
import {
  addRecentSearch,
  clearRecentSearches,
  readRecentSearches,
} from "@/lib/wishlist";

const RATING_OPTIONS = [
  { label: "Any", value: 0 },
  { label: "5.0", value: 5.0 },
  { label: "4.9+", value: 4.9 },
  { label: "4.8+", value: 4.8 },
] as const;

export function HotelListClient({
  hotels,
  areas,
  initialQuery = "",
  initialArea = "All",
  initialStay = "all",
}: {
  hotels: HotelWithRooms[];
  areas: string[];
  initialQuery?: string;
  initialArea?: string;
  initialStay?: "all" | "day" | "night";
}) {
  const [query, setQuery] = useState(initialQuery);
  const [area, setArea] = useState(initialArea);
  const [stay, setStay] = useState<"all" | "day" | "night">(initialStay);
  const [minPrice, setMinPrice] = useState<string>("0");
  const [maxPrice, setMaxPrice] = useState<string>("any");
  const [minRating, setMinRating] = useState<number>(0);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Draft filter states inside the Filter By modal
  const [draftStay, setDraftStay] = useState(stay);
  const [draftArea, setDraftArea] = useState(area);
  const [draftMinPrice, setDraftMinPrice] = useState(minPrice);
  const [draftMaxPrice, setDraftMaxPrice] = useState(maxPrice);
  const [draftMinRating, setDraftMinRating] = useState(minRating);
  const [draftAmenities, setDraftAmenities] = useState<string[]>(amenities);

  useEffect(() => {
    setRecentSearches(readRecentSearches());
  }, []);

  function openFilters() {
    setDraftStay(stay);
    setDraftArea(area);
    setDraftMinPrice(minPrice);
    setDraftMaxPrice(maxPrice);
    setDraftMinRating(minRating);
    setDraftAmenities(amenities);
    setFilterOpen(true);
  }

  function applyFilters() {
    setStay(draftStay);
    setArea(draftArea);
    setMinPrice(draftMinPrice);
    setMaxPrice(draftMaxPrice);
    setMinRating(draftMinRating);
    setAmenities(draftAmenities);
    setFilterOpen(false);
  }

  function handleSearchCommit(val: string) {
    setQuery(val);
    if (val.trim().length >= 2) {
      setRecentSearches(addRecentSearch(val));
    }
  }

  const activeFilterCount =
    (area !== "All" ? 1 : 0) +
    (stay !== "all" ? 1 : 0) +
    (minPrice !== "0" ? 1 : 0) +
    (maxPrice !== "any" ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    amenities.length;

  const filtered = useMemo(() => {
    return hotels.filter((h) => {
      if (area !== "All" && h.area !== area) return false;

      const { lowestDay, lowestNight } = getHotelPriceSummary(h);
      if (stay === "day" && lowestDay === null) return false;
      if (stay === "night" && lowestNight === null) return false;

      const effectivePrice =
        stay === "day"
          ? lowestDay
          : stay === "night"
          ? lowestNight
          : Math.min(lowestDay ?? Infinity, lowestNight ?? Infinity);

      if (minPrice !== "0") {
        const floor = Number(minPrice);
        if (effectivePrice === null || !Number.isFinite(effectivePrice) || effectivePrice < floor) {
          return false;
        }
      }

      if (maxPrice !== "any") {
        const cap = Number(maxPrice);
        if (effectivePrice === null || !Number.isFinite(effectivePrice) || effectivePrice > cap) {
          return false;
        }
      }

      const rating = Number(getHotelDisplayRating(h.slug));
      if (minRating > 0 && rating < minRating) return false;

      if (amenities.length > 0) {
        const hotelPerks = new Set(
          [
            ...(h.amenities ?? []),
            ...h.room_types.flatMap((r) => r.amenities ?? []),
          ].map((x) => x.toLowerCase())
        );
        for (const a of amenities) {
          if (!hotelPerks.has(a.toLowerCase())) return false;
        }
      }

      if (query.trim()) {
        const q = query.toLowerCase();
        const matches =
          h.name.toLowerCase().includes(q) ||
          h.area.toLowerCase().includes(q) ||
          h.address.toLowerCase().includes(q) ||
          h.description.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [hotels, area, stay, minPrice, maxPrice, minRating, amenities, query]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-6 md:px-6 md:py-10">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-jakarta text-2xl font-bold tracking-tight text-brand-ink">
            Search Hotels
          </h1>
          <p className="mt-0.5 text-xs text-brand-muted">
            Find Lagos day-stay hotels by area, price, rating, and amenities.
          </p>
        </div>
      </div>

      {/* Search Pill + Filter Trigger (matches Search Flow screenshot) */}
      <div className="mb-5 flex items-center gap-2.5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearchCommit(query);
          }}
          className="relative flex-1"
        >
          <SearchIcon className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-brand-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search hotel, Ikoyi, Victoria Island, Lekki..."
            className="w-full rounded-full bg-brand-bg py-3 pr-4 pl-11 text-sm text-brand-ink outline-none transition placeholder:text-brand-muted focus:ring-2 focus:ring-brand-primary/25"
          />
        </form>

        <button
          type="button"
          onClick={openFilters}
          className="relative flex h-[44px] shrink-0 cursor-pointer items-center gap-2 rounded-full bg-white px-4 text-xs font-semibold text-brand-ink shadow-[0_2px_18px_rgba(23,36,58,0.08)] ring-1 ring-brand-border transition hover:bg-brand-bg"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            className="h-4 w-4"
          >
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
          <span>Filter</span>
          {activeFilterCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-accent text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Recent Searches strip */}
      {recentSearches.length > 0 && !query && (
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-brand-ink">Recent Searches</span>
            <button
              type="button"
              onClick={() => {
                clearRecentSearches();
                setRecentSearches([]);
              }}
              className="cursor-pointer font-medium text-brand-accent hover:underline"
            >
              Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => setQuery(term)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-brand-bg px-3 py-1.5 text-xs font-medium text-brand-ink transition hover:bg-night-bg hover:text-brand-primary"
              >
                <ClockIcon className="h-3.5 w-3.5 text-brand-muted" />
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results header + List/Map toggle */}
      <div className="mb-4 flex items-center justify-between gap-3 text-xs text-brand-muted">
        <div className="flex items-center gap-3">
          <span>
            Showing <strong className="text-brand-ink">{filtered.length}</strong>{" "}
            {filtered.length === 1 ? "hotel" : "hotels"}
          </span>
          {(query || activeFilterCount > 0) && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setArea("All");
                setStay("all");
                setMinPrice("0");
                setMaxPrice("any");
                setMinRating(0);
                setAmenities([]);
              }}
              className="cursor-pointer font-semibold text-brand-primary hover:underline"
            >
              Reset all
            </button>
          )}
        </div>

        <div className="inline-flex rounded-full bg-brand-bg p-1 font-semibold">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`cursor-pointer rounded-full px-3 py-1 transition ${
              viewMode === "list" ? "bg-brand-ink text-white" : "text-brand-muted"
            }`}
          >
            List
          </button>
          <button
            type="button"
            onClick={() => setViewMode("map")}
            className={`inline-flex cursor-pointer items-center gap-1 rounded-full px-3 py-1 transition ${
              viewMode === "map" ? "bg-brand-primary text-white" : "text-brand-muted"
            }`}
          >
            <PinIcon className="h-3.5 w-3.5" />
            Map
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl bg-brand-bg p-10 text-center">
          <p className="text-sm font-semibold text-brand-ink">No hotels matched those filters.</p>
          <p className="mt-1 text-xs text-brand-muted">
            Try widening your price range or clearing a filter.
          </p>
        </div>
      ) : viewMode === "map" ? (
        <HotelsMapExplorer hotels={filtered} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((hotel) => (
            <HotelCardFeatured key={hotel.id} hotel={hotel} preferStay={stay} />
          ))}
        </div>
      )}

      {/* Filter By Modal Sheet (matches Image 6 left) */}
      {filterOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-ink/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4">
          <div className="w-full max-w-md rounded-t-[28px] bg-white p-6 shadow-2xl sm:rounded-[28px]">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-jakarta text-lg font-bold text-brand-ink">Filter By</h2>
              <button
                type="button"
                onClick={() => setFilterOpen(false)}
                className="cursor-pointer rounded-full p-1.5 text-brand-muted hover:bg-brand-bg hover:text-brand-ink"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
              {/* Stay Type */}
              <div>
                <p className="mb-2 text-xs font-semibold text-brand-ink">Stay Type</p>
                <div className="flex flex-wrap gap-2">
                  {(["all", "day", "night"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setDraftStay(mode)}
                      className={`cursor-pointer rounded-full px-4 py-2 text-xs font-semibold transition ${
                        draftStay === mode
                          ? "bg-brand-primary text-white"
                          : "bg-brand-bg text-brand-ink hover:bg-night-bg"
                      }`}
                    >
                      {mode === "all" ? "All Stays" : mode === "day" ? "Day Stay" : "Night Stay"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lagos Area */}
              <div>
                <p className="mb-2 text-xs font-semibold text-brand-ink">Lagos Area</p>
                <div className="flex flex-wrap gap-2">
                  {["All", ...areas].map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setDraftArea(a)}
                      className={`cursor-pointer rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                        draftArea === a
                          ? "bg-brand-primary text-white"
                          : "bg-brand-bg text-brand-ink hover:bg-night-bg"
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <p className="mb-2 text-xs font-semibold text-brand-ink">Price Range (₦)</p>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={draftMinPrice}
                    onChange={(e) => setDraftMinPrice(e.target.value)}
                    className="rounded-full bg-brand-bg px-4 py-2.5 text-xs font-medium text-brand-ink outline-none"
                  >
                    <option value="0">Minimum: Any</option>
                    <option value="5000">₦5,000+</option>
                    <option value="10000">₦10,000+</option>
                    <option value="20000">₦20,000+</option>
                  </select>
                  <select
                    value={draftMaxPrice}
                    onChange={(e) => setDraftMaxPrice(e.target.value)}
                    className="rounded-full bg-brand-bg px-4 py-2.5 text-xs font-medium text-brand-ink outline-none"
                  >
                    <option value="any">Maximum: Any</option>
                    <option value="10000">Up to ₦10,000</option>
                    <option value="20000">Up to ₦20,000</option>
                    <option value="50000">Up to ₦50,000</option>
                  </select>
                </div>
              </div>

              {/* Amenities */}
              <div>
                <p className="mb-2 text-xs font-semibold text-brand-ink">Amenities</p>
                <div className="flex flex-wrap gap-2">
                  {AMENITY_CATALOG.map((item) => {
                    const active = draftAmenities.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() =>
                          setDraftAmenities(
                            active
                              ? draftAmenities.filter((x) => x !== item)
                              : [...draftAmenities, item]
                          )
                        }
                        className={`cursor-pointer rounded-full px-3.5 py-2 text-xs font-medium transition ${
                          active
                            ? "bg-brand-primary text-white"
                            : "bg-brand-bg text-brand-ink hover:bg-night-bg"
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rating */}
              <div>
                <p className="mb-2 text-xs font-semibold text-brand-ink">Rating</p>
                <div className="flex flex-wrap gap-2">
                  {RATING_OPTIONS.map((r) => (
                    <button
                      key={r.label}
                      type="button"
                      onClick={() => setDraftMinRating(r.value)}
                      className={`inline-flex cursor-pointer items-center gap-1 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                        draftMinRating === r.value
                          ? "bg-brand-primary text-white"
                          : "bg-brand-bg text-brand-ink hover:bg-night-bg"
                      }`}
                    >
                      {r.value > 0 && <StarFilledIcon className="h-3.5 w-3.5 text-[#FFD33C]" />}
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFilterOpen(false)}
                className="cursor-pointer rounded-full border border-brand-border py-3 text-xs font-semibold text-brand-ink transition hover:bg-brand-bg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyFilters}
                className="cursor-pointer rounded-full bg-brand-ink py-3 text-xs font-semibold text-white transition hover:bg-brand-primary"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
