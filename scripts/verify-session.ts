import "fake-indexeddb/auto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

async function main() {
  const dataset = readFileSync(join(process.cwd(), "public/data/exercises.json"), "utf-8");
  (globalThis as any).fetch = async () => ({ json: async () => JSON.parse(dataset) });

  const { db, seedIfNeeded } = await import("../lib/db");
  const { startSessionFromPlan, addSet, finishSession } = await import("../lib/session");

  let pass = 0, fail = 0;
  const check = (n: string, c: boolean, e = "") => { c ? pass++ : fail++; console.log(`  ${c ? "✓" : "✗"} ${n} ${c ? "" : e}`); };

  await seedIfNeeded();
  const plans = await db.plans.orderBy("order").toArray();
  console.log("plans:", plans.map((p) => p.id).join(", "));

  let sessionId: number;
  try {
    sessionId = await startSessionFromPlan(plans[0].id);
    check("startSessionFromPlan returns id", typeof sessionId === "number", String(sessionId));
  } catch (e) {
    fail++;
    console.log("  ✗ startSessionFromPlan THREW:", (e as Error).message);
    console.log((e as Error).stack);
    process.exit(1);
  }

  const active = await db.sessions.where("status").equals("active").first();
  check("an active session exists", !!active && active.id === sessionId!);

  const ses = await db.sessionExercises.where("sessionId").equals(sessionId!).toArray();
  check("session exercises created (6 for Upper)", ses.length === 6, `got ${ses.length}`);

  const bench = ses.find((s) => s.name.includes("Bench"));
  check("bench suggested weight = 107.5 (seed)", bench?.suggestedWeightKg === 107.5, String(bench?.suggestedWeightKg));

  // simulate logging a set
  const first = ses[0];
  const setId = await addSet(
    { id: first.id!, exerciseId: first.exerciseId, suggestedWeightKg: first.suggestedWeightKg, rirTarget: "1-2" },
    active!.date,
  );
  check("addSet returns id", typeof setId === "number");

  await db.setLogs.update(setId, { reps: 5, completed: true });
  await finishSession(sessionId!);
  const done = await db.sessions.get(sessionId!);
  check("finishSession marks completed", done?.status === "completed");

  console.log(`\n${pass} passed, ${fail} failed\n`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => { console.error("FATAL", e); process.exit(1); });
