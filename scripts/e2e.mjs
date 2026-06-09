import { chromium } from "playwright";
import { existsSync } from "node:fs";

// Use a pre-installed browser if present (sandbox), else Playwright-managed (CI).
const LOCAL_EXE = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const EXE = existsSync(LOCAL_EXE) ? LOCAL_EXE : undefined;
const BASE = process.env.BASE || "http://localhost:3500";
const log = (...a) => console.log(...a);
let failures = 0;
const ok = (n, c) => { if (!c) failures++; log(`  ${c ? "✓" : "✗ FAIL"} ${n}`); };

const browser = await chromium.launch({ ...(EXE ? { executablePath: EXE } : {}), headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(`PAGEERROR: ${e.message}`));

const seeded = async () =>
  page.waitForFunction(() => !document.body.innerText.includes("Loading your program"), { timeout: 20000 }).catch(() => {});

try {
  // 1. Home
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 30000 });
  await seeded();
  await page.screenshot({ path: "/tmp/e2e-1-home.png" });
  ok("home shows Start session", (await page.getByText(/start session/i).count()) > 0);

  // 2. Navigate to /session
  await page.getByRole("link", { name: /start session/i }).first().click();
  await page.waitForURL(/\/session/, { timeout: 10000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "/tmp/e2e-2-session.png" });
  const startTraining = await page.getByText(/start training/i).count();
  ok("/session shows the Start-training screen (not blank)", startTraining > 0);

  // 3. Start the recommended plan
  const recBtn = page.getByRole("button", { name: /^start (upper|lower|push|pull|legs)/i }).first();
  ok("recommended Start button present", (await recBtn.count()) > 0);
  await recBtn.click();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "/tmp/e2e-3-active.png" });
  ok("active session renders (Finish session)", (await page.getByText(/finish session/i).count()) > 0);
  ok("exercises rendered (Bench Press)", (await page.getByText(/bench press/i).count()) > 0);

  // 4. Log a set: type reps into the first set row and complete it
  const repsInputs = page.locator('input[placeholder="reps"]');
  if (await repsInputs.count()) {
    await repsInputs.first().fill("5");
    // tap the green complete checkmark (first "Complete set" button)
    const completeBtn = page.getByRole("button", { name: /complete set/i }).first();
    await completeBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "/tmp/e2e-4-logged.png" });
    ok("set logged (rest timer appears)", (await page.getByText(/rest/i).count()) > 0);
  } else {
    ok("set inputs present", false);
  }

  // 5. Finish session returns home
  await page.getByText(/finish session/i).first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "/tmp/e2e-5-after-finish.png" });
  ok("returned to home after finishing", /\/$|\/$/.test(new URL(page.url()).pathname) || page.url().endsWith("/"));
} catch (e) {
  failures++;
  log("FATAL", e.message);
} finally {
  log("\n=== PAGE ERRORS ===");
  log(errors.join("\n") || "(none)");
  log(`\n${failures === 0 ? "ALL E2E CHECKS PASSED ✅" : failures + " E2E CHECK(S) FAILED ❌"}`);
  await browser.close();
  process.exit(failures > 0 ? 1 : 0);
}
