"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const referral = params.get("ref") || "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifySent, setVerifySent] = useState(false);

  const isSignup = mode === "signup";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();

    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: name, referred_by_code: referral },
            emailRedirectTo: `${location.origin}/auth/callback?next=${next}`,
          },
        });
        if (error) throw error;
        if (!data.session) {
          setVerifySent(true);
          return;
        }
        toast.success("Welcome to Snipd!");
        router.push(next);
        router.refresh();
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          if (/confirm/i.test(error.message) || /verified/i.test(error.message)) {
            throw new Error(
              "Check your inbox — you need to verify your email before logging in.",
            );
          }
          throw error;
        }
        router.push(next);
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    const supabase = createClient();
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) toast.error(error.message);
    else toast.success("Verification email re-sent.");
  }

  // ── "Check your inbox" state ────────────────────────────
  if (verifySent) {
    return (
      <div className="w-full max-w-md">
        <HeaderLogo />
        <div className="mt-8 rounded-3xl border border-border bg-surface p-8 shadow-sm text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <MailCheck className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight">
            Check your inbox
          </h1>
          <p className="mt-2 text-sm text-muted">
            We sent a verification link to{" "}
            <span className="text-ink">{email}</span>. Click it and you're in.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button variant="secondary" onClick={resend}>
              Re-send verification email
            </Button>
            <Link href="/login" className="text-sm text-muted hover:text-ink">
              Already verified? Log in
            </Link>
          </div>
          <p className="mt-6 text-xs text-muted">
            Tip: check spam. The sender is your Supabase project.
          </p>
        </div>
      </div>
    );
  }

  // ── Normal form ─────────────────────────────────────────
  return (
    <div className="w-full max-w-md">
      <HeaderLogo />
      <div className="mt-8 rounded-3xl border border-border bg-surface p-8 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">
          {isSignup ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          {isSignup
            ? "30 free credits a month. No credit card."
            : "Log in to your dashboard."}
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {isSignup && (
            <Field
              label="Display name"
              value={name}
              onChange={setName}
              placeholder="Your channel name"
              type="text"
            />
          )}
          <Field
            label="Email"
            value={email}
            onChange={setEmail}
            placeholder="you@channel.com"
            type="email"
            required
          />
          <PasswordField
            value={password}
            onChange={setPassword}
            show={showPw}
            onToggle={() => setShowPw((v) => !v)}
          />

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSignup ? "Create account" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          {isSignup ? "Already have an account?" : "New here?"}{" "}
          <Link
            href={isSignup ? "/login" : "/signup"}
            className="font-medium text-brand-600 hover:underline"
          >
            {isSignup ? "Sign in" : "Get early access"}
          </Link>
        </p>
      </div>
    </div>
  );
}

function HeaderLogo() {
  return (
    <Link href="/" className="flex justify-center">
      <Logo size={32} />
    </Link>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-xl border border-border bg-bg-soft px-3.5 text-sm outline-none transition-colors placeholder:text-muted/60 focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/15"
      />
    </label>
  );
}

function PasswordField({
  value,
  onChange,
  show,
  onToggle,
}: {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">Password</span>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          required
          minLength={6}
          placeholder="••••••••"
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full rounded-xl border border-border bg-bg-soft pl-3.5 pr-11 text-sm outline-none transition-colors placeholder:text-muted/60 focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/15"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-1 top-1 grid h-9 w-9 place-items-center rounded-lg text-muted transition-colors hover:bg-bg-soft hover:text-ink"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </label>
  );
}
