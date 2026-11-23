"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HeartIcon,
  HomeIcon,
  SearchIcon,
  UserIcon,
} from "@/components/Icons";

export function MobileBottomNav() {
  const pathname = usePathname();

  const isDetailPage =
    pathname.startsWith("/hotels/") && pathname.split("/").length >= 3;
  if (isDetailPage) return null;

  const items = [
    { href: "/", label: "Home", icon: HomeIcon, active: pathname === "/" },
    {
      href: "/hotels",
      label: "Search",
      icon: SearchIcon,
      active: pathname === "/hotels",
    },
    {
      href: "/wishlist",
      label: "Wishlist",
      icon: HeartIcon,
      active: pathname === "/wishlist",
    },
    {
      href: "/account",
      label: "Profile",
      icon: UserIcon,
      active:
        pathname.startsWith("/account") ||
        pathname.startsWith("/login") ||
        pathname.startsWith("/signup") ||
        pathname.startsWith("/hotel") ||
        pathname.startsWith("/admin"),
    },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 bg-white/95 px-6 pt-4 pb-6 shadow-[0_-5px_30px_rgba(23,36,58,0.1)] backdrop-blur md:hidden"
    >
      <div className="mx-auto flex max-w-sm items-center justify-between">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex h-[36px] items-center justify-center gap-[6px] rounded-[20px] transition ${
                item.active
                  ? "bg-night-bg px-[14px] text-brand-primary"
                  : "w-[36px] text-brand-muted hover:text-brand-ink"
              }`}
            >
              <Icon className="h-[21px] w-[21px] shrink-0" />
              {item.active && (
                <span className="text-[12px] font-semibold leading-[1.5]">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
