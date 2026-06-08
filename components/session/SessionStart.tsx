"use client";

import { useSearchParams } from "next/navigation";
import { Dumbbell, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePlans, useSessions, nextPlan } from "@/hooks/useDb";
import { startFreestyle, startSessionFromPlan } from "@/lib/session";

const dayLabel: Record<string, string> = {
  UPPER_HEAVY: "Upper · Heavy",
  LOWER_HEAVY: "Lower · Heavy",
  PUSH_VOLUME: "Push · Volume",
  PULL_VOLUME: "Pull · Volume",
  LEGS_VOLUME: "Legs · Volume",
};

export function SessionStart() {
  const params = useSearchParams();
  const plans = usePlans();
  const sessions = useSessions();
  const completed = (sessions ?? []).filter((s) => s.status === "completed");

  const preselect = params.get("plan");
  const suggested =
    (plans ?? []).find((p) => p.id === preselect) ??
    nextPlan(plans ?? [], completed[0]?.planId ?? null);

  return (
    <div className="space-y-6 animate-fade-up">
      <header>
        <h1 className="font-display text-2xl font-bold">Start training</h1>
        <p className="text-sm text-muted-foreground">
          Pick today&apos;s plan — weights pre-fill from your history.
        </p>
      </header>

      {suggested && (
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-ember/15 to-transparent" />
          <div className="relative p-5">
            <Badge variant="ember" className="mb-2">Recommended next</Badge>
            <h2 className="font-display text-2xl font-bold">{dayLabel[suggested.dayType]}</h2>
            <Button
              size="lg"
              className="mt-4 w-full"
              onClick={() => startSessionFromPlan(suggested.id)}
            >
              <Dumbbell className="size-5" /> Start {suggested.name}
            </Button>
          </div>
        </Card>
      )}

      <section>
        <h3 className="mb-2 font-display font-semibold">All plans</h3>
        <div className="space-y-2">
          {(plans ?? []).map((p) => (
            <button
              key={p.id}
              onClick={() => startSessionFromPlan(p.id)}
              className="w-full text-left"
            >
              <Card className="flex items-center justify-between p-3.5 transition-colors hover:border-ember/40">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-surface-2 text-sm font-bold text-muted-foreground">
                    {p.order}
                  </div>
                  <span className="font-medium">{dayLabel[p.dayType]}</span>
                </div>
                <Dumbbell className="size-4 text-muted-foreground" />
              </Card>
            </button>
          ))}
        </div>
      </section>

      <Button variant="secondary" className="w-full" onClick={() => startFreestyle()}>
        <Sparkles className="size-4" /> Freestyle session
      </Button>
    </div>
  );
}
