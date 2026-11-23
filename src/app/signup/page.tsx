import { StaysideLogoMark } from "@/components/StaysideLogo";
import { SignupForm } from "./SignupForm";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{
    next?: string;
    claim?: string;
    phone?: string;
    name?: string;
  }>;
}) {
  const { next, claim, phone, name } = await searchParams;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-140px)] max-w-md flex-col justify-center px-4 py-8">
      <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_12px_48px_rgba(23,36,58,0.1)]">
        <div
          className="h-24 px-6 pt-5 text-white"
          style={{
            background: "linear-gradient(135deg, #2457D6 0%, #4E86F7 100%)",
          }}
        >
          <span className="inline-flex items-center gap-2 text-sm font-bold text-white">
            <StaysideLogoMark className="h-7 w-7" />
            Stayside
          </span>
        </div>

        <div className="-mt-6 rounded-t-[28px] bg-white px-6 pt-7 pb-8 sm:px-8">
          <div className="mb-6 text-center">
            <h1 className="font-jakarta text-2xl font-bold text-brand-ink">
              Create Account
            </h1>
            <p className="mt-1 text-xs text-brand-muted">
              Fill up this form to create a new Stayside account
            </p>
          </div>

          <SignupForm
            nextPath={next}
            claimBookingId={claim}
            claimPhone={phone}
            initialName={name}
          />
        </div>
      </div>
    </div>
  );
}
