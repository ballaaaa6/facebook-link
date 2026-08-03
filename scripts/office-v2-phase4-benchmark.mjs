import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import {
  collectBenchmarkEvidence,
  createBenchmarkPlan,
  createBenchmarkRunMatrix,
} from "../apps/web/src/features/office-v2/renderer/benchmark-harness.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fixturePath = resolve(root, "docs/office-v2/fixtures/lab/renderer-benchmark-bundle-v1.json");

function parseArgs(argv) {
  const values = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--help") values.set("help", true);
    else if (value?.startsWith("--") && argv[index + 1] && !argv[index + 1].startsWith("--")) {
      values.set(value.slice(2), argv[index + 1]);
      index += 1;
    }
  }
  return values;
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function sourceRevision() {
  return process.env.SOURCE_REVISION ?? "unprovided";
}

function help() {
  console.log("Usage: node scripts/office-v2-phase4-benchmark.mjs [--url http://127.0.0.1:4173/] [--output path]");
  console.log("The script expects the development-only lab query contract and never starts a server or selects a winner.");
}

function unavailableRun(descriptor, message) {
  return {
    ...descriptor,
    warmupFrames: 0,
    samples: [],
    diagnostics: [{ code: "presentation.benchmark-page-unavailable", message, context: { descriptor } }],
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.has("help")) {
    help();
    return;
  }
  const baseUrl = args.get("url") ?? "http://127.0.0.1:4173/";
  const outputPath = resolve(root, args.get("output") ?? "artifacts/office-v2/phase4/renderer-benchmark-evidence.json");
  const plan = createBenchmarkPlan();
  const matrix = createBenchmarkRunMatrix(plan);
  const runs = [];
  let browser;
  let page;
  let currentKey = "";
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ deviceScaleFactor: 1, reducedMotion: "reduce" });
    page = await context.newPage();
    for (const descriptor of matrix) {
      const key = `${descriptor.candidate}|${descriptor.actorCount}|${descriptor.viewport.width}x${descriptor.viewport.height}`;
      await page.setViewportSize(descriptor.viewport);
      if (descriptor.runKind === "cold" || key !== currentKey) {
        const url = new URL(baseUrl);
        url.searchParams.set("lab", "office-engine-v2");
        url.searchParams.set("candidate", descriptor.candidate);
        url.searchParams.set("actors", String(descriptor.actorCount));
        await page.goto(url.toString(), { waitUntil: "networkidle" });
        await page.waitForFunction(() => Boolean(globalThis.__officeV2Lab?.ready));
        currentKey = key;
      }
      try {
        const result = await page.evaluate(async (input) => {
          if (!globalThis.__officeV2Lab?.runBenchmarkRun) return null;
          return globalThis.__officeV2Lab.runBenchmarkRun(input);
        }, descriptor);
        runs.push(result ?? unavailableRun(descriptor, "The lab did not expose runBenchmarkRun."));
      } catch (error) {
        runs.push(unavailableRun(descriptor, error instanceof Error ? error.message : "The browser benchmark call failed."));
      }
    }
  } finally {
    await browser?.close();
  }

  const evidence = collectBenchmarkEvidence(runs, plan);
  const bundleHash = sha256(readFileSync(fixturePath));
  const report = {
    schemaVersion: "office-renderer-benchmark-evidence-v1",
    generatedBy: "scripts/office-v2-phase4-benchmark.mjs",
    sourceRevision: sourceRevision(),
    baseUrl,
    fixture: { path: "docs/office-v2/fixtures/lab/renderer-benchmark-bundle-v1.json", bundleHash },
    environment: { browser: "chromium", deviceScaleFactor: 1, reducedMotion: "reduce", locale: "en-US" },
    evidence,
  };
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ outputPath, totalRuns: evidence.totalRuns, validRuns: evidence.validRuns, invalidRuns: evidence.invalidRuns, winner: evidence.winner }));
}

await main();
