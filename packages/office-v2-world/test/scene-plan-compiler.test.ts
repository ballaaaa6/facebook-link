import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { canonicalJson } from "@affiliate-ops/office-v2-contracts";
import {
  compileScenePlan,
  compilationReportCanonicalJson,
} from "../src/index.ts";
import type {
  SceneCompilerDependencies,
  ScenePlanDocument,
} from "../src/index.ts";

interface TargetFixture {
  readonly plan: ScenePlanDocument;
  readonly topologyFixture: string;
  readonly roomTemplateFixtures: readonly string[];
}

function loadInput(): { plan: ScenePlanDocument; dependencies: SceneCompilerDependencies } {
  const fixture = JSON.parse(readFileSync(new URL("../../../docs/office-v2/fixtures/scene-plan-target-floor.json", import.meta.url), "utf8")) as TargetFixture;
  const topology = JSON.parse(readFileSync(new URL(`../../../docs/office-v2/${fixture.topologyFixture}`, import.meta.url), "utf8"));
  const roomTemplates = fixture.roomTemplateFixtures.map((path) => JSON.parse(readFileSync(new URL(`../../../docs/office-v2/${path}`, import.meta.url), "utf8")));
  return { plan: fixture.plan, dependencies: { topology, roomTemplates } } as unknown as { plan: ScenePlanDocument; dependencies: SceneCompilerDependencies };
}

test("compiles the target floor with capacity, legal entrance, site context, and reserved cores", () => {
  const { plan, dependencies } = loadInput();
  const result = compileScenePlan(plan, dependencies);

  assert.equal(result.ok, true, JSON.stringify(result.diagnostics, null, 2));
  assert.ok(result.compiledBuilding);
  assert.equal(result.compiledBuilding.floors.length, 1);
  const world = result.compiledBuilding.floors[0]?.world;
  assert.ok(world);
  assert.deepEqual(world.bounds, { width: 32, depth: 24, maxElevation: 2 });
  assert.deepEqual(world.actorCapacity, { assigned: 10, reserved: 5, maximum: 15 });
  assert.equal(world.entities.filter((entity) => entity.semantic === "work").length, 10);
  assert.deepEqual(world.reservedCores.map((core) => core.kind).sort(), ["lift", "stair"]);
  assert.equal(world.portals.some((portal) => portal.id === "main-entrance"), true);
  assert.equal(result.compiledBuilding.siteEnvelope.presentationOnly, true);
  assert.equal((world as unknown as Record<string, unknown>).site, undefined);
});

test("clean compilation and authoring reordering produce identical hashes and bytes", () => {
  const original = loadInput();
  const first = compileScenePlan(original.plan, original.dependencies);
  const second = compileScenePlan(original.plan, original.dependencies);
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(first.sourcePlanHash, second.sourcePlanHash);
  assert.equal(first.canonicalWorldHash, second.canonicalWorldHash);
  assert.equal(compilationReportCanonicalJson(first), compilationReportCanonicalJson(second));
  assert.equal(canonicalJson(first.compiledBuilding as never), canonicalJson(second.compiledBuilding as never));

  const reorderedPlan = structuredClone(original.plan) as unknown as Record<string, any>;
  reorderedPlan.floorPlans.reverse();
  reorderedPlan.reservedCores.reverse();
  const reorderedTopology = structuredClone(original.dependencies.topology) as unknown as Record<string, any>;
  reorderedTopology.floors.reverse();
  reorderedTopology.portals.reverse();
  reorderedTopology.siteEnvelope.contextCells.reverse();
  const reorderedRoom = structuredClone(original.dependencies.roomTemplates[0]) as unknown as Record<string, any>;
  reorderedRoom.facilityGroups.reverse();
  reorderedRoom.facilityGroups.forEach((group: { facilities: unknown[] }) => group.facilities.reverse());
  const reordered = compileScenePlan(reorderedPlan, {
    topology: reorderedTopology,
    roomTemplates: [reorderedRoom],
  });
  assert.equal(reordered.ok, true, JSON.stringify(reordered.diagnostics, null, 2));
  assert.equal(reordered.sourcePlanHash, first.sourcePlanHash);
  assert.equal(reordered.canonicalWorldHash, first.canonicalWorldHash);
  assert.equal(canonicalJson(reordered.compiledBuilding as never), canonicalJson(first.compiledBuilding as never));
});

test("a semantic composition field changes the source and world hashes", () => {
  const { plan, dependencies } = loadInput();
  const original = compileScenePlan(plan, dependencies);
  const changedPlan = { ...plan, compositionProfile: "review" as const };
  const changed = compileScenePlan(changedPlan, dependencies);
  assert.equal(original.ok, true);
  assert.equal(changed.ok, true);
  assert.notEqual(changed.sourcePlanHash, original.sourcePlanHash);
  assert.notEqual(changed.canonicalWorldHash, original.canonicalWorldHash);
});

const invalidCases = [
  ["unresolved reference", (plan: ScenePlanDocument) => ({ ...plan, floorPlans: [{ ...plan.floorPlans[0], room: { ...plan.floorPlans[0]!.room, id: { kind: "room", value: "missing-room" } } }] }), "contract.reference-unresolved"],
  ["array-index-derived ID", (plan: ScenePlanDocument) => ({ ...plan, reservedCores: [{ ...plan.reservedCores[0]!, id: "reserved-core-0" }, plan.reservedCores[1]!] }), "contract.array-index-derived-id"],
  ["unsupported semantic variant", (plan: ScenePlanDocument) => ({ ...plan, semanticVariant: "legacy-office-v2" as never }), "world.semantic-variant-unsupported"],
  ["site occupancy leak", (plan: ScenePlanDocument) => ({ ...plan, siteOccupancy: { cells: [{ x: 9, y: 11 }] } } as never), "world.site-occupancy-leak"],
] as const;

for (const [name, mutate, expected] of invalidCases) {
  test(`rejects ${name} with a stable diagnostic`, () => {
    const { plan, dependencies } = loadInput();
    const result = compileScenePlan(mutate(plan), dependencies);
    assert.equal(result.ok, false);
    assert.equal(result.diagnostics[0]?.code, expected, JSON.stringify(result.diagnostics, null, 2));
  });
}

test("rejects direct V1 world input before attempting migration", () => {
  const { dependencies } = loadInput();
  const result = compileScenePlan({ schemaVersion: "office-world-v1", worldId: "legacy-world" }, dependencies);
  assert.equal(result.ok, false);
  assert.equal(result.diagnostics[0]?.code, "contract.v1-world-rejected");
});
