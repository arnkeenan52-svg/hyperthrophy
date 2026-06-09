// 12-week hypertrophy progression. Each week applies a directive + load factor
// on top of the base 5-day program. Pull volume is prioritized throughout.

export interface WeekPlan {
  week: number;
  phase: string;
  title: string;
  directive: string;
  /** Multiplier applied to a lift's baseline weight to show this week's target. */
  loadPct: number;
  deload?: boolean;
}

export const WEEK_PLAN: WeekPlan[] = [
  { week: 1, phase: "Foundation", title: "Dial it in", directive: "Establish your working weights. Stop 1–2 reps short of failure on every set.", loadPct: 1.0 },
  { week: 2, phase: "Foundation", title: "Add reps", directive: "Same weights as week 1 — squeeze out 1–2 more reps per set.", loadPct: 1.0 },
  { week: 3, phase: "Build", title: "Add load", directive: "+2.5kg barbells · +2kg dumbbells · +5kg machines. Keep 1–2 in reserve.", loadPct: 1.025 },
  { week: 4, phase: "Build", title: "Add volume", directive: "Add one extra set to every exercise — about +25% volume.", loadPct: 1.025 },
  { week: 5, phase: "Push", title: "Heavier", directive: "Add load again. Take the LAST set of each isolation to failure.", loadPct: 1.05 },
  { week: 6, phase: "Push", title: "Peak block 1", directive: "Top set to failure on everything — except Bench, Squat & Row (cap 1 RIR).", loadPct: 1.05 },
  { week: 7, phase: "Deload", title: "Recover", directive: "Recovery week. Half the sets, ~70% weight. Move easy and let it heal.", loadPct: 0.7, deload: true },
  { week: 8, phase: "Reset", title: "Reload", directive: "Back to hard sets — start 2.5kg above your week-6 working weights.", loadPct: 1.075 },
  { week: 9, phase: "Volume", title: "Pile it on", directive: "Add a set across the board again — chase +25% volume, lead with pull work.", loadPct: 1.075 },
  { week: 10, phase: "Intensity", title: "Go heavy", directive: "Heavier, lower reps. Add load and aim for the bottom of each range. 1 RIR.", loadPct: 1.1 },
  { week: 11, phase: "Overreach", title: "Beat the book", directive: "Beat every number from week 10. Last sets to failure — not the big 3.", loadPct: 1.125 },
  { week: 12, phase: "Peak", title: "Send it", directive: "Peak week — push for rep PRs on everything, then take a full deload after.", loadPct: 1.125 },
];

export function weekFor(week: number): WeekPlan {
  return WEEK_PLAN.find((w) => w.week === week) ?? WEEK_PLAN[0];
}

/** Round a target weight to the nearest 2.5kg for display. */
export function roundTarget(kg: number): number {
  return Math.round(kg / 2.5) * 2.5;
}
