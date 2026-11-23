"use client";

import { useState } from "react";
import Link from "next/link";
import {
  getHotelDisplayRating,
  getHotelPriceSummary,
  type HotelWithRooms,
} from "@/components/HotelCard";
import { PinIcon, StarFilledIcon } from "@/components/Icons";
import { formatNaira, type Hotel } from "@/types/database";

const DEFAULT_LAGOS = { lat: 6.4474, lng: 3.4357 };

function getOsmEmbedUrl(lat: number, lng: number, delta = 0.012): string {
  const bbox = `${(lng - delta).toFixed(5)},${(lat - delta).toFixed(5)},${(lng + delta).toFixed(5)},${(lat + delta).toFixed(5)}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat.toFixed(5)},${lng.toFixed(5)}`;
}

function getGoogleDirectionsUrl(lat: number, lng: number, label: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(label)}`;
}

/**
 * Multi-hotel Interactive Map View for /hotels (matches Map + Bottom Sheet reference).
 */
export function HotelsMapExplorer({ hotels }: { hotels: HotelWithRooms[] }) {
  const [activeId, setActiveId] = useState<string>(hotels[0]?.id ?? "");
  const activeHotel = hotels.find((h) => h.id === activeId) ?? hotels[0];

  if (!activeHotel) return null;

  const lat = activeHotel.lat ?? DEFAULT_LAGOS.lat;
  const lng = activeHotel.lng ?? DEFAULT_LAGOS.lng;
  const { lowestNight, lowestDay } = getHotelPriceSummary(activeHotel);
  const rating = getHotelDisplayRating(activeHotel.slug);

  return (
    <div className="overflow-hidden rounded-[24px] bg-brand-ink shadow-[0_12px_40px_rgba(23,36,58,0.16)]">
      {/* Top interactive hotel pin selector */}
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto bg-brand-ink px-4 py-3">
        {hotels.map((h) => {
          const active = h.id === activeHotel.id;
          return (
            <button
              key={h.id}
              type="button"
              onClick={() => setActiveId(h.id)}
              className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                active
                  ? "bg-brand-primary text-white shadow-xs"
                  : "bg-white/10 text-white/80 hover:bg-white/20"
              }`}
            >
              <PinIcon className="h-3.5 w-3.5" />
              <span>{h.area}</span>
            </button>
          );
        })}
      </div>

      {/* Live OpenStreetMap Lagos street view */}
      <div className="relative h-[340px] w-full bg-brand-bg sm:h-[400px]">
        <iframe
          key={activeHotel.id}
          title={`Map of ${activeHotel.name}`}
          src={getOsmEmbedUrl(lat, lng, 0.011)}
          className="h-full w-full border-0"
          loading="lazy"
        />

        {/* Floating Get Directions button */}
        <a
          href={getGoogleDirectionsUrl(lat, lng, activeHotel.name)}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-brand-ink px-4 py-2 text-xs font-semibold text-white shadow-lg transition hover:bg-brand-primary"
        >
          <PinIcon className="h-3.5 w-3.5 text-brand-accent" />
          Get Directions
        </a>
      </div>

      {/* Bottom Sheet Hotel Preview Card */}
      <div className="bg-brand-ink p-4 text-white sm:p-5">
        <div className="mb-3 flex items-center justify-between text-xs text-white/60">
          <span>
            {hotels.length} {hotels.length === 1 ? "Place" : "Places"} to stay in Lagos
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-white">
            <StarFilledIcon className="h-3.5 w-3.5 text-[#FFD33C]" />
            {rating}
          </span>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl bg-white/8 p-3">
          {activeHotel.photos[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activeHotel.photos[0]}
              alt={activeHotel.name}
              className="h-20 w-24 shrink-0 rounded-xl object-cover"
            />
          )}
          <div className="min-w-0 flex-1 space-y-1">
            <h3 className="truncate text-sm font-bold text-white">
              {activeHotel.name}
            </h3>
            <p className="truncate text-xs text-white/70">{activeHotel.address}</p>
            <div className="flex items-baseline gap-3 pt-1">
              <span className="text-sm font-bold text-brand-accent">
                {lowestDay ? formatNaira(lowestDay) : lowestNight ? formatNaira(lowestNight) : "—"}
                <span className="text-[11px] font-normal text-white/70"> /day</span>
              </span>
              <span className="text-xs text-white/75">10am–4pm</span>
            </div>
          </div>

          <Link
            href={`/hotels/${activeHotel.slug}`}
            aria-label={`View ${activeHotel.name}`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-primary text-sm font-bold text-white transition hover:bg-brand-accent"
          >
            →
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact Location & Directions Map Card for Hotel Detail (/hotels/[slug]).
 */
export function HotelLocationCard({ hotel }: { hotel: Hotel }) {
  const lat = hotel.lat ?? DEFAULT_LAGOS.lat;
  const lng = hotel.lng ?? DEFAULT_LAGOS.lng;

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <h2 className="text-[14px] font-medium leading-[1.5] text-brand-ink">
          Location
        </h2>
        <a
          href={getGoogleDirectionsUrl(lat, lng, hotel.name)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline"
        >
          <PinIcon className="h-3.5 w-3.5" />
          Get Directions
        </a>
      </div>

      <div className="overflow-hidden rounded-[14px] bg-white shadow-[0_2px_20px_rgba(23,36,58,0.06)]">
        <div className="h-48 w-full bg-brand-bg">
          <iframe
            title={`Location of ${hotel.name}`}
            src={getOsmEmbedUrl(lat, lng, 0.008)}
            className="h-full w-full border-0"
            loading="lazy"
          />
        </div>
        <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 text-xs">
          <span className="truncate text-brand-muted">{hotel.address}</span>
          <a
            href={getGoogleDirectionsUrl(lat, lng, hotel.name)}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-full bg-night-bg px-3 py-1 text-[11px] font-semibold text-brand-primary transition hover:bg-brand-primary hover:text-white"
          >
            Open Maps
          </a>
        </div>
      </div>
    </div>
  );
}
