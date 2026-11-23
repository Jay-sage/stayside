"use client";

import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "@/components/Icons";

const STORAGE_KEY = "stayside-theme";

export function ThemeToggle({
  variant = "header",
}: {
  variant?: "header" | "hero-mobile" | "menu";
}) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    setMounted(true);

    const onSync = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    window.addEventListener("stayside:theme-change", onSync);
    return () => window.removeEventListener("stayside:theme-change", onSync);
  }, []);

  function toggleTheme() {
    const nextDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", nextDark);
    try {
      localStorage.setItem(STORAGE_KEY, nextDark ? "dark" : "light");
    } catch {
      // Ignore storage errors in private browsing
    }
    setIsDark(nextDark);
    window.dispatchEvent(new Event("stayside:theme-change"));
  }

  if (variant === "menu") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className="flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold text-brand-ink transition hover:bg-brand-bg"
      >
        <span className="flex items-center gap-2.5">
          {mounted && isDark ? (
            <SunIcon className="h-4 w-4 text-[#FFD33C]" />
          ) : (
            <MoonIcon className="h-4 w-4 text-brand-primary" />
          )}
          <span>{mounted && isDark ? "Light Mode" : "Dark Mode"}</span>
        </span>
        <span className="rounded-full bg-brand-bg px-2 py-0.5 text-[10px] font-bold text-brand-muted">
          {mounted && isDark ? "ON" : "OFF"}
        </span>
      </button>
    );
  }

  if (variant === "hero-mobile") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-white/25 bg-white/15 text-white backdrop-blur-md transition hover:bg-white/25"
      >
        {mounted && isDark ? (
          <SunIcon className="h-5 w-5 text-[#FFD33C]" />
        ) : (
          <MoonIcon className="h-5 w-5" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-brand-border text-brand-ink transition hover:bg-brand-bg"
    >
      {mounted && isDark ? (
        <SunIcon className="h-4 w-4 text-[#FFD33C]" />
      ) : (
        <MoonIcon className="h-4 w-4" />
      )}
    </button>
  );
}
