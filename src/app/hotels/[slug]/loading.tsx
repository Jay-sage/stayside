export default function HotelDetailLoading() {
  return (
    <div className="mx-auto max-w-[1440px] lg:flex lg:min-h-[calc(100vh-64px)]">
      {/* Left Sidebar Skeleton */}
      <div className="space-y-4 border-b border-brand-border/70 px-5 py-6 lg:w-[360px] lg:shrink-0 lg:border-r lg:border-b-0 lg:px-7">
        <div className="h-3 w-36 animate-pulse rounded bg-brand-bg" />
        <div className="aspect-[16/10] w-full animate-pulse rounded-2xl bg-brand-bg" />
        <div className="h-7 w-3/4 animate-pulse rounded-lg bg-brand-bg" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-brand-bg" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-brand-bg" />
      </div>

      {/* Right Storefront Skeleton */}
      <div className="flex-1 space-y-6 px-5 py-6 lg:px-10">
        <div className="h-12 w-full animate-pulse rounded-xl bg-brand-bg" />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 rounded-2xl border border-brand-border/70 p-4"
            >
              <div className="flex-1 space-y-2.5">
                <div className="h-4 w-2/3 animate-pulse rounded bg-brand-bg" />
                <div className="h-3 w-full animate-pulse rounded bg-brand-bg" />
                <div className="h-4 w-1/3 animate-pulse rounded bg-brand-bg" />
              </div>
              <div className="h-28 w-28 shrink-0 animate-pulse rounded-xl bg-brand-bg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
