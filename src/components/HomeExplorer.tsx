"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  HotelCardCompact,
  HotelCardFeatured,
  getHotelPriceSummary,
  type HotelWithRooms,
} from "@/components/HotelCard";
import {
  BellIcon,
  BuildingIcon,
  CalendarIcon,
  CheckCircleIcon,
  PinIcon,
  SearchIcon,
  SunIcon,
} from "@/components/Icons";
import { StaysideLogoMark } from "@/components/StaysideLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { formatNaira } from "@/types/database";

const ROTATING_HEADLINES = [
  "Need a room till 4pm?",
  "Hotels, On Your Terms.",
  "Rest, work, or recharge.",
  "Lagos day stays, sorted.",
];

const STEP_DURATION_MS = 5000;

const STEPS = [
  {
    num: "01",
    title: "Pick a verified Lagos hotel",
    body: "Verified hotels in Ikoyi, VI, and Lekki—real daytime prices upfront.",
    bg: "#2457D6",
    text: "#FFFFFF",
    pillBg: "rgba(255,255,255,0.18)",
    ringColor: "#2457D6",
    badge: "Ikoyi · VI · Lekki",
    bgImage:
      "https://images.unsplash.com/photo-1618828665011-0abd973f7bb8?auto=format&fit=crop&w=1600&q=80",
    overlay:
      "linear-gradient(100deg, rgba(23,36,58,0.92) 0%, rgba(36,87,214,0.82) 52%, rgba(36,87,214,0.38) 100%)",
    image: "/images/step-1-hotel.jpg",
    imageAlt: "Lagos skyline and Lekki-Ikoyi Link Bridge",
  },
  {
    num: "02",
    title: "Choose your 10am–4pm date",
    body: "Pick your day on the calendar. Fixed Naira rates, zero overnight markup.",
    bg: "#FF7138",
    text: "#FFFFFF",
    pillBg: "rgba(255,255,255,0.22)",
    ringColor: "#FF7138",
    badge: "Fixed 7-Hour Window",
    bgImage:
      "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=1600&q=80",
    overlay:
      "linear-gradient(100deg, rgba(23,36,58,0.92) 0%, rgba(180,62,18,0.82) 52%, rgba(255,113,56,0.42) 100%)",
    image: "/images/step-2-calendar.jpg",
    imageAlt: "Minimalist calendar and day-stay scheduling desk",
  },
  {
    num: "03",
    title: "Check in & own your day",
    body: "Pay with Paystack or confirm on WhatsApp. Walk in at 10am, leave refreshed by 4pm.",
    bg: "#FFD33C",
    text: "#FFFFFF",
    pillBg: "rgba(255,211,60,0.24)",
    ringColor: "#FFD33C",
    badge: "Zero Full-Night Markup",
    bgImage:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1600&q=80",
    overlay:
      "linear-gradient(100deg, rgba(23,36,58,0.94) 0%, rgba(23,36,58,0.78) 54%, rgba(23,36,58,0.32) 100%)",
    image: "/images/step-3-checkin.jpg",
    imageAlt: "Guest checking in at a modern Lagos boutique hotel",
  },
];

const FAQS = [
  {
    category: "Day Stays",
    q: "What is a Stayside Day Stay?",
    a: "A Day Stay gives you full private access to a verified Lagos hotel room during fixed daytime hours (typically 10:00am to 4:00pm) at a fraction of the overnight rate—ideal for remote work, meetings, layovers, or a quiet recharge.",
  },
  {
    category: "Day Stays",
    q: "Can I also book a full overnight stay?",
    a: "Yes. Every hotel page leads with Day Stays, and right below the day-stay form you can switch to a Full Night Booking whenever you need to stay overnight.",
  },
  {
    category: "Day Stays",
    q: "Do I need an account to book a hotel?",
    a: "No! You can book immediately as a guest with just your name, email, and WhatsApp number. After booking, you can optionally create an account in one tap to track all your stays like orders.",
  },
  {
    category: "Payments",
    q: "What happens if a hotel declines my paid booking?",
    a: "If a hotel cannot accommodate your paid request and declines it, Stayside automatically initiates a full refund via Paystack back to your original payment method.",
  },
  {
    category: "For Hotels",
    q: "How does my hotel join Stayside?",
    a: "Partner hotels in Lagos can list rooms, set their own day-stay allotments and blackout dates, and automatically get a free <yourhotel>.stayside.ng one-page website. Reach out via our Contact page to get onboarded.",
  },
];

const FEATURE_PILLS = [
  "Fixed 10am–4pm windows",
  "Verified Lagos hotels",
  "Up to 55% off night rates",
  "Instant WhatsApp link",
  "Paystack secured",
  "No account required",
  "Pool & Wi-Fi access",
  "Free hotel one-pagers",
];

export function HomeExplorer({
  hotels,
  areas,
}: {
  hotels: HotelWithRooms[];
  areas: string[];
}) {
  const router = useRouter();
  const [areaFilter, setAreaFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [headlineIdx, setHeadlineIdx] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [stepPaused, setStepPaused] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [faqCategory, setFaqCategory] = useState<string>("All");

  // Rotate catchy hero headline smoothly
  useEffect(() => {
    const id = window.setInterval(() => {
      setHeadlineIdx((i) => (i + 1) % ROTATING_HEADLINES.length);
    }, 3400);
    return () => window.clearInterval(id);
  }, []);

  // Timed auto-cycle for 01 / 02 / 03 step card with live circular progress ring
  useEffect(() => {
    if (stepPaused) return;
    const tickMs = 50;
    const increment = (tickMs / STEP_DURATION_MS) * 100;
    const id = window.setInterval(() => {
      setStepProgress((prev) => {
        if (prev + increment >= 100) {
          setActiveStep((s) => (s + 1) % STEPS.length);
          return 0;
        }
        return prev + increment;
      });
    }, tickMs);
    return () => window.clearInterval(id);
  }, [stepPaused, activeStep]);

  function selectStep(idx: number) {
    setActiveStep(idx);
    setStepProgress(0);
  }

  const filtered = useMemo(() => {
    return hotels.filter((h) => {
      if (areaFilter !== "All" && h.area !== areaFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hit =
          h.name.toLowerCase().includes(q) ||
          h.area.toLowerCase().includes(q) ||
          h.address.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [hotels, areaFilter, searchQuery]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (areaFilter !== "All") params.set("area", areaFilter);
    router.push(`/hotels${params.toString() ? `?${params.toString()}` : ""}`);
  }

  const currentStep = STEPS[activeStep];

  return (
    <div className="bg-white">
      {/* =====================================================================
          SECTION 1: INSANELY CATCHY LAGOS DAY-STAY HERO (Chowdeck-inspired energy)
         ===================================================================== */}
      <section className="relative flex min-h-[520px] flex-col justify-center overflow-hidden border-b border-brand-border/60 bg-[#0E245C] sm:min-h-[560px] md:min-h-[600px]">
        {/* Full-Bleed Vector Lagos Artwork (infinitely sharp SVG) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/hero-lagos.svg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
        />

        {/* Subtle Slow Sun-Halo Pulse aligned over the upper-right golden sun */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-[6%] right-[10%] h-36 w-36 animate-pulse rounded-full bg-[#FFD33C]/30 blur-2xl sm:h-48 sm:w-48"
          style={{ animationDuration: "5s" }}
        />

        {/* Balanced Cobalt-Midnight Scrim so artwork glows & copy stays razor-sharp */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(13, 30, 68, 0.56) 0%, rgba(18, 36, 74, 0.44) 48%, rgba(13, 27, 58, 0.68) 100%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 68% 58% at 50% 48%, rgba(14, 28, 60, 0.42) 0%, rgba(14, 28, 60, 0) 75%)",
          }}
        />

        {/* Mobile Top Bar (Brand + Location + Notifications) */}
        <div className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 pt-5 md:hidden">
          <div className="flex items-center gap-2">
            <StaysideLogoMark className="h-9 w-9" />
            <div>
              <p className="font-jakarta text-sm font-extrabold leading-none text-white">
                Stayside
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-white/85">
                <PinIcon className="h-3 w-3 text-[#FFD33C]" />
                Lagos, Nigeria
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle variant="hero-mobile" />
            <Link
              href="/notifications"
              aria-label="Notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/25 bg-white/15 text-white backdrop-blur-md"
            >
              <BellIcon className="h-5 w-5" />
              <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-brand-accent" />
            </Link>
          </div>
        </div>

        {/* Hero Centerpiece */}
        <div className="relative z-10 mx-auto my-auto w-full max-w-4xl px-5 py-12 text-center sm:py-16 md:py-20">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/95 px-3.5 py-1.5 text-xs font-bold text-brand-ink shadow-md backdrop-blur">
            <SunIcon className="h-4 w-4 text-brand-accent" />
            Lagos Day-Stay Hotels · 10am – 4pm
          </span>

          <h1 className="mt-5 min-h-[1.2em] overflow-hidden font-jakarta text-4xl font-extrabold tracking-tight text-white drop-shadow-[0_4px_20px_rgba(10,20,45,0.45)] sm:text-5xl md:text-6xl">
            <span
              key={headlineIdx}
              className="animate-hero-headline inline-block"
            >
              {ROTATING_HEADLINES[headlineIdx]}
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm font-medium leading-relaxed text-white/95 drop-shadow-[0_2px_12px_rgba(10,20,45,0.5)] sm:text-base">
            Book verified luxury &amp; boutique hotels in Lagos for the day—work, unwind, or recharge without paying for a full night.
          </p>

          {/* Detached Floating White Search Pill */}
          <form
            onSubmit={handleSearchSubmit}
            className="mx-auto mt-7 flex max-w-2xl flex-col gap-2 rounded-[24px] bg-white p-2 shadow-[0_18px_50px_rgba(10,20,45,0.32)] ring-1 ring-white/40 sm:flex-row sm:items-center sm:rounded-full"
          >
            <div className="relative flex-1">
              <PinIcon className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-brand-primary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Where in Lagos? Ikoyi, VI, Lekki..."
                className="w-full rounded-full bg-transparent py-3 pr-3 pl-11 text-sm font-medium text-brand-ink outline-none placeholder:text-brand-muted"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                aria-label="Filter by Lagos area"
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                className="flex-1 rounded-full bg-brand-bg px-4 py-3 text-xs font-semibold text-brand-ink outline-none sm:flex-none"
              >
                <option value="All">All Lagos</option>
                {areas.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-brand-primary px-6 py-3 text-sm font-bold text-white shadow-[0_6px_20px_rgba(36,87,214,0.4)] transition hover:bg-brand-primary-hover"
              >
                <SearchIcon className="h-4 w-4" />
                <span>Find a Room</span>
              </button>
            </div>
          </form>

          {/* Starting Rate Highlight */}
          <div className="mt-5 flex items-center justify-center">
            <Link
              href="/hotels"
              className="inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-xs font-semibold text-brand-ink shadow-md ring-1 ring-white/40 transition hover:bg-white"
            >
              <span className="h-2 w-2 rounded-full bg-brand-accent" />
              <span>
                Listings start as low as{" "}
                <strong className="font-jakarta font-extrabold text-brand-primary">
                  ₦5,000
                </strong>
              </span>
              <span className="text-brand-primary" aria-hidden="true">
                →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 2: LIVE LAGOS DAY-STAY HOTELS (Crisp White Canvas)
         ===================================================================== */}
      <section className="mx-auto max-w-6xl px-5 py-12 md:px-6 md:py-16">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">
              Available Today · 10am–4pm
            </span>
            <h2 className="mt-1 font-jakarta text-2xl font-extrabold tracking-tight text-brand-ink md:text-3xl">
              Featured Lagos Day Stays
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAreaFilter("All")}
              className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                areaFilter === "All"
                  ? "bg-brand-primary text-white"
                  : "bg-brand-bg text-brand-muted hover:text-brand-ink"
              }`}
            >
              All ({hotels.length})
            </button>
            {areas.map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => setAreaFilter(areaFilter === area ? "All" : area)}
                className={`hidden cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition sm:inline-block ${
                  areaFilter === area
                    ? "bg-brand-primary text-white"
                    : "bg-brand-bg text-brand-muted hover:text-brand-ink"
                }`}
              >
                {area}
              </button>
            ))}
            <Link
              href="/hotels"
              className="pl-2 text-xs font-bold text-brand-primary hover:underline"
            >
              See all →
            </Link>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-3xl bg-brand-bg p-10 text-center text-sm text-brand-muted">
            No hotels matched that filter.{" "}
            <button
              type="button"
              onClick={() => {
                setAreaFilter("All");
                setSearchQuery("");
              }}
              className="cursor-pointer font-bold text-brand-primary underline"
            >
              Show all Lagos hotels
            </button>
          </div>
        ) : (
          <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0">
            {filtered.map((hotel) => (
              <div
                key={hotel.id}
                className="w-[268px] shrink-0 snap-start md:w-auto"
              >
                <HotelCardFeatured hotel={hotel} />
              </div>
            ))}
          </div>
        )}

        {/* Popular Compact Strip */}
        <div className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-jakarta text-lg font-bold text-brand-ink">
              Quick-Book Picks
            </h3>
            <Link
              href="/hotels"
              className="text-xs font-semibold text-brand-primary hover:underline"
            >
              Open Map &amp; Filters →
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {hotels.map((hotel) => (
              <HotelCardCompact key={hotel.id} hotel={hotel} />
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 3: COLOR-BLOCKED INTERACTIVE 01 / 02 / 03 STEP DOCK
         ===================================================================== */}
      <section className="border-y border-white/10 bg-[#17243A] py-16 text-white dark:bg-[#0E172B] md:py-20">
        <div className="mx-auto max-w-6xl px-5 md:px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-[#FFD33C]">
                How Stayside Works
              </span>
              <h2 className="mt-2 font-jakarta text-2xl font-extrabold tracking-tight sm:text-4xl">
                Book a Lagos hotel in 30 seconds.
              </h2>
            </div>

            {/* Timed Step Controls (01 / 02 / 03 with animated circular progress ring) */}
            <div className="flex items-center gap-2.5">
              {STEPS.map((s, idx) => {
                const isActive = activeStep === idx;
                const radius = 19;
                const circumference = 2 * Math.PI * radius;
                const dashOffset =
                  circumference - (stepProgress / 100) * circumference;

                return (
                  <button
                    key={s.num}
                    type="button"
                    onClick={() => selectStep(idx)}
                    aria-label={`Step ${s.num}: ${s.title}`}
                    className={`relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-full font-jakarta text-xs font-extrabold transition ${
                      isActive
                        ? "bg-white text-brand-ink shadow-md"
                        : "bg-white/10 text-white/75 hover:bg-white/20"
                    }`}
                  >
                    {isActive && (
                      <svg
                        viewBox="0 0 44 44"
                        className="pointer-events-none absolute -inset-[2px] h-[48px] w-[48px] -rotate-90"
                      >
                        <circle
                          cx="22"
                          cy="22"
                          r={radius}
                          fill="none"
                          stroke="rgba(255,255,255,0.22)"
                          strokeWidth="2.5"
                        />
                        <circle
                          cx="22"
                          cy="22"
                          r={radius}
                          fill="none"
                          stroke={s.bg}
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeDasharray={circumference}
                          strokeDashoffset={dashOffset}
                        />
                      </svg>
                    )}
                    <span>{s.num}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Full-Bleed Editorial Photo Step Card with Brand-Tinted Scrim */}
          <div
            onMouseEnter={() => setStepPaused(true)}
            onMouseLeave={() => setStepPaused(false)}
            className="relative overflow-hidden rounded-[28px] p-7 text-white shadow-2xl sm:p-10 md:p-12"
            style={{ backgroundColor: currentStep.bg }}
          >
            {/* Background Editorial Photo */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={currentStep.bgImage}
              src={currentStep.bgImage}
              alt={currentStep.imageAlt}
              className="absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-500"
            />
            {/* Directional Brand-Tinted Dark Scrim so copy stays razor sharp */}
            <div
              className="absolute inset-0 transition-all duration-500"
              style={{ background: currentStep.overlay }}
            />

            <div className="relative z-10 grid min-h-[260px] items-center gap-8 md:grid-cols-12">
              <div className="space-y-4 md:col-span-7">
                <span
                  className="inline-block rounded-full px-3.5 py-1 text-xs font-bold backdrop-blur-xs"
                  style={{ backgroundColor: currentStep.pillBg }}
                >
                  Step {currentStep.num} · {currentStep.badge}
                </span>
                <h3 className="font-jakarta text-2xl font-extrabold leading-tight sm:text-4xl">
                  {currentStep.title}
                </h3>
                <p className="max-w-lg text-sm leading-relaxed text-white/90 sm:text-base">
                  {currentStep.body}
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <Link
                    href="/hotels"
                    className="rounded-full !bg-white px-6 py-3 text-xs font-bold !text-[#17243A] shadow-md transition hover:!bg-[#FFD33C]"
                  >
                    Browse Day Stays →
                  </Link>
                  <button
                    type="button"
                    onClick={() => selectStep((activeStep + 1) % STEPS.length)}
                    className="cursor-pointer rounded-full px-4 py-3 text-xs font-bold text-white/90 underline underline-offset-4 hover:text-white"
                  >
                    Next step
                  </button>
                </div>
              </div>

              <div className="hidden justify-end md:col-span-5 md:flex">
                <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-right backdrop-blur-md">
                  <div className="font-jakarta text-4xl font-black leading-none text-white">
                    {currentStep.num}
                  </div>
                  <div className="mt-1 text-[11px] font-bold uppercase tracking-wider text-white/80">
                    {currentStep.badge}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Pill Strip */}
          <div className="no-scrollbar mt-8 flex gap-2.5 overflow-x-auto pb-1">
            {FEATURE_PILLS.map((pill) => (
              <span
                key={pill}
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white/8 px-4 py-2 text-xs font-semibold text-white/90 ring-1 ring-white/10"
              >
                <CheckCircleIcon className="h-3.5 w-3.5 text-[#FFD33C]" />
                {pill}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 4: FOR GUESTS & FOR LAGOS HOTELS (2-Col Network Split)
         ===================================================================== */}
      <section className="mx-auto max-w-6xl px-5 py-16 md:px-6">
        <div className="mb-8 text-center">
          <h2 className="font-jakarta text-2xl font-extrabold tracking-tight text-brand-ink sm:text-3xl">
            Built for Guests &amp; Lagos Hotels
          </h2>
          <p className="mt-2 text-sm text-brand-muted">
            One platform connecting daytime travelers with Lagos&apos;s best rooms.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* For Guests Card — Visual Illustrated Card */}
          <Link
            href="/hotels"
            className="group relative flex min-h-[300px] flex-col justify-end overflow-hidden rounded-[24px] border-2 border-brand-ink bg-night-bg p-7 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl sm:min-h-[340px]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/card-book-stay.svg"
              alt="Book a Day Stay in Lagos"
              className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.03]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(14, 28, 60, 0.05) 35%, rgba(14, 28, 60, 0.86) 100%)",
              }}
            />
            <div className="relative z-10 flex items-end justify-between gap-4">
              <div>
                <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold text-[#FFD33C] backdrop-blur-xs">
                  For Guests
                </span>
                <h3 className="mt-2 font-jakarta text-2xl font-extrabold text-white">
                  Book a Day Stay
                </h3>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full !bg-white px-4 py-2.5 text-xs font-extrabold !text-[#17243A] shadow-md transition group-hover:!bg-[#FFD33C]">
                Explore →
              </span>
            </div>
          </Link>

          {/* For Hotels Card — Visual Illustrated Card */}
          <Link
            href="/login"
            className="group relative flex min-h-[300px] flex-col justify-end overflow-hidden rounded-[24px] border-2 border-brand-ink bg-day-bg p-7 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl sm:min-h-[340px]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/card-partner-hotel.svg?v=2"
              alt="Partner Your Lagos Hotel with Stayside"
              className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.03]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(23, 36, 58, 0.05) 35%, rgba(23, 36, 58, 0.86) 100%)",
              }}
            />
            <div className="relative z-10 flex items-end justify-between gap-4">
              <div>
                <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold text-[#FFD33C] backdrop-blur-xs">
                  For Lagos Hotels
                </span>
                <h3 className="mt-2 font-jakarta text-2xl font-extrabold text-white">
                  Partner Your Hotel
                </h3>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full !bg-white px-4 py-2.5 text-xs font-extrabold !text-[#17243A] shadow-md transition group-hover:!bg-[#FFD33C]">
                Partner Sign In →
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* =====================================================================
          SECTION 5: STAYSIDE EDITORIAL ACCORDION FAQ (Cloud Canvas)
         ===================================================================== */}
      <section className="border-t border-brand-border/70 bg-brand-bg py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-5 md:px-6">
          <div className="grid items-start gap-10 lg:grid-cols-12">
            {/* Left Intro & Contact CTA */}
            <div className="space-y-4 lg:sticky lg:top-24 lg:col-span-4">
              <span className="inline-block rounded-full bg-night-bg px-3 py-1 text-xs font-bold text-brand-primary">
                Common Questions
              </span>
              <h2 className="font-jakarta text-2xl font-extrabold tracking-tight text-brand-ink sm:text-3xl">
                Questions about Lagos Day Stays?
              </h2>
              <p className="text-sm leading-relaxed text-brand-muted">
                Quick answers on how 10am–4pm bookings, Paystack refunds, and hotel partnerships work on Stayside.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full bg-brand-ink px-5 py-2.5 text-xs font-bold text-white transition hover:bg-brand-primary"
              >
                Still have a question? Contact us →
              </Link>
            </div>

            {/* Right Categorized Accordion */}
            <div className="space-y-4 lg:col-span-8">
              <div className="flex flex-wrap gap-2">
                {["All", "Day Stays", "Payments", "For Hotels"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setFaqCategory(cat);
                      setActiveFaq(0);
                    }}
                    className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                      faqCategory === cat
                        ? "bg-brand-primary text-white shadow-xs"
                        : "bg-white text-brand-muted ring-1 ring-brand-border hover:text-brand-ink"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {FAQS.filter(
                  (f) => faqCategory === "All" || f.category === faqCategory
                ).map((item, idx) => {
                  const isOpen = activeFaq === idx;
                  return (
                    <div
                      key={item.q}
                      className={`overflow-hidden rounded-2xl bg-white transition shadow-[0_2px_16px_rgba(23,36,58,0.05)] ${
                        isOpen ? "ring-2 ring-brand-primary/25" : ""
                      }`}
                    >
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() => setActiveFaq(isOpen ? null : idx)}
                        className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left"
                      >
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-accent">
                            {item.category}
                          </span>
                          <h3 className="text-sm font-bold text-brand-ink sm:text-[15px]">
                            {item.q}
                          </h3>
                        </div>
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base font-bold transition ${
                            isOpen
                              ? "bg-brand-primary text-white"
                              : "bg-brand-bg text-brand-ink"
                          }`}
                        >
                          {isOpen ? "−" : "+"}
                        </span>
                      </button>

                      {isOpen && (
                        <div className="border-t border-brand-border/60 px-5 pt-3 pb-5 text-xs leading-relaxed text-brand-muted sm:text-sm">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
