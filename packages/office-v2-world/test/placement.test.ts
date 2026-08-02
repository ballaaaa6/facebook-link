import assert from "node:assert/strict";
import test from "node:test";
import type { FloorReference, GeometryDocument, GeometryReference, WorldFacing } from "@affiliate-ops/office-v2-contracts";
import {
  createEmptyPlacementSnapshot,
  derivePlacementGeometry,
  placeEntity,
  type PlacementContext,
  type PlacementFloor,
  type PlacementRequest,
} from "../src/placement.ts";

const floor = { id: { kind: "floor", value: "ground-floor" }, version: 1 } as FloorReference;
const geometryRef = { id: { kind: "geometry", value: "asymmetric-desk" }, version: 1 } as GeometryReference;
const socketRef = { kind: "socket", value: "actor" };
const slotRef = { kind: "use-slot", value: "work" };

function geometry(): GeometryDocument {
  return {
    schemaVersion: "office-geometry-v2", geometry: geometryRef, authority: "office-geometry-authority-v1",
    anchorBasis: { origin: { space: "definition-local-cell", x: 0, y: 0, elevation: 0 }, groundContact: { space: "definition-local-sub-cell", x: 0, y: 0, elevation: 0 } },
    footprint: [{ space: "definition-local-cell", x: 0, y: 0, elevation: 0 }, { space: "definition-local-cell", x: 2, y: 0, elevation: 0 }, { space: "definition-local-cell", x: 0, y: 1, elevation: 0 }],
    blocking: { mode: "solid", cells: [{ space: "definition-local-cell", x: 0, y: 0, elevation: 0 }] },
    clearance: [{ space: "definition-local-cell", x: 1, y: 1, elevation: 0 }],
    supportedOrientations: ["north", "east", "south", "west"],
    orientationTransforms: ["north", "east", "south", "west"].map((orientation, quarterTurnsClockwise) => ({ orientation, quarterTurnsClockwise })),
    sockets: [{ id: socketRef, position: { space: "definition-local-sub-cell", x: 5, y: 2, elevation: 0 }, role: "actor" }],
    useSlots: [{ id: slotRef, approach: [{ space: "definition-local-cell", x: 0, y: 2, elevation: 0 }], waiting: [{ space: "definition-local-cell", x: 1, y: 2, elevation: 0 }], facing: "north", actorSocket: socketRef }],
  } as GeometryDocument;
}

function floorModel(overrides: Partial<PlacementFloor> = {}): PlacementFloor {
  const surfaces = Array.from({ length: 8 * 8 }, (_, index) => ({ coordinate: { x: index % 8, y: Math.floor(index / 8), elevation: 0 }, kind: "floor" as const }));
  return {
    floor, bounds: { width: 8, depth: 8, maxElevation: 0 }, surfaces,
    surfacePolicy: { allowedKinds: { structure: ["floor"], furniture: ["floor"], decoration: ["floor"], facility: ["floor"], prop: ["floor"], "actor-anchor": ["floor"] }, walkableKinds: ["floor"] },
    navigation: { starts: [{ x: 0, y: 0, elevation: 0 }] }, ...overrides,
  };
}

function request(id: string, anchor: { x: number; y: number; elevation?: number } = { x: 3, y: 3, elevation: 0 }, kind: "structure" | "furniture" | "decoration" = "furniture", overrides: Partial<PlacementRequest> = {}): PlacementRequest {
  return { entity: { id, kind }, geometry: geometryRef, floor, anchor: { ...anchor, elevation: anchor.elevation ?? 0 }, orientation: "north", requireApproach: false, ...overrides };
}

function context(floorOverride: Partial<PlacementFloor> = {}): PlacementContext { return { floor: floorModel(floorOverride), geometryAuthority: { authority: "office-geometry-authority-v1", geometries: [geometry()] } }; }
function place(snapshot: ReturnType<typeof createEmptyPlacementSnapshot>, item: PlacementRequest, world = context()) { return placeEntity(snapshot, item, world); }
function codes(result: { readonly diagnostics: readonly { readonly code: string }[] }): readonly string[] { return result.diagnostics.map(({ code }) => code); }

test("asymmetric footprint, clearance, approach, waiting, socket, and facing rotate cardinally", () => {
  const base = request("turns", { x: 3, y: 3, elevation: 0 });
  const expected = {
    north: [{ x: 3, y: 3, elevation: 0 }, { x: 5, y: 3, elevation: 0 }, { x: 3, y: 4, elevation: 0 }],
    east: [{ x: 3, y: 3, elevation: 0 }, { x: 3, y: 5, elevation: 0 }, { x: 2, y: 3, elevation: 0 }],
    south: [{ x: 3, y: 3, elevation: 0 }, { x: 1, y: 3, elevation: 0 }, { x: 3, y: 2, elevation: 0 }],
    west: [{ x: 3, y: 3, elevation: 0 }, { x: 3, y: 1, elevation: 0 }, { x: 4, y: 3, elevation: 0 }],
  } as const;
  for (const orientation of ["north", "east", "south", "west"] as const) {
    const result = derivePlacementGeometry(geometry(), { ...base, orientation }, "blocking");
    assert.equal(result.ok, true, JSON.stringify(result.diagnostics));
    assert.deepEqual(result.geometry?.footprint, expected[orientation].slice().sort((a, b) => a.y - b.y || a.x - b.x));
    assert.equal(result.geometry?.useSlots[0]?.facing, orientation);
  }
  const east = derivePlacementGeometry(geometry(), { ...base, orientation: "east" }, "blocking");
  assert.deepEqual(east.geometry?.clearance, [{ x: 2, y: 4, elevation: 0 }]);
  assert.deepEqual(east.geometry?.useSlots[0]?.approach, [{ x: 1, y: 3, elevation: 0 }]);
  assert.deepEqual(east.geometry?.useSlots[0]?.waiting, [{ x: 1, y: 4, elevation: 0 }]);
  assert.deepEqual(east.geometry?.sockets[0]?.position, { x: 10, y: 17, elevation: 0 });
  assert.deepEqual(east.geometry?.useSlots[0]?.actorSocket.position, { x: 10, y: 17, elevation: 0 });
});

test("edge and corner placement rejects transformed cells outside floor bounds", () => {
  const world = context({ bounds: { width: 4, depth: 4, maxElevation: 0 } });
  const result = place(createEmptyPlacementSnapshot(world.floor), request("edge", { x: 3, y: 3, elevation: 0 }), world);
  assert.equal(result.ok, false); assert.ok(codes(result).includes("world.out-of-bounds"));
});

test("structural and furniture blockers occupy cells while decoration is presentation-only", () => {
  const world = context(); const first = place(createEmptyPlacementSnapshot(world.floor), request("structure", { x: 1, y: 1 }, "structure"), world);
  assert.equal(first.ok, true, JSON.stringify(first)); if (!first.ok) return;
  const furniture = place(first.snapshot, request("furniture", { x: 1, y: 1 }, "furniture"), world);
  assert.equal(furniture.ok, false); assert.ok(codes(furniture).includes("world.occupied"));
  const decoration = place(first.snapshot, request("decoration", { x: 1, y: 1 }, "decoration"), world);
  assert.equal(decoration.ok, true); if (!decoration.ok) return;
  assert.equal(decoration.snapshot.occupancy.ownerOf({ x: 1, y: 1, elevation: 0 }), "structure");
  assert.equal(decoration.snapshot.occupancy.blocking.size, 1);
  assert.deepEqual(decoration.entity.blocking, []); assert.deepEqual(decoration.entity.clearance, []);
});

test("clearance conflict, unsupported surface, and unreachable approach reject", () => {
  const world = context(); const first = place(createEmptyPlacementSnapshot(world.floor), request("first", { x: 1, y: 1 }), world);
  assert.equal(first.ok, true, JSON.stringify(first)); if (!first.ok) return;
  const clearance = place(first.snapshot, request("clearance", { x: 2, y: 2 }), world);
  assert.equal(clearance.ok, false); assert.ok(codes(clearance).includes("world.clearance"));
  const unsupported = place(createEmptyPlacementSnapshot(world.floor), request("surface", { x: 1, y: 1 }), context({ surfaces: world.floor.surfaces.map((surface) => ({ ...surface, kind: "carpet" })) }));
  assert.equal(unsupported.ok, false); assert.ok(codes(unsupported).includes("world.unsupported-surface"));
  const unreachable = place(createEmptyPlacementSnapshot(world.floor), { ...request("unreachable", { x: 2, y: 2 }), requireApproach: true }, context({ navigation: { starts: [{ x: 0, y: 0, elevation: 0 }], walkableCells: [{ x: 0, y: 0, elevation: 0 }] } }));
  assert.equal(unreachable.ok, false); assert.ok(codes(unreachable).includes("world.unreachable"));
});

test("missing geometry and unsupported orientation fail with stable diagnostics", () => {
  const world = context(); const missing = place(createEmptyPlacementSnapshot(world.floor), { ...request("missing"), geometry: { id: { kind: "geometry", value: "missing" }, version: 1 } as GeometryReference }, world);
  assert.equal(missing.ok, false); assert.ok(codes(missing).includes("world.geometry-missing"));
  const unsupportedGeometry = { ...geometry(), supportedOrientations: ["north"], orientationTransforms: [{ orientation: "north", quarterTurnsClockwise: 0 }] } as GeometryDocument;
  const unsupported = place(createEmptyPlacementSnapshot(world.floor), { ...request("unsupported"), orientation: "east" }, { ...world, geometryAuthority: { geometries: [unsupportedGeometry] } });
  assert.equal(unsupported.ok, false); assert.ok(codes(unsupported).includes("world.orientation-unsupported"));
});

test("rejection preserves immutable snapshot and caller inputs", () => {
  const world = context(); const accepted = place(createEmptyPlacementSnapshot(world.floor), request("owner", { x: 1, y: 1 }), world);
  assert.equal(accepted.ok, true, JSON.stringify(accepted)); if (!accepted.ok) return;
  const before = JSON.stringify(accepted.snapshot); const input = request("collision", { x: 1, y: 1 }); const inputBefore = structuredClone(input);
  const rejected = place(accepted.snapshot, input, world);
  assert.equal(rejected.ok, false); assert.equal(rejected.snapshot, accepted.snapshot); assert.equal(JSON.stringify(rejected.snapshot), before); assert.deepEqual(input, inputBefore);
});

test("equivalent insertion order yields deterministic immutable occupancy", () => {
  const world = context(); const empty = createEmptyPlacementSnapshot(world.floor); const a = request("a", { x: 1, y: 1 }); const b = request("b", { x: 5, y: 5 });
  const firstA = place(empty, a, world); assert.equal(firstA.ok, true, JSON.stringify(firstA)); if (!firstA.ok) return; const firstAB = place(firstA.snapshot, b, world); assert.equal(firstAB.ok, true, JSON.stringify(firstAB)); if (!firstAB.ok) return;
  const firstB = place(empty, b, world); assert.equal(firstB.ok, true, JSON.stringify(firstB)); if (!firstB.ok) return; const firstBA = place(firstB.snapshot, a, world); assert.equal(firstBA.ok, true, JSON.stringify(firstBA)); if (!firstBA.ok) return;
  assert.equal(JSON.stringify(firstAB.snapshot), JSON.stringify(firstBA.snapshot)); assert.equal(firstAB.snapshot.occupancy.ownerOf({ x: 1, y: 1, elevation: 0 }), "a"); assert.equal(firstAB.snapshot.occupancy.ownerOf({ x: 5, y: 5, elevation: 0 }), "b");
});
