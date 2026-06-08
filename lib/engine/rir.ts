import type { FailureRule } from "@/lib/db/types";

export interface RirCue {
  target: string; // short label, e.g. "1–2 RIR"
  cue: string; // coaching line shown on the set
  toFailureAllowed: boolean;
  capped: boolean; // big-compound cap warning
}

/**
 * Per-set RIR guidance from the user's intensity protocol:
 *  - Most sets: 1–2 RIR.
 *  - Last set: 0 RIR (to failure) allowed...
 *  - ...EXCEPT big compounds (Bench/Squat/Row): never true failure, cap at 1 RIR
 *    even on the last set, with a clear reminder.
 */
export function rirForSet(
  rule: FailureRule,
  setIndex: number,
  totalSets: number,
): RirCue {
  const isLast = setIndex >= totalSets - 1;

  if (rule === "cap1RIR") {
    return isLast
      ? {
          target: "≤1 RIR",
          cue: "Big lift — stop 1 rep shy. Never to true failure.",
          toFailureAllowed: false,
          capped: true,
        }
      : {
          target: "1–2 RIR",
          cue: "Leave 1–2 in the tank.",
          toFailureAllowed: false,
          capped: true,
        };
  }

  // lastSetToFailure
  return isLast
    ? {
        target: "0 RIR",
        cue: "Last set — take it to failure if you've got it.",
        toFailureAllowed: true,
        capped: false,
      }
    : {
        target: "1–2 RIR",
        cue: "Leave 1–2 in the tank.",
        toFailureAllowed: false,
        capped: false,
      };
}
