import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StaysideLogoMark } from "@/components/StaysideLogo";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; claim?: string; phone?: string }>;
}) {
  const { next, claim, phone } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && !claim) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "super_admin") redirect("/admin");
    if (profile?.role === "hotel_admin") redirect("/hotel");
    redirect("/account");
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-140px)] max-w-md flex-col justify-center px-4 py-8">
      <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_12px_48px_rgba(23,36,58,0.1)]">
        {/* Cobalt Blue gradient header matching reference */}
        <div
          className="h-28 px-6 pt-6 text-white"
          style={{
            background: "linear-gradient(135deg, #2457D6 0%, #4E86F7 100%)",
          }}
        >
          <span className="inline-flex items-center gap-2 text-sm font-bold text-white">
            <StaysideLogoMark className="h-7 w-7" />
            Stayside
          </span>
        </div>

        {/* Curved white form sheet */}
        <div className="-mt-6 rounded-t-[28px] bg-white px-6 pt-7 pb-8 sm:px-8">
          <div className="mb-6 text-center">
            <h1 className="font-jakarta text-2xl font-bold text-brand-ink">
              Welcome Back
            </h1>
            <p className="mt-1 text-xs text-brand-muted">
              Enter your details below to log back into your account
            </p>
          </div>

          <LoginForm nextPath={next} claimBookingId={claim} claimPhone={phone} />
        </div>
      </div>
    </div>
  );
}
