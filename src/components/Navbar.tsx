import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BellIcon, HeartIcon } from "@/components/Icons";
import { ProfileMenu } from "@/components/ProfileMenu";
import { StaysideLogoMark } from "@/components/StaysideLogo";
import { ThemeToggle } from "@/components/ThemeToggle";

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role = "guest";
  let fullName = "";
  let avatarId = "classic";

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name, avatar_id")
      .eq("id", user.id)
      .single();
    role = profile?.role ?? "guest";
    fullName = profile?.full_name || user.email || "";
    avatarId = profile?.avatar_id || "classic";
  }

  return (
    <header className="sticky top-0 z-30 hidden border-b border-brand-border/70 bg-white/90 backdrop-blur md:block">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <StaysideLogoMark className="h-9 w-9" />
          <span className="font-jakarta text-lg font-extrabold tracking-tight text-brand-ink">
            Stayside
          </span>
        </Link>

        <nav className="flex items-center gap-5 text-sm">
          <Link
            href="/"
            className="font-medium text-brand-muted transition hover:text-brand-ink"
          >
            Home
          </Link>
          <Link
            href="/hotels"
            className="font-medium text-brand-muted transition hover:text-brand-ink"
          >
            Search
          </Link>
          <Link
            href="/wishlist"
            className="inline-flex items-center gap-1.5 font-medium text-brand-muted transition hover:text-brand-ink"
          >
            <HeartIcon className="h-4 w-4" />
            Wishlist
          </Link>
          <Link
            href="/contact"
            className="font-medium text-brand-muted transition hover:text-brand-ink"
          >
            Contact
          </Link>
          <ThemeToggle />

          <Link
            href="/notifications"
            aria-label="Notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-brand-border text-brand-ink transition hover:bg-brand-bg"
          >
            <BellIcon className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-brand-accent" />
          </Link>

          {user ? (
            <ProfileMenu
              fullName={fullName}
              email={user.email ?? ""}
              role={role}
              avatarId={avatarId}
            />
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-full px-3.5 py-2 text-xs font-semibold text-brand-ink transition hover:bg-brand-bg"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-brand-primary px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-brand-primary-hover"
              >
                Sign Up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
