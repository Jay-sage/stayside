"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SavedCard } from "@/types/database";

export function SavedCardCarousel({
  initialCards,
}: {
  initialCards: SavedCard[];
}) {
  const [cards, setCards] = useState<SavedCard[]>(initialCards);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleRemove(id: string) {
    setRemovingId(id);
    const supabase = createClient();
    const { error } = await supabase.from("saved_cards").delete().eq("id", id);
    if (!error) {
      setCards((prev) => prev.filter((c) => c.id !== id));
    }
    setRemovingId(null);
  }

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-brand-ink">Saved Cards</h3>
        <span className="text-[11px] font-medium text-brand-muted">
          Secured by Paystack
        </span>
      </div>

      {cards.length === 0 ? (
        <div className="rounded-2xl bg-brand-ink p-5 text-white shadow-[0_8px_28px_rgba(23,36,58,0.14)]">
          <div
            className="relative overflow-hidden rounded-2xl p-5"
            style={{
              background: "linear-gradient(135deg, #2457D6 0%, #3E73F5 60%, #FF7138 140%)",
            }}
          >
            <div className="flex items-center justify-between">
              <span className="font-jakarta text-lg font-extrabold tracking-wide">
                VISA
              </span>
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                Paystack Tokenized
              </span>
            </div>

            <div className="mt-5 font-mono text-base tracking-[0.2em] text-white/95">
              4084 &nbsp;**** &nbsp;**** &nbsp;4081
            </div>

            <div className="mt-5 flex items-end justify-between text-xs">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/70">
                  Card Holder
                </p>
                <p className="mt-0.5 font-semibold">Saved after first Paystack checkout</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-white/70">
                  Expires
                </p>
                <p className="mt-0.5 font-semibold">--/--</p>
              </div>
            </div>
          </div>

          <p className="mt-3 text-[11px] text-white/65">
            Cards are automatically saved after a successful Paystack payment. We never store raw card numbers or CVVs.
          </p>
        </div>
      ) : (
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
          {cards.map((card, idx) => (
            <div
              key={card.id}
              className="w-[300px] shrink-0 overflow-hidden rounded-2xl p-5 text-white shadow-[0_10px_30px_rgba(36,87,214,0.22)]"
              style={{
                background:
                  idx % 2 === 0
                    ? "linear-gradient(135deg, #2457D6 0%, #3E73F5 70%, #17243A 130%)"
                    : "linear-gradient(135deg, #17243A 0%, #2457D6 85%, #FF7138 140%)",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-jakarta text-lg font-extrabold uppercase tracking-wide">
                  {card.brand}
                </span>
                <button
                  type="button"
                  disabled={removingId === card.id}
                  onClick={() => handleRemove(card.id)}
                  className="cursor-pointer rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-semibold text-white/90 transition hover:bg-white/25"
                >
                  {removingId === card.id ? "..." : "Remove"}
                </button>
              </div>

              <div className="mt-5 font-mono text-base tracking-[0.2em]">
                **** &nbsp;**** &nbsp;**** &nbsp;{card.last4}
              </div>

              <div className="mt-5 flex items-end justify-between text-xs">
                <div className="min-w-0 pr-3">
                  <p className="text-[10px] uppercase tracking-wider text-white/70">
                    Card Holder
                  </p>
                  <p className="mt-0.5 truncate font-semibold">
                    {card.cardholder_name || card.bank || "Stayside Guest"}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[10px] uppercase tracking-wider text-white/70">
                    Expires
                  </p>
                  <p className="mt-0.5 font-semibold">
                    {card.exp_month}/{card.exp_year.slice(-2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
