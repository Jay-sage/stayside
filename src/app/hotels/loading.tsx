export default function HotelsLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-5 py-8 md:px-6">
      <div className="h-14 w-full animate-pulse rounded-2xl bg-brand-bg" />
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-9 w-24 animate-pulse rounded-full bg-brand-bg"
          />
        ))}
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="dark-card-surface overflow-hidden rounded-2xl bg-white p-3 shadow-xs"
          >
            <div className="h-44 w-full animate-pulse rounded-xl bg-brand-bg" />
            <div className="mt-3 space-y-2">
              <div className="h-4 w-2/3 animate-pulse rounded bg-brand-bg" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-brand-bg" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-brand-bg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
