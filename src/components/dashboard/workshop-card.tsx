"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Heart,
  MessageCircle,
  ExternalLink,
  Loader2,
  Send,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { avatarUrlFor, channelUrlFor } from "@/lib/workshop";
import { formatDate } from "@/lib/utils";

export interface WorkshopChannel {
  id: string;
  user_id: string;
  handle: string;
  display_name: string;
  niche: string;
  caption: string | null;
  upvotes: number;
  tips_count: number;
  created_at: string;
  profiles?: { display_name: string | null } | null;
}

interface Tip {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
  profiles?: { display_name: string | null } | null;
}

export function WorkshopCard({
  channel,
  currentUserId,
}: {
  channel: WorkshopChannel;
  currentUserId: string;
}) {
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  const [upvotes, setUpvotes] = useState(channel.upvotes);
  const [upvoting, setUpvoting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [tips, setTips] = useState<Tip[] | null>(null);
  const [tipsLoading, setTipsLoading] = useState(false);
  const [newTip, setNewTip] = useState("");
  const [posting, setPosting] = useState(false);
  const [tipsCount, setTipsCount] = useState(channel.tips_count);

  const isOwner = channel.user_id === currentUserId;
  const submitter =
    channel.profiles?.display_name || "a creator";

  async function toggleUpvote() {
    setUpvoting(true);
    try {
      const res = await fetch(
        `/api/workshop/channels/${channel.id}/upvote`,
        { method: "POST" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Vote failed");
      setUpvotes((v) => v + (data.upvoted ? 1 : -1));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't vote");
    } finally {
      setUpvoting(false);
    }
  }

  async function loadTips() {
    setTipsLoading(true);
    try {
      const res = await fetch(`/api/workshop/channels/${channel.id}/tips`);
      const data = await res.json();
      setTips((data.tips as Tip[]) ?? []);
    } catch {
      toast.error("Couldn't load tips");
    } finally {
      setTipsLoading(false);
    }
  }

  async function postTip(e: React.FormEvent) {
    e.preventDefault();
    if (!newTip.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(
        `/api/workshop/channels/${channel.id}/tips`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: newTip }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't post");
      setNewTip("");
      setTipsCount((c) => c + 1);
      await loadTips();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't post tip");
    } finally {
      setPosting(false);
    }
  }

  async function remove() {
    if (!confirm("Delete your submission?")) return;
    try {
      const res = await fetch(`/api/workshop/channels/${channel.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Couldn't delete");
      toast.success("Removed");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete");
    }
  }

  function toggleExpanded() {
    setExpanded((v) => !v);
    if (!expanded && tips === null) loadTips();
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <div className="p-5">
        <div className="flex items-start gap-4">
          {failed ? (
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-base font-bold text-white">
              {channel.display_name.charAt(0).toUpperCase()}
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrlFor(channel.handle)}
              alt=""
              loading="lazy"
              onError={() => setFailed(true)}
              className="h-12 w-12 shrink-0 rounded-full border border-border bg-bg-soft object-cover"
            />
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <h3 className="truncate font-semibold">
                {channel.display_name}
              </h3>
              <span className="font-mono text-xs text-brand-600">
                {channel.handle}
              </span>
            </div>
            <div className="mt-0.5 text-xs text-muted">
              Submitted by {submitter} · {formatDate(channel.created_at)}
            </div>
            <span className="mt-2 inline-block rounded-full bg-bg-soft px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted">
              {channel.niche}
            </span>
          </div>

          {isOwner && (
            <button
              onClick={remove}
              aria-label="Delete"
              className="rounded-lg p-1.5 text-muted hover:bg-bg-soft hover:text-rose-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {channel.caption && (
          <div className="mt-4 rounded-xl border-l-2 border-brand-500 bg-bg-soft px-3 py-2 text-sm italic">
            "{channel.caption}"
          </div>
        )}

        <div className="mt-4 flex items-center gap-2">
          <a
            href={channelUrlFor(channel.handle)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-soft px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-brand-500/40 hover:text-brand-600"
          >
            <ExternalLink className="h-3 w-3" />
            Subscribe on YouTube
          </a>
          <button
            onClick={toggleUpvote}
            disabled={upvoting}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-soft px-3 py-1.5 text-xs font-medium transition-colors hover:border-rose-500/40 hover:text-rose-600"
          >
            <Heart className="h-3 w-3" />
            {upvotes}
          </button>
          <button
            onClick={toggleExpanded}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-soft px-3 py-1.5 text-xs font-medium transition-colors hover:border-brand-500/40 hover:text-brand-600"
          >
            <MessageCircle className="h-3 w-3" />
            {tipsCount} tips
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border bg-bg-soft/40 p-5">
          <form onSubmit={postTip} className="flex items-start gap-2">
            <textarea
              value={newTip}
              onChange={(e) => setNewTip(e.target.value)}
              placeholder="Give a constructive tip…"
              rows={2}
              maxLength={500}
              className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted/60 focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/15"
            />
            <button
              type="submit"
              disabled={posting || !newTip.trim()}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50"
              aria-label="Post tip"
            >
              {posting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>

          <div className="mt-4 space-y-2">
            {tipsLoading && (
              <p className="text-xs text-muted">Loading tips…</p>
            )}
            {!tipsLoading && tips && tips.length === 0 && (
              <p className="text-xs italic text-muted">
                No tips yet — be the first.
              </p>
            )}
            {tips?.map((tip) => (
              <div
                key={tip.id}
                className="rounded-xl border border-border bg-surface px-3 py-2 text-sm"
              >
                <p>{tip.body}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted">
                  {tip.profiles?.display_name || "creator"} ·{" "}
                  {formatDate(tip.created_at)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
