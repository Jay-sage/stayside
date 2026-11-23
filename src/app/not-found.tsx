import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-20 text-center">
      <span className="rounded-full bg-brand-accent-soft px-3 py-1 text-xs font-semibold text-day-text">
        404 · Not Found
      </span>
      <h1 className="mt-4 text-2xl font-bold text-brand-ink">Page not found</h1>
      <p className="mt-2 text-sm text-brand-muted">
        The hotel or page you&apos;re looking for isn&apos;t available right now.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary-hover"
      >
        Back to Stayside
      </Link>
    </div>
  );
}
