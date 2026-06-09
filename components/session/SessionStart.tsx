"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import { ArrowRight, Dumbbell, Loader2, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import type { DayType } from "@/lib/db/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePlans, useSessions, nextPlan } from "@/hooks/useDb";
import { startFreestyle, startSessionFromPlan } from "@/lib/session";

const dayLabel: Record<DayType, string> = {
  UPPER_HEAVY: "Upper · Heavy",
  LOWER_HEAVY: "Lower · Heavy",
  PUSH_VOLUME: "Push · Volume",
  PULL_VOLUME: "Pull · Volume",
  LEGS_VOLUME: "Legs · Volume",
};

// Per-day accent colors for a premium, glanceable split.
const dayAccent: Record<DayType, string> = {
  UPPER_HEAVY: "#ff7a1a",
  LOWER_HEAVY: "#3b82f6",
  PUSH_VOLUME: "#fb7185",
  PULL_VOLUME: "#2dd4bf",
  LEGS_VOLUME: "#a78bfa",
};

export function SessionStart() {
  const params = useSearchParams();
  const plans = usePlans();
  const sessions = useSessions();
  const [starting, setStarting] = useState<string | null>(null);

  const counts = useLiveQuery(async () => {
    const all = await db.planExercises.toArray();
    const m = new Map<string, number>();
    for (const pe of all) m.set(pe.planId, (m.get(pe.planId) ?? 0) + 1);
    return m;
  });

  const completed = (sessions ?? []).filter((s) => s.status === "completed");
  const preselect = params.get("plan");
  const suggested =
    (plans ?? []).find((p) => p.id === preselect) ??
    nextPlan(plans ?? [], completed[0]?.planId ?? null);

  async function start(kind: "plan" | "free", id?: string) {
    if (starting) return;
    setStarting(id ?? "free");
    try {
      if (kind === "plan" && id) await startSessionFromPlan(id);
      else await startFreestyle();
      // The active-session live query swaps the view automatically.
    } catch (err) {
      console.error("start session failed", err);
      toast.error("Couldn't start the session", {
        description: (err as Error)?.message ?? "Please try again.",
      });
      setStarting(null);
    }
  }

  return (
    <div className="space-y-7 animate-fade-up">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-ember/80">
          Today
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight">Start training</h1>
        <p className="text-sm text-muted-foreground">
          Pick a day — your weights pre-fill from history.
        </p>
      </header>

      {suggested && (
        <Card className="group relative overflow-hidden border-white/10">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-30 blur-3xl transition-opacity group-hover:opacity-50"
            style={{ background: dayAccent[suggested.dayType] }}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.06] to-transparent" />
          <div className="relative p-6">
            <Badge variant="ember" className="mb-3">
              <Sparkles className="size-3" /> Recommended next
            </Badge>
            <div className="flex items-center gap-3">
              <div
                className="flex size-12 items-center justify-center rounded-2xl text-black shadow-lg"
                style={{ background: dayAccent[suggested.dayType] }}
              >
                <Dumbbell className="size-6" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold leading-tight">
                  {dayLabel[suggested.dayType]}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {counts?.get(suggested.id) ?? 0} exercises · weights ready
                </p>
              </div>
            </div>
            <Button
              size="lg"
              className="mt-5 w-full"
              disabled={starting !== null}
              onClick={() => start("plan", suggested.id)}
            >
              {starting === suggested.id ? (
                <>
                  <Loader2 className="size-5 animate-spin" /> Starting…
                </>
              ) : (
                <>
                  <Dumbbell className="size-5" /> Start {suggested.name}
                  <ArrowRight className="size-5" />
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      <section>
        <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          All plans
        </h3>
        <div className="space-y-2.5">
          {(plans ?? []).map((p) => {
            const accent = dayAccent[p.dayType];
            const isStarting = starting === p.id;
            return (
              <button
                key={p.id}
                onClick={() => start("plan", p.id)}
                disabled={starting !== null}
                className="block w-full text-left disabled:opacity-60"
              >
                <Card className="relative flex items-center gap-3 overflow-hidden p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/15 active:scale-[0.99]">
                  <span
                    className="absolute inset-y-0 left-0 w-1"
                    style={{ background: accent }}
                  />
                  <div
                    className="flex size-10 shrink-0 items-center justify-center rounded-xl font-display text-base font-bold"
                    style={{ background: `${accent}1f`, color: accent }}
                  >
                    {p.order}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-tight">{dayLabel[p.dayType]}</p>
                    <p className="text-xs text-muted-foreground">
                      {counts?.get(p.id) ?? 0} exercises
                    </p>
                  </div>
                  {isStarting ? (
                    <Loader2 className="size-5 shrink-0 animate-spin text-ember" />
                  ) : (
                    <ArrowRight className="size-5 shrink-0 text-muted-foreground" />
                  )}
                </Card>
              </button>
            );
          })}
        </div>
      </section>

      <Button
        variant="secondary"
        className="w-full"
        disabled={starting !== null}
        onClick={() => start("free")}
      >
        {starting === "free" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Sparkles className="size-4" />
        )}
        Freestyle session
      </Button>
    </div>
  );
}
