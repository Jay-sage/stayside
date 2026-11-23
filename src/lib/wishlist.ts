"use client";

import { useEffect, useState } from "react";

const WISHLIST_KEY = "stayside_wishlist_v1";
const RECENT_SEARCH_KEY = "stayside_recent_searches_v1";
const WISHLIST_EVENT = "stayside:wishlist-change";

export function readWishlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(WISHLIST_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function toggleWishlistId(hotelId: string): string[] {
  const current = readWishlist();
  const next = current.includes(hotelId)
    ? current.filter((id) => id !== hotelId)
    : [...current, hotelId];
  try {
    window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(WISHLIST_EVENT));
  } catch {
    // Ignore storage errors
  }
  return next;
}

export function useWishlist() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(readWishlist());
    const sync = () => setIds(readWishlist());
    window.addEventListener(WISHLIST_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(WISHLIST_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return {
    ids,
    has: (hotelId: string) => ids.includes(hotelId),
    toggle: (hotelId: string) => {
      const next = toggleWishlistId(hotelId);
      setIds(next);
    },
  };
}

export function readRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCH_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(term: string): string[] {
  const clean = term.trim();
  if (!clean) return readRecentSearches();
  const current = readRecentSearches().filter(
    (s) => s.toLowerCase() !== clean.toLowerCase()
  );
  const next = [clean, ...current].slice(0, 5);
  try {
    window.localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

export function clearRecentSearches(): void {
  try {
    window.localStorage.removeItem(RECENT_SEARCH_KEY);
  } catch {
    // ignore
  }
}
