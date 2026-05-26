import { cn } from "@/lib/utils";

/** Small pill label. `score` tints by CTR/retention value. */
export function Badge({
  children,
  className,
  score,
}: {
  children: React.ReactNode;
  className?: string;
  score?: number;
}) {
  const tone =
    score === undefined
      ? "bg-brand-500/15 text-brand-600 border-brand-500/30"
      : score >= 80
        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
        : score >= 60
          ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
          : "bg-rose-500/15 text-rose-300 border-rose-500/30";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tone,
        className,
      )}
    >
      {children}
    </span>
  );
}
