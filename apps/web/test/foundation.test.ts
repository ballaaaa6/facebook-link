import assert from "node:assert/strict";
import test from "node:test";
import { normalizeRoute } from "../src/app/useRoute.ts";
import { defaultMetrics } from "../src/features/dashboard/metrics.ts";
import { officeEngineEntryGates, officeEngineLayers } from "../src/features/office-v2/foundation.ts";

test("dashboard metrics have stable unique identifiers", () => {
  assert.equal(defaultMetrics.length, 4);
  assert.equal(new Set(defaultMetrics.map((metric) => metric.id)).size, defaultMetrics.length);
});

test("Office Engine V2 starts with four one-way architectural layers", () => {
  assert.deepEqual(officeEngineLayers.map((layer) => layer.id), [
    "world",
    "simulation",
    "projection",
    "presentation",
  ]);
  assert.ok(officeEngineEntryGates.length >= officeEngineLayers.length);
});

test("control panel routes keep Office at the root", () => {
  assert.equal(normalizeRoute("/"), "/");
  assert.equal(normalizeRoute("/dashboard"), "/dashboard");
  assert.equal(normalizeRoute("/settings"), "/settings");
  assert.equal(normalizeRoute("/retired-office-route"), "/");
});
