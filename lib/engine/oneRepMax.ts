// Brzycki formula, matching wger's approach.

/** Estimated 1RM from a working set. */
export function estimate1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  // cap reps at 36 to avoid the formula blowing up
  const r = Math.min(reps, 12);
  return weight * (36 / (37 - r));
}

/** Inverse: the working weight expected for a given rep target from a known 1RM. */
export function weightForReps(oneRm: number, reps: number): number {
  if (oneRm <= 0 || reps <= 0) return 0;
  if (reps === 1) return oneRm;
  const r = Math.min(reps, 12);
  return oneRm * ((37 - r) / 36);
}

/** Round to the nearest plate-friendly increment. */
export function roundToIncrement(value: number, increment = 2.5): number {
  return Math.round(value / increment) * increment;
}
