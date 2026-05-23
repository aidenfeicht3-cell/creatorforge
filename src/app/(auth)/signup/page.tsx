import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <main className="grid min-h-screen place-items-center px-5 py-16">
      <Suspense>
        <AuthForm mode="signup" />
      </Suspense>
    </main>
  );
}
