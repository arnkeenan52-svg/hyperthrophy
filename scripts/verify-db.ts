import "fake-indexeddb/auto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

async function main() {
  const dataset = readFileSync(join(process.cwd(), "public/data/exercises.json"), "utf-8");
  (globalThis as any).fetch = async () => ({ json: async () => JSON.parse(dataset) });

  const { db, seedIfNeeded } = await import("../lib/db");

  let pass = 0,
    fail = 0;
  function check(name: string, cond: boolean, extra = "") {
    cond ? pass++ : fail++;
    console.log(`  ${cond ? "✓" : "✗"} ${name} ${cond ? "" : extra}`);
  }

  await seedIfNeeded();

  const exCount = await db.exercises.count();
  const plans = await db.plans.toArray();
  const planEx = await db.planExercises.toArray();
  const refs = await db.oneRmRefs.toArray();
  const profile = await db.profile.get("me");

  console.log("\n# Seeding against real dataset");
  check("exercise library seeded (>800)", exCount > 800, `got ${exCount}`);
  const dead = await db.exercises.filter((e) => e.name.toLowerCase().includes("deadlift")).count();
  check("no deadlifts in library", dead === 0, `found ${dead}`);
  check("5 plans", plans.length === 5);
  check("30 plan exercises", planEx.length === 30, `got ${planEx.length}`);

  const resolved = planEx.filter((p) => p.exerciseId !== null).length;
  check("most plan exercises matched to library", resolved >= 26, `${resolved}/30 matched`);
  console.log(
    "    unmatched:",
    planEx.filter((p) => !p.exerciseId).map((p) => p.name).join(", ") || "(none)",
  );

  let badLinks = 0;
  for (const p of planEx) {
    if (p.exerciseId && !(await db.exercises.get(p.exerciseId))) badLinks++;
  }
  check("all matched ids exist in library", badLinks === 0, `${badLinks} dangling`);

  check("bench 1RM reference stored (120)", refs.some((r) => r.value === 120), JSON.stringify(refs));
  check("profile seeded (age 17)", profile?.age === 17);

  await seedIfNeeded();
  check("seed is idempotent", (await db.plans.count()) === 5);

  // --- Program-version migration: upgrade preserves user data, swaps plans ---
  console.log("\n# Program upgrade migration");
  await db.bestLifts.add({ name: "Bench Press", weightKg: 120, reps: 3, date: "2026-01-01" });
  await db.bodyweight.put({ date: "2026-01-02", weightKg: 83 });
  await db.checks.put({ key: "w1-old-s0", week: 1, dayId: "upper-heavy", ts: Date.now() });
  // Pretend this install was seeded with the previous program.
  const s = await db.settings.get("app");
  await db.settings.put({ ...s!, programVersion: 1 });

  await seedIfNeeded(); // should detect v1 != current and re-seed the program

  const lead = await db.planExercises.where("planId").equals("upper-heavy").sortBy("order");
  check("upgrade re-seeds new program (Row leads Upper)", lead[0]?.name === "Barbell Row", lead[0]?.name);
  check("upgrade keeps best lifts", (await db.bestLifts.count()) === 1);
  check("upgrade keeps bodyweight", !!(await db.bodyweight.where("date").equals("2026-01-02").first()));
  check("upgrade clears stale set checks", (await db.checks.count()) === 0);
  check("upgrade bumps programVersion", (await db.settings.get("app"))?.programVersion !== 1);

  console.log(`\n${pass} passed, ${fail} failed\n`);
  process.exit(fail > 0 ? 1 : 0);
}

main();
