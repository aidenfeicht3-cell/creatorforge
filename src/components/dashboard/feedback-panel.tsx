"use client";

import { useEffect, useState } from "react";
import { Send, Loader2, MessageSquare, Inbox } from "lucide-react";
import { toast } from "sonner";

interface FeedbackRow {
  id: string;
  user_email: string | null;
  message: string;
  created_at: string;
}

/**
 * Feedback panel for /dashboard/settings.
 *
 * Anyone signed in can submit. Only the admin email (server-side check in
 * /api/feedback GET) sees the full list. Regular users see a blank "thanks"
 * state after submit — they don't get to read other users' feedback.
 */
export function FeedbackPanel({ isAdmin }: { isAdmin: boolean }) {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Admin-only: load all feedback once on mount.
  const [adminFeed, setAdminFeed] = useState<FeedbackRow[] | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    setAdminLoading(true);
    fetch("/api/feedback", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.feedback) setAdminFeed(data.feedback);
      })
      .catch(() => {
        toast.error("Couldn't load feedback inbox.");
      })
      .finally(() => setAdminLoading(false));
  }, [isAdmin]);

  async function submit() {
    if (message.trim().length < 3) {
      toast.error("Message is too short.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMessage("");
      setSubmitted(true);
      toast.success("Thanks — feedback sent.");
      // If the submitter is the admin, refresh the inbox.
      if (isAdmin) {
        const r = await fetch("/api/feedback", { cache: "no-store" });
        const j = await r.json();
        if (j.feedback) setAdminFeed(j.feedback);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <div className="border-b border-border pb-4">
        <h2 className="flex items-center gap-2 font-semibold">
          <MessageSquare className="h-4 w-4 text-brand-600" />
          Send feedback
        </h2>
        <p className="mt-1 text-sm text-muted">
          Bugs, feature ideas, what's annoying — anything goes. Goes straight
          to the founder.
        </p>
      </div>

      <div className="mt-4 space-y-3">
        <textarea
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (submitted) setSubmitted(false);
          }}
          rows={4}
          maxLength={4000}
          placeholder="What's on your mind?"
          className="w-full resize-y rounded-xl border border-border bg-bg-soft px-4 py-3 text-sm outline-none focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/15"
        />
        <div className="flex items-center justify-between text-xs text-muted">
          <span className="font-mono">{message.length} / 4000</span>
          <button
            type="button"
            onClick={submit}
            disabled={submitting || message.trim().length < 3}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {submitting ? "Sending…" : submitted ? "Send another" : "Send"}
          </button>
        </div>
      </div>

      {/* Admin-only inbox */}
      {isAdmin && (
        <div className="mt-8 border-t border-border pt-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Inbox className="h-4 w-4 text-brand-600" />
            Inbox
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
              admin
            </span>
            {adminFeed && (
              <span className="ml-auto font-mono text-xs text-muted">
                {adminFeed.length} {adminFeed.length === 1 ? "message" : "messages"}
              </span>
            )}
          </h3>

          {adminLoading && (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted">
              <Loader2 className="h-3 w-3 animate-spin" /> Loading…
            </div>
          )}

          {adminFeed && adminFeed.length === 0 && (
            <p className="mt-3 text-sm text-muted">
              No feedback yet. The first message you send to yourself appears here.
            </p>
          )}

          {adminFeed && adminFeed.length > 0 && (
            <ul className="mt-3 max-h-[480px] space-y-2 overflow-y-auto pr-1">
              {adminFeed.map((row) => (
                <li
                  key={row.id}
                  className="rounded-xl border border-border bg-bg-soft p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate font-mono text-[11px] text-muted">
                      {row.user_email || "anonymous"}
                    </span>
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted">
                      {new Date(row.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm">
                    {row.message}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
