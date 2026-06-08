import type { MovementCat, SetLog } from "@/lib/db/types";

export type OverloadAction = "increase" | "hold" | "hold-add-reps";

export interface OverloadResult {
  action: OverloadAction;
  suggestedWeightKg: number | null;
  deltaKg: number;
  reason: string;
}

/** Weight increment by movement category, per the user's rules. */
export function incrementFor(cat: MovementCat): number {
  switch (cat) {
    case "barbell":
      return 2.5; // 2.5–5kg → default to the conservative 2.5
    case "dumbbell":
      return 2;
    case "machine":
    case "cable":
      return 5;
    case "bw":
      return 0;
  }
}

/**
 * Progressive-overload engine. Given the working sets from the most recent
 * session of an exercise and its target rep range, decide next session's
 * suggested weight.
 *
 *  - All working sets hit the TOP of the range  → add weight.
 *  - Any working set below the BOTTOM           → hold the same weight.
 *  - Otherwise                                  → hold weight, chase more reps.
 */
export function suggestNextWeight(
  lastSets: Pick<SetLog, "weightKg" | "reps" | "isWarmup" | "completed">[],
  repMin: number,
  repMax: number,
  cat: MovementCat,
): OverloadResult {
  const working = lastSets.filter(
    (s) => !s.isWarmup && s.completed && s.reps != null && s.weightKg != null,
  );

  if (working.length === 0) {
    return {
      action: "hold",
      suggestedWeightKg: null,
      deltaKg: 0,
      reason: "No previous data yet.",
    };
  }

  // Use the top working weight as the baseline for the suggestion.
  const baseWeight = Math.max(...working.map((s) => s.weightKg as number));
  const allHitTop = working.every((s) => (s.reps as number) >= repMax);
  const anyBelowBottom = working.some((s) => (s.reps as number) < repMin);
  const delta = incrementFor(cat);

  if (allHitTop && delta > 0) {
    return {
      action: "increase",
      suggestedWeightKg: baseWeight + delta,
      deltaKg: delta,
      reason: `Hit ${repMax} on every set — add ${delta}kg.`,
    };
  }

  if (anyBelowBottom) {
    return {
      action: "hold",
      suggestedWeightKg: baseWeight,
      deltaKg: 0,
      reason: `Missed the bottom of ${repMin}–${repMax}. Repeat ${baseWeight}kg.`,
    };
  }

  return {
    action: "hold-add-reps",
    suggestedWeightKg: baseWeight,
    deltaKg: 0,
    reason: `Stay at ${baseWeight}kg and chase ${repMax} reps.`,
  };
}
