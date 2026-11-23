"use client";

import { useEffect, useState } from "react";
import { BuildingIcon, CheckCircleIcon, PinIcon } from "@/components/Icons";

const ONBOARD_KEY = "stayside_onboarded_v1";

const SLIDES = [
  {
    title: "Day-Stay Hotels Across Lagos",
    body: "Book curated hotel rooms for the day (10am–4pm) across Ikoyi, Victoria Island, and Lekki—at a fraction of overnight rates.",
    icon: PinIcon,
    badge: "Lagos Day Stays",
  },
  {
    title: "Smooth Booking, Seamless Experience",
    body: "Browse verified partner hotels, compare daytime rates, pick your date, and reserve in seconds.",
    icon: BuildingIcon,
    badge: "10am – 4pm Windows",
  },
  {
    title: "Hotels, On Your Terms.",
    body: "Book immediately as a guest or sign in before or after to track your bookings and message hotels on WhatsApp.",
    icon: CheckCircleIcon,
    badge: "Built by Xlay",
  },
];

export function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      const seen = window.localStorage.getItem(ONBOARD_KEY);
      if (!seen) setOpen(true);
    } catch {
      // ignore
    }
  }, []);

  function dismiss() {
    try {
      window.localStorage.setItem(ONBOARD_KEY, "1");
    } catch {
      // ignore
    }
    setOpen(false);
  }

  if (!open) return null;

  const slide = SLIDES[step];
  const Icon = slide.icon;
  const isLast = step === SLIDES.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-[28px] bg-white px-7 py-9 text-center shadow-2xl">
        <div
          className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl text-white shadow-[0_14px_32px_rgba(36,87,214,0.3)]"
          style={{
            background: "linear-gradient(135deg, #2457D6 0%, #4E86F7 100%)",
          }}
        >
          <Icon className="h-11 w-11" />
        </div>

        <span className="mt-6 inline-block rounded-full bg-day-bg px-3 py-1 text-[11px] font-semibold text-day-text">
          {slide.badge}
        </span>

        <h2 className="mt-3 font-jakarta text-xl font-bold leading-snug text-brand-ink">
          {slide.title}
        </h2>
        <p className="mt-2.5 text-xs leading-relaxed text-brand-muted">
          {slide.body}
        </p>

        {/* Dots */}
        <div className="mt-6 flex items-center justify-center gap-1.5">
          {SLIDES.map((_, idx) => (
            <span
              key={idx}
              className={`h-1.5 rounded-full transition-all ${
                idx === step ? "w-6 bg-brand-primary" : "w-1.5 bg-brand-border"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => (isLast ? dismiss() : setStep((s) => s + 1))}
          className="mt-6 w-full cursor-pointer rounded-full bg-brand-ink py-3.5 text-sm font-semibold text-white transition hover:bg-brand-primary"
        >
          {isLast ? "Get Started" : "Next"}
        </button>

        <button
          type="button"
          onClick={dismiss}
          className="mt-3 cursor-pointer text-xs font-medium text-brand-muted hover:text-brand-ink"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
