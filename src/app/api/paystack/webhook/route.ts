import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyPaystackSignature } from "@/lib/paystack";

interface PaystackWebhookEvent {
  event: string;
  data?: {
    id?: number | string;
    reference?: string;
    amount?: number;
    status?: string;
    authorization?: {
      authorization_code?: string;
      brand?: string;
      last4?: string;
      exp_month?: string;
      exp_year?: string;
      bank?: string;
      reusable?: boolean;
    };
  };
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyPaystackSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: PaystackWebhookEvent;
  try {
    payload = JSON.parse(rawBody) as PaystackWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (payload.event === "charge.success" && payload.data?.reference) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const auth = payload.data.authorization;
    const isReusable = Boolean(auth?.reusable && auth?.authorization_code);

    const { error } = await supabase.rpc("confirm_paystack_payment", {
      p_reference: payload.data.reference,
      p_paystack_transaction_id: String(payload.data.id ?? ""),
      p_amount_kobo: Number(payload.data.amount ?? 0),
      p_raw_event: payload,
      p_auth_code: isReusable ? auth?.authorization_code ?? null : null,
      p_card_brand: isReusable ? auth?.brand ?? null : null,
      p_card_last4: isReusable ? auth?.last4 ?? null : null,
      p_card_exp_month: isReusable ? auth?.exp_month ?? null : null,
      p_card_exp_year: isReusable ? auth?.exp_year ?? null : null,
      p_card_bank: isReusable ? auth?.bank ?? null : null,
    });

    if (error) {
      return NextResponse.json({ error: "Confirmation failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
