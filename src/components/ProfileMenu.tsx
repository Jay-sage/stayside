"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ProfileAvatar } from "@/components/ProfileAvatar";

interface ProfileMenuProps {
  fullName: string;
  email: string;
  role: string;
  avatarId: string;
}

export function ProfileMenu({
  fullName,
  email,
  role,
  avatarId,
}: ProfileMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const firstName = (fullName || email.split("@")[0] || "there").split(" ")[0];

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Open account menu"
        className="flex cursor-pointer items-center justify-center rounded-full p-0.5 ring-2 ring-transparent transition hover:ring-brand-primary/30 focus:outline-none focus:ring-brand-primary"
      >
        <ProfileAvatar avatarId={avatarId} size="sm" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2.5 w-60 overflow-hidden rounded-2xl border border-brand-border bg-white p-2 shadow-[0_14px_40px_rgba(23,36,58,0.14)]"
        >
          {/* Greeting header */}
          <div className="mb-1.5 rounded-xl bg-brand-bg px-3.5 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate font-jakarta text-sm font-bold text-brand-ink">
                Hi, {firstName}
              </p>
              <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold capitalize text-brand-primary">
                {role.replace("_", " ")}
              </span>
            </div>
            <p className="mt-0.5 truncate text-[11px] text-brand-muted">{email}</p>
          </div>

          {/* Role-specific portal shortcut */}
          {role === "super_admin" && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="mb-1 flex items-center justify-between rounded-xl bg-night-bg px-3.5 py-2 text-xs font-bold text-brand-primary transition hover:bg-brand-primary hover:text-white"
            >
              <span>Super Admin Dashboard</span>
              <span>→</span>
            </Link>
          )}

          {role === "hotel_admin" && (
            <Link
              href="/hotel"
              onClick={() => setOpen(false)}
              className="mb-1 flex items-center justify-between rounded-xl bg-night-bg px-3.5 py-2 text-xs font-bold text-brand-primary transition hover:bg-brand-primary hover:text-white"
            >
              <span>Hotel Admin Portal</span>
              <span>→</span>
            </Link>
          )}

          {/* Profile navigation items */}
          <div className="space-y-0.5 text-xs font-medium text-brand-ink">
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3.5 py-2 transition hover:bg-brand-bg"
            >
              My Profile
            </Link>
            <Link
              href="/account/bookings"
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3.5 py-2 transition hover:bg-brand-bg"
            >
              My Bookings
            </Link>
            <Link
              href="/account/payment-methods"
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3.5 py-2 transition hover:bg-brand-bg"
            >
              Payment Methods
            </Link>
            <Link
              href="/wishlist"
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3.5 py-2 transition hover:bg-brand-bg"
            >
              Wishlist
            </Link>
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3.5 py-2 transition hover:bg-brand-bg"
            >
              Notifications
            </Link>
          </div>

          <div className="mt-1.5 border-t border-brand-border/80 pt-1.5">
            <button
              type="button"
              disabled={signingOut}
              onClick={handleSignOut}
              className="w-full cursor-pointer rounded-xl px-3.5 py-2 text-left text-xs font-semibold text-brand-accent transition hover:bg-day-bg disabled:opacity-50"
            >
              {signingOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
