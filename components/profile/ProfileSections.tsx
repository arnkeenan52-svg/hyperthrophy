"use client";

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import {
  Activity,
  CheckCheck,
  Dumbbell,
  Footprints,
  HeartPulse,
  Loader2,
  Moon,
  Plus,
  Scale,
  Trash2,
  Trophy,
} from "lucide-react";
import { db } from "@/lib/db";
import { estimate1RM } from "@/lib/engine/oneRepMax";
import { NUTRITION } from "@/lib/data/protocol";
import { isNativeHealth, syncFromAppleHealth } from "@/lib/health";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { dateKey } from "@/lib/utils";

// ---------- Stats grid (from lifting + health) ----------
export function StatsGrid() {
  const lifts = useLiveQuery(() => db.bestLifts.toArray());
  const bodyweight = useLiveQuery(() => db.bodyweight.orderBy("date").toArray());
  const health = useLiveQuery(() => db.health.get("latest"));
  const checks = useLiveQuery(() => db.checks.toArray());

  const best = (lifts ?? [])
    .map((l) => ({ ...l, e1rm: estimate1RM(l.weightKg, l.reps) }))
    .sort((a, b) => b.e1rm - a.e1rm)[0];

  const bw = bodyweight?.length ? bodyweight[bodyweight.length - 1].weightKg : null;
  const weekAgo = Date.now() - 7 * 86400000;
  const setsThisWeek = (checks ?? []).filter((c) => c.ts >= weekAgo).length;

  const tiles = [
    { icon: Trophy, label: "Top e1RM", value: best ? Math.round(best.e1rm) : null, unit: "kg", accent: true },
    { icon: Dumbbell, label: "Lifts tracked", value: lifts?.length ?? 0, unit: "" },
    { icon: Scale, label: "Bodyweight", value: bw, unit: "kg" },
    { icon: CheckCheck, label: "Sets · 7d", value: setsThisWeek, unit: "" },
    { icon: Footprints, label: "Steps", value: health?.steps ?? null, unit: "" },
    { icon: Moon, label: "Sleep", value: health?.sleepH ?? null, unit: "h" },
    { icon: HeartPulse, label: "Resting HR", value: health?.restingHr ?? null, unit: "bpm" },
    { icon: Activity, label: best ? "Top lift" : "Add a lift", value: null, text: best?.name ?? "—" },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {tiles.map((t) => {
        const Icon = t.icon;
        return (
          <Card key={t.label} className="p-3.5">
            <Icon className={`mb-2 size-4 ${t.accent ? "text-ember" : "text-muted-foreground"}`} />
            {t.text !== undefined ? (
              <p className="truncate font-display text-base font-semibold leading-tight">{t.text}</p>
            ) : (
              <p className="font-poster text-3xl leading-none">
                {t.value != null ? t.value : "—"}
                {t.value != null && t.unit && (
                  <span className="ml-1 font-sans text-xs font-normal text-muted-foreground">{t.unit}</span>
                )}
              </p>
            )}
            <p className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">{t.label}</p>
          </Card>
        );
      })}
    </div>
  );
}

// ---------- Best lifts (editable) ----------
export function BestLifts() {
  const lifts = useLiveQuery(() => db.bestLifts.toArray());
  const [name, setName] = useState("");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");

  const sorted = (lifts ?? [])
    .map((l) => ({ ...l, e1rm: estimate1RM(l.weightKg, l.reps) }))
    .sort((a, b) => b.e1rm - a.e1rm);

  async function add() {
    const w = Number(weight);
    const r = Number(reps);
    if (!name.trim() || !w || !r) {
      toast.error("Add a lift name, weight and reps");
      return;
    }
    await db.bestLifts.add({ name: name.trim(), weightKg: w, reps: r, date: dateKey() });
    setName(""); setWeight(""); setReps("");
    toast.success("Lift saved");
  }

  return (
    <Card className="p-4">
      <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold uppercase tracking-wide">
        <Trophy className="size-4 text-ember" /> Best lifts
      </h3>

      {sorted.length > 0 ? (
        <div className="mb-3 space-y-2">
          {sorted.map((l) => (
            <div key={l.id} className="flex items-center justify-between gap-2 rounded-xl bg-surface-2/50 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate font-display font-semibold leading-tight">{l.name}</p>
                <p className="stat-num text-xs text-muted-foreground">{l.weightKg}kg × {l.reps}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-poster text-2xl leading-none text-ember">{Math.round(l.e1rm)}</span>
                <span className="text-[10px] uppercase text-muted-foreground">e1RM</span>
                <button onClick={() => db.bestLifts.delete(l.id!)} aria-label="Delete lift" className="text-muted-foreground/60 active:scale-90">
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mb-3 text-sm text-muted-foreground">Add your best lifts to track PRs and your estimated 1RM.</p>
      )}

      <div className="grid grid-cols-[1fr_auto_auto] gap-2">
        <Input placeholder="Lift (e.g. Bench Press)" value={name} onChange={(e) => setName(e.target.value)} />
        <Input className="w-20 text-center font-mono" inputMode="decimal" type="number" placeholder="kg" value={weight} onChange={(e) => setWeight(e.target.value)} />
        <Input className="w-16 text-center font-mono" inputMode="numeric" type="number" placeholder="reps" value={reps} onChange={(e) => setReps(e.target.value)} />
      </div>
      <Button onClick={add} className="mt-2 w-full">
        <Plus className="size-4" /> Add lift
      </Button>
    </Card>
  );
}

// ---------- Health ----------
export function HealthCard() {
  const health = useLiveQuery(() => db.health.get("latest"));
  const bw = useLiveQuery(() => db.bodyweight.orderBy("date").last());
  const [native, setNative] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    isNativeHealth() && setNative(true);
  }, []);

  async function sync() {
    setSyncing(true);
    try {
      await syncFromAppleHealth();
      toast.success("Synced from Apple Health");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSyncing(false);
    }
  }

  async function save(patch: Partial<{ steps: number | null; sleepH: number | null; restingHr: number | null }>) {
    const cur = (await db.health.get("latest")) ?? {
      id: "latest", steps: null, sleepH: null, restingHr: null, updatedAt: 0,
    };
    await db.health.put({ ...cur, ...patch, updatedAt: Date.now() });
  }
  const num = (v: string) => (v === "" ? null : Number(v));

  async function saveBw(v: string) {
    const w = Number(v);
    if (!w) return;
    const d = dateKey();
    const ex = await db.bodyweight.where("date").equals(d).first();
    if (ex) await db.bodyweight.update(ex.id!, { weightKg: w });
    else await db.bodyweight.add({ date: d, weightKg: w });
  }

  return (
    <Card className="p-4">
      <h3 className="mb-1 flex items-center gap-2 font-display text-lg font-semibold uppercase tracking-wide">
        <HeartPulse className="size-4 text-ember" /> Health
      </h3>
      <p className="mb-3 text-xs text-muted-foreground">
        Log today&apos;s metrics. (Auto-sync from Apple Health / Google Fit needs the native app — see notes.)
      </p>
      <div className="grid grid-cols-2 gap-2.5">
        <Metric label="Bodyweight" unit="kg" defaultValue={bw?.weightKg} onSave={saveBw} step="0.1" />
        <Metric label="Steps" unit="" defaultValue={health?.steps ?? undefined} onSave={(v) => save({ steps: num(v) })} />
        <Metric label="Sleep" unit="h" defaultValue={health?.sleepH ?? undefined} onSave={(v) => save({ sleepH: num(v) })} step="0.1" />
        <Metric label="Resting HR" unit="bpm" defaultValue={health?.restingHr ?? undefined} onSave={(v) => save({ restingHr: num(v) })} />
      </div>
      {native && (
        <Button onClick={sync} disabled={syncing} className="mt-3 w-full">
          {syncing ? <Loader2 className="size-4 animate-spin" /> : <HeartPulse className="size-4" />}
          {syncing ? "Syncing…" : "Sync Apple Health"}
        </Button>
      )}
    </Card>
  );
}

function Metric({
  label, unit, defaultValue, onSave, step,
}: {
  label: string; unit: string; defaultValue?: number; onSave: (v: string) => void; step?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] uppercase tracking-wide text-muted-foreground">{label}{unit && ` (${unit})`}</span>
      <Input
        type="number"
        inputMode="decimal"
        step={step}
        defaultValue={defaultValue ?? ""}
        onBlur={(e) => onSave(e.target.value)}
        className="text-center font-mono tabular-nums"
      />
    </label>
  );
}

// ---------- Nutrition (editable) ----------
export function NutritionCard() {
  const nut = useLiveQuery(() => db.nutrition.get("targets"));
  const v = {
    calories: nut?.calories ?? NUTRITION[0].value,
    protein: nut?.protein ?? NUTRITION[1].value,
    carbs: nut?.carbs ?? NUTRITION[2].value,
    fats: nut?.fats ?? NUTRITION[3].value,
  };
  async function save(patch: Partial<typeof v>) {
    await db.nutrition.put({ id: "targets", ...v, ...patch });
  }
  const rows: [string, keyof typeof v][] = [
    ["Calories", "calories"], ["Protein", "protein"], ["Carbs", "carbs"], ["Fats", "fats"],
  ];
  return (
    <Card className="p-4">
      <h3 className="mb-3 font-display text-lg font-semibold uppercase tracking-wide">Nutrition targets</h3>
      <div className="space-y-2">
        {rows.map(([label, key]) => (
          <div key={key} className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">{label}</span>
            <input
              defaultValue={v[key]}
              onBlur={(e) => save({ [key]: e.target.value } as Partial<typeof v>)}
              className="w-44 rounded-lg border border-input bg-surface-2 px-2 py-1 text-right text-sm font-medium text-foreground focus:border-ember/60 focus:outline-none"
            />
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Eat a solid meal 1–2h before training.</p>
    </Card>
  );
}
