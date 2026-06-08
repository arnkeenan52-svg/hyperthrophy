"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { ChevronRight, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { usePlans } from "@/hooks/useDb";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { dateKey } from "@/lib/utils";

const dayLabel: Record<string, string> = {
  UPPER_HEAVY: "Upper · Heavy",
  LOWER_HEAVY: "Lower · Heavy",
  PUSH_VOLUME: "Push · Volume",
  PULL_VOLUME: "Pull · Volume",
  LEGS_VOLUME: "Legs · Volume",
};

export default function PlansPage() {
  const plans = usePlans();
  const counts = useLiveQuery(async () => {
    const all = await db.planExercises.toArray();
    const m = new Map<string, number>();
    for (const pe of all) m.set(pe.planId, (m.get(pe.planId) ?? 0) + 1);
    return m;
  });

  async function createPlan() {
    const order = (plans?.length ?? 0) + 1;
    const id = `custom-${dateKey()}-${Math.random().toString(36).slice(2, 6)}`;
    await db.plans.add({
      id,
      order,
      name: "New plan",
      dayType: "PUSH_VOLUME",
      focus: "Custom",
    });
    window.location.href = `/plans/${id}`;
  }

  if (!plans) return <div className="h-40 animate-pulse rounded-2xl bg-surface" />;

  return (
    <div className="space-y-4 animate-fade-up">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">My plans</h1>
          <p className="text-sm text-muted-foreground">Your 5-day split</p>
        </div>
      </header>

      <div className="space-y-2">
        {plans.map((p) => (
          <Link key={p.id} href={`/plans/${p.id}`}>
            <Card className="flex items-center justify-between p-4 transition-colors hover:border-ember/40">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-surface-2 font-display text-lg font-bold text-ember">
                  {p.order}
                </div>
                <div>
                  <p className="font-semibold">{dayLabel[p.dayType] ?? p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {counts?.get(p.id) ?? 0} exercises
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={p.focus === "Heavy" ? "ember" : "current"}>{p.focus}</Badge>
                <ChevronRight className="size-4 text-muted-foreground" />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <Button variant="secondary" className="w-full" onClick={createPlan}>
        <Plus className="size-4" /> New plan
      </Button>
    </div>
  );
}
