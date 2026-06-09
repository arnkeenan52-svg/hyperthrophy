"use client";

import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Check as CheckIcon, ChevronDown, RotateCcw, ShieldAlert } from "lucide-react";
import { db } from "@/lib/db";
import type { Check, DayType, PlanExercise } from "@/lib/db/types";
import { WEEK_PLAN, roundTarget, weekFor } from "@/lib/data/weeks";
import { cn } from "@/lib/utils";

const dayLabel: Record<DayType, string> = {
  UPPER_HEAVY: "Upper",
  LOWER_HEAVY: "Lower",
  PUSH_VOLUME: "Push",
  PULL_VOLUME: "Pull",
  LEGS_VOLUME: "Legs",
};
const dayAccent: Record<DayType, string> = {
  UPPER_HEAVY: "#ff7a1a",
  LOWER_HEAVY: "#3b82f6",
  PUSH_VOLUME: "#fb7185",
  PULL_VOLUME: "#2dd4bf",
  LEGS_VOLUME: "#a78bfa",
};

export function WorkoutGuide() {
  const plans = useLiveQuery(() => db.plans.orderBy("order").toArray());
  const planExercises = useLiveQuery(() => db.planExercises.orderBy("order").toArray());

  const [week, setWeek] = useState(1);
  const [dayId, setDayId] = useState<string | null>(null);

  // restore last selection
  useEffect(() => {
    const w = Number(localStorage.getItem("hx-week"));
    if (w >= 1 && w <= 12) setWeek(w);
    const d = localStorage.getItem("hx-day");
    if (d) setDayId(d);
  }, []);
  useEffect(() => {
    localStorage.setItem("hx-week", String(week));
  }, [week]);
  useEffect(() => {
    if (dayId) localStorage.setItem("hx-day", dayId);
  }, [dayId]);

  // default to first plan once loaded
  useEffect(() => {
    if (!dayId && plans && plans.length) setDayId(plans[0].id);
  }, [plans, dayId]);

  const activeDay = (plans ?? []).find((p) => p.id === dayId) ?? plans?.[0];
  const exercises = useMemo(
    () => (planExercises ?? []).filter((pe) => pe.planId === activeDay?.id),
    [planExercises, activeDay],
  );

  const checks = useLiveQuery(
    async () => {
      if (!activeDay) return [] as Check[];
      return db.checks.where("[week+dayId]").equals([week, activeDay.id]).toArray();
    },
    [week, activeDay?.id],
  );
  const checkedKeys = useMemo(() => new Set((checks ?? []).map((c) => c.key)), [checks]);

  const wk = weekFor(week);
  const totalSets = exercises.reduce((n, e) => n + e.targetSets, 0);
  const doneSets = checkedKeys.size;

  async function toggle(key: string, checked: boolean) {
    if (!activeDay) return;
    if (checked) await db.checks.delete(key);
    else await db.checks.put({ key, week, dayId: activeDay.id, ts: Date.now() });
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(15);
  }

  async function resetDay() {
    if (!activeDay) return;
    const rows = await db.checks.where("[week+dayId]").equals([week, activeDay.id]).toArray();
    await db.checks.bulkDelete(rows.map((r) => r.key));
  }

  if (!plans || !planExercises) {
    return <div className="h-48 animate-pulse rounded-2xl bg-surface" />;
  }

  return (
    <div className="space-y-5 animate-fade-up">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ember/80">
          12-Week Program
        </p>
        <h1 className="font-display text-4xl font-bold uppercase leading-none tracking-tight">
          Workout
        </h1>
      </header>

      {/* Week selector */}
      <div className="relative">
        <label htmlFor="week" className="sr-only">Training week</label>
        <select
          id="week"
          value={week}
          onChange={(e) => setWeek(Number(e.target.value))}
          className="h-14 w-full cursor-pointer appearance-none rounded-2xl border border-white/10 bg-surface pl-4 pr-12 font-display text-xl font-semibold tracking-wide text-foreground focus:border-ember/60 focus:outline-none focus:ring-2 focus:ring-ring/30"
        >
          {WEEK_PLAN.map((w) => (
            <option key={w.week} value={w.week}>
              Week {w.week} — {w.phase}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
      </div>

      {/* Week directive banner */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-surface p-4">
        <span className="absolute inset-y-0 left-0 w-1 bg-ember" />
        <div className="flex items-center justify-between">
          <p className="font-display text-lg font-semibold uppercase tracking-wide text-ember-300">
            {wk.title}
          </p>
          <span className="stat-num text-xs text-muted-foreground">
            {wk.deload ? "DELOAD" : `${Math.round((wk.loadPct - 1) * 100) >= 0 ? "+" : ""}${Math.round((wk.loadPct - 1) * 100)}% load`}
          </span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{wk.directive}</p>
      </div>

      {/* Day selector */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {plans.map((p, i) => {
          const accent = dayAccent[p.dayType];
          const active = p.id === activeDay?.id;
          return (
            <button
              key={p.id}
              onClick={() => setDayId(p.id)}
              className={cn(
                "flex shrink-0 flex-col items-center rounded-xl border px-4 py-2 transition-all active:scale-95",
                active ? "border-transparent" : "border-white/10 bg-surface text-muted-foreground",
              )}
              style={active ? { background: `${accent}1f`, borderColor: accent, color: accent } : undefined}
            >
              <span className="font-display text-xs font-semibold uppercase tracking-wider opacity-70">
                Day {i + 1}
              </span>
              <span className="font-display text-base font-bold uppercase">{dayLabel[p.dayType]}</span>
            </button>
          );
        })}
      </div>

      {/* Program */}
      <div className="space-y-2.5">
        {exercises.map((pe) => (
          <ExerciseRow
            key={pe.id}
            pe={pe}
            week={week}
            loadPct={wk.loadPct}
            checkedKeys={checkedKeys}
            onToggle={toggle}
          />
        ))}
      </div>

      {/* Day footer */}
      <div className="flex items-center justify-between rounded-2xl border border-white/[0.07] bg-surface px-4 py-3">
        <div>
          <p className="stat-num text-lg font-bold">
            {doneSets}<span className="text-muted-foreground">/{totalSets}</span>
          </p>
          <p className="text-xs text-muted-foreground">sets done · Day {(plans.findIndex((p) => p.id === activeDay?.id) + 1)} · Week {week}</p>
        </div>
        <button
          onClick={resetDay}
          className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-sm text-muted-foreground active:scale-95"
        >
          <RotateCcw className="size-4" /> Reset
        </button>
      </div>
    </div>
  );
}

function ExerciseRow({
  pe,
  week,
  loadPct,
  checkedKeys,
  onToggle,
}: {
  pe: PlanExercise;
  week: number;
  loadPct: number;
  checkedKeys: Set<string>;
  onToggle: (key: string, checked: boolean) => void;
}) {
  const isBig = pe.failureRule === "cap1RIR";
  const target = pe.seedWeightKg ? roundTarget(pe.seedWeightKg * loadPct) : null;
  const reps = pe.repMin === pe.repMax ? `${pe.repMax}` : `${pe.repMin}–${pe.repMax}`;

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-display text-lg font-semibold leading-tight">{pe.name}</h3>
            {isBig && <ShieldAlert className="size-4 shrink-0 text-current" />}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            <span className="stat-num font-semibold text-foreground">{pe.targetSets} × {reps}</span>
            {" · "}rest {pe.restSec}s
            {isBig && <span className="text-current-400"> · cap 1 RIR</span>}
          </p>
        </div>
        {target != null && (
          <div className="shrink-0 rounded-xl bg-ember/10 px-3 py-1.5 text-right">
            <p className="stat-num text-lg font-bold leading-none text-ember-300">{target}</p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">kg target</p>
          </div>
        )}
      </div>

      {/* Set dots */}
      <div className="mt-3 flex flex-wrap gap-2">
        {Array.from({ length: pe.targetSets }).map((_, i) => {
          const key = `w${week}-${pe.id}-s${i}`;
          const checked = checkedKeys.has(key);
          return (
            <button
              key={key}
              onClick={() => onToggle(key, checked)}
              aria-label={`Set ${i + 1}${checked ? " done" : ""}`}
              className={cn(
                "flex size-11 items-center justify-center rounded-xl border text-sm font-semibold transition-all active:scale-90",
                checked
                  ? "border-transparent bg-ember text-black shadow-[0_4px_16px_-6px_rgba(255,122,26,0.7)]"
                  : "border-white/10 bg-surface-2 text-muted-foreground",
              )}
            >
              {checked ? <CheckIcon className="size-5" /> : <span className="stat-num">{i + 1}</span>}
            </button>
          );
        })}
      </div>

      {pe.note && <p className="mt-2.5 text-xs text-muted-foreground">{pe.note}</p>}
    </div>
  );
}
