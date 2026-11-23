"use client";

import Link from "next/link";
import { useWishlist } from "@/lib/wishlist";
import {
  getHotelDisplayRating,
  getHotelPriceSummary,
  type HotelWithRooms,
} from "@/components/HotelCard";
import { ChevronLeftIcon, HeartIcon, StarFilledIcon } from "@/components/Icons";
import { formatNaira } from "@/types/database";

export function WishlistClient({ hotels }: { hotels: HotelWithRooms[] }) {
  const { ids, toggle } = useWishlist();
  const savedHotels = hotels.filter((h) => ids.includes(h.id));

  return (
    <div className="mx-auto max-w-4xl px-5 pt-5 pb-14 md:px-6 md:py-10">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-border bg-white text-brand-ink transition hover:bg-brand-bg"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="font-jakarta text-lg font-bold text-brand-ink">Wishlist</h1>
        <span className="w-10 text-right text-xs font-semibold text-brand-muted">
          {savedHotels.length}
        </span>
      </div>

      {savedHotels.length === 0 ? (
        <div className="rounded-3xl bg-brand-bg p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand-primary shadow-xs">
            <HeartIcon className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-base font-bold text-brand-ink">
            No saved hotels yet
          </h2>
          <p className="mt-1 text-xs text-brand-muted">
            Tap the heart icon on any Lagos hotel to save it here for quick booking later.
          </p>
          <Link
            href="/hotels"
            className="mt-5 inline-flex rounded-full bg-brand-primary px-6 py-2.5 text-xs font-semibold text-white transition hover:bg-brand-primary-hover"
          >
            Explore Hotels
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {savedHotels.map((hotel) => {
            const { lowestNight, lowestDay } = getHotelPriceSummary(hotel);
            const rating = getHotelDisplayRating(hotel.slug);
            return (
              <div
                key={hotel.id}
                className="overflow-hidden rounded-2xl bg-white shadow-[0_4px_30px_rgba(23,36,58,0.08)]"
              >
                <div className="relative h-52 overflow-hidden bg-brand-bg">
                  <Link href={`/hotels/${hotel.slug}`} className="block h-full w-full">
                    {hotel.photos[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={hotel.photos[0]}
                        alt={hotel.name}
                        className="h-full w-full object-cover transition duration-500 hover:scale-105"
                      />
                    )}
                  </Link>
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-brand-ink/70 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
                    <StarFilledIcon className="h-3.5 w-3.5 text-[#FFD33C]" />
                    {rating}
                  </span>
                  <button
                    type="button"
                    aria-label="Remove from wishlist"
                    onClick={() => toggle(hotel.id)}
                    className="absolute top-3 right-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white shadow-xs"
                  >
                    <HeartIcon filled className="h-4 w-4 text-[#E74C3C]" />
                  </button>
                </div>

                <Link href={`/hotels/${hotel.slug}`} className="block space-y-1.5 p-4">
                  <h2 className="text-base font-bold text-brand-ink">{hotel.name}</h2>
                  <p className="line-clamp-2 text-xs leading-relaxed text-brand-muted">
                    {hotel.description}
                  </p>
                  <div className="flex items-baseline justify-between pt-2">
                    <p className="text-sm font-bold text-brand-primary">
                      {lowestDay ? formatNaira(lowestDay) : lowestNight ? formatNaira(lowestNight) : "—"}
                      <span className="text-xs font-normal text-brand-muted"> /day</span>
                    </p>
                    <span className="rounded-full bg-day-bg px-2.5 py-0.5 text-[11px] font-semibold text-day-text">
                      Day Stay
                    </span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
