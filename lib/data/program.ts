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
 * Bump when the PROGRAM below changes so existing installs re-seed the new
 * plans (without wiping best lifts, bodyweight, health, nutrition).
 */
export const PROGRAM_VERSION = 2;

/**
 * Back-Priority Hypertrophy Program (Rebalanced).
 * Pull/back volume raised to match an already-strong press; quads trimmed;
 * side delts and hinge work added. No deadlifts (hinge via back extension /
 * hip thrust). Back-led Upper day. Target-weight display is off in the guide,
 * so seed weights are omitted here.
 */
export const PROGRAM: SeedDay[] = [
  {
    id: "upper-heavy",
    order: 1,
    name: "Upper",
    dayType: "UPPER_HEAVY",
    focus: "Heavy",
    exercises: [
      { name: "Barbell Row", sets: 4, repMin: 5, repMax: 7, restSec: 180, cat: "barbell", failure: big, match: "bent over barbell row", note: "Lead here — back is the priority. Or chest-supported row." },
      { name: "Weighted Pull-up or Lat Pulldown", sets: 4, repMin: 6, repMax: 8, restSec: 150, cat: "cable", failure: fail, match: "wide grip lat pulldown" },
      { name: "Barbell Bench Press", sets: 4, repMin: 4, repMax: 6, restSec: 180, cat: "barbell", failure: big, match: "barbell bench press" },
      { name: "Overhead Press (barbell)", sets: 3, repMin: 5, repMax: 7, restSec: 150, cat: "barbell", failure: fail, match: "barbell shoulder press" },
      { name: "Chest-Supported / Seated Cable Row", sets: 3, repMin: 8, repMax: 10, restSec: 90, cat: "cable", failure: fail, match: "seated cable rows" },
      { name: "Reverse Pec Deck", sets: 3, repMin: 12, repMax: 15, restSec: 60, cat: "machine", failure: fail, match: "reverse machine fly", note: "Rear delts." },
    ],
  },
  {
    id: "lower-heavy",
    order: 2,
    name: "Lower",
    dayType: "LOWER_HEAVY",
    focus: "Heavy",
    exercises: [
      { name: "Barbell Squat", sets: 4, repMin: 4, repMax: 6, restSec: 180, cat: "barbell", failure: big, match: "barbell squat" },
      { name: "45° Back Extension (or Hip Thrust)", sets: 3, repMin: 10, repMax: 12, restSec: 90, cat: "machine", failure: fail, match: "hyperextensions back extensions", note: "Hinge stimulus — hams, glutes, erectors. Not a deadlift." },
      { name: "Leg Press", sets: 3, repMin: 8, repMax: 10, restSec: 120, cat: "machine", failure: fail, match: "leg press" },
      { name: "Seated Leg Curl", sets: 4, repMin: 8, repMax: 10, restSec: 90, cat: "machine", failure: fail, match: "seated leg curl" },
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
      { name: "DB Shoulder Press", sets: 3, repMin: 8, repMax: 10, restSec: 90, cat: "dumbbell", failure: fail, match: "dumbbell shoulder press" },
      { name: "Cable Chest Fly", sets: 4, repMin: 10, repMax: 12, restSec: 60, cat: "cable", failure: fail, match: "cable crossover" },
      { name: "Lateral Raises", sets: 5, repMin: 12, repMax: 15, restSec: 60, cat: "dumbbell", failure: fail, match: "side lateral raise", note: "Side delts — your weak point. Push these." },
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
      { name: "Lat Pulldown (or Pull-up variation)", sets: 4, repMin: 8, repMax: 10, restSec: 120, cat: "cable", failure: fail, match: "wide grip lat pulldown" },
      { name: "Chest-Supported / Seated Cable Row", sets: 4, repMin: 10, repMax: 12, restSec: 90, cat: "cable", failure: fail, match: "seated cable rows" },
      { name: "DB Row (each arm)", sets: 3, repMin: 10, repMax: 12, restSec: 90, cat: "dumbbell", failure: fail, match: "one arm dumbbell row" },
      { name: "Straight-Arm Pulldown", sets: 3, repMin: 12, repMax: 15, restSec: 60, cat: "cable", failure: fail, match: "straight arm pulldown", note: "Lat isolation — drive with the elbows." },
      { name: "Face Pull / Reverse Pec Deck", sets: 4, repMin: 15, repMax: 15, restSec: 60, cat: "cable", failure: fail, match: "face pull", note: "Rear delts." },
      { name: "Barbell/DB Curl", sets: 3, repMin: 8, repMax: 10, restSec: 60, cat: "dumbbell", failure: fail, match: "dumbbell bicep curl" },
      { name: "Hammer Curl", sets: 3, repMin: 10, repMax: 12, restSec: 60, cat: "dumbbell", failure: fail, match: "hammer curls", note: "Optional if short on time." },
    ],
  },
  {
    id: "legs-volume",
    order: 5,
    name: "Legs",
    dayType: "LEGS_VOLUME",
    focus: "Volume",
    exercises: [
      { name: "Hack Squat or Moderate Squat", sets: 3, repMin: 8, repMax: 10, restSec: 120, cat: "machine", failure: big, match: "hack squat", note: "Pick one." },
      { name: "Leg Press", sets: 3, repMin: 10, repMax: 12, restSec: 90, cat: "machine", failure: fail, match: "leg press" },
      { name: "Leg Extension", sets: 3, repMin: 12, repMax: 15, restSec: 60, cat: "machine", failure: fail, match: "leg extensions" },
      { name: "Leg Curl", sets: 4, repMin: 10, repMax: 12, restSec: 60, cat: "machine", failure: fail, match: "lying leg curls" },
      { name: "Lateral Raises", sets: 3, repMin: 15, repMax: 20, restSec: 45, cat: "dumbbell", failure: fail, match: "side lateral raise", note: "Extra side-delt volume." },
      { name: "Calf Raises", sets: 4, repMin: 15, repMax: 20, restSec: 60, cat: "machine", failure: fail, match: "standing machine calf raise" },
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
