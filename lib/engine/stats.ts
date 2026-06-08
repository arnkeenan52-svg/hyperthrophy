import type { Exercise, SetLog } from "@/lib/db/types";
import { estimate1RM } from "./oneRepMax";

export type LiftGroup = "pull" | "press" | "legs" | "other";

const PULL = ["lats", "middle back", "lower back", "traps", "biceps", "forearms"];
const PRESS = ["chest", "shoulders", "triceps"];
const LEGS = ["quadriceps", "hamstrings", "glutes", "calves", "abductors", "adductors"];

/** Classify an exercise as pull / press / legs for the focus metric. */
export function classifyExercise(ex: Pick<Exercise, "primaryMuscles">): LiftGroup {
  const m = ex.primaryMuscles.map((x) => x.toLowerCase());
  if (m.some((x) => PULL.includes(x))) return "pull";
  if (m.some((x) => PRESS.includes(x))) return "press";
  if (m.some((x) => LEGS.includes(x))) return "legs";
  return "other";
}

export function setVolume(s: Pick<SetLog, "weightKg" | "reps">): number {
  return (s.weightKg ?? 0) * (s.reps ?? 0);
}

export function totalVolume(sets: SetLog[]): number {
  return sets.reduce((n, s) => n + setVolume(s), 0);
}

/** ISO-ish week key (YYYY-Www) from a YYYY-MM-DD date string. */
export function weekKey(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day + 3);
  const firstThursday = new Date(d.getFullYear(), 0, 4);
  const week =
    1 +
    Math.round(
      ((d.getTime() - firstThursday.getTime()) / 86400000 -
        3 +
        ((firstThursday.getDay() + 6) % 7)) /
        7,
    );
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

export interface VolumePoint {
  week: string;
  label: string;
  volume: number;
}

/** Weekly training volume for the last `weeks` weeks (chronological). */
export function weeklyVolume(sets: SetLog[], weeks = 8): VolumePoint[] {
  const byWeek = new Map<string, number>();
  for (const s of sets) byWeek.set(weekKey(s.date), (byWeek.get(weekKey(s.date)) ?? 0) + setVolume(s));

  const out: VolumePoint[] = [];
  const now = new Date();
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    const key = weekKey(d.toISOString().slice(0, 10));
    out.push({ week: key, label: key.split("-W")[1], volume: byWeek.get(key) ?? 0 });
  }
  return out;
}

/** Volume in the current calendar week. */
export function thisWeekVolume(sets: SetLog[]): number {
  const wk = weekKey(new Date().toISOString().slice(0, 10));
  return sets.filter((s) => weekKey(s.date) === wk).reduce((n, s) => n + setVolume(s), 0);
}

/** Estimated-1RM progression for one exercise (best e1RM per session date). */
export function e1rmSeries(
  sets: Pick<SetLog, "weightKg" | "reps" | "date" | "isWarmup">[],
): { date: string; value: number }[] {
  const byDate = new Map<string, number>();
  for (const s of sets) {
    if (s.isWarmup || !s.weightKg || !s.reps) continue;
    const e = estimate1RM(s.weightKg, s.reps);
    byDate.set(s.date, Math.max(byDate.get(s.date) ?? 0, e));
  }
  return [...byDate.entries()]
    .map(([date, value]) => ({ date, value: Math.round(value * 10) / 10 }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export interface PR {
  exerciseId: string;
  name: string;
  bestE1RM: number;
  bestWeight: number;
  bestReps: number;
  date: string;
}

/** Best estimated-1RM PR per exercise. */
export function personalRecords(
  sets: SetLog[],
  nameOf: (id: string) => string,
): PR[] {
  const map = new Map<string, PR>();
  for (const s of sets) {
    if (s.isWarmup || !s.exerciseId || !s.weightKg || !s.reps) continue;
    const e = estimate1RM(s.weightKg, s.reps);
    const cur = map.get(s.exerciseId);
    if (!cur || e > cur.bestE1RM) {
      map.set(s.exerciseId, {
        exerciseId: s.exerciseId,
        name: nameOf(s.exerciseId),
        bestE1RM: Math.round(e * 10) / 10,
        bestWeight: s.weightKg,
        bestReps: s.reps,
        date: s.date,
      });
    }
  }
  return [...map.values()].sort((a, b) => b.date.localeCompare(a.date));
}

/** Pull vs press volume balance over a window, with pull trend vs the prior window. */
export function pullPressBalance(
  sets: SetLog[],
  groupOf: (exerciseId: string | null) => LiftGroup,
  windowDays = 28,
) {
  const now = Date.now();
  const cutoff = now - windowDays * 86400000;
  const prevCutoff = now - 2 * windowDays * 86400000;

  let pull = 0,
    press = 0,
    legs = 0,
    pullPrev = 0;
  for (const s of sets) {
    const t = new Date(s.date + "T00:00:00").getTime();
    const g = groupOf(s.exerciseId);
    const v = setVolume(s);
    if (t >= cutoff) {
      if (g === "pull") pull += v;
      else if (g === "press") press += v;
      else if (g === "legs") legs += v;
    } else if (t >= prevCutoff && g === "pull") {
      pullPrev += v;
    }
  }
  const ratio = press > 0 ? pull / press : pull > 0 ? Infinity : 0;
  const pullTrendPct = pullPrev > 0 ? ((pull - pullPrev) / pullPrev) * 100 : null;
  return { pull, press, legs, ratio, pullTrendPct };
}

/** Current streak: consecutive days ending today/yesterday with a session. */
export function dayStreak(sessionDates: string[]): number {
  const days = new Set(sessionDates);
  let streak = 0;
  const cursor = new Date();
  // allow the streak to "hold" if today is a rest day but yesterday was trained
  if (!days.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
