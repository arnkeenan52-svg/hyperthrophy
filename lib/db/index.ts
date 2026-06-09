import Dexie, { type Table } from "dexie";
import type {
  BodyweightEntry,
  Check,
  Exercise,
  OneRmRef,
  Plan,
  PlanExercise,
  Profile,
  ProtocolDay,
  Session,
  SessionExercise,
  SetLog,
  Settings,
} from "./types";
import {
  EXCLUDED_KEYWORDS,
  ONE_RM_REFS,
  PROGRAM,
  SEED_BODYWEIGHT_KG,
  SEED_PROFILE,
} from "@/lib/data/program";
import { dateKey } from "@/lib/utils";

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

class HypertrophyDB extends Dexie {
  profile!: Table<Profile, string>;
  bodyweight!: Table<BodyweightEntry, number>;
  exercises!: Table<Exercise, string>;
  plans!: Table<Plan, string>;
  planExercises!: Table<PlanExercise, string>;
  sessions!: Table<Session, number>;
  sessionExercises!: Table<SessionExercise, number>;
  setLogs!: Table<SetLog, number>;
  oneRmRefs!: Table<OneRmRef, number>;
  settings!: Table<Settings, string>;
  protocolDays!: Table<ProtocolDay, number>;
  checks!: Table<Check, string>;

  constructor() {
    super("hyperthrophy");
    this.version(1).stores({
      profile: "id",
      bodyweight: "++id, date",
      exercises: "id, category, *primaryMuscles, *equipment",
      plans: "id, order",
      planExercises: "id, planId, order",
      sessions: "++id, date, status, planId",
      sessionExercises: "++id, sessionId, order",
      setLogs: "++id, sessionExerciseId, exerciseId, date",
      oneRmRefs: "++id, exerciseId",
      settings: "id",
      protocolDays: "++id, date",
    });
    // v2: set check-offs for the Workout guide.
    this.version(2).stores({
      checks: "key, [week+dayId]",
    });
  }
}

export const db = new HypertrophyDB();

interface RawExercise {
  name: string;
  category?: string;
  description?: string;
  equipment?: string[];
  primary_muscles?: string[];
  secondary_muscles?: string[];
  instructions?: string[];
  tips?: string[];
  video?: string;
  images?: string[];
}

async function loadLibrary(): Promise<Exercise[]> {
  const res = await fetch("/data/exercises.json");
  const data = (await res.json()) as { exercises: RawExercise[] };
  const seen = new Set<string>();
  const out: Exercise[] = [];

  for (const e of data.exercises) {
    if (!e.name) continue;
    const lower = e.name.toLowerCase();
    // Honor the rule: deadlifts never appear anywhere.
    if (EXCLUDED_KEYWORDS.some((k) => lower.includes(k))) continue;

    let id = slugify(e.name);
    if (!id) continue;
    let n = 2;
    while (seen.has(id)) id = `${slugify(e.name)}-${n++}`;
    seen.add(id);

    out.push({
      id,
      name: e.name,
      category: e.category ?? "strength",
      primaryMuscles: e.primary_muscles ?? [],
      secondaryMuscles: e.secondary_muscles ?? [],
      equipment: e.equipment ?? [],
      instructions: e.instructions ?? [],
      tips: e.tips ?? [],
      video: e.video ?? null,
      images: e.images ?? [],
      isCustom: false,
    });
  }
  return out;
}

/** Find the best library match for a planned exercise. */
function resolveExerciseId(
  library: Exercise[],
  byNorm: Map<string, string>,
  row: { name: string; match?: string },
): string | null {
  const candidates = [row.match, row.name].filter(Boolean) as string[];
  for (const c of candidates) {
    const hit = byNorm.get(norm(c));
    if (hit) return hit;
  }
  // loose contains match as a fallback
  const target = norm(row.match || row.name);
  const loose = library.find(
    (e) => norm(e.name).includes(target) || target.includes(norm(e.name)),
  );
  return loose?.id ?? null;
}

/** Seed the database with the program, lifts, profile, and exercise library. */
export async function seedIfNeeded(): Promise<void> {
  const existing = await db.settings.get("app");
  if (existing?.seeded) return;

  const library = await loadLibrary();
  const byNorm = new Map<string, string>();
  for (const e of library) {
    const key = norm(e.name);
    if (!byNorm.has(key)) byNorm.set(key, e.id);
  }

  const plans: Plan[] = [];
  const planExercises: PlanExercise[] = [];
  const oneRmRefs: OneRmRef[] = [];

  for (const day of PROGRAM) {
    plans.push({
      id: day.id,
      order: day.order,
      name: day.name,
      dayType: day.dayType,
      focus: day.focus,
    });
    day.exercises.forEach((row, i) => {
      planExercises.push({
        id: `${day.id}-${i}`,
        planId: day.id,
        order: i,
        exerciseId: resolveExerciseId(library, byNorm, row),
        name: row.name,
        targetSets: row.sets,
        repMin: row.repMin,
        repMax: row.repMax,
        restSec: row.restSec,
        movementCat: row.cat,
        failureRule: row.failure,
        seedWeightKg: row.seed ?? null,
        note: row.note,
      });
    });
  }

  for (const ref of ONE_RM_REFS) {
    const id = byNorm.get(norm(ref.match));
    if (id) oneRmRefs.push({ exerciseId: id, value: ref.value, source: "manual" });
  }

  await db.transaction(
    "rw",
    [
      db.exercises,
      db.plans,
      db.planExercises,
      db.profile,
      db.bodyweight,
      db.oneRmRefs,
      db.settings,
    ],
    async () => {
      await db.exercises.bulkPut(library);
      await db.plans.bulkPut(plans);
      await db.planExercises.bulkPut(planExercises);
      await db.profile.put({ ...SEED_PROFILE, updatedAt: Date.now() });
      await db.bodyweight.put({ date: dateKey(), weightKg: SEED_BODYWEIGHT_KG });
      if (oneRmRefs.length) await db.oneRmRefs.bulkPut(oneRmRefs);
      await db.settings.put({
        id: "app",
        restSoundOn: true,
        hapticsOn: true,
        seeded: true,
      });
    },
  );
}
