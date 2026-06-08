"use client";

import { use } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, ChevronDown, ChevronUp, ShieldAlert, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import type { PlanExercise } from "@/lib/db/types";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ExercisePicker } from "@/components/session/ExercisePicker";

export default function PlanEditor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const plan = useLiveQuery(() => db.plans.get(id), [id]);
  const exercises = useLiveQuery(
    () => db.planExercises.where("planId").equals(id).sortBy("order"),
    [id],
  );

  async function updatePe(peId: string, patch: Partial<PlanExercise>) {
    await db.planExercises.update(peId, patch);
  }

  async function remove(peId: string) {
    await db.planExercises.delete(peId);
  }

  async function move(list: PlanExercise[], index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= list.length) return;
    const a = list[index];
    const b = list[target];
    await db.planExercises.update(a.id, { order: b.order });
    await db.planExercises.update(b.id, { order: a.order });
  }

  async function addExercise(ex: { id: string; name: string }) {
    const order = exercises?.length ?? 0;
    await db.planExercises.add({
      id: `${id}-${Date.now()}`,
      planId: id,
      order,
      exerciseId: ex.id,
      name: ex.name,
      targetSets: 3,
      repMin: 8,
      repMax: 12,
      restSec: 90,
      movementCat: "machine",
      failureRule: "lastSetToFailure",
      seedWeightKg: null,
    });
  }

  if (!plan || !exercises)
    return <div className="h-40 animate-pulse rounded-2xl bg-surface" />;

  return (
    <div className="space-y-4 animate-fade-up">
      <Link href="/plans" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Plans
      </Link>

      <Input
        value={plan.name}
        onChange={(e) => db.plans.update(id, { name: e.target.value })}
        className="font-display text-lg font-bold"
      />

      <div className="space-y-2">
        {exercises.map((pe, i) => (
          <Card key={pe.id} className="p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <p className="font-medium leading-tight">{pe.name}</p>
                {pe.failureRule === "cap1RIR" && (
                  <ShieldAlert className="size-3.5 shrink-0 text-current" />
                )}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => move(exercises, i, -1)} className="rounded-md p-1 text-muted-foreground active:scale-90">
                  <ChevronUp className="size-4" />
                </button>
                <button onClick={() => move(exercises, i, 1)} className="rounded-md p-1 text-muted-foreground active:scale-90">
                  <ChevronDown className="size-4" />
                </button>
                <button onClick={() => remove(pe.id)} className="rounded-md p-1 text-muted-foreground/60 active:scale-90">
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2">
              <NumField label="Sets" value={pe.targetSets} onChange={(v) => updatePe(pe.id, { targetSets: v })} />
              <NumField label="Rep min" value={pe.repMin} onChange={(v) => updatePe(pe.id, { repMin: v })} />
              <NumField label="Rep max" value={pe.repMax} onChange={(v) => updatePe(pe.id, { repMax: v })} />
              <NumField label="Rest s" value={pe.restSec} onChange={(v) => updatePe(pe.id, { restSec: v })} />
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="text-xs text-muted-foreground">
                Category
                <select
                  value={pe.movementCat}
                  onChange={(e) => updatePe(pe.id, { movementCat: e.target.value as PlanExercise["movementCat"] })}
                  className="mt-1 h-9 w-full rounded-lg border border-input bg-surface-2 px-2 text-sm capitalize text-foreground"
                >
                  {["barbell", "dumbbell", "machine", "cable", "bw"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-muted-foreground">
                Intensity
                <select
                  value={pe.failureRule}
                  onChange={(e) => updatePe(pe.id, { failureRule: e.target.value as PlanExercise["failureRule"] })}
                  className="mt-1 h-9 w-full rounded-lg border border-input bg-surface-2 px-2 text-sm text-foreground"
                >
                  <option value="lastSetToFailure">Last set to failure</option>
                  <option value="cap1RIR">Big lift · cap 1 RIR</option>
                </select>
              </label>
            </div>
          </Card>
        ))}
      </div>

      <ExercisePicker onPick={addExercise} />
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="text-[11px] text-muted-foreground">
      {label}
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="mt-1 h-9 w-full rounded-lg border border-input bg-surface-2 px-2 text-center font-mono text-sm tabular-nums text-foreground"
      />
    </label>
  );
}
