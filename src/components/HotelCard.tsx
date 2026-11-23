"use client";

import Link from "next/link";
import { formatNaira, formatTimeShort, type Hotel, type RoomType } from "@/types/database";
import { HeartIcon, StarFilledIcon } from "@/components/Icons";
import { useWishlist } from "@/lib/wishlist";

export type HotelWithRooms = Hotel & { room_types: RoomType[] };

export function getHotelPriceSummary(hotel: HotelWithRooms) {
  const lowestNight = hotel.room_types.reduce(
    (min, r) => Math.min(min, r.night_price_ngn),
    Infinity
  );
  const lowestDay = hotel.room_types.reduce(
    (min, r) =>
      r.day_price_ngn && r.day_rooms_per_day > 0 ? Math.min(min, r.day_price_ngn) : min,
    Infinity
  );
  return {
    lowestNight: Number.isFinite(lowestNight) ? lowestNight : null,
    lowestDay: Number.isFinite(lowestDay) ? lowestDay : null,
  };
}

export function getHotelDisplayRating(slug: string): string {
  if (slug.includes("ikoyi")) return "5.0";
  if (slug.includes("vi")) return "4.9";
  return "4.8";
}

/**
 * Tall featured card matching HotelIQ's "Near Location" card (718:4640).
 * Crisp white surface, whisper-soft shadow, clean photography with circular Heart button,
 * Hotel Name + Gold Star rating, Address, and Deep Teal Naira price.
 */
export function HotelCardFeatured({
  hotel,
  preferStay = "all",
}: {
  hotel: HotelWithRooms;
  preferStay?: "all" | "day" | "night";
}) {
  const wishlist = useWishlist();
  const liked = wishlist.has(hotel.id);
  const { lowestNight, lowestDay } = getHotelPriceSummary(hotel);
  const rating = getHotelDisplayRating(hotel.slug);

  const primaryPrice =
    preferStay === "night" && lowestNight !== null
      ? lowestNight
      : lowestDay ?? lowestNight;
  const primaryUnit =
    preferStay === "night" && lowestNight !== null ? "/night" : "/day";

  return (
    <div className="group dark-card-surface relative overflow-hidden rounded-[14px] bg-white shadow-[0_2px_36px_rgba(19,32,48,0.08)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_40px_rgba(36,87,214,0.14)]">
      {/* Top Image */}
      <div className="relative h-[182px] w-full overflow-hidden rounded-t-[12px] bg-brand-bg">
        <Link href={`/hotels/${hotel.slug}`} className="block h-full w-full">
          {hotel.photos[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={hotel.photos[0]}
              alt={hotel.name}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : null}
        </Link>

        <button
          type="button"
          aria-label={liked ? "Remove from saved" : "Save hotel"}
          onClick={() => wishlist.toggle(hotel.id)}
          className="absolute top-[12px] right-[12px] flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-full bg-white shadow-xs transition hover:scale-105"
        >
          <HeartIcon
            filled={liked}
            className={`h-[18px] w-[18px] ${
              liked ? "text-[#E74C3C]" : "text-brand-muted"
            }`}
          />
        </button>
      </div>

      {/* Card Detail */}
      <Link href={`/hotels/${hotel.slug}`} className="block p-[12px]">
        <div className="space-y-[4px]">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-[14px] font-medium leading-[1.5] text-brand-ink transition group-hover:text-brand-primary">
              {hotel.name}
            </h3>
            <div className="flex shrink-0 items-center gap-[5px]">
              <StarFilledIcon className="h-[16px] w-[16px] text-[#FFD33C]" />
              <span className="font-jakarta text-[12px] font-bold leading-[1.5] text-brand-ink">
                {rating}
              </span>
            </div>
          </div>

          <p className="truncate text-[12px] font-normal leading-[1.5] text-brand-muted">
            {hotel.address}
          </p>
        </div>

        <div className="mt-[14px] flex items-baseline justify-between gap-2">
          <p className="leading-[20px]">
            <span className="text-[14px] font-bold text-brand-primary">
              {primaryPrice !== null ? formatNaira(primaryPrice) : "—"}
            </span>{" "}
            <span className="text-[12px] font-normal text-brand-muted">
              {primaryUnit}
            </span>
          </p>

          <span className="rounded-full bg-day-bg px-2 py-0.5 text-[11px] font-semibold text-day-text">
            {formatTimeShort(hotel.day_start)}–{formatTimeShort(hotel.day_end)}
          </span>
        </div>
      </Link>
    </div>
  );
}

/**
 * Compact horizontal list card matching HotelIQ's "Popular Hotel" card (718:4621).
 */
export function HotelCardCompact({ hotel }: { hotel: HotelWithRooms }) {
  const { lowestNight, lowestDay } = getHotelPriceSummary(hotel);
  const rating = getHotelDisplayRating(hotel.slug);

  return (
    <Link
      href={`/hotels/${hotel.slug}`}
      className="group dark-card-surface flex items-center gap-[12px] rounded-[14px] bg-white p-[12px] shadow-[0_2px_24px_rgba(19,32,48,0.07)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(36,87,214,0.12)]"
    >
      <div className="relative h-[84px] w-[84px] shrink-0 overflow-hidden rounded-[12px] bg-brand-bg">
        {hotel.photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hotel.photos[0]}
            alt={hotel.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : null}
      </div>

      <div className="min-w-0 flex-1 space-y-[12px]">
        <div className="space-y-[3px]">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-[14px] font-medium leading-[1.5] text-brand-ink transition group-hover:text-brand-primary">
              {hotel.name}
            </h3>
            <div className="flex shrink-0 items-center gap-[5px]">
              <StarFilledIcon className="h-[16px] w-[16px] text-[#FFD33C]" />
              <span className="font-jakarta text-[12px] font-bold leading-[1.5] text-brand-ink">
                {rating}
              </span>
            </div>
          </div>

          <p className="truncate text-[12px] font-normal leading-[1.5] text-brand-muted">
            {hotel.address}
          </p>
        </div>

        <div className="flex items-baseline justify-between gap-2">
          <p className="leading-[20px]">
            <span className="text-[14px] font-bold text-brand-primary">
              {lowestDay !== null ? formatNaira(lowestDay) : lowestNight !== null ? formatNaira(lowestNight) : "—"}
            </span>{" "}
            <span className="text-[12px] font-normal text-brand-muted">/day</span>
          </p>

          <span className="rounded-full bg-day-bg px-2 py-0.5 text-[11px] font-semibold text-day-text">
            {formatTimeShort(hotel.day_start)}–{formatTimeShort(hotel.day_end)}
          </span>
        </div>
      </div>
    </Link>
  );
}
