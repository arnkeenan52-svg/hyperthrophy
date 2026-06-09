import { scanHealthXml } from "../lib/health";

const sample = `<?xml version="1.0"?>
<HealthData>
<Record type="HKQuantityTypeIdentifierBodyMass" unit="kg" startDate="2024-05-01 07:00:00 +0000" endDate="2024-05-01 07:00:00 +0000" value="84.5"/>
<Record type="HKQuantityTypeIdentifierBodyMass" unit="lb" startDate="2024-05-03 07:00:00 +0000" endDate="2024-05-03 07:00:00 +0000" value="185"/>
<Record type="HKQuantityTypeIdentifierRestingHeartRate" unit="count/min" startDate="2024-05-02 07:00:00 +0000" endDate="2024-05-02 07:00:00 +0000" value="55"/>
<Record type="HKQuantityTypeIdentifierRestingHeartRate" unit="count/min" startDate="2024-05-04 07:00:00 +0000" endDate="2024-05-04 07:00:00 +0000" value="52"/>
<Record type="HKQuantityTypeIdentifierStepCount" unit="count" startDate="2024-05-03 10:00:00 +0000" endDate="2024-05-03 10:05:00 +0000" value="5000"/>
<Record type="HKQuantityTypeIdentifierStepCount" unit="count" startDate="2024-05-04 09:00:00 +0000" endDate="2024-05-04 09:05:00 +0000" value="1000"/>
<Record type="HKQuantityTypeIdentifierStepCount" unit="count" startDate="2024-05-04 10:00:00 +0000" endDate="2024-05-04 10:05:00 +0000" value="2000"/>
<Record type="HKCategoryTypeIdentifierSleepAnalysis" value="HKCategoryValueSleepAnalysisAsleepCore" startDate="2024-05-03 23:00:00 +0000" endDate="2024-05-04 03:00:00 +0000"/>
<Record type="HKCategoryTypeIdentifierSleepAnalysis" value="HKCategoryValueSleepAnalysisAsleepREM" startDate="2024-05-04 03:00:00 +0000" endDate="2024-05-04 06:30:00 +0000"/>
<Record type="HKCategoryTypeIdentifierSleepAnalysis" value="HKCategoryValueSleepAnalysisInBed" startDate="2024-05-03 22:30:00 +0000" endDate="2024-05-04 06:45:00 +0000"/>
</HealthData>`;

let pass = 0, fail = 0;
const check = (n: string, c: boolean, e = "") => { c ? pass++ : fail++; console.log(`  ${c ? "✓" : "✗"} ${n} ${c ? "" : e}`); };

const m = scanHealthXml(sample);
console.log("\n# Apple Health export parser");
console.log("  parsed:", JSON.stringify(m));
check("latest bodyweight (185lb → ~83.9kg)", Math.abs((m.bodyWeightKg ?? 0) - 83.9) < 0.3, String(m.bodyWeightKg));
check("latest resting HR = 52", m.restingHr === 52, String(m.restingHr));
check("most recent day's steps = 3000", m.steps === 3000, String(m.steps));
check("last night's asleep = 7.5h", m.sleepHours === 7.5, String(m.sleepHours));

// empty / non-health text → all null, no throw
const empty = scanHealthXml("<HealthData></HealthData>");
check("empty export → all null", empty.steps === null && empty.bodyWeightKg === null);

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail > 0 ? 1 : 0);
