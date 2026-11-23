import type { Metadata } from "next";
import Link from "next/link";
import { ContactFormClient } from "@/components/ContactFormClient";
import { BuildingIcon, ClockIcon, PinIcon, SunIcon } from "@/components/Icons";
import { buildWhatsAppUrl } from "@/lib/phone";

export const metadata: Metadata = {
  title: "Contact Stayside — Hotels, On Your Terms.",
  description:
    "Reach the Stayside Lagos team for day-stay guest support or hotel partner onboarding.",
};

export default function ContactPage() {
  const supportWa = buildWhatsAppUrl(
    "+2348000000001",
    "Hello Stayside, I have a question about booking a Lagos day stay."
  );

  return (
    <div className="bg-white">
      {/* Sunlit Hero Header matching Home */}
      <section
        className="border-b border-brand-border/60 py-14 text-center"
        style={{
          background:
            "linear-gradient(180deg, #FFFBF0 0%, #FFF7E6 55%, #EAF0FF 100%)",
        }}
      >
        <div className="mx-auto max-w-2xl px-5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-accent/25 bg-white/90 px-3.5 py-1.5 text-xs font-bold text-brand-ink shadow-xs">
            <SunIcon className="h-4 w-4 text-brand-accent" />
            Stayside Support · Lagos, Nigeria
          </span>
          <h1 className="mt-4 font-jakarta text-3xl font-extrabold tracking-tight text-brand-ink sm:text-5xl">
            Let&apos;s talk.
          </h1>
          <p className="mt-3 text-sm text-brand-ink/75 sm:text-base">
            Need help with a Lagos day stay, a refund, or listing your hotel on Stayside? Reach out anytime.
          </p>
        </div>
      </section>

      {/* Main 2-Column Content */}
      <section className="mx-auto max-w-6xl px-5 py-12 md:px-6 md:py-16">
        <div className="grid items-start gap-8 lg:grid-cols-12">
          {/* Left: Direct Channels */}
          <div className="space-y-4 lg:col-span-5">
            <div className="rounded-[24px] border-2 border-brand-ink bg-night-bg p-6">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary text-white">
                <ClockIcon className="h-5 w-5" />
              </span>
              <h2 className="mt-3.5 font-jakarta text-lg font-extrabold text-brand-ink">
                Fastest: WhatsApp Desk
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-brand-ink/75">
                Message our Lagos support team directly on WhatsApp for quick booking help or hotel checks.
              </p>
              <a
                href={supportWa}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex rounded-full bg-brand-primary px-5 py-2.5 text-xs font-bold text-white transition hover:bg-brand-primary-hover"
              >
                Chat on WhatsApp →
              </a>
            </div>

            <div className="rounded-[24px] border-2 border-brand-ink bg-day-bg p-6">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-accent text-white">
                <BuildingIcon className="h-5 w-5" />
              </span>
              <h2 className="mt-3.5 font-jakarta text-lg font-extrabold text-brand-ink">
                Own a Hotel in Lagos?
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-brand-ink/75">
                Monetise empty 10am–4pm rooms and get a free one-page website at <span className="font-mono font-semibold">yourhotel.stayside.ng</span>.
              </p>
              <Link
                href="/login"
                className="mt-4 inline-flex text-xs font-extrabold uppercase tracking-wider text-day-text hover:underline"
              >
                Partner Portal →
              </Link>
            </div>

            <div className="rounded-2xl bg-brand-bg p-5 text-xs text-brand-muted space-y-2">
              <p className="flex items-center gap-2 font-semibold text-brand-ink">
                <PinIcon className="h-4 w-4 text-brand-primary" />
                Lagos, Nigeria (Ikoyi · Victoria Island · Lekki)
              </p>
              <p>Email: <strong className="text-brand-ink">hello@stayside.ng</strong></p>
              <p>Hours: Daily, 8:00am – 8:00pm WAT (Africa/Lagos)</p>
            </div>
          </div>

          {/* Right: Interactive Form */}
          <div className="lg:col-span-7">
            <ContactFormClient />
          </div>
        </div>
      </section>
    </div>
  );
}
