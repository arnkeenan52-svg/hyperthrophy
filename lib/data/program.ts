import type { DayType, FailureRule, MovementCat } from "@/lib/db/types";

export interface SeedExerciseRow {
  name: string;
  sets: number;
  repMin: number;
  repMax: number;
  restSec: number;
  cat: MovementCat;
  failure: FailureRule;
  /** Pre-fill weight for the first session (from current lifts). */
  seed?: number;
  note?: string;
  /** Library lookup hint (overrides name matching) when names differ. */
  match?: string;
}

export interface SeedDay {
  id: string;
  order: number;
  name: string;
  dayType: DayType;
  focus: string;
  exercises: SeedExerciseRow[];
}

const big: FailureRule = "cap1RIR"; // Bench / Squat / Row — never true failure
const fail: FailureRule = "lastSetToFailure";

/**
 * The user's 5-day split, seeded verbatim.
 * Seed weights come from current lifts; bench is derived from a 120kg 1RM
 * (≈107.5kg for ~4 reps via Brzycki) and kept editable. Squat & OHP are left
 * blank on the first session by design. No deadlifts anywhere.
 */
export const PROGRAM: SeedDay[] = [
  {
    id: "upper-heavy",
    order: 1,
    name: "Upper",
    dayType: "UPPER_HEAVY",
    focus: "Heavy",
    exercises: [
      { name: "Barbell Bench Press", sets: 5, repMin: 3, repMax: 5, restSec: 180, cat: "barbell", failure: big, seed: 107.5 },
      { name: "Barbell Row", sets: 5, repMin: 3, repMax: 5, restSec: 180, cat: "barbell", failure: big, seed: 65, match: "bent over barbell row" },
      { name: "Overhead Press (barbell)", sets: 4, repMin: 4, repMax: 6, restSec: 120, cat: "barbell", failure: fail, match: "barbell shoulder press" },
      { name: "Cable Pullover", sets: 4, repMin: 4, repMax: 6, restSec: 120, cat: "cable", failure: fail, match: "straight arm pulldown" },
      { name: "Incline DB Press", sets: 3, repMin: 6, repMax: 8, restSec: 90, cat: "dumbbell", failure: fail, seed: 32, match: "incline dumbbell press" },
      { name: "Reverse Pec Deck", sets: 3, repMin: 12, repMax: 15, restSec: 60, cat: "machine", failure: fail, match: "reverse machine fly" },
    ],
  },
  {
    id: "lower-heavy",
    order: 2,
    name: "Lower",
    dayType: "LOWER_HEAVY",
    focus: "Heavy",
    exercises: [
      { name: "Barbell Squat", sets: 5, repMin: 3, repMax: 5, restSec: 180, cat: "barbell", failure: big, match: "barbell squat" },
      { name: "Hack Squat", sets: 4, repMin: 6, repMax: 8, restSec: 120, cat: "machine", failure: fail, match: "hack squat" },
      { name: "Leg Press", sets: 4, repMin: 8, repMax: 10, restSec: 120, cat: "machine", failure: fail, match: "leg press" },
      { name: "Leg Curl (machine)", sets: 4, repMin: 8, repMax: 10, restSec: 90, cat: "machine", failure: fail, match: "lying leg curls" },
      { name: "Seated Leg Curl", sets: 4, repMin: 8, repMax: 10, restSec: 90, cat: "machine", failure: fail, match: "seated leg curl", note: "Second hamstring curl variation" },
      { name: "Calf Raises", sets: 4, repMin: 12, repMax: 15, restSec: 60, cat: "machine", failure: fail, match: "standing machine calf raise" },
    ],
  },
  {
    id: "push-volume",
    order: 3,
    name: "Push",
    dayType: "PUSH_VOLUME",
    focus: "Volume",
    exercises: [
      { name: "Incline Barbell Press", sets: 4, repMin: 8, repMax: 10, restSec: 120, cat: "barbell", failure: fail, match: "barbell incline bench press medium grip" },
      { name: "DB Shoulder Press", sets: 4, repMin: 8, repMax: 10, restSec: 90, cat: "dumbbell", failure: fail, match: "dumbbell shoulder press" },
      { name: "Cable Chest Fly", sets: 4, repMin: 10, repMax: 12, restSec: 60, cat: "cable", failure: fail, match: "cable crossover" },
      { name: "Lateral Raises", sets: 4, repMin: 12, repMax: 15, restSec: 60, cat: "dumbbell", failure: fail, match: "side lateral raise" },
      { name: "Tricep Rope Pushdown", sets: 3, repMin: 12, repMax: 15, restSec: 60, cat: "cable", failure: fail, match: "triceps pushdown" },
      { name: "Overhead Tricep Extension", sets: 3, repMin: 10, repMax: 12, restSec: 60, cat: "cable", failure: fail, match: "cable rope overhead triceps extension" },
    ],
  },
  {
    id: "pull-volume",
    order: 4,
    name: "Pull",
    dayType: "PULL_VOLUME",
    focus: "Volume",
    exercises: [
      { name: "Lat Pulldown", sets: 4, repMin: 8, repMax: 10, restSec: 120, cat: "cable", failure: fail, seed: 80, match: "wide grip lat pulldown" },
      { name: "Cable Row (seated)", sets: 4, repMin: 10, repMax: 12, restSec: 90, cat: "cable", failure: fail, match: "seated cable rows" },
      { name: "DB Row (each arm)", sets: 4, repMin: 10, repMax: 12, restSec: 90, cat: "dumbbell", failure: fail, match: "one arm dumbbell row" },
      { name: "Reverse Pec Deck", sets: 4, repMin: 15, repMax: 15, restSec: 60, cat: "machine", failure: fail, match: "reverse machine fly" },
      { name: "Barbell/DB Curl", sets: 4, repMin: 10, repMax: 12, restSec: 60, cat: "dumbbell", failure: fail, seed: 18, match: "dumbbell bicep curl" },
      { name: "Hammer Curl", sets: 3, repMin: 10, repMax: 12, restSec: 60, cat: "dumbbell", failure: fail, match: "hammer curls" },
    ],
  },
  {
    id: "legs-volume",
    order: 5,
    name: "Legs",
    dayType: "LEGS_VOLUME",
    focus: "Volume",
    exercises: [
      { name: "Squat (moderate)", sets: 4, repMin: 8, repMax: 10, restSec: 120, cat: "barbell", failure: big, match: "barbell squat" },
      { name: "Leg Press", sets: 4, repMin: 10, repMax: 12, restSec: 90, cat: "machine", failure: fail, match: "leg press" },
      { name: "Hack Squat or Bulgarian Split Squat", sets: 3, repMin: 10, repMax: 10, restSec: 90, cat: "machine", failure: fail, match: "hack squat", note: "3×10 each — pick one" },
      { name: "Leg Extension", sets: 4, repMin: 12, repMax: 15, restSec: 60, cat: "machine", failure: fail, match: "leg extensions" },
      { name: "Leg Curl", sets: 4, repMin: 10, repMax: 12, restSec: 60, cat: "machine", failure: fail, match: "lying leg curls" },
      { name: "Calf Raises", sets: 5, repMin: 15, repMax: 20, restSec: 60, cat: "machine", failure: fail, match: "standing machine calf raise" },
    ],
  },
];

/** Manual 1RM references for the estimated-1RM charts. */
export const ONE_RM_REFS: { match: string; value: number }[] = [
  { match: "barbell bench press", value: 120 },
];

/** The user's profile, seeded into the Profile screen. */
export const SEED_PROFILE = {
  id: "me",
  name: "Athlete",
  age: 17,
  heightCm: 187,
  goalFocus:
    "Bring back / pull strength up to match pressing. Pressing is already strong — keep it, prioritize pull volume.",
  units: "kg" as const,
};

export const SEED_BODYWEIGHT_KG = 84;

/** Words that disqualify a library exercise from ever appearing. */
export const EXCLUDED_KEYWORDS = ["deadlift"];

/** Current lifts, shown as a reference on the Profile screen. */
export const CURRENT_LIFTS = [
  { lift: "Bench Press", detail: "120 kg (1RM)" },
  { lift: "DB Press", detail: "32 kg × 7 each" },
  { lift: "Shoulder Press (machine)", detail: "40 kg × 5–6 each" },
  { lift: "Bicep Curl", detail: "18 kg × 5–6 each" },
  { lift: "Row", detail: "65 kg × 5" },
  { lift: "Lat Pulldown", detail: "80 kg × 7–8" },
];
