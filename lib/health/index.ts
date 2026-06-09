import { dateKey } from "@/lib/utils";

export interface HealthMetrics {
  steps: number | null;
  sleepHours: number | null;
  restingHr: number | null;
  bodyWeightKg: number | null;
}

const TYPES = {
  bodyMass: "HKQuantityTypeIdentifierBodyMass",
  restingHr: "HKQuantityTypeIdentifierRestingHeartRate",
  steps: "HKQuantityTypeIdentifierStepCount",
  sleep: "HKCategoryTypeIdentifierSleepAnalysis",
};

function attr(blob: string, name: string): string | null {
  const m = blob.match(new RegExp(`${name}="([^"]*)"`));
  return m ? m[1] : null;
}

/** Apple dates look like "2024-01-02 07:00:00 +0000"; normalize for Date(). */
function parseAppleDate(s: string | null): number {
  if (!s) return NaN;
  return Date.parse(s.replace(" ", "T").replace(" ", ""));
}

/**
 * Pure scanner over an Apple Health `export.xml` string. Pulls the latest
 * bodyweight & resting HR, the most recent day's step total, and the most
 * recent night's asleep hours. Kept regex-based (no DOM) to handle big files.
 */
export function scanHealthXml(xml: string): HealthMetrics {
  const recordRe =
    /<Record type="(HKQuantityTypeIdentifierBodyMass|HKQuantityTypeIdentifierRestingHeartRate|HKQuantityTypeIdentifierStepCount|HKCategoryTypeIdentifierSleepAnalysis)"([^>]*?)\/?>/g;

  let mass: { end: number; kg: number } | null = null;
  let hr: { end: number; bpm: number } | null = null;
  const stepsByDay = new Map<string, number>();
  const asleep: { start: number; end: number }[] = [];

  let m: RegExpExecArray | null;
  while ((m = recordRe.exec(xml))) {
    const type = m[1];
    const blob = m[2];

    if (type === TYPES.bodyMass) {
      const v = Number(attr(blob, "value"));
      const end = parseAppleDate(attr(blob, "endDate") ?? attr(blob, "startDate"));
      if (!isNaN(v) && !isNaN(end)) {
        const kg = (attr(blob, "unit") ?? "kg").toLowerCase().startsWith("lb") ? v * 0.453592 : v;
        if (!mass || end > mass.end) mass = { end, kg };
      }
    } else if (type === TYPES.restingHr) {
      const v = Number(attr(blob, "value"));
      const end = parseAppleDate(attr(blob, "endDate") ?? attr(blob, "startDate"));
      if (!isNaN(v) && !isNaN(end) && (!hr || end > hr.end)) hr = { end, bpm: v };
    } else if (type === TYPES.steps) {
      const v = Number(attr(blob, "value"));
      const start = attr(blob, "startDate");
      if (!isNaN(v) && start) {
        const day = start.slice(0, 10);
        stepsByDay.set(day, (stepsByDay.get(day) ?? 0) + v);
      }
    } else if (type === TYPES.sleep) {
      const val = attr(blob, "value") ?? "";
      if (/asleep/i.test(val)) {
        const start = parseAppleDate(attr(blob, "startDate"));
        const end = parseAppleDate(attr(blob, "endDate"));
        if (!isNaN(start) && !isNaN(end) && end > start) asleep.push({ start, end });
      }
    }
  }

  // Most recent day's steps
  let steps: number | null = null;
  if (stepsByDay.size) {
    const latestDay = [...stepsByDay.keys()].sort().pop()!;
    steps = Math.round(stepsByDay.get(latestDay)!);
  }

  // Most recent night's asleep hours (16h window ending at the last asleep sample)
  let sleepHours: number | null = null;
  if (asleep.length) {
    const maxEnd = Math.max(...asleep.map((a) => a.end));
    const windowStart = maxEnd - 16 * 3600 * 1000;
    const ms = asleep
      .filter((a) => a.end > windowStart)
      .reduce((n, a) => n + (a.end - a.start), 0);
    if (ms > 0) sleepHours = Math.round((ms / 3600000) * 10) / 10;
  }

  return {
    steps,
    sleepHours,
    restingHr: hr ? Math.round(hr.bpm) : null,
    bodyWeightKg: mass ? Math.round(mass.kg * 10) / 10 : null,
  };
}

/** Read an Apple Health export (`export.zip` or `export.xml`) into metrics. */
export async function parseHealthExport(file: File): Promise<HealthMetrics> {
  let xml: string;
  if (file.name.toLowerCase().endsWith(".zip")) {
    const { unzip } = await import("fflate");
    const buf = new Uint8Array(await file.arrayBuffer());
    const files = await new Promise<Record<string, Uint8Array>>((res, rej) =>
      unzip(buf, (err, data) => (err ? rej(err) : res(data))),
    );
    const key = Object.keys(files).find((k) => k.toLowerCase().endsWith("export.xml"));
    if (!key) throw new Error("Couldn't find export.xml inside the zip.");
    xml = new TextDecoder().decode(files[key]);
  } else {
    xml = await file.text();
  }
  if (!xml.includes("<Record")) throw new Error("That doesn't look like an Apple Health export.");
  return scanHealthXml(xml);
}

/** Parse the file and persist the metrics into the local DB. */
export async function importAppleHealth(file: File): Promise<HealthMetrics> {
  const m = await parseHealthExport(file);
  const { db } = await import("@/lib/db");

  const cur =
    (await db.health.get("latest")) ?? {
      id: "latest",
      steps: null,
      sleepH: null,
      restingHr: null,
      updatedAt: 0,
    };
  await db.health.put({
    id: "latest",
    steps: m.steps ?? cur.steps,
    sleepH: m.sleepHours ?? cur.sleepH,
    restingHr: m.restingHr ?? cur.restingHr,
    updatedAt: Date.now(),
  });

  if (m.bodyWeightKg) {
    const d = dateKey();
    const existing = await db.bodyweight.where("date").equals(d).first();
    if (existing) await db.bodyweight.update(existing.id!, { weightKg: m.bodyWeightKg });
    else await db.bodyweight.add({ date: d, weightKg: m.bodyWeightKg });
  }
  return m;
}
