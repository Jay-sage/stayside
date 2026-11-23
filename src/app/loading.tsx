export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl space-y-10 px-5 py-10 md:px-6">
      {/* Hero Skeleton */}
      <div className="h-[360px] w-full animate-pulse rounded-3xl bg-brand-bg sm:h-[420px]" />

      {/* Featured Cards Skeleton */}
      <div className="space-y-4">
        <div className="h-6 w-56 animate-pulse rounded-lg bg-brand-bg" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="dark-card-surface overflow-hidden rounded-2xl bg-white p-3 shadow-xs"
            >
              <div className="h-44 w-full animate-pulse rounded-xl bg-brand-bg" />
              <div className="mt-3 space-y-2">
                <div className="h-4 w-3/4 animate-pulse rounded bg-brand-bg" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-brand-bg" />
                <div className="h-4 w-1/3 animate-pulse rounded bg-brand-bg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
