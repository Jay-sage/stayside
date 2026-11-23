import Link from "next/link";
import { StaysideLogoMark } from "@/components/StaysideLogo";

export function Footer() {
  return (
    <footer className="bg-[#0D1524] text-white">
      <div className="mx-auto max-w-6xl px-5 pt-10 pb-28 md:px-6 md:pt-14 md:pb-12">
        {/* Closing CTA Banner with Custom Lagos Rooftop Artwork */}
        <div className="relative mb-12 overflow-hidden rounded-[28px] border border-white/10 bg-[#1B357A] p-7 shadow-2xl sm:p-10 md:min-h-[300px] md:p-12">
          {/* Full-bleed artwork aligned right so pool, bridge & couple stay unobstructed */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/footer-lagos.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover object-right"
          />

          {/* Directional left-to-right scrim: crisp readability on left, vibrant artwork on right */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(95deg, rgba(13, 25, 56, 0.88) 0%, rgba(20, 42, 92, 0.72) 44%, rgba(20, 42, 92, 0.16) 76%, rgba(13, 25, 56, 0.05) 100%)",
            }}
          />

          <div className="relative z-10 flex max-w-lg flex-col items-start gap-5">
            <div className="space-y-2.5">
              <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-[#FFD33C] backdrop-blur-xs">
                Lagos Day Stays · 10am – 4pm
              </span>
              <h2 className="font-jakarta text-2xl font-extrabold tracking-tight text-white drop-shadow-xs sm:text-3xl">
                Your Lagos hotel room is waiting.
              </h2>
              <p className="text-xs leading-relaxed text-white/85 sm:text-sm">
                Hotels, On Your Terms. Browse verified Ikoyi, Victoria Island, and Lekki stays—book in seconds with no account required.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href="/hotels"
                className="inline-flex items-center gap-2 rounded-full !bg-white px-6 py-3.5 text-sm font-bold !text-[#17243A] shadow-md transition hover:!bg-[#FFD33C]"
              >
                Browse Listings →
              </Link>
              <Link
                href="/login"
                className="rounded-full bg-white/15 px-5 py-3.5 text-xs font-semibold text-white backdrop-blur-xs transition hover:bg-white/25"
              >
                Partner Portal
              </Link>
            </div>
          </div>
        </div>

        {/* Minimal Footer Links Row */}
        <div className="flex flex-col items-start justify-between gap-6 border-t border-white/10 pt-8 md:flex-row md:items-center">
          <Link href="/" className="flex items-center gap-2.5">
            <StaysideLogoMark className="h-9 w-9" />
            <div>
              <div className="font-jakarta text-base font-extrabold leading-none text-white">
                Stayside
              </div>
              <div className="mt-1 text-[11px] text-white/60">
                Hotels, On Your Terms.
              </div>
            </div>
          </Link>

          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-white/75">
            <Link href="/hotels" className="transition hover:text-white">
              Browse Listings
            </Link>
            <Link href="/wishlist" className="transition hover:text-white">
              Wishlist
            </Link>
            <Link href="/account" className="transition hover:text-white">
              My Bookings
            </Link>
            <Link href="/contact" className="transition hover:text-white">
              Contact Us
            </Link>
            <Link href="/login" className="transition hover:text-white">
              Partner Sign In
            </Link>
          </nav>
        </div>

        {/* Bottom Copyright & Xlay Credit */}
        <div className="mt-8 flex flex-col items-start justify-between gap-2 border-t border-white/10 pt-5 text-[11px] text-white/50 sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} Stayside · Built by{" "}
            <span className="font-semibold text-white/85">Xlay</span>
          </p>
          <p>Lagos, Nigeria · Currency: NGN (₦)</p>
        </div>
      </div>
    </footer>
  );
}
