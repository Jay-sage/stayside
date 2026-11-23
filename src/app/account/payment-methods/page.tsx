import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChevronLeftIcon } from "@/components/Icons";
import { SavedCardCarousel } from "@/components/SavedCardCarousel";
import type { SavedCard } from "@/types/database";

export default async function PaymentMethodsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/account/payment-methods");
  }

  const { data: rawCards } = await supabase
    .from("saved_cards")
    .select("id, brand, last4, exp_month, exp_year, bank, cardholder_name, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-xl px-5 pt-5 pb-16 md:py-10">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/account"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-border bg-white text-brand-ink transition hover:bg-brand-bg"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="font-jakarta text-lg font-bold text-brand-ink">
          Payment Methods
        </h1>
        <span className="w-10" />
      </div>

      <SavedCardCarousel initialCards={(rawCards ?? []) as SavedCard[]} />
    </div>
  );
}
