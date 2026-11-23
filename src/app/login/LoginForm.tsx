"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { claimGuestBookingAction } from "@/app/actions/bookings";
import { EyeIcon, EyeOffIcon } from "@/components/Icons";
import { SocialAuthButtons } from "@/components/SocialAuthButtons";

export function LoginForm({
  nextPath,
  claimBookingId,
  claimPhone,
}: {
  nextPath?: string;
  claimBookingId?: string;
  claimPhone?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError || !data.user) {
      setError(signInError?.message ?? "Sign in failed. Please check your credentials.");
      setLoading(false);
      return;
    }

    // If the user came from a post-booking confirmation, link that booking to their account
    if (claimBookingId && claimPhone) {
      await claimGuestBookingAction(claimBookingId, claimPhone);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    const role = profile?.role;
    let destination = "/account";
    if (role === "super_admin") {
      destination =
        nextPath === "/admin" || nextPath?.startsWith("/admin/") ? nextPath : "/admin";
    } else if (role === "hotel_admin") {
      destination =
        nextPath === "/hotel" || nextPath?.startsWith("/hotel/") ? nextPath : "/hotel";
    } else if (nextPath && nextPath.startsWith("/")) {
      destination = nextPath;
    }

    router.push(destination);
    router.refresh();
  }

  const signupHref =
    claimBookingId && claimPhone
      ? `/signup?claim=${encodeURIComponent(claimBookingId)}&phone=${encodeURIComponent(claimPhone)}`
      : nextPath
      ? `/signup?next=${encodeURIComponent(nextPath)}`
      : "/signup";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {claimBookingId && (
        <div className="rounded-xl bg-night-bg px-3.5 py-2.5 text-xs font-medium text-brand-primary">
          Sign in to save booking <strong>#{claimBookingId.slice(0, 8).toUpperCase()}</strong> to your account.
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
          {error}
        </div>
      )}

      <SocialAuthButtons
        mode="login"
        nextPath={nextPath}
        claimBookingId={claimBookingId}
        claimPhone={claimPhone}
      />

      <div>
        <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-brand-ink">
          Email address
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-full bg-brand-bg px-4 py-3 text-sm text-brand-ink outline-none transition placeholder:text-brand-muted/70 focus:ring-2 focus:ring-brand-primary/30"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-brand-ink">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-full bg-brand-bg py-3 pr-14 pl-4 text-sm text-brand-ink outline-none transition placeholder:text-brand-muted/70 focus:ring-2 focus:ring-brand-primary/30"
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

      <div className="flex items-center justify-between pt-0.5 text-xs">
        <label className="flex cursor-pointer items-center gap-2 text-brand-muted">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-3.5 w-3.5 rounded accent-brand-primary"
          />
          Remember me
        </label>
        <span className="font-medium text-brand-primary">Hotels, On Your Terms.</span>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-2 w-full cursor-pointer rounded-full bg-brand-ink py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Logging in..." : "Log in"}
      </button>

      <p className="pt-2 text-center text-xs text-brand-muted">
        Don&apos;t have an account?{" "}
        <Link href={signupHref} className="font-semibold text-brand-primary hover:underline">
          Sign Up
        </Link>
      </p>
    </form>
  );
}
