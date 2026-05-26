"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function WorkshopSubmit() {
  const router = useRouter();
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [niche, setNiche] = useState("");
  const [caption, setCaption] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/workshop/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle,
          displayName,
          niche,
          caption,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submit failed");
      toast.success("Channel submitted — others can see it now.");
      setHandle("");
      setDisplayName("");
      setNiche("");
      setCaption("");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="lg" className="w-full">
        <Send className="h-4 w-4" />
        Submit your channel for feedback
      </Button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-3xl border border-border bg-surface p-6 shadow-sm"
    >
      <h2 className="text-lg font-bold">Drop your channel</h2>
      <p className="mt-1 text-sm text-muted">
        Get tips from other creators. Optional: ask a specific question.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field
          label="YouTube handle or URL"
          value={handle}
          onChange={setHandle}
          placeholder="@yourchannel or youtube.com/@yourchannel"
          required
        />
        <Field
          label="Display name"
          value={displayName}
          onChange={setDisplayName}
          placeholder="Your channel name"
          required
        />
        <Field
          label="Niche"
          value={niche}
          onChange={setNiche}
          placeholder="AI tools for creators"
          required
        />
      </div>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-sm font-medium">
          What feedback are you looking for? (optional)
        </span>
        <textarea
          rows={3}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="e.g. 'My thumbnails look weak — what should I change?' or 'Just here for honest feedback.'"
          className="w-full rounded-xl border border-border bg-bg-soft px-4 py-3 text-[15px] outline-none placeholder:text-muted/60 focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/15"
        />
        <p className="mt-1 text-xs text-muted">
          {caption.length} / 600 characters
        </p>
      </label>

      <div className="mt-5 flex gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Post to the Workshop
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </span>
      <input
        type="text"
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-border bg-bg-soft px-3.5 text-sm outline-none placeholder:text-muted/60 focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/15"
      />
    </label>
  );
}
