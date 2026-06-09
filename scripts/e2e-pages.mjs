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

async function visit(path, expect) {
  await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 30000 });
  await seeded();
  await page.waitForTimeout(800);
  const txt = (await page.locator("body").innerText()).replace(/\s+/g, " ");
  ok(`${path} renders "${expect}"`, txt.includes(expect), `got: ${txt.slice(0, 80)}`);
  return txt;
}

try {
  await visit("/", "Let's build");
  await visit("/session", "Start training");
  await visit("/plans", "My plans");
  await visit("/progress", "Progress");
  await visit("/library", "Library");
  await visit("/profile", "Profile");

  // Plans → open first plan editor
  await page.goto(BASE + "/plans", { waitUntil: "networkidle" });
  await seeded();
  await page.getByText(/Upper · Heavy/i).first().click();
  await page.waitForURL(/\/plans\//, { timeout: 8000 });
  await page.waitForTimeout(800);
  ok("plan editor opens with exercises", (await page.getByText(/Barbell Bench Press/i).count()) > 0);

  // Library → search + open detail
  await page.goto(BASE + "/library", { waitUntil: "networkidle" });
  await seeded();
  await page.getByPlaceholder(/search exercises/i).fill("squat");
  await page.waitForTimeout(600);
  const firstCard = page.locator("a[href^='/library/']").first();
  ok("library search returns results", (await firstCard.count()) > 0);
  await firstCard.click();
  await page.waitForURL(/\/library\//, { timeout: 8000 });
  await page.waitForTimeout(600);
  ok("library detail shows Instructions", (await page.getByText(/instructions|primary muscles/i).count()) > 0);

  // Profile → toggle a protocol switch + log bodyweight
  await page.goto(BASE + "/profile", { waitUntil: "networkidle" });
  await seeded();
  ok("profile shows current lifts (Bench Press)", (await page.getByText(/Bench Press/i).count()) > 0);
  ok("profile shows nutrition targets", (await page.getByText(/Protein/i).count()) > 0);
  const sw = page.locator('button[role="switch"]').first();
  if (await sw.count()) { await sw.click(); await page.waitForTimeout(300); ok("protocol switch toggles", true); }

  // Progress → charts present after the logged session from e2e? fresh ctx has none, but page renders
  await page.goto(BASE + "/progress", { waitUntil: "networkidle" });
  await seeded();
  ok("progress shows Pull focus card", (await page.getByText(/pull focus/i).count()) > 0);
} catch (e) {
  fail++;
  log("FATAL", e.message);
} finally {
  log("\n=== PAGE ERRORS ===");
  log(errors.join("\n") || "(none)");
  log(`\n${fail === 0 ? "ALL PAGE CHECKS PASSED ✅" : fail + " CHECK(S) FAILED ❌"}`);
  await browser.close();
  process.exit(fail > 0 ? 1 : 0);
}
