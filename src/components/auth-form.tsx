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
  // Shows the Google button only once the provider is configured, so it's
  // never a dead end. Set NEXT_PUBLIC_GOOGLE_AUTH=1 in Vercel after wiring
  // Google in Supabase → Authentication → Providers.
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH === "1";

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

  async function signInWithGoogle() {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback?next=${next}` },
    });
    if (error) toast.error(error.message);
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
        <div className="mt-8 rounded-3xl border border-border bg-surface p-8 text-center elev-2 lg:mt-0">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-brand-500/20 bg-brand-500/10 text-brand-600">
            <MailCheck className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">
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
      <div className="mt-8 rounded-3xl border border-border bg-surface p-8 elev-2 lg:mt-0">
        <p className="font-mono text-[11px] uppercase tracking-wider text-brand-600">
          {isSignup ? "Get started" : "Welcome back"}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {isSignup ? "Create your account" : "Log in to Snipd"}
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          {isSignup
            ? "30 free credits a month. No credit card."
            : "Pick up right where you left off."}
        </p>

        {googleEnabled && (
          <div className="mt-6">
            <button
              type="button"
              onClick={signInWithGoogle}
              className="btn-feel flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-surface text-sm font-semibold text-ink hover:-translate-y-0.5 hover:bg-bg-soft active:translate-y-0"
            >
              <GoogleIcon />
              Continue with Google
            </button>
            <div className="my-5 flex items-center gap-3 text-xs text-muted">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>
          </div>
        )}

        <form onSubmit={onSubmit} className={googleEnabled ? "space-y-4" : "mt-6 space-y-4"}>
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
            {isSignup ? "Sign in" : "Create a free account"}
          </Link>
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

function HeaderLogo() {
  return (
    <Link href="/" className="flex justify-center lg:hidden">
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
        className="field h-11 px-3.5 text-sm"
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
          className="field h-11 pl-3.5 pr-11 text-sm"
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
