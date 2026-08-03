import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { fitCameraToWorld } from "../apps/web/src/features/office-v2/renderer/camera.ts";
import { buildSyntheticScene } from "../apps/web/src/features/office-v2/renderer/candidate-scene.ts";
import { createFixtureSnapshot, LAB_BOUNDS, LAB_FLOOR } from "../apps/web/src/features/office-v2/renderer/lab-fixture.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const viewports = Object.freeze([{ width: 1440, height: 900 }, { width: 1024, height: 768 }, { width: 390, height: 844 }]);
const snapshot = createFixtureSnapshot(15, 0);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function jsonHash(value) {
  return sha256(JSON.stringify(value));
}

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

function goldenManifest(viewport, browserVersion, capture) {
  return {
    schemaVersion: "office-golden-manifest-v1",
    manifestId: "office-golden-manifest-v1",
    browser: `chromium-${browserVersion}`,
    fontSet: "system-monospace-v1",
    viewport,
    camera: `lab-fit-camera-v1|${viewport.width}x${viewport.height}`,
    tick: 42,
    seed: 20260801,
    animationTime: 0,
    worldHash: snapshot.worldHash,
    snapshotHash: jsonHash(snapshot),
    projectionProfile: "office-projection-v1",
    styleProfile: "office-synthetic-geometric-style-v1",
    testFamily: "synthetic-geometric-family-v1",
    testAtlas: "synthetic-test-atlas-v1",
    testCatalog: "synthetic-test-catalog-v1",
    testBundle: "office-renderer-benchmark-bundle-v1",
    rendererRevision: capture.rendererRevision,
    osImage: "windows-pilot-image-2026-08-03",
    locale: "en-US",
    dpr: 1,
    fontHashes: [sha256("system-monospace-v1|monospace|windows-pilot-image-2026-08-03")],
    forcedColor: "none",
    reducedMotion: "no-preference",
    threshold: { pixelDifference: 0.01, reviewRequired: true },
    reviewer: "Main Orchestration Session",
    updatePolicy: "normal-checks-never-rewrite",
    geometryIndependent: true,
    migration: { fromVersion: "office-golden-manifest-v0", effect: "new-reviewed-golden-set" },
  };
}

function help() {
  console.log("Usage: node scripts/office-v2-phase4-golden.mjs [--url http://127.0.0.1:4173/] [--output path]");
  console.log("Captures the selected Canvas 2D fixture only; normal checks never rewrite this evidence.");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.has("help")) {
    help();
    return;
  }
  const baseUrl = args.get("url") ?? "http://127.0.0.1:4173/";
  const output = resolve(root, args.get("output") ?? "artifacts/office-v2/phase4/renderer-golden-evidence.json");
  const captureRoot = resolve(root, "artifacts/office-v2/phase4/goldens");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ deviceScaleFactor: 1, reducedMotion: "no-preference", locale: "en-US" });
  const page = await context.newPage();
  const browserVersion = browser.version();
  const manifests = [];
  const captures = [];
  try {
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      const url = new URL(baseUrl);
      url.searchParams.set("lab", "office-engine-v2");
      url.searchParams.set("candidate", "canvas-2d");
      url.searchParams.set("actors", "15");
      await page.goto(url.toString(), { waitUntil: "networkidle" });
      await page.waitForFunction(() => Boolean(globalThis.__officeV2Lab?.ready));
      const capture = await page.evaluate(async (input) => {
        const api = globalThis.__officeV2Lab;
        if (!api?.runBenchmarkRun || !api.captureDeterministic) return null;
        await api.runBenchmarkRun({ candidate: "canvas-2d", actorCount: 15, viewport: input, runKind: "warm", repetition: 1 });
        return api.captureDeterministic();
      }, viewport);
      if (!capture?.dataUrl) throw new Error(`presentation.golden-capture-missing: ${viewport.width}x${viewport.height}`);
      const encoded = capture.dataUrl.slice(capture.dataUrl.indexOf(",") + 1);
      const bytes = Buffer.from(encoded, "base64");
      const relativePath = `artifacts/office-v2/phase4/goldens/canvas-2d-15-${viewport.width}x${viewport.height}.png`;
      const absolutePath = resolve(root, relativePath);
      mkdirSync(dirname(absolutePath), { recursive: true });
      writeFileSync(absolutePath, bytes);
      const camera = fitCameraToWorld(LAB_FLOOR, LAB_BOUNDS, viewport);
      const sceneHash = buildSyntheticScene(snapshot, camera).sceneHash;
      manifests.push(goldenManifest(viewport, browserVersion, capture));
      captures.push({ viewport, actorCount: 15, rendererRevision: capture.rendererRevision, sceneHash, width: capture.width, height: capture.height, payloadHash: capture.payloadHash, pngSha256: sha256(bytes), path: relativePath });
    }
  } finally {
    await browser.close();
  }
  const fixtureHash = sha256(readFileSync(resolve(root, "docs/office-v2/fixtures/lab/renderer-benchmark-bundle-v1.json")));
  const report = {
    schemaVersion: "office-golden-manifest-set-v1",
    generatedBy: "scripts/office-v2-phase4-golden.mjs",
    sourceRevision: process.env.SOURCE_REVISION ?? "unprovided",
    winner: "canvas-2d",
    fixture: { path: "docs/office-v2/fixtures/lab/renderer-benchmark-bundle-v1.json", sha256: fixtureHash },
    environment: { browser: `chromium-${browserVersion}`, deviceScaleFactor: 1, locale: "en-US", forcedColor: "none", reducedMotion: "no-preference", osImage: "windows-pilot-image-2026-08-03" },
    manifests,
    captures,
  };
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ output, manifests: manifests.length, captures: captures.length, winner: report.winner }));
}

await main();
