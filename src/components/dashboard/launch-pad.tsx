"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Rocket,
  Compass,
  Wand2,
  Hash,
  UserCircle,
  AtSign,
  Lightbulb,
  Clapperboard,
  Check,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Zap,
  FileText,
  Sparkles,
  RefreshCw,
  PartyPopper,
} from "lucide-react";
import { toast } from "sonner";
import { Button, buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ───────────────────────────────────────────────
   Launch Pad — the flagship guided walkthrough.
   Chains the existing tools into one clean flow:
   niche → name → pfp → bio → first video idea → full package.
   Everything the user picks carries forward into a single launch kit.
   ─────────────────────────────────────────────── */

type StepKey =
  | "intro"
  | "niche"
  | "name"
  | "pfp"
  | "bio"
  | "idea"
  | "package"
  | "done";

const STEP_ORDER: StepKey[] = [
  "intro",
  "niche",
  "name",
  "pfp",
  "bio",
  "idea",
  "package",
  "done",
];

const PHASES = [
  { label: "Niche", steps: ["niche"] },
  { label: "Brand", steps: ["name", "pfp", "bio"] },
  { label: "First video", steps: ["idea", "package"] },
  { label: "Launch", steps: ["done"] },
];

interface ScriptShape {
  hook?: string;
  sections?: Array<{ heading?: string; script?: string; approxSeconds?: number }>;
  cta?: string;
}

interface LaunchPlan {
  niche?: string;
  nicheReason?: string;
  channelName?: string;
  handle?: string;
  tagline?: string;
  pfpImage?: string;
  pfpConcept?: string;
  bio?: string;
  bioPlatform?: string;
  videoTopic?: string;
  videoWhy?: string;
  title?: string;
  thumbnailImage?: string;
  thumbnailOverlay?: string;
  script?: ScriptShape;
}

type GenResult = {
  result: Record<string, unknown>;
  creditsUsed: number;
};

export function LaunchPad({
  initialNiche,
  initialAudience,
  creditsLeft: initialCredits,
  displayName,
}: {
  initialNiche?: string | null;
  initialAudience?: string | null;
  creditsLeft: number;
  displayName?: string | null;
}) {
  const [step, setStep] = useState<StepKey>("intro");
  const [plan, setPlan] = useState<LaunchPlan>({
    niche: initialNiche || undefined,
  });
  const [credits, setCredits] = useState(initialCredits);

  function patch(p: Partial<LaunchPlan>) {
    setPlan((prev) => ({ ...prev, ...p }));
  }

  function go(to: StepKey) {
    setStep(to);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const idx = STEP_ORDER.indexOf(step);
  function next() {
    const n = STEP_ORDER[idx + 1];
    if (n) go(n);
  }
  function back() {
    const p = STEP_ORDER[idx - 1];
    if (p) go(p);
  }

  /** Single entry point for every generation. Decrements local credit count. */
  async function runTool(
    slug: string,
    inputs: Record<string, string>,
  ): Promise<GenResult> {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool: slug, inputs }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Generation failed.");
    if (typeof data.creditsUsed === "number") {
      // creditsUsed is the running total; recompute remaining from charge.
      setCredits((c) => Math.max(0, c - (data.creditsCharged ?? 0)));
    }
    return { result: data.result ?? {}, creditsUsed: data.creditsUsed };
  }

  const currentPhase = PHASES.findIndex((ph) =>
    ph.steps.includes(step),
  );

  return (
    <div className="mx-auto max-w-3xl">
      {/* Top bar: phases + credits */}
      {step !== "intro" && (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <ol className="flex items-center gap-1.5">
            {PHASES.map((ph, i) => {
              const done = i < currentPhase;
              const active = i === currentPhase;
              return (
                <li key={ph.label} className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                      active
                        ? "bg-brand-500 text-white"
                        : done
                          ? "bg-brand-50 text-brand-700"
                          : "bg-bg-soft text-muted",
                    )}
                  >
                    {done ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <span className="font-mono text-[10px]">{i + 1}</span>
                    )}
                    {ph.label}
                  </span>
                  {i < PHASES.length - 1 && (
                    <span className="h-px w-3 bg-border sm:w-5" />
                  )}
                </li>
              );
            })}
          </ol>
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-bg-soft px-3 py-1 font-mono text-[11px] text-muted">
            <Zap className="h-3 w-3 text-brand-600" />
            {credits} credits left
          </span>
        </div>
      )}

      {step === "intro" && (
        <IntroStep onStart={() => go("niche")} displayName={displayName} />
      )}
      {step === "niche" && (
        <NicheStep
          plan={plan}
          patch={patch}
          runTool={runTool}
          initialAudience={initialAudience}
          onNext={next}
        />
      )}
      {step === "name" && (
        <NameStep plan={plan} patch={patch} runTool={runTool} onNext={next} onBack={back} />
      )}
      {step === "pfp" && (
        <PfpStep plan={plan} patch={patch} runTool={runTool} onNext={next} onBack={back} />
      )}
      {step === "bio" && (
        <BioStep plan={plan} patch={patch} runTool={runTool} onNext={next} onBack={back} />
      )}
      {step === "idea" && (
        <IdeaStep plan={plan} patch={patch} runTool={runTool} onNext={next} onBack={back} />
      )}
      {step === "package" && (
        <PackageStep plan={plan} patch={patch} runTool={runTool} onNext={next} onBack={back} />
      )}
      {step === "done" && <DoneStep plan={plan} onRestart={() => { setPlan({ niche: initialNiche || undefined }); go("intro"); }} />}
    </div>
  );
}

/* ─────────────────────────  Shared shells  ───────────────────────── */

function StepShell({
  icon: Icon,
  eyebrow,
  title,
  blurb,
  children,
  footer,
}: {
  icon: React.ComponentType<{ className?: string }>;
  eyebrow: string;
  title: string;
  blurb: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-400 text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.5)]">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-brand-600">
            {eyebrow}
          </p>
          <h2 className="mt-0.5 text-2xl font-bold tracking-tight">{title}</h2>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted">{blurb}</p>
      <div className="mt-6">{children}</div>
      {footer && <div className="mt-7">{footer}</div>}
    </div>
  );
}

function Footer({
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled,
  skip,
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  skip?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
      {onBack ? (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      ) : (
        <span />
      )}
      <div className="flex items-center gap-3">
        {skip && (
          <button
            onClick={skip}
            className="text-sm text-muted transition-colors hover:text-ink"
          >
            Skip for now
          </button>
        )}
        {onNext && (
          <Button onClick={onNext} disabled={nextDisabled} size="md">
            {nextLabel}
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

/** Big generate button used to kick off a tool run for a step. */
function RunButton({
  label,
  cost,
  loading,
  onClick,
  icon: Icon = Sparkles,
}: {
  label: string;
  cost: number;
  loading: boolean;
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={cn(
        "group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-400 px-5 py-3.5 font-semibold text-white shadow-[0_10px_30px_-10px_rgba(37,99,235,0.6)] transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60",
      )}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Icon className="h-5 w-5" />
      )}
      {loading ? "Working…" : label}
      <span className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-white/20 px-2 py-0.5 font-mono text-[11px]">
        <Zap className="h-3 w-3" />
        {cost}
      </span>
    </button>
  );
}

function PickCard({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative w-full rounded-2xl border bg-bg-soft p-4 text-left transition-all hover:border-brand-500/50",
        selected
          ? "border-brand-500 ring-2 ring-brand-500/20"
          : "border-border",
      )}
    >
      {selected && (
        <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-brand-500 text-white">
          <Check className="h-3 w-3" />
        </span>
      )}
      {children}
    </button>
  );
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-brand-500 to-brand-400 px-2 py-0.5 font-mono text-[11px] font-semibold text-white">
      {score}
    </span>
  );
}

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}
function arr(v: unknown): Record<string, unknown>[] {
  return Array.isArray(v) ? (v as Record<string, unknown>[]) : [];
}

/* ─────────────────────────  Intro  ───────────────────────── */

function IntroStep({
  onStart,
  displayName,
}: {
  onStart: () => void;
  displayName?: string | null;
}) {
  const steps = [
    { icon: Compass, t: "Find your niche", d: "Pick a lane you can own — or let us find one." },
    { icon: Hash, t: "Name + brand it", d: "Channel name, profile picture, and bio." },
    { icon: Clapperboard, t: "Plan video one", d: "A real idea, title, thumbnail, and full script." },
    { icon: Rocket, t: "Launch kit", d: "Everything in one place, with the exact steps to film it." },
  ];
  return (
    <div className="rounded-3xl border border-border bg-surface p-8 shadow-sm sm:p-10">
      <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/20 bg-brand-50 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-brand-700">
        <Sparkles className="h-3 w-3" /> The fastest way to start
      </div>
      <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
        Launch Pad
      </h1>
      <p className="mt-3 max-w-xl text-lg text-muted">
        {displayName ? `${displayName.split(" ")[0]}, w` : "W"}e&apos;ll walk you
        from a blank page to your first video — niche, brand, and a complete,
        film-ready package. No guessing. Just follow along.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {steps.map((s, i) => (
          <div
            key={s.t}
            className="flex items-start gap-3 rounded-2xl border border-border bg-bg-soft p-4"
          >
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface text-brand-600">
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className="font-mono text-[11px] text-muted">{i + 1}</span>
                {s.t}
              </div>
              <p className="mt-0.5 text-xs text-muted">{s.d}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Button onClick={onStart} size="lg">
          <Rocket className="h-4 w-4" />
          Start building
          <ArrowRight className="h-4 w-4" />
        </Button>
        <p className="text-xs text-muted">
          Takes ~5 minutes · up to ~15 credits if you run every step · skip any step.
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────  Niche  ───────────────────────── */

function NicheStep({
  plan,
  patch,
  runTool,
  initialAudience,
  onNext,
}: {
  plan: LaunchPlan;
  patch: (p: Partial<LaunchPlan>) => void;
  runTool: (slug: string, inputs: Record<string, string>) => Promise<GenResult>;
  initialAudience?: string | null;
  onNext: () => void;
}) {
  const [mode, setMode] = useState<"choose" | "know" | "find">(
    plan.niche ? "know" : "choose",
  );
  const [own, setOwn] = useState(plan.niche || "");
  const [interests, setInterests] = useState("");
  const [audience, setAudience] = useState(initialAudience || "");
  const [loading, setLoading] = useState(false);
  const [niches, setNiches] = useState<Record<string, unknown>[]>([]);

  async function find() {
    if (!interests.trim() || !audience.trim()) {
      toast.error("Fill in your interests and who you want to help.");
      return;
    }
    setLoading(true);
    try {
      const { result } = await runTool("niche", {
        interests,
        audience,
      });
      setNiches(arr(result.niches));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't find niches.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <StepShell
      icon={Compass}
      eyebrow="Step 1 · Niche"
      title="What lane will you own?"
      blurb="Your niche decides everything else. The trick isn't picking something huge — it's picking something specific enough that a brand-new creator can become the go-to name."
      footer={
        <Footer
          onNext={onNext}
          nextDisabled={!plan.niche}
          nextLabel={plan.niche ? "Lock it in" : "Pick a niche first"}
        />
      }
    >
      {mode === "choose" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => setMode("know")}
            className="flex flex-col items-start gap-2 rounded-2xl border border-border bg-bg-soft p-5 text-left transition-all hover:-translate-y-0.5 hover:border-brand-500/40"
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-surface text-brand-600">
              <Check className="h-5 w-5" />
            </div>
            <div className="font-semibold">I know my niche</div>
            <p className="text-sm text-muted">
              Type it in and keep moving.
            </p>
          </button>
          <button
            onClick={() => setMode("find")}
            className="flex flex-col items-start gap-2 rounded-2xl border border-brand-500/30 bg-gradient-to-br from-brand-50 to-bg-soft p-5 text-left transition-all hover:-translate-y-0.5 hover:border-brand-500/50"
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500 text-white">
              <Wand2 className="h-5 w-5" />
            </div>
            <div className="font-semibold">I don&apos;t know — find one for me</div>
            <p className="text-sm text-muted">
              Tell us what you&apos;re into; we&apos;ll surface 5 winnable niches.
            </p>
          </button>
        </div>
      )}

      {mode === "know" && (
        <div className="space-y-4">
          <LabeledInput
            label="Your niche"
            value={own}
            onChange={setOwn}
            placeholder="Personal finance for Gen Z"
          />
          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                if (!own.trim()) return toast.error("Type your niche.");
                patch({ niche: own.trim(), nicheReason: undefined });
                toast.success("Niche locked.");
              }}
              size="md"
            >
              Use this niche
            </Button>
            <button
              onClick={() => setMode("choose")}
              className="text-sm text-muted hover:text-ink"
            >
              Not sure? Find one instead
            </button>
          </div>
          {plan.niche && (
            <ChosenBanner text={plan.niche} />
          )}
        </div>
      )}

      {mode === "find" && (
        <div className="space-y-4">
          {niches.length === 0 && (
            <>
              <LabeledTextarea
                label="What are you into? (skills, interests, obsessions)"
                value={interests}
                onChange={setInterests}
                placeholder="AI, coding, retro gaming, personal finance, building in public"
              />
              <LabeledInput
                label="Who do you want to help?"
                value={audience}
                onChange={setAudience}
                placeholder="Beginner indie devs"
              />
              <RunButton
                label="Find my niches"
                cost={2}
                loading={loading}
                onClick={find}
                icon={Wand2}
              />
              <button
                onClick={() => setMode("choose")}
                className="text-sm text-muted hover:text-ink"
              >
                ← I actually know my niche
              </button>
            </>
          )}

          {niches.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">
                Pick the one that excites you most:
              </p>
              {niches.map((n, i) => {
                const name = str(n.name);
                const selected = plan.niche === name;
                return (
                  <PickCard
                    key={i}
                    selected={selected}
                    onClick={() =>
                      patch({ niche: name, nicheReason: str(n.whyUnderserved) })
                    }
                  >
                    <div className="flex items-center justify-between gap-3 pr-6">
                      <span className="font-semibold">{name}</span>
                      <ScoreBadge score={num(n.dominationScore)} />
                    </div>
                    <p className="mt-1 text-sm text-muted">{str(n.whyUnderserved)}</p>
                    {Array.isArray(n.exampleVideos) && (
                      <ul className="mt-2 space-y-0.5">
                        {(n.exampleVideos as string[]).slice(0, 2).map((v, j) => (
                          <li key={j} className="flex items-start gap-1.5 text-xs text-muted">
                            <Lightbulb className="mt-0.5 h-3 w-3 shrink-0 text-brand-600" />
                            {v}
                          </li>
                        ))}
                      </ul>
                    )}
                  </PickCard>
                );
              })}
              <button
                onClick={() => { setNiches([]); }}
                className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Try different inputs
              </button>
            </div>
          )}
        </div>
      )}
    </StepShell>
  );
}

/* ─────────────────────────  Name  ───────────────────────── */

const NAME_VIBES = ["Bold", "Playful", "Professional", "Mysterious", "Personal brand"];

function NameStep({
  plan,
  patch,
  runTool,
  onNext,
  onBack,
}: StepProps) {
  const [vibe, setVibe] = useState(NAME_VIBES[0]);
  const [loading, setLoading] = useState(false);
  const [names, setNames] = useState<Record<string, unknown>[]>([]);
  const [own, setOwn] = useState(plan.channelName || "");

  async function gen() {
    setLoading(true);
    try {
      const { result } = await runTool("channelname", {
        niche: plan.niche || "",
        vibe,
      });
      setNames(arr(result.names));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't generate names.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <StepShell
      icon={Hash}
      eyebrow="Step 2 · Brand"
      title="Name your channel"
      blurb={`A good name is short, easy to say out loud, and works as a handle. Generate options tuned to "${plan.niche}", or type one you already love.`}
      footer={
        <Footer
          onBack={onBack}
          onNext={onNext}
          nextDisabled={!plan.channelName}
          nextLabel={plan.channelName ? "Continue" : "Pick a name first"}
        />
      }
    >
      <div className="space-y-5">
        {/* Own name */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <LabeledInput
              label="Already have a name?"
              value={own}
              onChange={setOwn}
              placeholder="AidenBuildsTech"
            />
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              if (!own.trim()) return toast.error("Type a name.");
              patch({
                channelName: own.trim(),
                handle: "@" + own.trim().replace(/\s+/g, "").toLowerCase(),
              });
              toast.success("Name set.");
            }}
            size="md"
          >
            Use this
          </Button>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted">
          <span className="h-px flex-1 bg-border" /> or generate ideas{" "}
          <span className="h-px flex-1 bg-border" />
        </div>

        {/* Generate */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted">Vibe:</span>
            {NAME_VIBES.map((v) => (
              <button
                key={v}
                onClick={() => setVibe(v)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  vibe === v
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-border text-muted hover:text-ink",
                )}
              >
                {v}
              </button>
            ))}
          </div>
          <RunButton
            label={names.length ? "Regenerate names" : "Generate names"}
            cost={1}
            loading={loading}
            onClick={gen}
            icon={Hash}
          />
        </div>

        {names.length > 0 && (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {names.map((n, i) => {
              const name = str(n.name);
              const selected = plan.channelName === name;
              return (
                <PickCard
                  key={i}
                  selected={selected}
                  onClick={() =>
                    patch({
                      channelName: name,
                      handle: str(n.handle),
                      tagline: str(n.tagline),
                    })
                  }
                >
                  <div className="flex items-center justify-between gap-2 pr-6">
                    <span className="font-semibold">{name}</span>
                    <ScoreBadge score={num(n.memorabilityScore)} />
                  </div>
                  <div className="mt-0.5 font-mono text-xs text-brand-600">
                    {str(n.handle)}
                  </div>
                  <p className="mt-1 text-xs text-muted">{str(n.why)}</p>
                </PickCard>
              );
            })}
          </div>
        )}
      </div>
    </StepShell>
  );
}

/* ─────────────────────────  PFP  ───────────────────────── */

const PFP_VIBES = [
  "Bold & energetic",
  "Clean & minimal",
  "Friendly & approachable",
  "Mysterious",
  "Professional",
];

function PfpStep({ plan, patch, runTool, onNext, onBack }: StepProps) {
  const [vibe, setVibe] = useState(PFP_VIBES[0]);
  const [loading, setLoading] = useState(false);
  const [concepts, setConcepts] = useState<Record<string, unknown>[]>([]);

  async function gen() {
    setLoading(true);
    try {
      const { result } = await runTool("pfp", {
        channelName: plan.channelName || "My Channel",
        niche: plan.niche || "",
        vibe,
      });
      setConcepts(arr(result.concepts));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't generate PFPs.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <StepShell
      icon={UserCircle}
      eyebrow="Step 3 · Brand"
      title="Design your profile picture"
      blurb="Your PFP is the most-seen 40px of your brand. We render 4 real options — pick the one that reads clearest at a tiny size."
      footer={
        <Footer onBack={onBack} onNext={onNext} skip={onNext} nextLabel="Continue" />
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted">Vibe:</span>
          {PFP_VIBES.map((v) => (
            <button
              key={v}
              onClick={() => setVibe(v)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                vibe === v
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-border text-muted hover:text-ink",
              )}
            >
              {v}
            </button>
          ))}
        </div>
        <RunButton
          label={concepts.length ? "Regenerate PFPs" : "Generate profile pictures"}
          cost={3}
          loading={loading}
          onClick={gen}
          icon={UserCircle}
        />

        {loading && concepts.length === 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-square skeleton rounded-2xl" />
            ))}
          </div>
        )}

        {concepts.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {concepts.map((c, i) => {
              const image = str(c.image);
              const name = str(c.name);
              const selected = plan.pfpConcept === name;
              return (
                <button
                  key={i}
                  onClick={() => patch({ pfpImage: image, pfpConcept: name })}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border bg-bg-soft transition-all",
                    selected
                      ? "border-brand-500 ring-2 ring-brand-500/20"
                      : "border-border hover:border-brand-500/50",
                  )}
                >
                  <div className="aspect-square w-full">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image} alt={name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center bg-gradient-to-br from-brand-500 to-brand-400 text-white">
                        <UserCircle className="h-8 w-8 opacity-80" />
                      </div>
                    )}
                  </div>
                  {selected && (
                    <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-brand-500 text-white">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                  <div className="truncate px-2 py-1.5 text-[11px] font-medium">
                    {name}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </StepShell>
  );
}

/* ─────────────────────────  Bio  ───────────────────────── */

function BioStep({ plan, patch, runTool, onNext, onBack }: StepProps) {
  const [loading, setLoading] = useState(false);
  const [bios, setBios] = useState<Record<string, unknown>[]>([]);

  async function gen() {
    setLoading(true);
    try {
      const { result } = await runTool("bio", {
        channelName: plan.handle || plan.channelName || "@me",
        niche: plan.niche || "",
        cta: "Get followers",
      });
      setBios(arr(result.bios));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't write bios.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <StepShell
      icon={AtSign}
      eyebrow="Step 4 · Brand"
      title="Write your bio"
      blurb="One line that tells a stranger why to follow. We write versions sized for every platform — pick your favorite."
      footer={<Footer onBack={onBack} onNext={onNext} skip={onNext} nextLabel="Continue" />}
    >
      <div className="space-y-4">
        <RunButton
          label={bios.length ? "Rewrite bios" : "Write my bios"}
          cost={1}
          loading={loading}
          onClick={gen}
          icon={AtSign}
        />
        {bios.length > 0 && (
          <div className="space-y-2.5">
            {bios.map((b, i) => {
              const text = str(b.text);
              const selected = plan.bio === text;
              return (
                <PickCard
                  key={i}
                  selected={selected}
                  onClick={() => patch({ bio: text, bioPlatform: str(b.platform) })}
                >
                  <div className="flex items-center gap-2 pr-6">
                    <span className="rounded-md bg-bg-soft px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted">
                      {str(b.platform)}
                    </span>
                    {num(b.charCount) > 0 && (
                      <span className="font-mono text-[10px] text-muted">
                        {num(b.charCount)}/{num(b.limit)}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm">{text}</p>
                </PickCard>
              );
            })}
          </div>
        )}
      </div>
    </StepShell>
  );
}

/* ─────────────────────────  Idea  ───────────────────────── */

function IdeaStep({ plan, patch, runTool, onNext, onBack }: StepProps) {
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<Record<string, unknown>[]>([]);
  const [own, setOwn] = useState(plan.videoTopic || "");

  async function gen() {
    setLoading(true);
    try {
      const { result } = await runTool("ideas", {
        niche: plan.niche || "",
        goal: "Maximize views",
      });
      setIdeas(arr(result.trending));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't get ideas.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <StepShell
      icon={Lightbulb}
      eyebrow="Step 5 · First video"
      title="Pick your first video"
      blurb="The first video matters most — it sets your channel's tone. We'll suggest ideas specific enough to film this week."
      footer={
        <Footer
          onBack={onBack}
          onNext={onNext}
          nextDisabled={!plan.videoTopic}
          nextLabel={plan.videoTopic ? "Build the package" : "Pick an idea first"}
        />
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <LabeledInput
              label="Have an idea already?"
              value={own}
              onChange={setOwn}
              placeholder="I tried every productivity app for 30 days"
            />
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              if (!own.trim()) return toast.error("Type your video idea.");
              patch({ videoTopic: own.trim(), videoWhy: undefined });
              toast.success("Topic set.");
            }}
            size="md"
          >
            Use this
          </Button>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted">
          <span className="h-px flex-1 bg-border" /> or get ideas{" "}
          <span className="h-px flex-1 bg-border" />
        </div>

        <RunButton
          label={ideas.length ? "More ideas" : "Get video ideas"}
          cost={2}
          loading={loading}
          onClick={gen}
          icon={Lightbulb}
        />

        {ideas.length > 0 && (
          <div className="space-y-2.5">
            {ideas.map((it, i) => {
              const title = str(it.title);
              const selected = plan.videoTopic === title;
              return (
                <PickCard
                  key={i}
                  selected={selected}
                  onClick={() => patch({ videoTopic: title, videoWhy: str(it.why) })}
                >
                  <div className="pr-6 font-semibold">{title}</div>
                  <p className="mt-1 text-xs text-muted">{str(it.why)}</p>
                  {str(it.filmability) && (
                    <p className="mt-1 text-xs text-brand-600">
                      To film: {str(it.filmability)}
                    </p>
                  )}
                </PickCard>
              );
            })}
          </div>
        )}
      </div>
    </StepShell>
  );
}

/* ─────────────────────────  Package  ───────────────────────── */

function PackageStep({ plan, patch, runTool, onNext, onBack }: StepProps) {
  const [loading, setLoading] = useState(false);
  const [titles, setTitles] = useState<Record<string, unknown>[]>([]);
  const [built, setBuilt] = useState(false);

  async function build() {
    if (!plan.videoTopic) return;
    setLoading(true);
    try {
      // Run the three package tools. Titles + thumbnails can go together;
      // scripts after so we don't overwhelm the rate limiter.
      const [titlesRes, thumbsRes] = await Promise.all([
        runTool("titles", { topic: plan.videoTopic }),
        runTool("thumbnails", { topic: plan.videoTopic, style: "MrBeast" }),
      ]);
      const scriptRes = await runTool("scripts", {
        topic: plan.videoTopic,
        format: "Long-form (8-12 min)",
        tone: "Energetic",
      });

      const titleList = arr(titlesRes.result.titles);
      setTitles(titleList);

      const thumbs = arr(thumbsRes.result.concepts);
      const firstThumb = thumbs[0] || {};

      const sr = scriptRes.result as Record<string, unknown>;

      patch({
        title: str((titleList[0] || {}).text) || str(titlesRes.result.topPick),
        thumbnailImage: str(firstThumb.image),
        thumbnailOverlay: str(firstThumb.overlayText),
        script: {
          hook: str(sr.hook),
          sections: arr(sr.sections).map((s) => ({
            heading: str(s.heading),
            script: str(s.script),
            approxSeconds: num(s.approxSeconds),
          })),
          cta: str(sr.cta),
        },
      });
      setBuilt(true);
      toast.success("Your video package is ready.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't build the package.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <StepShell
      icon={Clapperboard}
      eyebrow="Step 6 · First video"
      title="Build the full package"
      blurb={`One click turns "${plan.videoTopic}" into a title, a thumbnail, and a complete script — the whole video, ready to film.`}
      footer={
        <Footer
          onBack={onBack}
          onNext={onNext}
          nextDisabled={!built}
          nextLabel={built ? "See my launch kit" : "Build it first"}
        />
      }
    >
      <div className="space-y-5">
        {!built && (
          <RunButton
            label="Build my video package"
            cost={6}
            loading={loading}
            onClick={build}
            icon={Clapperboard}
          />
        )}

        {loading && (
          <div className="space-y-3">
            <div className="skeleton h-10 rounded-xl" />
            <div className="skeleton aspect-video rounded-2xl" />
            <div className="skeleton h-32 rounded-2xl" />
          </div>
        )}

        {built && (
          <div className="space-y-5">
            {/* Thumbnail */}
            <div>
              <SectionLabel icon={Clapperboard} text="Thumbnail" />
              <div className="relative mt-2 aspect-video overflow-hidden rounded-2xl border border-border bg-bg-soft">
                {plan.thumbnailImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={plan.thumbnailImage}
                    alt="Thumbnail"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-muted">
                    <Clapperboard className="h-8 w-8" />
                  </div>
                )}
                {plan.thumbnailOverlay && (
                  <span className="absolute bottom-3 left-3 rounded-lg bg-ink/70 px-2.5 py-1 text-sm font-bold text-white backdrop-blur">
                    {plan.thumbnailOverlay}
                  </span>
                )}
              </div>
            </div>

            {/* Titles */}
            <div>
              <SectionLabel icon={FileText} text="Pick your title" />
              <div className="mt-2 space-y-2">
                {titles.slice(0, 5).map((t, i) => {
                  const text = str(t.text);
                  const selected = plan.title === text;
                  return (
                    <PickCard
                      key={i}
                      selected={selected}
                      onClick={() => patch({ title: text })}
                    >
                      <div className="flex items-start justify-between gap-3 pr-6">
                        <span className="text-sm font-medium">{text}</span>
                        <ScoreBadge score={num(t.ctrScore)} />
                      </div>
                      {str(t.pattern) && (
                        <p className="mt-1 text-xs text-muted">{str(t.pattern)}</p>
                      )}
                    </PickCard>
                  );
                })}
              </div>
            </div>

            {/* Script preview */}
            {plan.script && (
              <div>
                <SectionLabel icon={FileText} text="Your script" />
                <div className="mt-2 space-y-3 rounded-2xl border border-border bg-bg-soft p-4">
                  {plan.script.hook && (
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-wider text-brand-600">
                        Hook (first 15s)
                      </div>
                      <p className="mt-0.5 text-sm">{plan.script.hook}</p>
                    </div>
                  )}
                  {(plan.script.sections || []).slice(0, 3).map((s, i) => (
                    <div key={i}>
                      <div className="text-sm font-semibold">{s.heading}</div>
                      <p className="mt-0.5 line-clamp-3 text-sm text-muted">
                        {s.script}
                      </p>
                    </div>
                  ))}
                  {(plan.script.sections?.length || 0) > 3 && (
                    <p className="text-xs text-muted">
                      + {(plan.script.sections!.length - 3)} more sections in your kit.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </StepShell>
  );
}

/* ─────────────────────────  Done  ───────────────────────── */

function DoneStep({ plan, onRestart }: { plan: LaunchPlan; onRestart: () => void }) {
  const checklist = [
    `Create your channel — name it "${plan.channelName || "your channel"}"${plan.handle ? ` (${plan.handle})` : ""} and upload the profile picture.`,
    plan.bio ? `Paste your bio: "${plan.bio}"` : "Add a short bio that says who you help.",
    `Write/record using the script for "${plan.videoTopic || "your first video"}" — start with the hook word-for-word.`,
    `Film B-roll and record voice, then edit. Use the thumbnail${plan.thumbnailOverlay ? ` with the text "${plan.thumbnailOverlay}"` : ""}.`,
    `Upload with the title "${plan.title || "your chosen title"}" and post. Reply to every comment in the first hour.`,
  ];

  return (
    <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-400 text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.5)]">
          <PartyPopper className="h-6 w-6" />
        </div>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-brand-600">
            Your launch kit
          </p>
          <h2 className="text-2xl font-bold tracking-tight">You&apos;re ready to launch.</h2>
        </div>
      </div>

      {/* Kit summary */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <KitCard label="Niche">
          <p className="font-semibold">{plan.niche || "—"}</p>
        </KitCard>
        <KitCard label="Channel">
          <div className="flex items-center gap-3">
            {plan.pfpImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={plan.pfpImage}
                alt="PFP"
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="grid h-10 w-10 place-items-center rounded-full bg-bg-soft text-muted">
                <UserCircle className="h-5 w-5" />
              </div>
            )}
            <div>
              <p className="font-semibold leading-tight">{plan.channelName || "—"}</p>
              {plan.handle && (
                <p className="font-mono text-xs text-brand-600">{plan.handle}</p>
              )}
            </div>
          </div>
        </KitCard>
        {plan.bio && (
          <KitCard label="Bio">
            <p className="text-sm">{plan.bio}</p>
          </KitCard>
        )}
        <KitCard label="First video">
          <div className="flex items-center gap-3">
            {plan.thumbnailImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={plan.thumbnailImage}
                alt="Thumbnail"
                className="h-12 w-20 shrink-0 rounded-lg object-cover"
              />
            ) : null}
            <p className="text-sm font-semibold">{plan.title || plan.videoTopic || "—"}</p>
          </div>
        </KitCard>
      </div>

      {/* How to make it */}
      <div className="mt-7">
        <h3 className="text-sm font-semibold">Exactly how to make this video</h3>
        <ol className="mt-3 space-y-2.5">
          {checklist.map((c, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-50 font-mono text-xs font-semibold text-brand-700">
                {i + 1}
              </span>
              <span className="text-sm leading-relaxed">{c}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-8 flex flex-wrap gap-3 border-t border-border pt-6">
        <Link href="/dashboard/library" className={buttonClasses("primary", "md")}>
          <FileText className="h-4 w-4" />
          View saved in Library
        </Link>
        <Link href="/dashboard/tools/scripts" className={buttonClasses("secondary", "md")}>
          Refine the script
        </Link>
        <Link
          href={`/dashboard/tools/autovideo?topic=${encodeURIComponent(
            plan.videoTopic || "",
          )}&format=Both`}
          className={buttonClasses("secondary", "md")}
        >
          <Clapperboard className="h-4 w-4" />
          Auto-generate this video
        </Link>
        <button
          onClick={onRestart}
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Plan another channel
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────  Small UI bits  ───────────────────────── */

interface StepProps {
  plan: LaunchPlan;
  patch: (p: Partial<LaunchPlan>) => void;
  runTool: (slug: string, inputs: Record<string, string>) => Promise<GenResult>;
  onNext: () => void;
  onBack: () => void;
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-border bg-bg-soft px-3.5 text-sm outline-none placeholder:text-muted/60 focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/15"
      />
    </label>
  );
}

function LabeledTextarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="w-full rounded-xl border border-border bg-bg-soft px-3.5 py-2.5 text-sm outline-none placeholder:text-muted/60 focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/15"
      />
    </label>
  );
}

function ChosenBanner({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-brand-500/30 bg-brand-50 px-3.5 py-2.5 text-sm text-brand-700">
      <Check className="h-4 w-4" />
      <span className="font-medium">Locked in:</span> {text}
    </div>
  );
}

function SectionLabel({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-sm font-semibold">
      <Icon className="h-4 w-4 text-brand-600" />
      {text}
    </div>
  );
}

function KitCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-bg-soft p-4">
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted">
        {label}
      </div>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
