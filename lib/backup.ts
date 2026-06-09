import { db } from "@/lib/db";

const TABLES = [
  "profile",
  "bodyweight",
  "exercises",
  "plans",
  "planExercises",
  "sessions",
  "sessionExercises",
  "setLogs",
  "oneRmRefs",
  "settings",
  "protocolDays",
  "checks",
] as const;

/** Export the entire local database as a JSON blob and trigger a download. */
export async function exportData(): Promise<void> {
  const dump: Record<string, unknown[]> = {};
  for (const t of TABLES) {
    dump[t] = await db.table(t).toArray();
  }
  const payload = {
    app: "hyperthrophy",
    version: 1,
    exportedAt: new Date().toISOString(),
    data: dump,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `hyperthrophy-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Restore the database from a previously exported JSON file. */
export async function importData(file: File): Promise<void> {
  const text = await file.text();
  const parsed = JSON.parse(text);
  const data = parsed?.data;
  if (!data || parsed.app !== "hyperthrophy") {
    throw new Error("Not a valid Hyperthrophy backup file.");
  }
  await db.transaction(
    "rw",
    TABLES.map((t) => db.table(t)),
    async () => {
      for (const t of TABLES) {
        await db.table(t).clear();
        if (Array.isArray(data[t]) && data[t].length) {
          await db.table(t).bulkAdd(data[t]);
        }
      }
    },
  );
}
