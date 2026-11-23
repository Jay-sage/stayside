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

function AppleLogo() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-[18px] w-[18px]"
      aria-hidden="true"
    >
      <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43Zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45Z" />
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
  const [busyProvider, setBusyProvider] = useState<"google" | "apple" | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  async function handleOAuth(provider: "google" | "apple") {
    setError(null);
    setBusyProvider(provider);

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
      provider,
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });

    if (oauthError) {
      setError(
        oauthError.message ||
          `Could not connect to ${provider === "google" ? "Google" : "Apple"}. Make sure the provider is enabled in Supabase Auth.`
      );
      setBusyProvider(null);
    }
  }

  const prefix = mode === "signup" ? "Sign up with" : "Continue with";

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <button
          type="button"
          disabled={busyProvider !== null}
          onClick={() => handleOAuth("google")}
          className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-full border border-brand-border bg-white px-4 py-2.5 text-xs font-bold text-brand-ink shadow-xs transition hover:border-brand-primary/40 hover:bg-brand-bg disabled:cursor-not-allowed disabled:opacity-60"
        >
          <GoogleLogo />
          <span>
            {busyProvider === "google" ? "Connecting..." : `${prefix} Google`}
          </span>
        </button>

        <button
          type="button"
          disabled={busyProvider !== null}
          onClick={() => handleOAuth("apple")}
          className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-full border border-brand-border bg-brand-ink px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <AppleLogo />
          <span>
            {busyProvider === "apple" ? "Connecting..." : `${prefix} Apple`}
          </span>
        </button>
      </div>

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
