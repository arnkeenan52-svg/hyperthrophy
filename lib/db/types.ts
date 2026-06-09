// Movement category drives the progressive-overload weight increment.
export type MovementCat = "barbell" | "dumbbell" | "machine" | "cable" | "bw";

// Failure rule per the user's intensity protocol.
//  - "lastSetToFailure": most sets 1–2 RIR, last set 0 RIR allowed
//  - "cap1RIR": big compounds (Bench/Squat/Row) — never true failure, cap at 1 RIR
export type FailureRule = "lastSetToFailure" | "cap1RIR";

export type DayType =
  | "UPPER_HEAVY"
  | "LOWER_HEAVY"
  | "PUSH_VOLUME"
  | "PULL_VOLUME"
  | "LEGS_VOLUME";

export interface Profile {
  id: string; // singleton: "me"
  name: string;
  age: number;
  heightCm: number;
  goalFocus: string;
  units: "kg";
  updatedAt: number;
}

export interface BodyweightEntry {
  id?: number;
  date: string; // YYYY-MM-DD
  weightKg: number;
}

export interface Exercise {
  id: string; // slug
  name: string;
  category: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string[];
  instructions: string[];
  tips: string[];
  video: string | null;
  images: string[];
  isCustom: boolean;
}

export interface Plan {
  id: string;
  order: number;
  name: string;
  dayType: DayType;
  focus: string; // short tagline
}

export interface PlanExercise {
  id: string;
  planId: string;
  order: number;
  exerciseId: string | null; // resolved library exercise, if matched
  name: string; // display name (may be an "A or B" choice)
  targetSets: number;
  repMin: number;
  repMax: number;
  restSec: number;
  movementCat: MovementCat;
  failureRule: FailureRule;
  seedWeightKg: number | null; // pre-fill for the very first session
  note?: string;
}

export type SessionStatus = "active" | "completed";

export interface Session {
  id?: number;
  planId: string | null; // null = freestyle
  dayType: DayType | null;
  name: string;
  date: string; // YYYY-MM-DD
  startedAt: number;
  endedAt: number | null;
  notes: string;
  status: SessionStatus;
}

export interface SessionExercise {
  id?: number;
  sessionId: number;
  exerciseId: string | null;
  name: string;
  order: number;
  targetSets: number;
  repMin: number;
  repMax: number;
  restSec: number;
  movementCat: MovementCat;
  failureRule: FailureRule;
  suggestedWeightKg: number | null;
  suggestionNote?: string; // e.g. "+2.5kg suggested" — shown as an acceptable hint
  note?: string;
}

export interface SetLog {
  id?: number;
  sessionExerciseId: number;
  exerciseId: string | null; // denormalized for fast history/PR queries
  setIndex: number;
  weightKg: number | null;
  reps: number | null;
  rirTarget: string; // e.g. "1–2", "0", "≤1"
  rirActual: number | null;
  isWarmup: boolean;
  toFailure: boolean;
  completed: boolean;
  date: string; // denormalized session date
}

// Manual 1RM reference points (e.g. bench 120kg) for the e1RM charts.
export interface OneRmRef {
  id?: number;
  exerciseId: string;
  value: number;
  source: "manual";
}

export interface Settings {
  id: string; // singleton: "app"
  restSoundOn: boolean;
  hapticsOn: boolean;
  seeded: boolean;
}

// Lightweight daily check-off for the "My Protocol" screen.
export interface ProtocolDay {
  id?: number;
  date: string;
  atePreWorkout: boolean;
  hitProtein: boolean;
  sleptEnough: boolean;
  noPhoneBeforeBed: boolean;
}

// A ticked-off set in the Workout guide. Key = `w{week}-{planExerciseId}-s{setIndex}`.
export interface Check {
  key: string;
  week: number;
  dayId: string;
  ts: number;
}

// A user-entered best lift / PR.
export interface BestLift {
  id?: number;
  name: string;
  weightKg: number;
  reps: number;
  date: string;
}

// Health metrics (manually entered, or imported from a health app export).
export interface Health {
  id: string; // singleton "latest"
  steps: number | null;
  sleepH: number | null;
  restingHr: number | null;
  updatedAt: number;
}

// Editable nutrition targets (override the defaults).
export interface NutritionTargets {
  id: string; // singleton "targets"
  calories: string;
  protein: string;
  carbs: string;
  fats: string;
}
