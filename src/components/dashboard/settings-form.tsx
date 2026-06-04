"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2, LogOut, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function SettingsForm({
  initialName,
  email,
  referralCode,
}: {
  initialName: string;
  email: string;
  referralCode: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      toast.success("Saved");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast.success("Referral code copied");
    setTimeout(() => setCopied(false), 1500);
  }

  async function signOut() {
    await createClient().auth.signOut();
    toast.success("Signed out");
    router.push("/");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Profile */}
      <Section title="Profile" subtitle="Your account details.">
        <FieldRow label="Display name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your channel name"
            className="field h-11 px-3.5 text-sm"
          />
        </FieldRow>
        <FieldRow label="Email">
          <div className="flex h-11 items-center rounded-xl border border-border bg-bg-soft px-3.5 text-sm text-muted">
            {email}
          </div>
        </FieldRow>
        <div className="flex justify-end pt-2">
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </div>
      </Section>

      {/* Referral */}
      <Section title="Referrals" subtitle="Your unique referral code.">
        <FieldRow label="Code">
          <div className="flex h-11 items-center gap-2 rounded-xl border border-border bg-bg-soft px-3.5">
            <code className="flex-1 font-mono text-sm font-semibold text-ink">
              {referralCode}
            </code>
            <button
              onClick={copyCode}
              className="rounded-md p-1.5 text-muted transition-colors hover:bg-surface hover:text-ink"
              aria-label="Copy"
            >
              {copied ? (
                <Check className="h-4 w-4 text-brand-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        </FieldRow>
        <p className="text-xs text-muted">
          Share this with other creators. When they sign up, you both earn
          bonus credits.
        </p>
      </Section>

      {/* Notifications (placeholder) */}
      <Section title="Notifications" subtitle="What we email you about.">
        <ToggleRow
          label="Product updates"
          help="New tools, big improvements, founder notes."
          defaultOn
        />
        <ToggleRow
          label="Weekly creator digest"
          help="Trending ideas in your niche, sent Sunday."
          defaultOn
        />
        <ToggleRow
          label="Marketing emails"
          help="Promotions and occasional offers."
          defaultOn={false}
        />
        <p className="text-xs text-muted">
          Saved locally for now — wire to a real email backend when launching.
        </p>
      </Section>

      {/* Danger zone */}
      <Section
        title="Danger zone"
        subtitle="Permanent things."
        accent="rose"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-medium">Sign out everywhere</div>
            <p className="text-sm text-muted">
              Ends your session on this device.
            </p>
          </div>
          <Button variant="secondary" onClick={signOut}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
        <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-medium text-rose-700">Delete account</div>
            <p className="text-sm text-muted">
              Permanently removes your data. This can't be undone.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() =>
              toast.error(
                "Account deletion will be enabled at public launch.",
              )
            }
            className="text-rose-700 hover:text-rose-800"
          >
            <Trash2 className="h-4 w-4" />
            Request deletion
          </Button>
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  subtitle,
  accent,
  children,
}: {
  title: string;
  subtitle: string;
  accent?: "rose";
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border bg-surface p-6 elev-1 ${
        accent === "rose" ? "border-rose-200" : "border-border"
      }`}
    >
      <div className="border-b border-border pb-4">
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted">{subtitle}</p>
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function ToggleRow({
  label,
  help,
  defaultOn,
}: {
  label: string;
  help: string;
  defaultOn: boolean;
}) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="font-medium">{label}</div>
        <p className="text-sm text-muted">{help}</p>
      </div>
      <Toggle on={on} onChange={() => setOn((v) => !v)} />
    </div>
  );
}

/** Reusable toggle switch. */
export function Toggle({
  on,
  onChange,
}: {
  on: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={on}
      type="button"
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent transition-colors ${
        on ? "bg-brand-500" : "bg-border"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-surface shadow-sm transition-transform ${
          on ? "translate-x-[22px]" : "translate-x-[2px]"
        }`}
      />
    </button>
  );
}
