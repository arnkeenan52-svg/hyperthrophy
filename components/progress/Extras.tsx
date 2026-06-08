"use client";

import { useState } from "react";
import { Trophy, TrendingUp, Plus } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import type { Exercise, SetLog, Session } from "@/lib/db/types";
import {
  LiftGroup,
  personalRecords,
  pullPressBalance,
  setVolume,
} from "@/lib/engine/stats";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn, dateKey, formatNumber } from "@/lib/utils";

const dayLabel: Record<string, string> = {
  UPPER_HEAVY: "Upper · Heavy",
  LOWER_HEAVY: "Lower · Heavy",
  PUSH_VOLUME: "Push · Volume",
  PULL_VOLUME: "Pull · Volume",
  LEGS_VOLUME: "Legs · Volume",
};

export function PullFocusCard({
  sets,
  groupOf,
}: {
  sets: SetLog[];
  groupOf: (id: string | null) => LiftGroup;
}) {
  const { pull, press, ratio, pullTrendPct } = pullPressBalance(sets, groupOf, 28);
  const total = pull + press;
  const pullPct = total > 0 ? (pull / total) * 100 : 50;

  return (
    <Card className="relative overflow-hidden p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-current/10 to-transparent" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold">Pull focus</h3>
          {pullTrendPct != null && (
            <Badge variant="current">
              <TrendingUp className="size-3" />
              {pullTrendPct >= 0 ? "+" : ""}
              {Math.round(pullTrendPct)}% pull
            </Badge>
          )}
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Back/pull vs pressing volume · last 28 days
        </p>
        <div className="flex h-3 overflow-hidden rounded-full bg-surface-2">
          <div className="bg-current" style={{ width: `${pullPct}%` }} />
          <div className="bg-ember/70" style={{ width: `${100 - pullPct}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-xs">
          <span className="text-current-400">Pull {formatNumber(pull)}kg</span>
          <span className="text-muted-foreground">
            ratio {ratio === Infinity ? "∞" : ratio.toFixed(2)}
          </span>
          <span className="text-ember-300">Press {formatNumber(press)}kg</span>
        </div>
        {ratio !== Infinity && ratio < 1 && total > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Pressing still leads — keep prioritizing pull volume.
          </p>
        )}
        {ratio >= 1 && total > 0 && (
          <p className="mt-2 text-xs text-current-400">
            Pull volume is matching or beating press. Goal on track. 🎯
          </p>
        )}
      </div>
    </Card>
  );
}

export function CalendarHeatmap({ sets }: { sets: SetLog[] }) {
  const byDay = new Map<string, number>();
  for (const s of sets) byDay.set(s.date, (byDay.get(s.date) ?? 0) + (s.completed ? setVolume(s) : 0));
  const max = Math.max(1, ...byDay.values());

  const weeks = 12;
  const today = new Date();
  const dow = (today.getDay() + 6) % 7; // Mon=0
  const start = new Date(today);
  start.setDate(today.getDate() - dow - (weeks - 1) * 7);

  const cols: { date: string; vol: number }[][] = [];
  for (let w = 0; w < weeks; w++) {
    const col: { date: string; vol: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(start);
      day.setDate(start.getDate() + w * 7 + d);
      const key = dateKey(day);
      col.push({ date: key, vol: byDay.get(key) ?? 0 });
    }
    cols.push(col);
  }

  function shade(vol: number) {
    if (vol <= 0) return "bg-surface-2";
    const t = vol / max;
    if (t > 0.66) return "bg-ember";
    if (t > 0.33) return "bg-ember/60";
    return "bg-ember/30";
  }

  return (
    <Card className="p-4">
      <h3 className="mb-3 font-display font-semibold">Training calendar</h3>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {cols.map((col, i) => (
          <div key={i} className="flex flex-col gap-1">
            {col.map((cell) => (
              <div
                key={cell.date}
                title={`${cell.date}: ${formatNumber(cell.vol)}kg`}
                className={cn("size-4 rounded-[4px]", shade(cell.vol), cell.date === dateKey(today) && "ring-1 ring-foreground/40")}
              />
            ))}
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">Last 12 weeks</p>
    </Card>
  );
}

export function PRList({ sets, exercises }: { sets: SetLog[]; exercises: Map<string, Exercise> }) {
  const prs = personalRecords(sets, (id) => exercises.get(id)?.name ?? id).slice(0, 6);
  if (prs.length === 0) return null;
  return (
    <Card className="p-4">
      <h3 className="mb-3 flex items-center gap-2 font-display font-semibold">
        <Trophy className="size-4 text-gold" /> Personal records
      </h3>
      <div className="space-y-2">
        {prs.map((pr) => (
          <div key={pr.exerciseId} className="flex items-center justify-between text-sm">
            <span className="truncate pr-2">{pr.name}</span>
            <span className="stat-num shrink-0 text-muted-foreground">
              {pr.bestWeight}kg×{pr.bestReps} ·{" "}
              <span className="font-semibold text-gold">{Math.round(pr.bestE1RM)}</span> e1RM
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function BodyweightLogger({ latest }: { latest: number | null }) {
  const [value, setValue] = useState("");
  async function save() {
    const w = Number(value);
    if (!w || w <= 0) return;
    const today = dateKey();
    const existing = await db.bodyweight.where("date").equals(today).first();
    if (existing) await db.bodyweight.update(existing.id!, { weightKg: w });
    else await db.bodyweight.add({ date: today, weightKg: w });
    setValue("");
    toast.success(`Logged ${w}kg`);
  }
  return (
    <div className="flex gap-2">
      <Input
        inputMode="decimal"
        type="number"
        placeholder={latest ? `${latest}kg` : "Today's weight"}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button onClick={save} variant="secondary" className="shrink-0">
        <Plus className="size-4" /> Log
      </Button>
    </div>
  );
}

export function SessionHistory({
  sessions,
  setsBySession,
}: {
  sessions: Session[];
  setsBySession: Map<number, SetLog[]>;
}) {
  const done = sessions.filter((s) => s.status === "completed");
  if (done.length === 0)
    return (
      <Card className="p-6 text-center text-sm text-muted-foreground">
        No sessions logged yet.
      </Card>
    );
  return (
    <div className="space-y-2">
      {done.map((s) => {
        const sets = setsBySession.get(s.id!) ?? [];
        const vol = sets.reduce((n, x) => n + setVolume(x), 0);
        const label = s.dayType ? dayLabel[s.dayType] : s.name;
        return (
          <Card key={s.id} className="flex items-center justify-between p-3.5">
            <div>
              <p className="font-medium">{label}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(s.date + "T00:00:00").toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="stat-num text-sm font-semibold text-ember">{formatNumber(vol)}kg</p>
              <p className="text-xs text-muted-foreground">{sets.length} sets</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
