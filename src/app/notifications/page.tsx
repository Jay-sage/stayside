import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  BellIcon,
  CalendarIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
} from "@/components/Icons";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let bookingAlerts: {
    id: string;
    title: string;
    body: string;
    time: string;
  }[] = [];

  if (user) {
    const { data } = await supabase
      .from("bookings")
      .select("id, status, booking_type, check_in_date, created_at, hotels(name)")
      .eq("guest_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    bookingAlerts = (data ?? []).map((b) => {
      const hotel = Array.isArray(b.hotels) ? b.hotels[0] : b.hotels;
      const hotelName = hotel?.name ?? "your hotel";
      return {
        id: b.id,
        title:
          b.status === "confirmed"
            ? "Booking Confirmed"
            : b.status === "declined"
            ? "Booking Declined"
            : "Booking Request Sent",
        body: `Your ${b.booking_type} stay at ${hotelName} for ${b.check_in_date} is currently ${b.status}.`,
        time: new Date(b.created_at).toLocaleDateString("en-NG", {
          month: "short",
          day: "numeric",
        }),
      };
    });
  }

  return (
    <div className="mx-auto max-w-xl px-5 pt-5 pb-16 md:py-10">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-border bg-white text-brand-ink transition hover:bg-brand-bg"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="font-jakarta text-lg font-bold text-brand-ink">
          Notification
        </h1>
        <span className="w-10" />
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-brand-muted">
            Today
          </h2>
          <div className="space-y-2.5">
            {bookingAlerts.length > 0 ? (
              bookingAlerts.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3.5 rounded-2xl bg-white p-4 shadow-[0_4px_22px_rgba(23,36,58,0.06)]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-night-bg text-brand-primary">
                    <CheckCircleIcon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-brand-ink">
                        {item.title}
                      </p>
                      <span className="shrink-0 text-[11px] text-brand-muted">
                        {item.time}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-brand-muted">{item.body}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-start gap-3.5 rounded-2xl bg-white p-4 shadow-[0_4px_22px_rgba(23,36,58,0.06)]">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-night-bg text-brand-primary">
                  <CalendarIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-brand-ink">
                    Day Stays Now Live in Lagos
                  </p>
                  <p className="mt-0.5 text-xs text-brand-muted">
                    Book 10am–4pm daytime rooms across Ikoyi, Victoria Island, and Lekki Phase 1.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-brand-muted">
            Earlier
          </h2>
          <div className="space-y-2.5">
            <div className="flex items-start gap-3.5 rounded-2xl bg-white p-4 shadow-[0_4px_22px_rgba(23,36,58,0.06)]">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-day-bg text-brand-accent">
                <BellIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-brand-ink">
                  Welcome to Stayside — Hotels, On Your Terms.
                </p>
                <p className="mt-0.5 text-xs text-brand-muted">
                  Book directly with verified Lagos partner hotels, or sign in to save and track all your stays.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
