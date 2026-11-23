import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buildWhatsAppUrl } from "@/lib/phone";
import { PinIcon, SunIcon } from "@/components/Icons";
import {
  formatNaira,
  formatTimeShort,
  type Hotel,
  type RoomType,
} from "@/types/database";

interface SiteContent {
  tagline?: string;
  featured_photos?: string[];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}): Promise<Metadata> {
  const { subdomain } = await params;
  const supabase = await createClient();

  const { data: site } = await supabase
    .from("hotel_sites")
    .select("content, published, hotels(name, area, description, photos, status)")
    .eq("subdomain", subdomain.toLowerCase())
    .eq("published", true)
    .maybeSingle();

  const rawHotel = site?.hotels
    ? Array.isArray(site.hotels)
      ? site.hotels[0]
      : site.hotels
    : null;

  if (!rawHotel || rawHotel.status !== "approved") {
    return { title: "Hotel Page Unavailable" };
  }

  const content = (site?.content ?? {}) as SiteContent;
  const hero =
    content.featured_photos?.[0] ||
    (Array.isArray(rawHotel.photos) ? rawHotel.photos[0] : "/images/hero-lagos.png");
  const desc =
    content.tagline ||
    rawHotel.description?.slice(0, 155) ||
    `Book verified day stays at ${rawHotel.name} in ${rawHotel.area}, Lagos.`;

  return {
    title: `${rawHotel.name} — ${rawHotel.area}, Lagos`,
    description: desc,
    openGraph: {
      title: `${rawHotel.name} · Powered by Stayside`,
      description: desc,
      images: [{ url: hero, alt: rawHotel.name }],
    },
  };
}

export default async function HotelOnePagerSite({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const supabase = await createClient();

  const { data: site } = await supabase
    .from("hotel_sites")
    .select("id, subdomain, content, published, hotels(*, room_types(*))")
    .eq("subdomain", subdomain.toLowerCase())
    .eq("published", true)
    .maybeSingle();

  const rawHotel = site?.hotels
    ? Array.isArray(site.hotels)
      ? site.hotels[0]
      : site.hotels
    : null;

  const hotel = rawHotel as (Hotel & { room_types: RoomType[] }) | null;

  // Stage 5 rule: only serve published, approved hotels; otherwise show a friendly unavailable screen
  if (!site || !hotel || hotel.status !== "approved") {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-5 text-center">
        <span className="rounded-full bg-day-bg px-3 py-1 text-xs font-semibold text-day-text">
          Page Not Available
        </span>
        <h1 className="mt-4 font-jakarta text-2xl font-bold text-brand-ink">
          This hotel page is currently unavailable
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-brand-muted">
          The hotel may be updating its listing or hasn&apos;t published its page yet. Explore other verified Lagos day-stay hotels on Stayside.
        </p>
        <Link
          href="/"
          className="mt-6 rounded-full bg-brand-primary px-6 py-3 text-xs font-semibold text-white transition hover:bg-brand-primary-hover"
        >
          Browse Stayside Hotels
        </Link>
      </div>
    );
  }

  const content = (site.content ?? {}) as SiteContent;
  const tagline =
    content.tagline?.trim() ||
    `Day stays (${formatTimeShort(hotel.day_start)}–${formatTimeShort(hotel.day_end)}) & overnight rooms in ${hotel.area}, Lagos`;

  const chosenPhotos =
    content.featured_photos && content.featured_photos.length > 0
      ? content.featured_photos
      : hotel.photos;

  const heroPhoto = chosenPhotos[0] || hotel.photos[0] || "";
  const galleryPhotos = chosenPhotos.slice(1, 4);
  const rooms = hotel.room_types ?? [];

  const lowestDay = rooms.reduce(
    (min, r) =>
      r.day_price_ngn && r.day_rooms_per_day > 0 ? Math.min(min, r.day_price_ngn) : min,
    Infinity
  );

  // Plan check hook ready for future custom-domain support on paid hotels
  const supportsCustomDomain = hotel.plan === "paid";

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";
  const protocol = rootDomain.startsWith("localhost") ? "http" : "https";
  const bookingUrl = `${protocol}://${rootDomain}/hotels/${hotel.slug}#booking-form`;

  const waUrl = buildWhatsAppUrl(
    hotel.whatsapp,
    `Hello ${hotel.name}, I saw your Stayside page and would like to inquire about a day stay (${formatTimeShort(hotel.day_start)}–${formatTimeShort(hotel.day_end)}).`
  );

  return (
    <div className="min-h-screen bg-white text-brand-ink">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-brand-ink text-white">
        {heroPhoto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroPhoto}
            alt={hotel.name}
            className="absolute inset-0 h-full w-full object-cover opacity-50"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-ink via-brand-ink/45 to-brand-ink/20" />

        <div className="relative mx-auto max-w-5xl px-5 py-16 sm:py-24">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
              <SunIcon className="h-3.5 w-3.5 text-brand-accent" />
              Day Stay: {formatTimeShort(hotel.day_start)} – {formatTimeShort(hotel.day_end)}
            </span>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              {hotel.area}, Lagos
            </span>
          </div>

          <h1 className="mt-5 max-w-2xl font-jakarta text-3xl font-bold tracking-tight sm:text-5xl">
            {hotel.name}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base">
            {tagline}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a
              href={bookingUrl}
              className="rounded-full bg-brand-primary px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-brand-primary-hover"
            >
              Request a Booking
              {Number.isFinite(lowestDay) ? ` · From ${formatNaira(lowestDay)}/day` : ""}
            </a>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-white/15 px-5 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25"
            >
              WhatsApp Front Desk
            </a>
          </div>
        </div>
      </section>

      {/* About + Day-Stay Offer */}
      <section className="mx-auto max-w-5xl px-5 py-12">
        <div className="grid gap-8 md:grid-cols-12">
          <div className="space-y-3 md:col-span-7">
            <h2 className="font-jakarta text-xl font-bold text-brand-ink">
              About {hotel.name}
            </h2>
            <p className="text-sm leading-relaxed text-brand-muted">
              {hotel.description}
            </p>
            <p className="flex items-center gap-1.5 pt-1 text-xs font-medium text-brand-ink">
              <PinIcon className="h-4 w-4 text-brand-primary" />
              {hotel.address}
            </p>
          </div>

          <div className="rounded-2xl bg-brand-bg p-5 md:col-span-5">
            <span className="inline-block rounded-full bg-day-bg px-3 py-1 text-[11px] font-semibold text-day-text">
              Day-Stay Offer
            </span>
            <h3 className="mt-3 font-jakarta text-lg font-bold text-brand-ink">
              {formatTimeShort(hotel.day_start)} – {formatTimeShort(hotel.day_end)}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-brand-muted">
              Enjoy full room access during the day—ideal for remote work, layovers, or a quiet Lagos recharge.
            </p>
            {Number.isFinite(lowestDay) && (
              <p className="mt-4 text-xl font-bold text-brand-primary">
                {formatNaira(lowestDay)}{" "}
                <span className="text-xs font-normal text-brand-muted">/ day stay</span>
              </p>
            )}
          </div>
        </div>

        {/* Optional Featured Gallery */}
        {galleryPhotos.length > 0 && (
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {galleryPhotos.map((url, idx) => (
              <div
                key={url}
                className="h-48 overflow-hidden rounded-2xl bg-brand-bg"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`${hotel.name} photo ${idx + 2}`}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* Rooms & Rates */}
        <div className="mt-12">
          <h2 className="mb-5 font-jakarta text-xl font-bold text-brand-ink">
            Rooms &amp; Rates
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="overflow-hidden rounded-2xl bg-white shadow-[0_4px_26px_rgba(23,36,58,0.07)]"
              >
                {room.photos[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={room.photos[0]}
                    alt={room.name}
                    className="h-44 w-full object-cover"
                  />
                )}
                <div className="space-y-2 p-5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-brand-ink">{room.name}</h3>
                    <span className="text-xs text-brand-muted">
                      Up to {room.capacity} guests
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-brand-muted">
                    {room.description}
                  </p>
                  <div className="flex items-center justify-between border-t border-brand-border/70 pt-3">
                    <div>
                      <span className="text-base font-bold text-brand-primary">
                        {formatNaira(room.day_price_ngn ?? room.night_price_ngn)}
                      </span>
                      <span className="text-xs text-brand-muted">
                        {room.day_price_ngn ? " /day" : " /night"}
                      </span>
                    </div>
                    <a
                      href={bookingUrl}
                      className="rounded-full bg-brand-ink px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-primary"
                    >
                      Book Room
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Clean Footer */}
      <footer className="border-t border-brand-border/70 bg-brand-bg/50 py-6 text-center text-xs text-brand-muted">
        <p>
          {hotel.name} · {hotel.area}, Lagos
          {supportsCustomDomain ? " · Verified Partner" : ""}
        </p>
        <p className="mt-1">
          Powered by <span className="font-semibold text-brand-primary">Stayside</span> · Built by Xlay
        </p>
      </footer>
    </div>
  );
}
