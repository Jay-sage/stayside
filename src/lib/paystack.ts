import crypto from "crypto";

const PAYSTACK_BASE = "https://api.paystack.co";

function getSecretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured in environment variables.");
  }
  return key;
}

export function isPaystackConfigured(): boolean {
  return Boolean(process.env.PAYSTACK_SECRET_KEY?.trim());
}

export function verifyPaystackSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !signature) return false;

  const expected = crypto
    .createHmac("sha512", secret)
    .update(rawBody, "utf8")
    .digest("hex");

  const expectedBuf = Buffer.from(expected, "utf8");
  const sigBuf = Buffer.from(signature, "utf8");
  if (expectedBuf.length !== sigBuf.length) return false;

  return crypto.timingSafeEqual(expectedBuf, sigBuf);
}

export interface InitializeTransactionParams {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
}

export async function initializePaystackTransaction(
  params: InitializeTransactionParams
): Promise<{
  ok: true;
  authorizationUrl: string;
  accessCode: string;
  reference: string;
} | { ok: false; error: string }> {
  const secret = getSecretKey();

  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amountKobo,
      currency: "NGN",
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
    }),
    cache: "no-store",
  });

  const json = (await res.json()) as {
    status: boolean;
    message?: string;
    data?: {
      authorization_url: string;
      access_code: string;
      reference: string;
    };
  };

  if (!res.ok || !json.status || !json.data?.authorization_url) {
    return {
      ok: false,
      error: json.message ?? "Could not initialize Paystack checkout.",
    };
  }

  return {
    ok: true,
    authorizationUrl: json.data.authorization_url,
    accessCode: json.data.access_code,
    reference: json.data.reference,
  };
}

export interface VerifiedPaystackData {
  id: number;
  status: string;
  reference: string;
  amount: number;
  currency: string;
  authorization?: {
    authorization_code?: string;
    brand?: string;
    last4?: string;
    exp_month?: string;
    exp_year?: string;
    bank?: string;
    reusable?: boolean;
  };
}

export async function verifyPaystackTransaction(reference: string): Promise<
  { ok: true; data: VerifiedPaystackData; raw: unknown } | { ok: false; error: string }
> {
  const secret = getSecretKey();

  const res = await fetch(
    `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${secret}`,
      },
      cache: "no-store",
    }
  );

  const json = (await res.json()) as {
    status: boolean;
    message?: string;
    data?: VerifiedPaystackData;
  };

  if (!res.ok || !json.status || !json.data) {
    return { ok: false, error: json.message ?? "Failed to verify Paystack transaction." };
  }

  return { ok: true, data: json.data, raw: json };
}

/**
 * Paystack Refund helper (used in Stage 3 when a hotel declines or cancels a paid booking).
 */
export async function refundPaystackTransaction(params: {
  transaction: string;
  amountKobo?: number;
  merchantNote?: string;
}): Promise<{ ok: true; raw: unknown } | { ok: false; error: string }> {
  const secret = getSecretKey();

  const res = await fetch(`${PAYSTACK_BASE}/refund`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      transaction: params.transaction,
      ...(params.amountKobo ? { amount: params.amountKobo } : {}),
      ...(params.merchantNote ? { merchant_note: params.merchantNote } : {}),
    }),
    cache: "no-store",
  });

  const json = (await res.json()) as { status: boolean; message?: string };
  if (!res.ok || !json.status) {
    return { ok: false, error: json.message ?? "Paystack refund request failed." };
  }

  return { ok: true, raw: json };
}
