"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizeNigerianPhone } from "@/lib/phone";
import type { HotelPlan, HotelStatus } from "@/types/database";

async function requireSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false as const, error: "Not authenticated." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin") {
    return { ok: false as const, error: "Super admin access required." };
  }

  return { ok: true as const, supabase, user };
}

function revalidateAll() {
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/hotels");
}

export async function updateHotelStatusAction(
  hotelId: string,
  status: HotelStatus
): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.supabase
    .from("hotels")
    .update({ status })
    .eq("id", hotelId);

  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

export async function updateHotelPlanAndCommissionAction(
  hotelId: string,
  plan: HotelPlan,
  commissionRate: number
): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (Number.isNaN(commissionRate) || commissionRate < 0 || commissionRate > 100) {
    return { ok: false, error: "Commission rate must be between 0 and 100." };
  }

  const { error } = await auth.supabase
    .from("hotels")
    .update({ plan, commission_rate: Number(commissionRate.toFixed(2)) })
    .eq("id", hotelId);

  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true };
}

export async function toggleHotelSitePublishAction(
  hotelId: string,
  slug: string,
  nextPublished: boolean
): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { data: existing } = await auth.supabase
    .from("hotel_sites")
    .select("id")
    .eq("hotel_id", hotelId)
    .maybeSingle();

  if (existing) {
    const { error } = await auth.supabase
      .from("hotel_sites")
      .update({ published: nextPublished })
      .eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await auth.supabase.from("hotel_sites").insert({
      hotel_id: hotelId,
      subdomain: slug,
      content: {},
      published: nextPublished,
    });
    if (error) return { ok: false, error: error.message };
  }

  revalidateAll();
  return { ok: true };
}

export async function markHotelPaidOutAction(input: {
  hotelId: string;
  periodMonth: string;
  amountNgn: number;
  notes?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (!/^\d{4}-\d{2}$/.test(input.periodMonth)) {
    return { ok: false, error: "Invalid month format (expected YYYY-MM)." };
  }

  const { error } = await auth.supabase.from("payouts").upsert(
    {
      hotel_id: input.hotelId,
      period_month: input.periodMonth,
      amount_ngn: Math.max(0, Math.round(input.amountNgn)),
      paid_out_at: new Date().toISOString(),
      notes: input.notes?.trim() || null,
    },
    { onConflict: "hotel_id,period_month" }
  );

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  return { ok: true };
}

export async function createPartnerHotelAccountAction(input: {
  email: string;
  tempPassword: string;
  ownerName: string;
  hotelName: string;
  area: string;
  whatsapp: string;
}): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return {
      ok: false,
      error:
        "Add SUPABASE_SERVICE_ROLE_KEY to .env.local to create partner auth accounts from /admin.",
    };
  }

  if (input.tempPassword.length < 8) {
    return { ok: false, error: "Temporary password must be at least 8 characters." };
  }

  const normalizedWa = normalizeNigerianPhone(input.whatsapp);
  if (!normalizedWa) {
    return { ok: false, error: "Enter a valid Nigerian WhatsApp number." };
  }

  const slug = input.hotelName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  if (!slug) return { ok: false, error: "Invalid hotel name." };

  const { createClient: createAdminClient } = await import("@supabase/supabase-js");
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: input.email.trim().toLowerCase(),
    password: input.tempPassword,
    email_confirm: true,
    user_metadata: {
      full_name: input.ownerName.trim(),
      phone: normalizedWa,
    },
  });

  if (createErr || !created.user) {
    return { ok: false, error: createErr?.message ?? "Could not create partner account." };
  }

  const userId = created.user.id;

  await admin
    .from("profiles")
    .update({
      role: "hotel_admin",
      full_name: input.ownerName.trim(),
      phone: normalizedWa,
    })
    .eq("id", userId);

  const { data: hotel, error: hotelErr } = await admin
    .from("hotels")
    .insert({
      owner_id: userId,
      name: input.hotelName.trim(),
      slug,
      area: input.area.trim(),
      whatsapp: normalizedWa,
      phone: normalizedWa,
      status: "approved",
      plan: "free",
    })
    .select("id")
    .single();

  if (hotelErr || !hotel) {
    return { ok: false, error: hotelErr?.message ?? "Account created, but hotel insert failed." };
  }

  await admin.from("hotel_sites").insert({
    hotel_id: hotel.id,
    subdomain: slug,
    content: {},
    published: true,
  });

  revalidateAll();
  return { ok: true };
}
