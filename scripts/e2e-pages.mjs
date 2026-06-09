import { chromium } from "playwright";
import { existsSync } from "node:fs";

const LOCAL_EXE = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const EXE = existsSync(LOCAL_EXE) ? LOCAL_EXE : undefined;
const BASE = process.env.BASE || "http://localhost:3500";
const log = (...a) => console.log(...a);
let fail = 0;
const ok = (n, c, extra = "") => { if (!c) fail++; log(`  ${c ? "✓" : "✗ FAIL"} ${n} ${c ? "" : extra}`); };

const browser = await chromium.launch({ ...(EXE ? { executablePath: EXE } : {}), headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(`${page.url()} :: ${e.message}`));
const seeded = () =>
  page.waitForFunction(() => !document.body.innerText.includes("Loading your program"), { timeout: 20000 }).catch(() => {});

try {
  // --- Workout guide ---
  await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 30000 });
  await seeded();
  await page.waitForTimeout(800);
  ok("home is the Workout guide", (await page.getByRole("heading", { name: /^workout$/i }).count()) > 0);
  ok("week selector present", (await page.locator("#week").count()) > 0);
  ok("Day 1 shows Bench Press", (await page.getByText(/barbell bench press/i).count()) > 0);
  ok("target weight removed from workout", (await page.getByText(/kg target/i).count()) === 0);

  // tick a set
  const set1 = page.getByRole("button", { name: /^set 1$/i }).first();
  ok("set buttons present", (await set1.count()) > 0);
  await set1.click();
  await page.waitForTimeout(400);
  ok("set 1 becomes 'done'", (await page.getByRole("button", { name: /set 1 done/i }).count()) > 0);
  await page.screenshot({ path: "/tmp/w-day1.png" });

  // change week → directive updates
  await page.selectOption("#week", "6");
  await page.waitForTimeout(400);
  ok("week 6 directive updates (failure)", /failure/i.test(await page.locator("body").innerText()));

  // switch to Pull day
  await page.getByRole("button", { name: /pull/i }).first().click();
  await page.waitForTimeout(400);
  ok("Pull day shows Lat Pulldown", (await page.getByText(/lat pulldown/i).count()) > 0);
  await page.screenshot({ path: "/tmp/w-pull.png" });

  // --- Profile ---
  await page.goto(BASE + "/profile", { waitUntil: "networkidle" });
  await seeded();
  await page.waitForTimeout(600);
  ok("profile current lifts removed", (await page.getByText(/current lifts/i).count()) === 0);
  ok("profile has Best lifts", (await page.getByRole("heading", { name: /best lifts/i }).count()) > 0);
  ok("profile has Stats (e1RM tile)", (await page.getByText(/top e1rm/i).count()) > 0);
  ok("profile has Health section", (await page.getByRole("heading", { name: /^health$/i }).count()) > 0);
  ok("Apple Health import button present", (await page.getByRole("button", { name: /import apple health/i }).count()) > 0);
  ok("profile nutrition editable (Protein)", (await page.getByText(/protein/i).count()) > 0);

  // add a best lift
  await page.getByPlaceholder(/lift \(e\.g/i).fill("Bench Press");
  await page.locator('input[placeholder="kg"]').fill("120");
  await page.locator('input[placeholder="reps"]').fill("3");
  await page.getByRole("button", { name: /add lift/i }).click();
  await page.waitForTimeout(500);
  ok("best lift added (e1RM appears)", (await page.getByText(/e1rm/i).count()) > 0);
  await page.screenshot({ path: "/tmp/w-profile.png", fullPage: true });

  // nav back to workout
  await page.getByRole("link", { name: /workout/i }).first().click();
  await page.waitForTimeout(500);
  ok("nav back to workout works", (await page.locator("#week").count()) > 0);
} catch (e) {
  fail++;
  log("FATAL", e.message);
} finally {
  log("\n=== PAGE ERRORS ===");
  log(errors.join("\n") || "(none)");
  log(`\n${fail === 0 ? "ALL E2E CHECKS PASSED ✅" : fail + " CHECK(S) FAILED ❌"}`);
  await browser.close();
  process.exit(fail > 0 ? 1 : 0);
}
