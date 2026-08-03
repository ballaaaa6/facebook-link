import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const candidates = ["canvas-2d", "pixijs-8.19.0"];
const viewports = [{ width: 1440, height: 900 }, { width: 390, height: 844 }];

function parseArgs(argv) {
  const values = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value?.startsWith("--") && argv[index + 1] && !argv[index + 1].startsWith("--")) {
      values.set(value.slice(2), argv[index + 1]);
      index += 1;
    }
  }
  return values;
}

async function waitReady(page) {
  await page.waitForFunction(() => document.querySelector('[data-testid="renderer-ready"]')?.textContent === "Ready");
}

async function domEvidence(page) {
  return page.evaluate(() => {
    const options = [...document.querySelectorAll('[role="option"]')];
    return {
      ready: document.querySelector('[data-testid="renderer-ready"]')?.textContent,
      optionCount: options.length,
      states: [...new Set(options.map((option) => option.getAttribute("data-state")))].sort(),
      hasLongLabel: options.some((option) => (option.textContent ?? "").length > 60),
      rendererCount: document.querySelectorAll("[data-renderer]").length,
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      inspectorText: document.querySelector('[data-testid="semantic-inspector"]')?.textContent ?? "",
    };
  });
}

async function runCandidate(page, baseUrl, candidate, viewport) {
  await page.setViewportSize(viewport);
  const url = new URL(baseUrl);
  url.searchParams.set("lab", "office-engine-v2");
  url.searchParams.set("candidate", candidate);
  url.searchParams.set("actors", "15");
  await page.goto(url.toString(), { waitUntil: "networkidle" });
  await waitReady(page);
  const initial = await domEvidence(page);
  assert.equal(initial.ready, "Ready");
  assert.equal(initial.optionCount, 15);
  assert.deepEqual(initial.states, ["blocked", "idle", "review", "unavailable", "waiting", "working"]);
  assert.equal(initial.hasLongLabel, true);
  assert.equal(initial.rendererCount, 1);
  assert.equal(initial.horizontalOverflow, false);

  const actorTwo = page.locator('[data-entity-id="actor-02"]');
  await actorTwo.click();
  assert.equal(await actorTwo.getAttribute("aria-selected"), "true");
  assert.match(await page.locator('[data-testid="semantic-inspector"]').innerText(), /actor-02/);
  await actorTwo.press("ArrowDown");
  const actorThree = page.locator('[data-entity-id="actor-03"]');
  await actorThree.press("Enter");
  assert.equal(await actorThree.getAttribute("aria-selected"), "true");
  await page.getByRole("button", { name: "Refresh snapshot" }).click();
  assert.equal(await page.locator('[data-entity-id="actor-03"]').getAttribute("aria-selected"), "true");
  await page.getByRole("button", { name: "Remove focused" }).click();
  await page.waitForFunction(() => document.querySelectorAll('[role="option"]').length === 14);
  assert.equal(await page.locator('[data-entity-id="actor-03"]').count(), 0);
  await page.getByRole("button", { name: "Hide renderer" }).click();
  await page.waitForFunction(() => document.querySelector('[data-testid="renderer-host"]')?.classList.contains("is-hidden") === true);
  await page.getByRole("button", { name: "Resume renderer" }).click();
  await page.waitForFunction(() => document.querySelector('[data-testid="renderer-host"]')?.classList.contains("is-hidden") === false);
  await page.getByRole("button", { name: "Recover context" }).click();
  await page.waitForFunction(() => document.querySelectorAll("[data-renderer]").length === 1);
  await page.getByRole("button", { name: "Teardown and remount" }).click();
  await waitReady(page);
  await page.waitForFunction(() => document.querySelectorAll("[data-renderer]").length === 1);
  const final = await domEvidence(page);
  assert.equal(final.optionCount, 14);
  assert.equal(final.rendererCount, 1);
  assert.equal(final.horizontalOverflow, false);

  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  await page.reload({ waitUntil: "networkidle" });
  await waitReady(page);
  const preferences = await domEvidence(page);
  assert.equal(preferences.optionCount, 15);
  assert.equal(preferences.horizontalOverflow, false);
  assert.equal(preferences.rendererCount, 1);
  return { candidate, viewport, initial, final, preferences, keyboardPointerParity: true, lifecycleRecovery: true, responsive: true, preferencesPreserved: true };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const output = resolve(root, args.get("output") ?? "artifacts/office-v2/phase4/renderer-qa-evidence.json");
  const baseUrl = args.get("url") ?? "http://127.0.0.1:4173/";
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ deviceScaleFactor: 1, locale: "en-US" });
  const page = await context.newPage();
  const browserVersion = browser.version();
  const checks = [];
  try {
    for (const candidate of candidates) {
      for (const viewport of viewports) checks.push(await runCandidate(page, baseUrl, candidate, viewport));
    }
  } finally {
    await browser.close();
  }
  const report = {
    schemaVersion: "office-renderer-qa-evidence-v1",
    sourceRevision: process.env.SOURCE_REVISION ?? "unprovided",
    browser: `chromium-${browserVersion}`,
    checks,
    allPassed: checks.length === candidates.length * viewports.length && checks.every((check) => check.keyboardPointerParity && check.lifecycleRecovery && check.responsive && check.preferencesPreserved),
  };
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ output, checks: checks.length, allPassed: report.allPassed }));
  if (!report.allPassed) process.exitCode = 1;
}

await main();
