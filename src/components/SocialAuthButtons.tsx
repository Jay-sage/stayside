"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 0 0 0 10.76l3.98-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96Z"
      />
    </svg>
  );
}

export function SocialAuthButtons({
  mode,
  nextPath,
  claimBookingId,
  claimPhone,
}: {
  mode: "login" | "signup";
  nextPath?: string;
  claimBookingId?: string;
  claimPhone?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleOAuth() {
    setError(null);
    setBusy(true);

    const supabase = createClient();
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    if (nextPath && nextPath.startsWith("/")) {
      callbackUrl.searchParams.set("next", nextPath);
    }
    if (claimBookingId && claimPhone) {
      callbackUrl.searchParams.set("claim", claimBookingId);
      callbackUrl.searchParams.set("phone", claimPhone);
    }

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });

    if (oauthError) {
      setError(
        oauthError.message ||
          "Could not connect to Google. Make sure Google sign-in is enabled in Supabase Auth."
      );
      setBusy(false);
    }
  }

  const label = mode === "signup" ? "Sign up with Google" : "Continue with Google";

  return (
    <div className="space-y-2.5">
      <button
        type="button"
        disabled={busy}
        onClick={handleGoogleOAuth}
        className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-full border border-brand-border bg-white px-4 py-3 text-xs font-bold text-brand-ink shadow-xs transition hover:border-brand-primary/40 hover:bg-brand-bg disabled:cursor-not-allowed disabled:opacity-60"
      >
        <GoogleLogo />
        <span>{busy ? "Connecting to Google..." : label}</span>
      </button>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-medium text-red-700">
          {error}
        </p>
      )}

      <div className="relative flex items-center py-1.5">
        <div className="flex-1 border-t border-brand-border" />
        <span className="px-3 text-[11px] font-medium text-brand-muted">
          or continue with email
        </span>
        <div className="flex-1 border-t border-brand-border" />
      </div>
    </div>
  );
}
