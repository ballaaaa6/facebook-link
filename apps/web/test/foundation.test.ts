import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { normalizeRoute } from "../src/app/useRoute.ts";
import { defaultMetrics } from "../src/features/dashboard/metrics.ts";
import { officeEngineEntryGates, officeEngineLayers } from "../src/features/office-v2/foundation.ts";

const knowledgeFiles = [
  "README.md",
  "FOUNDATIONS.md",
  "PRODUCT_AND_GAME_LOOP.md",
  "GLOSSARY_AND_INVARIANTS.md",
  "WORLD_COORDINATES_PROJECTION_CAMERA.md",
  "WORLD_MODEL_OCCUPANCY_PLACEMENT.md",
  "RENDERING_DEPTH_OCCLUSION.md",
  "CONNECTIVITY_AUTO_TILING.md",
  "SIMULATION_TIME_RANDOMNESS_REPLAY.md",
  "ACTORS_NAVIGATION_INTERACTIONS.md",
  "CHARACTERS_ANIMATION_HELD_PROPS.md",
  "ART_DIRECTION_PIXEL_SPEC.md",
  "ASSET_PIPELINE_PROVENANCE_VALIDATION.md",
  "OPERATIONS_ADAPTER_UI_SAFETY.md",
  "TESTING_ACCEPTANCE_BUDGETS.md",
  "IMPLEMENTATION_PLAN.md",
  "RESEARCH.md",
  "schemas/world.schema.json",
  "schemas/asset.schema.json",
  "fixtures/minimal-office.json",
  "fixtures/connected-desk.json",
] as const;

function readKnowledgeJson(path: string): unknown {
  return JSON.parse(readFileSync(new URL(`../../../docs/office-v2/${path}`, import.meta.url), "utf8"));
}

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

test("Office V2 canonical knowledge pack is complete and parseable", () => {
  assert.equal(knowledgeFiles.length, 21);
  for (const path of knowledgeFiles) {
    assert.ok(existsSync(new URL(`../../../docs/office-v2/${path}`, import.meta.url)), `missing ${path}`);
  }
  assert.equal((readKnowledgeJson("schemas/world.schema.json") as { title: string }).title, "Office V2 World Definition");
  assert.equal((readKnowledgeJson("schemas/asset.schema.json") as { title: string }).title, "Office V2 Asset Family");
  assert.equal((readKnowledgeJson("fixtures/minimal-office.json") as { schemaVersion: string }).schemaVersion, "office-world-v1");
});

test("connected desk fixture resolves deterministic east-west masks", () => {
  const fixture = readKnowledgeJson("fixtures/connected-desk.json") as {
    requiredMasks: number[];
    variants: { mask: number }[];
    cases: { cells: { x: number; y: number }[]; expectedMasks: number[] }[];
  };
  const availableMasks = new Set(fixture.variants.map(({ mask }) => mask));
  assert.ok(fixture.requiredMasks.every((mask) => availableMasks.has(mask)));
  for (const entry of fixture.cases) {
    const occupied = new Set(entry.cells.map(({ x, y }) => `${x},${y}`));
    const masks = entry.cells.map(({ x, y }) =>
      (occupied.has(`${x + 1},${y}`) ? 2 : 0) | (occupied.has(`${x - 1},${y}`) ? 8 : 0),
    );
    assert.deepEqual(masks, entry.expectedMasks);
  }
});
