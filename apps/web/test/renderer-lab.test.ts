import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createFixtureSnapshot } from "../src/features/office-v2/renderer/lab-fixture.ts";

test("QA lab fixture covers semantic states, freshness, stable IDs, and long labels", () => {
  const snapshot = createFixtureSnapshot(15, 0);
  assert.equal(snapshot.entities.length, 15);
  assert.equal(new Set(snapshot.entities.map((entity) => entity.semanticState)).size, 6);
  assert.ok(snapshot.entities.some((entity) => entity.freshness === "stale"));
  assert.ok(snapshot.entities.some((entity) => entity.freshness === "reconnecting"));
  assert.ok(snapshot.entities.some((entity) => entity.freshness === "unavailable"));
  assert.equal(new Set(snapshot.entities.map((entity) => entity.entityId.value)).size, 15);
  assert.ok((snapshot.entities[0]?.label.length ?? 0) > 60);
  assert.equal(Object.isFrozen(snapshot), true);
});

test("QA lab source keeps semantic DOM and preference coverage explicit", () => {
  const page = readFileSync(new URL("../src/features/office-v2/OfficeEngineV2LabPage.tsx", import.meta.url), "utf8");
  const benchmark = readFileSync(new URL("../src/features/office-v2/renderer/lab-benchmark.ts", import.meta.url), "utf8");
  const css = readFileSync(new URL("../src/features/office-v2/officeEngineV2Lab.css", import.meta.url), "utf8");
  assert.match(page, /role="listbox"/);
  assert.match(page, /aria-label="Semantic inspector"/);
  assert.match(benchmark, /runBenchmarkRun/);
  assert.match(page, /Remove focused/);
  assert.match(page, /Recover context/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /forced-colors/);
});
