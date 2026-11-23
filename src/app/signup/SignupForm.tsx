"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { claimGuestBookingAction } from "@/app/actions/bookings";
import { normalizeNigerianPhone } from "@/lib/phone";
import { EyeIcon, EyeOffIcon } from "@/components/Icons";
import { SocialAuthButtons } from "@/components/SocialAuthButtons";

export function SignupForm({
  nextPath,
  claimBookingId,
  claimPhone,
  initialName,
}: {
  nextPath?: string;
  claimBookingId?: string;
  claimPhone?: string;
  initialName?: string;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialName ?? "");
  const [phone, setPhone] = useState(claimPhone ?? "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (fullName.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }

    const normalizedPhone = phone.trim() ? normalizeNigerianPhone(phone) : null;
    if (phone.trim() && !normalizedPhone) {
      setError("Enter a valid Nigerian WhatsApp number (e.g. 0803 123 4567).");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          phone: normalizedPhone,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // If session is immediately active (email confirmation disabled), claim booking & redirect
    if (data.session && data.user) {
      if (claimBookingId && (claimPhone || normalizedPhone)) {
        await claimGuestBookingAction(claimBookingId, claimPhone || normalizedPhone || "");
      }
      router.push(nextPath && nextPath.startsWith("/") ? nextPath : "/account");
      router.refresh();
      return;
    }

    // Email confirmation required
    setNotice(
      "Account created! Check your email to confirm your address, then sign in to view your bookings."
    );
    setLoading(false);
  }

  const loginHref =
    claimBookingId && claimPhone
      ? `/login?claim=${encodeURIComponent(claimBookingId)}&phone=${encodeURIComponent(claimPhone)}`
      : nextPath
      ? `/login?next=${encodeURIComponent(nextPath)}`
      : "/login";

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      {claimBookingId && (
        <div className="rounded-xl bg-night-bg px-3.5 py-2.5 text-xs font-medium text-brand-primary">
          Create an account to save booking{" "}
          <strong>#{claimBookingId.slice(0, 8).toUpperCase()}</strong> and track it anytime.
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
          {error}
        </div>
      )}

      {notice && (
        <div className="rounded-xl border border-brand-primary/20 bg-night-bg px-3.5 py-2.5 text-xs text-brand-primary">
          {notice}
        </div>
      )}

      <SocialAuthButtons
        mode="signup"
        nextPath={nextPath}
        claimBookingId={claimBookingId}
        claimPhone={claimPhone}
      />

      <div>
        <label htmlFor="fullName" className="mb-1 block text-xs font-medium text-brand-ink">
          Full Name
        </label>
        <input
          id="fullName"
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Enter your full name"
          className="w-full rounded-full bg-brand-bg px-4 py-3 text-sm text-brand-ink outline-none placeholder:text-brand-muted/70 focus:ring-2 focus:ring-brand-primary/30"
        />
      </div>

      <div>
        <label htmlFor="phone" className="mb-1 block text-xs font-medium text-brand-ink">
          WhatsApp Number (Nigeria)
        </label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="0803 123 4567"
          className="w-full rounded-full bg-brand-bg px-4 py-3 text-sm text-brand-ink outline-none placeholder:text-brand-muted/70 focus:ring-2 focus:ring-brand-primary/30"
        />
      </div>

      <div>
        <label htmlFor="email" className="mb-1 block text-xs font-medium text-brand-ink">
          Email address
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          className="w-full rounded-full bg-brand-bg px-4 py-3 text-sm text-brand-ink outline-none placeholder:text-brand-muted/70 focus:ring-2 focus:ring-brand-primary/30"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-xs font-medium text-brand-ink">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 6 characters"
            className="w-full rounded-full bg-brand-bg py-3 pr-14 pl-4 text-sm text-brand-ink outline-none placeholder:text-brand-muted/70 focus:ring-2 focus:ring-brand-primary/30"
          />
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer text-brand-muted transition hover:text-brand-ink"
          >
            {showPassword ? (
              <EyeIcon className="h-[18px] w-[18px]" />
            ) : (
              <EyeOffIcon className="h-[18px] w-[18px]" />
            )}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-2 w-full cursor-pointer rounded-full bg-brand-ink py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Creating account..." : "Sign Up"}
      </button>

      <p className="pt-2 text-center text-xs text-brand-muted">
        Already have an account?{" "}
        <Link href={loginHref} className="font-semibold text-brand-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
