import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Lock } from "lucide-react";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";
import { Logo } from "@/components/logo";
import { buttonClasses } from "@/components/ui/button";

export const metadata: Metadata = { title: "Sign up" };

/**
 * Sign-up is gated behind the FOUNDER_KEY env var while we're in
 * waitlist-only mode. Public visitors see a "join the waitlist" message;
 * the founder appends `?key=THE_KEY` to access the actual form.
 *
 * Belt + suspenders: in Supabase Dashboard, also disable
 * "Allow new users to sign up" (Authentication ▸ Providers ▸ Email).
 */
export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const { key } = await searchParams;
  const expected = process.env.FOUNDER_KEY;
  const unlocked = !!expected && key === expected;

  if (unlocked) {
    return (
      <AuthShell>
        <Suspense>
          <AuthForm mode="signup" />
        </Suspense>
      </AuthShell>
    );
  }

  // Public view — gentle redirect to the waitlist.
  return (
    <AuthShell>
      <div className="w-full max-w-md">
        <Link href="/" className="flex justify-center lg:hidden">
          <Logo size={36} />
        </Link>

        <div className="mt-10 rounded-3xl border border-border bg-surface p-8 shadow-sm lg:mt-0">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-500/10 text-brand-600">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">
            We're invite-only right now.
          </h1>
          <p className="mt-2 text-sm text-muted">
            Snipd is in private build. Drop your email on the
            waitlist — free users get bonus credits, paid intenders get a
            promo code for their first month.
          </p>

          <div className="mt-6 flex flex-col gap-2">
            <Link href="/waitlist" className={buttonClasses("primary", "md")}>
              Join the waitlist
            </Link>
            <Link href="/login" className="text-center text-sm text-muted hover:text-ink">
              Already have an account? Log in
            </Link>
          </div>
        </div>
      </div>
    </AuthShell>
  );
}
