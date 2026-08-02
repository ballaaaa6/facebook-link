import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { compileScenePlan } from "../src/scene-plan-compiler.ts";
import type { DefinitionBundleDocument, FloorLocalCellPosition } from "@affiliate-ops/office-v2-contracts";
import {
  canonicalizeWorldKernel,
  normalizeBuildingTopology,
  normalizeStructuralEdge,
  normalizeStructuralEdges,
  structuralEdgeIdentity,
  type TopologyKernelDocument,
  type WorldKernelEnvelope,
} from "../src/topology-kernel.ts";
import type { SceneCompilerDependencies, ScenePlanDocument } from "../src/scene-plan-compiler.ts";

function fixture<T>(name: string): T {
  return JSON.parse(readFileSync(new URL(`../../../docs/office-v2/fixtures/${name}`, import.meta.url), "utf8")) as T;
}

function floorCell(floor: unknown, x: number, y: number, elevation = 0): FloorLocalCellPosition {
  return { space: "floor-local-cell", floor: floor as FloorLocalCellPosition["floor"], coordinate: { space: "cell", x, y, elevation } };
}

function targetWorld(): WorldKernelEnvelope {
  const target = fixture<{ plan: ScenePlanDocument; topologyFixture: string; roomTemplateFixtures: readonly string[] }>("scene-plan-target-floor.json");
  const topology = fixture<TopologyKernelDocument>(target.topologyFixture.replace("fixtures/", ""));
  const roomTemplates = target.roomTemplateFixtures.map((path) => fixture<Record<string, unknown>>(path.replace("fixtures/", "")));
  const result = compileScenePlan(target.plan, { topology, roomTemplates } as unknown as SceneCompilerDependencies);
  assert.equal(result.ok, true, JSON.stringify(result.diagnostics));
  return result.compiledBuilding!.floors[0]!.world as unknown as WorldKernelEnvelope;
}

test("normalizes the existing one-floor, target-floor, and two-floor topology fixtures", () => {
  for (const name of ["building-topology-one-floor.json", "building-topology-target-floor.json", "building-topology-two-floors.json"]) {
    const result = normalizeBuildingTopology(fixture<TopologyKernelDocument>(name));
    assert.equal(result.ok, true, `${name}: ${JSON.stringify(result.diagnostics)}`);
    assert.ok(result.topology);
  }
});

test("topology collection normalization is invariant under floor, site, and portal reorder", () => {
  const source = fixture<TopologyKernelDocument>("building-topology-two-floors.json");
  const reordered = structuredClone(source);
  reordered.floors.reverse();
  reordered.portals.reverse();
  reordered.siteEnvelope.contextKinds.reverse();
  reordered.siteEnvelope.contextCells.reverse();
  for (const floor of reordered.floors) floor.siteFootprint.reverse();
  assert.deepEqual(normalizeBuildingTopology(reordered), normalizeBuildingTopology(source));
});

test("an explicitly ordered topology collection remains order-sensitive", () => {
  const source = fixture<TopologyKernelDocument>("building-topology-two-floors.json");
  source.collectionDeclarations = [{ pointer: "/portals", order: "ordered" }];
  const reordered = structuredClone(source);
  reordered.portals.reverse();
  const first = normalizeBuildingTopology(source);
  const second = normalizeBuildingTopology(reordered);
  assert.equal(first.ok && second.ok, true);
  assert.notDeepEqual(first.topology!.portals, second.topology!.portals);
});

test("structural south/east edges share the adjacent north/west identity", () => {
  const floor = { id: { kind: "floor", value: "ground-floor" }, version: 1 };
  const north = normalizeStructuralEdge({ floor, ownerCell: floorCell(floor, 3, 4), edge: "north" });
  const south = normalizeStructuralEdge({ floor, ownerCell: floorCell(floor, 3, 3), edge: "south" });
  const west = normalizeStructuralEdge({ floor, ownerCell: floorCell(floor, 5, 4), edge: "west" });
  const east = normalizeStructuralEdge({ floor, ownerCell: floorCell(floor, 4, 4), edge: "east" });
  assert.equal(north.ok && south.ok && north.edge!.identity === south.edge!.identity, true);
  assert.equal(west.ok && east.ok && west.edge!.identity === east.edge!.identity, true);
  assert.notEqual(structuralEdgeIdentity({ id: { kind: "floor", value: "other-floor" }, version: 1 }, floorCell(floor, 3, 3), "south"), south.edge!.identity);
  assert.equal(normalizeStructuralEdges([north.edge!, south.edge!].map((edge) => edge as never)).ok, false);
});

test("canonical world bytes/hash are stable for unordered reorder and change for semantics", () => {
  const world = targetWorld();
  const first = canonicalizeWorldKernel(world);
  assert.equal(first.ok, true, JSON.stringify(first.diagnostics));
  assert.ok(first.bytes && first.hash);
  const reordered = structuredClone(world) as unknown as Record<string, any>;
  for (const field of ["rooms", "actorSlots", "entities", "reservedCores", "portals"] as const) {
    if (Array.isArray(reordered[field])) reordered[field].reverse();
  }
  reordered.entities.forEach((entity: { occupiedCells: unknown[] }) => entity.occupiedCells.reverse());
  reordered.reservedCores.forEach((core: { cells: unknown[] }) => core.cells.reverse());
  const second = canonicalizeWorldKernel(reordered);
  assert.equal(second.ok, true, JSON.stringify(second.diagnostics));
  assert.equal(new TextDecoder().decode(first.bytes), new TextDecoder().decode(second.bytes));
  assert.equal(first.hash, second.hash);
  const changed = canonicalizeWorldKernel({ ...world, compositionProfile: "review" });
  assert.equal(changed.ok, true);
  assert.notEqual(changed.hash, first.hash);
  const ordered = canonicalizeWorldKernel(reordered, { orderedPointers: ["/entities"] });
  assert.equal(ordered.ok, true);
  assert.notEqual(new TextDecoder().decode(ordered.bytes), new TextDecoder().decode(first.bytes));
});

test("missing, stale, wrong-kind/version, duplicate, site-leak, and cycle inputs fail before bytes", () => {
  const world = targetWorld();
  const missing = structuredClone(world) as unknown as Record<string, any>;
  delete missing.building;
  const missingResult = canonicalizeWorldKernel(missing);
  assert.equal(missingResult.ok, false);
  assert.equal(missingResult.diagnostics.some(({ code }) => code === "world.reference-missing"), true);
  assert.equal(missingResult.bytes, undefined);

  const stale = structuredClone(world) as unknown as Record<string, any>;
  stale.floor.version = 2;
  assert.equal(canonicalizeWorldKernel(stale).diagnostics.some(({ code }) => code === "world.floor-mismatch"), true);
  const wrongKind = structuredClone(world) as unknown as Record<string, any>;
  wrongKind.building.id.kind = "floor";
  assert.equal(canonicalizeWorldKernel(wrongKind).diagnostics.some(({ code }) => code === "world.reference-kind-mismatch"), true);
  const wrongVersion = structuredClone(world) as unknown as Record<string, any>;
  delete wrongVersion.floor.version;
  assert.equal(canonicalizeWorldKernel(wrongVersion).diagnostics.some(({ code }) => code === "contract.reference-version-missing"), true);
  const duplicate = structuredClone(world) as unknown as Record<string, any>;
  duplicate.portals.push(structuredClone(duplicate.portals[0]));
  assert.equal(canonicalizeWorldKernel(duplicate).diagnostics.some(({ code }) => code === "world.reference-duplicate"), true);
  const site = canonicalizeWorldKernel({ ...world, siteOccupancy: { cells: [] } });
  assert.equal(site.diagnostics.some(({ code }) => code === "world.site-occupancy-leak"), true);
  const cycle = canonicalizeWorldKernel(world, {
    renderParts: [
      { id: { id: { kind: "render-part", value: "part-a" }, version: 1 }, dependencies: [{ id: { kind: "render-part", value: "part-b" }, version: 1 }] },
      { id: { id: { kind: "render-part", value: "part-b" }, version: 1 }, dependencies: [{ id: { kind: "render-part", value: "part-a" }, version: 1 }] },
    ],
  });
  assert.equal(cycle.ok, false);
  assert.equal(cycle.diagnostics.some(({ code }) => code === "world.render-attachment-cycle"), true);
});

test("definition-bundle reference closure is reused before canonical output", () => {
  const bundle = fixture<DefinitionBundleDocument>("definition-bundle-v2.json");
  bundle.references.assetFamilyRefs = [];
  const result = canonicalizeWorldKernel(targetWorld(), { definitionBundle: bundle });
  assert.equal(result.ok, false);
  assert.equal(result.diagnostics.some(({ code }) => code === "world.reference-missing"), true);
  assert.equal(result.hash, undefined);
});
