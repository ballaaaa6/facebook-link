import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  geometryFingerprint,
  inverseWorldOrientation,
  rotateDefinitionLocalCell,
  rotateDefinitionLocalSubCell,
  transformGeometry,
  validateGeometry,
  validateGeometryAgreement,
} from "../src/index.ts";
import type {
  DefinitionLocalCellOffset,
  DefinitionLocalSubCellOffset,
  GeometryDocument,
} from "@affiliate-ops/office-v2-contracts";

function readGeometry(): GeometryDocument {
  const bundle = JSON.parse(readFileSync(new URL("../../../docs/office-v2/fixtures/definition-bundle-v2.json", import.meta.url), "utf8"));
  return bundle.geometries[0] as GeometryDocument;
}

function cloneGeometry(): GeometryDocument {
  return structuredClone(readGeometry());
}

test("all four cardinal transforms round-trip asymmetric cell and sub-cell offsets", () => {
  const cell: DefinitionLocalCellOffset = { space: "definition-local-cell", x: 2, y: -1, elevation: 3 };
  const subCell: DefinitionLocalSubCellOffset = { space: "definition-local-sub-cell", x: 7, y: -2, elevation: 5 };
  for (const orientation of ["north", "east", "south", "west"] as const) {
    assert.deepEqual(rotateDefinitionLocalCell(rotateDefinitionLocalCell(cell, orientation), inverseWorldOrientation(orientation)), cell);
    assert.deepEqual(rotateDefinitionLocalSubCell(rotateDefinitionLocalSubCell(subCell, orientation), inverseWorldOrientation(orientation)), subCell);
  }
});

test("geometry transforms preserve asymmetric footprint, clearance, socket, and use-slot facts", () => {
  const geometry = cloneGeometry() as unknown as Record<string, any>;
  geometry.footprint.push({ space: "definition-local-cell", x: 2, y: -1, elevation: 0 });
  geometry.clearance.push({ space: "definition-local-cell", x: -1, y: 2, elevation: 0 });
  geometry.sockets[0].position = { space: "definition-local-sub-cell", x: 7, y: -2, elevation: 0 };
  geometry.useSlots[0].approach.push({ space: "definition-local-cell", x: 1, y: 2, elevation: 0 });
  const transformed = transformGeometry(geometry as GeometryDocument, "east");
  assert.deepEqual(transformed.footprint[1], { space: "definition-local-cell", x: 1, y: 2, elevation: 0 });
  assert.deepEqual(transformed.clearance[0], { space: "definition-local-cell", x: -2, y: -1, elevation: 0 });
  assert.deepEqual(transformed.sockets[0].position, { space: "definition-local-sub-cell", x: 2, y: 7, elevation: 0 });
  assert.deepEqual(transformed.useSlots[0].approach[1], { space: "definition-local-cell", x: -2, y: 1, elevation: 0 });
});

test("unsupported orientations and invalid transform tables fail with stable diagnostics", () => {
  const unsupported = validateGeometry(cloneGeometry(), "north-east" as never);
  assert.equal(unsupported.diagnostics.some(({ code }) => code === "world.orientation-unsupported"), true);

  const invalid = cloneGeometry() as unknown as Record<string, any>;
  invalid.orientationTransforms[1].quarterTurnsClockwise = 2;
  const result = validateGeometry(invalid as GeometryDocument);
  assert.equal(result.ok, false);
  assert.equal(result.diagnostics.some(({ code }) => code === "world.geometry-rotation-invalid"), true);
});

test("duplicate members and rotated clearance conflicts fail closed", () => {
  const geometry = cloneGeometry() as unknown as Record<string, any>;
  geometry.sockets.push(structuredClone(geometry.sockets[0]));
  geometry.useSlots.push(structuredClone(geometry.useSlots[0]));
  geometry.clearance.push({ space: "definition-local-cell", x: 0, y: 0, elevation: 0 });
  const result = validateGeometry(geometry as GeometryDocument);
  assert.equal(result.ok, false);
  assert.equal(result.diagnostics.some(({ code }) => code === "world.socket-duplicate"), true);
  assert.equal(result.diagnostics.some(({ code }) => code === "world.use-slot-duplicate"), true);
  assert.equal(result.diagnostics.some(({ code }) => code === "world.geometry-rotation-invalid"), true);
});

test("derived geometry agrees only after the declared rotation", () => {
  const geometry = cloneGeometry();
  const transformed = transformGeometry(geometry, "south");
  const accepted = validateGeometryAgreement(geometry, {
    geometry: geometry.geometry,
    orientation: "south",
    owner: "derived",
    geometryDigest: geometryFingerprint(transformed),
    footprint: transformed.footprint,
    clearance: transformed.clearance,
    sockets: transformed.sockets,
    useSlots: transformed.useSlots,
  });
  assert.equal(accepted.ok, true, JSON.stringify(accepted.diagnostics, null, 2));

  const conflicting = validateGeometryAgreement(geometry, {
    geometry: geometry.geometry,
    orientation: "south",
    owner: "derived",
    footprint: [{ ...transformed.footprint[0], x: 99 }],
  });
  assert.equal(conflicting.diagnostics.some(({ code }) => code === "world.geometry-conflict"), true);
});

test("assets cannot introduce simulation occupancy geometry", () => {
  const geometry = cloneGeometry();
  const result = validateGeometryAgreement(geometry, {
    geometry: geometry.geometry,
    orientation: "north",
    owner: "asset",
    footprint: geometry.footprint,
  });
  assert.equal(result.ok, false);
  assert.equal(result.diagnostics.some(({ code }) => code === "world.asset-occupancy-forbidden"), true);
});
