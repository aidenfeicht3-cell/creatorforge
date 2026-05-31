import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";

export const metadata: Metadata = { title: "Sign up" };

/**
 * Public sign-up — anyone can create a free Starter account (30 credits/mo).
 *
 * NOTE: For this to work, Supabase must allow new signups
 * (Authentication ▸ Providers ▸ Email ▸ "Allow new users to sign up" = ON).
 */
export default function SignupPage() {
  return (
    <AuthShell>
      <Suspense>
        <AuthForm mode="signup" />
      </Suspense>
    </AuthShell>
  );
}
