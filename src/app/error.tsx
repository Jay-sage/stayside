"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-5 py-16 text-center">
      <div className="dark-card-surface w-full rounded-3xl bg-white p-8 shadow-sm">
        <span className="inline-block rounded-full bg-day-bg px-3 py-1 text-xs font-bold text-day-text">
          Something went wrong
        </span>
        <h1 className="mt-4 font-jakarta text-2xl font-extrabold text-brand-ink">
          We couldn&apos;t load this page
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-brand-muted">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="cursor-pointer rounded-full bg-brand-primary px-6 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-brand-primary-hover"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="rounded-full border border-brand-border px-5 py-2.5 text-xs font-semibold text-brand-ink transition hover:bg-brand-bg"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
