"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { Plan } from "@/lib/db/types";

export function useProfile() {
  return useLiveQuery(() => db.profile.get("me"));
}

export function useSettings() {
  return useLiveQuery(() => db.settings.get("app"));
}

export function usePlans() {
  return useLiveQuery(() => db.plans.orderBy("order").toArray());
}

export function useBodyweight() {
  return useLiveQuery(() => db.bodyweight.orderBy("date").toArray());
}

/** All completed + active sessions, newest first. */
export function useSessions() {
  return useLiveQuery(() =>
    db.sessions.orderBy("date").reverse().toArray(),
  );
}

export function useActiveSession() {
  // `.first()` returns undefined both while loading AND when there's no active
  // session — coalesce the "resolved but empty" case to null so callers can
  // distinguish loading (undefined) from no-active-session (null).
  return useLiveQuery(
    async () => (await db.sessions.where("status").equals("active").first()) ?? null,
  );
}

export function useAllSetLogs() {
  return useLiveQuery(() => db.setLogs.toArray());
}

export function useExercisesMap() {
  return useLiveQuery(async () => {
    const all = await db.exercises.toArray();
    return new Map(all.map((e) => [e.id, e]));
  });
}

/** Decide which plan is "today" by cycling the split after the last session. */
export function nextPlan(plans: Plan[], lastPlanId: string | null): Plan | null {
  if (plans.length === 0) return null;
  if (!lastPlanId) return plans[0];
  const idx = plans.findIndex((p) => p.id === lastPlanId);
  if (idx === -1) return plans[0];
  return plans[(idx + 1) % plans.length];
}
