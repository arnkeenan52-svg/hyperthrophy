import { Capacitor, registerPlugin } from "@capacitor/core";
import { dateKey } from "@/lib/utils";

export interface HealthMetrics {
  steps: number | null;
  sleepHours: number | null;
  restingHr: number | null;
  bodyWeightKg: number | null;
}

// Implemented natively by ios-native/HealthBridge.swift. On the web this proxy
// is never invoked (guarded by isNativeHealth()).
interface HealthBridgePlugin {
  isAvailable(): Promise<{ available: boolean }>;
  requestAuthorization(): Promise<{ granted: boolean }>;
  getMetrics(): Promise<HealthMetrics>;
}

const HealthBridge = registerPlugin<HealthBridgePlugin>("HealthBridge");

/** True only inside the native iOS (Capacitor) shell. */
export function isNativeHealth(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Request Apple Health permission, read the latest metrics, and persist them
 * into the local DB (health singleton + today's bodyweight). Returns the
 * metrics that were read.
 */
export async function syncFromAppleHealth(): Promise<HealthMetrics> {
  if (!isNativeHealth()) {
    throw new Error("Apple Health is only available in the iOS app.");
  }
  const avail = await HealthBridge.isAvailable();
  if (!avail.available) throw new Error("HealthKit isn't available on this device.");

  await HealthBridge.requestAuthorization();
  const m = await HealthBridge.getMetrics();

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
