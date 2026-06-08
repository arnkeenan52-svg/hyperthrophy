import { db } from "@/lib/db";
import type { Plan, SetLog } from "@/lib/db/types";
import { suggestNextWeight } from "@/lib/engine/overload";
import { dateKey } from "@/lib/utils";

const dayLabel: Record<string, string> = {
  UPPER_HEAVY: "Upper · Heavy",
  LOWER_HEAVY: "Lower · Heavy",
  PUSH_VOLUME: "Push · Volume",
  PULL_VOLUME: "Pull · Volume",
  LEGS_VOLUME: "Legs · Volume",
};

/** Most recent completed session's working sets for an exercise (by id or name). */
export async function lastSetsFor(
  exerciseId: string | null,
  name: string,
): Promise<SetLog[]> {
  // Find candidate sessionExercises (previous occurrences of this movement).
  let exList = exerciseId
    ? await db.sessionExercises.where("sessionId").above(0).filter((se) => se.exerciseId === exerciseId).toArray()
    : await db.sessionExercises.filter((se) => se.name === name).toArray();

  if (exList.length === 0) return [];

  // Group by session, pick the latest session that has logged sets.
  const sessions = await db.sessions.where("status").equals("completed").toArray();
  const orderedSessionIds = sessions
    .sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0))
    .map((s) => s.id!);

  for (const sid of orderedSessionIds) {
    const se = exList.find((e) => e.sessionId === sid);
    if (!se) continue;
    const sets = await db.setLogs.where("sessionExerciseId").equals(se.id!).toArray();
    if (sets.some((s) => s.completed)) return sets;
  }
  return [];
}

/** Create (or resume) an active session from a plan, with suggested weights. */
export async function startSessionFromPlan(planId: string): Promise<number> {
  const active = await db.sessions.where("status").equals("active").first();
  if (active) return active.id!;

  const plan = (await db.plans.get(planId)) as Plan;
  const planExercises = await db.planExercises
    .where("planId")
    .equals(planId)
    .sortBy("order");

  const sessionId = (await db.sessions.add({
    planId,
    dayType: plan.dayType,
    name: dayLabel[plan.dayType] ?? plan.name,
    date: dateKey(),
    startedAt: Date.now(),
    endedAt: null,
    notes: "",
    status: "active",
  })) as number;

  for (const pe of planExercises) {
    const history = await lastSetsFor(pe.exerciseId, pe.name);
    let suggested: number | null;
    let suggestionNote: string | undefined;
    if (history.length > 0) {
      const res = suggestNextWeight(history, pe.repMin, pe.repMax, pe.movementCat);
      suggested = res.suggestedWeightKg;
      if (res.action === "increase") suggestionNote = `+${res.deltaKg}kg suggested`;
      else if (res.action === "hold-add-reps") suggestionNote = `Chase ${pe.repMax} reps`;
      else suggestionNote = `Repeat ${suggested}kg`;
    } else {
      suggested = pe.seedWeightKg; // first-ever session: seed or blank
      if (suggested != null) suggestionNote = "Starting weight";
    }
    await db.sessionExercises.add({
      sessionId,
      exerciseId: pe.exerciseId,
      name: pe.name,
      order: pe.order,
      targetSets: pe.targetSets,
      repMin: pe.repMin,
      repMax: pe.repMax,
      restSec: pe.restSec,
      movementCat: pe.movementCat,
      failureRule: pe.failureRule,
      suggestedWeightKg: suggested,
      suggestionNote,
      note: pe.note,
    });
  }
  return sessionId;
}

/** Start an empty freestyle session. */
export async function startFreestyle(): Promise<number> {
  const active = await db.sessions.where("status").equals("active").first();
  if (active) return active.id!;
  return (await db.sessions.add({
    planId: null,
    dayType: null,
    name: "Freestyle",
    date: dateKey(),
    startedAt: Date.now(),
    endedAt: null,
    notes: "",
    status: "active",
  })) as number;
}

/** Add an exercise to an active session (freestyle or extra movement). */
export async function addExerciseToSession(
  sessionId: number,
  exercise: { id: string | null; name: string },
): Promise<void> {
  const count = await db.sessionExercises.where("sessionId").equals(sessionId).count();
  const history = await lastSetsFor(exercise.id, exercise.name);
  await db.sessionExercises.add({
    sessionId,
    exerciseId: exercise.id,
    name: exercise.name,
    order: count,
    targetSets: 3,
    repMin: 8,
    repMax: 12,
    restSec: 90,
    movementCat: "machine",
    failureRule: "lastSetToFailure",
    suggestedWeightKg: history[0]?.weightKg ?? null,
    note: undefined,
  });
}

export async function addSet(
  se: {
    id: number;
    exerciseId: string | null;
    suggestedWeightKg: number | null;
    rirTarget: string;
  },
  date: string,
): Promise<number> {
  const count = await db.setLogs.where("sessionExerciseId").equals(se.id).count();
  return (await db.setLogs.add({
    sessionExerciseId: se.id,
    exerciseId: se.exerciseId,
    setIndex: count,
    weightKg: se.suggestedWeightKg,
    reps: null,
    rirTarget: se.rirTarget,
    rirActual: null,
    isWarmup: false,
    toFailure: false,
    completed: false,
    date,
  })) as number;
}

export async function finishSession(sessionId: number): Promise<void> {
  // Drop empty (uncompleted, no-rep) sets to keep history clean.
  const ses = await db.sessionExercises.where("sessionId").equals(sessionId).toArray();
  for (const se of ses) {
    const sets = await db.setLogs.where("sessionExerciseId").equals(se.id!).toArray();
    for (const s of sets) {
      if (!s.completed && s.reps == null) await db.setLogs.delete(s.id!);
    }
  }
  await db.sessions.update(sessionId, { status: "completed", endedAt: Date.now() });
}

export async function cancelSession(sessionId: number): Promise<void> {
  const ses = await db.sessionExercises.where("sessionId").equals(sessionId).toArray();
  for (const se of ses) {
    await db.setLogs.where("sessionExerciseId").equals(se.id!).delete();
  }
  await db.sessionExercises.where("sessionId").equals(sessionId).delete();
  await db.sessions.delete(sessionId);
}
