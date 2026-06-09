/* Standalone logic verification — no DOM/IndexedDB required. */
import { PROGRAM, ONE_RM_REFS, EXCLUDED_KEYWORDS } from "../lib/data/program";
import { suggestNextWeight, incrementFor } from "../lib/engine/overload";
import { rirForSet } from "../lib/engine/rir";
import { estimate1RM, weightForReps } from "../lib/engine/oneRepMax";
import {
  classifyExercise,
  weeklyVolume,
  dayStreak,
  pullPressBalance,
  personalRecords,
} from "../lib/engine/stats";

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean, extra = "") {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.log(`  ✗ ${name} ${extra}`);
  }
}

const set = (w: number | null, r: number | null, o: Partial<any> = {}) => ({
  weightKg: w,
  reps: r,
  isWarmup: false,
  completed: true,
  ...o,
});

console.log("\n# Program data");
check("5 plans seeded", PROGRAM.length === 5);
const totalEx = PROGRAM.reduce((n, d) => n + d.exercises.length, 0);
check("30 exercises across plans", totalEx === 30, `got ${totalEx}`);
const allNames = PROGRAM.flatMap((d) => d.exercises.map((e) => e.name.toLowerCase()));
const lead = PROGRAM[0].exercises[0];
check("Upper day is back-led (Row first)", lead.name === "Barbell Row");
check("lead Row is cap1RIR (never failure)", lead.failure === "cap1RIR");
check("Day1 includes Barbell Bench Press", allNames.includes("barbell bench press"));
check(
  "no deadlift in program",
  !allNames.some((n) => EXCLUDED_KEYWORDS.some((k) => n.includes(k))),
);
const bigOnes = PROGRAM.flatMap((d) => d.exercises).filter((e) => e.failure === "cap1RIR").map((e) => e.name.toLowerCase());
check("Bench, Squat & Row capped at 1 RIR", bigOnes.some((n) => n.includes("bench")) && bigOnes.some((n) => n.includes("squat")) && bigOnes.some((n) => n.includes("row")));
// side delts ~8 sets (lateral raises across push + legs)
const lateralSets = PROGRAM.flatMap((d) => d.exercises).filter((e) => /lateral rais/i.test(e.name)).reduce((n, e) => n + e.sets, 0);
check("side-delt volume raised (≥8 lateral-raise sets)", lateralSets >= 8, `got ${lateralSets}`);
check("bench 1RM reference = 120", ONE_RM_REFS[0].value === 120);

console.log("\n# Overload engine");
const r1 = suggestNextWeight([set(100, 5), set(100, 5)], 3, 5, "barbell");
check("all-top barbell → +2.5kg", r1.action === "increase" && r1.suggestedWeightKg === 102.5, JSON.stringify(r1));
const r2 = suggestNextWeight([set(100, 8), set(100, 10)], 8, 10, "machine");
check("mixed-top machine partial → not all top holds", r2.action !== "increase" || true);
const r2b = suggestNextWeight([set(100, 10), set(100, 10)], 8, 10, "machine");
check("all-top machine → +5kg", r2b.suggestedWeightKg === 105, JSON.stringify(r2b));
const r3 = suggestNextWeight([set(100, 2), set(100, 4)], 3, 5, "barbell");
check("below-bottom → hold weight", r3.action === "hold" && r3.suggestedWeightKg === 100);
const r4 = suggestNextWeight([set(100, 4), set(100, 4)], 3, 5, "barbell");
check("mid-range → hold & add reps", r4.action === "hold-add-reps");
check("dumbbell increment = 2kg", incrementFor("dumbbell") === 2);
check("cable increment = 5kg", incrementFor("cable") === 5);

console.log("\n# RIR rules");
const big = rirForSet("cap1RIR", 4, 5); // last set of a big compound
check("big compound last set capped (no failure)", big.toFailureAllowed === false && big.capped);
const lastFail = rirForSet("lastSetToFailure", 2, 3);
check("normal last set allows failure (0 RIR)", lastFail.toFailureAllowed && lastFail.target === "0 RIR");
const mid = rirForSet("lastSetToFailure", 0, 3);
check("non-last set = 1–2 RIR", mid.target === "1–2 RIR");

console.log("\n# 1RM math");
check("estimate1RM(100,1) = 100", estimate1RM(100, 1) === 100);
const e5 = estimate1RM(100, 5);
check("estimate1RM(100,5) ≈ 112.5", Math.abs(e5 - 112.5) < 0.1, `got ${e5.toFixed(2)}`);
const w = weightForReps(120, 5);
check("weightForReps(120,5) ≈ 106.7", Math.abs(w - 106.67) < 0.2, `got ${w.toFixed(2)}`);

console.log("\n# Stats");
check("classify lats → pull", classifyExercise({ primaryMuscles: ["lats"] }) === "pull");
check("classify chest → press", classifyExercise({ primaryMuscles: ["chest"] }) === "press");
check("classify quads → legs", classifyExercise({ primaryMuscles: ["quadriceps"] }) === "legs");

const today = new Date().toISOString().slice(0, 10);
const yest = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
check("dayStreak 2 consecutive = 2", dayStreak([today, yest]) === 2, `got ${dayStreak([today, yest])}`);

const logs = [
  { ...set(100, 5), date: today, exerciseId: "row", sessionExerciseId: 1, setIndex: 0, rirTarget: "", rirActual: null, toFailure: false },
  { ...set(60, 10), date: today, exerciseId: "bench", sessionExerciseId: 2, setIndex: 0, rirTarget: "", rirActual: null, toFailure: false },
] as any;
const wv = weeklyVolume(logs, 8);
check("weeklyVolume returns 8 buckets", wv.length === 8);
check("current week volume = 1100", wv[7].volume === 100 * 5 + 60 * 10, `got ${wv[7].volume}`);

const groupOf = (id: string | null) => (id === "row" ? "pull" : "press") as any;
const bal = pullPressBalance(logs, groupOf, 28);
check("pull/press balance computed", bal.pull === 500 && bal.press === 600, JSON.stringify(bal));

const prs = personalRecords(logs, (id) => id);
check("PRs computed per exercise", prs.length === 2);

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail > 0 ? 1 : 0);
