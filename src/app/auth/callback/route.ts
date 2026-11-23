import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const claimBookingId = searchParams.get("claim");
  const claimPhone = searchParams.get("phone");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
  }

  // If the guest came from a post-booking claim link, attach that booking now
  if (claimBookingId && claimPhone) {
    await supabase.rpc("claim_guest_booking", {
      p_booking_id: claimBookingId,
      p_guest_phone: claimPhone,
    });
  }

  // Route based on role (or safe relative `next` path)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
  let destination = "/account";

  if (profile?.role === "super_admin") {
    destination =
      safeNext === "/admin" || safeNext?.startsWith("/admin/") ? safeNext : "/admin";
  } else if (profile?.role === "hotel_admin") {
    destination =
      safeNext === "/hotel" || safeNext?.startsWith("/hotel/") ? safeNext : "/hotel";
  } else if (safeNext) {
    destination = safeNext;
  }

  return NextResponse.redirect(`${origin}${destination}`);
}
