import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { verifyPaystackTransaction } from "@/lib/paystack";
import { buildWhatsAppUrl } from "@/lib/phone";
import { CheckCircleIcon } from "@/components/Icons";
import { formatNaira, formatTimeShort } from "@/types/database";

interface ConfirmedPayload {
  booking_id: string;
  hotel_name: string;
  hotel_slug: string;
  hotel_whatsapp: string;
  room_name: string;
  guest_name: string;
  guest_phone: string;
  linked_to_user: boolean;
  booking_type: string;
  check_in_date: string;
  check_out_date: string | null;
  amount_ngn: number;
  day_start: string;
  day_end: string;
}

export default async function PaymentCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  const params = await searchParams;
  const reference = params.reference || params.trxref;

  if (!reference) {
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <div className="rounded-[28px] bg-white p-8 shadow-[0_12px_40px_rgba(23,36,58,0.08)]">
          <h1 className="font-jakarta text-xl font-bold text-brand-ink">
            Missing payment reference
          </h1>
          <p className="mt-2 text-xs text-brand-muted">
            We couldn&apos;t find a payment reference to verify.
          </p>
          <Link
            href="/hotels"
            className="mt-6 inline-flex rounded-full bg-brand-primary px-6 py-3 text-xs font-semibold text-white"
          >
            Browse Hotels
          </Link>
        </div>
      </div>
    );
  }

  let verifiedError: string | null = null;
  let confirmed: ConfirmedPayload | null = null;

  try {
    const verification = await verifyPaystackTransaction(reference);
    if (!verification.ok || verification.data.status !== "success") {
      verifiedError = verification.ok
        ? `Payment status: ${verification.data.status}. No money was captured.`
        : verification.error;
    } else {
      const supabase = await createClient();
      const auth = verification.data.authorization;
      const isReusable = Boolean(auth?.reusable && auth?.authorization_code);

      const { data, error } = await supabase.rpc("confirm_paystack_payment", {
        p_reference: reference,
        p_paystack_transaction_id: String(verification.data.id),
        p_amount_kobo: verification.data.amount,
        p_raw_event: verification.raw,
        p_auth_code: isReusable ? auth?.authorization_code ?? null : null,
        p_card_brand: isReusable ? auth?.brand ?? null : null,
        p_card_last4: isReusable ? auth?.last4 ?? null : null,
        p_card_exp_month: isReusable ? auth?.exp_month ?? null : null,
        p_card_exp_year: isReusable ? auth?.exp_year ?? null : null,
        p_card_bank: isReusable ? auth?.bank ?? null : null,
      });

      const res = data as ({ ok: boolean; error?: string } & Partial<ConfirmedPayload>) | null;
      if (error || !res?.ok || !res.booking_id) {
        verifiedError = res?.error ?? "Could not confirm booking payment.";
      } else {
        confirmed = res as ConfirmedPayload;
      }
    }
  } catch (err) {
    verifiedError =
      err instanceof Error ? err.message : "Payment verification failed.";
  }

  if (verifiedError || !confirmed) {
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <div className="rounded-[28px] bg-white p-8 shadow-[0_12px_40px_rgba(23,36,58,0.08)]">
          <span className="inline-block rounded-full bg-day-bg px-3 py-1 text-xs font-semibold text-day-text">
            Payment Not Completed
          </span>
          <h1 className="mt-3 font-jakarta text-xl font-bold text-brand-ink">
            We couldn&apos;t confirm your payment
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-brand-muted">
            {verifiedError ?? "Your payment was cancelled or failed. Your slot will be released automatically."}
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <Link
              href="/hotels"
              className="w-full rounded-full bg-brand-primary py-3 text-xs font-semibold text-white transition hover:bg-brand-primary-hover"
            >
              Retry Booking
            </Link>
            <Link
              href="/"
              className="w-full rounded-full border border-brand-border py-3 text-xs font-semibold text-brand-ink transition hover:bg-brand-bg"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const shortRef = confirmed.booking_id.slice(0, 8).toUpperCase();
  const stayDesc =
    confirmed.booking_type === "day"
      ? `Day Stay (${formatTimeShort(confirmed.day_start)}–${formatTimeShort(confirmed.day_end)}) on ${confirmed.check_in_date}`
      : `Night Stay (${confirmed.check_in_date} to ${confirmed.check_out_date})`;

  const waUrl = buildWhatsAppUrl(
    confirmed.hotel_whatsapp,
    [
      `Hello ${confirmed.hotel_name},`,
      `I just paid for a booking on Stayside (Ref: #${shortRef}).`,
      `• Name: ${confirmed.guest_name}`,
      `• Room: ${confirmed.room_name}`,
      `• Stay: ${stayDesc}`,
      `• Paid: ${formatNaira(confirmed.amount_ngn)}`,
      `Please confirm my reservation. Thank you!`,
    ].join("\n")
  );

  return (
    <div className="mx-auto max-w-md px-5 py-12">
      <div className="rounded-[28px] bg-white p-7 shadow-[0_12px_48px_rgba(23,36,58,0.1)]">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-night-bg text-brand-primary">
            <CheckCircleIcon className="h-6 w-6" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary">
              Payment Verified · #{shortRef}
            </p>
            <h1 className="font-jakarta text-xl font-bold text-brand-ink">
              Booking Requested
            </h1>
          </div>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-brand-muted">
          Your payment has been received. <strong>{confirmed.hotel_name}</strong> will confirm your stay shortly (declined bookings are automatically refunded).
        </p>

        <div className="mt-4 space-y-2 rounded-2xl bg-brand-bg p-4 text-xs">
          <div className="flex justify-between">
            <span className="text-brand-muted">Hotel</span>
            <span className="font-semibold text-brand-ink">{confirmed.hotel_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-brand-muted">Room</span>
            <span className="font-semibold text-brand-ink">{confirmed.room_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-brand-muted">Stay</span>
            <span className="font-semibold text-brand-ink">{stayDesc}</span>
          </div>
          <div className="flex justify-between border-t border-brand-border pt-2">
            <span className="font-semibold text-brand-ink">Paid via Paystack</span>
            <span className="text-sm font-bold text-brand-primary">
              {formatNaira(confirmed.amount_ngn)}
            </span>
          </div>
        </div>

        <div className="mt-5 space-y-2.5">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center rounded-full bg-brand-primary py-3 text-sm font-semibold text-white transition hover:bg-brand-primary-hover"
          >
            Message the hotel on WhatsApp
          </a>

          {confirmed.linked_to_user ? (
            <Link
              href="/account"
              className="flex w-full items-center justify-center rounded-full bg-night-bg py-2.5 text-xs font-semibold text-brand-primary"
            >
              View in My Bookings
            </Link>
          ) : (
            <div className="rounded-2xl bg-brand-bg p-3.5 text-xs">
              <p className="font-semibold text-brand-ink">
                Save this booking to a Stayside account
              </p>
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <Link
                  href={`/signup?claim=${encodeURIComponent(confirmed.booking_id)}&phone=${encodeURIComponent(confirmed.guest_phone)}&name=${encodeURIComponent(confirmed.guest_name)}`}
                  className="flex items-center justify-center rounded-full bg-brand-ink py-2 text-xs font-semibold text-white"
                >
                  Create Account
                </Link>
                <Link
                  href={`/login?claim=${encodeURIComponent(confirmed.booking_id)}&phone=${encodeURIComponent(confirmed.guest_phone)}`}
                  className="flex items-center justify-center rounded-full border border-brand-border bg-white py-2 text-xs font-semibold text-brand-ink"
                >
                  Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
