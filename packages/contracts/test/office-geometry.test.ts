import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  officeAssetTypes,
  validateOfficeGeometryV3,
  type OfficeGeometryV3,
} from "../src/officeGeometry.ts";

const catalog = JSON.parse(readFileSync(new URL(
  "../../../assets/game/manifests/fixtures/office-geometry-v3-valid.json",
  import.meta.url,
), "utf8")) as { assets: OfficeGeometryV3[] };

test("Geometry v3 has one valid fixture for every Office asset type", () => {
  assert.deepEqual(
    new Set(catalog.assets.map(({ assetType }) => assetType)),
    new Set(officeAssetTypes),
  );
  for (const geometry of catalog.assets) {
    assert.deepEqual(validateOfficeGeometryV3(geometry), [], geometry.id);
  }
});

test("the canonical desk separates scale, footprint, and support plane", () => {
  const desk = catalog.assets.find(({ id }) => id === "fixture.desk.surface");
  assert.ok(desk);
  assert.deepEqual(desk.physicalScale, {
    width: 5,
    depth: 4,
    height: 2.4,
    unit: "tile",
  });
  assert.deepEqual(desk.footprint, { width: 5, depth: 4, unit: "tile" });
  assert.deepEqual(desk.supportPlane, {
    id: "desk-surface",
    width: 5,
    depth: 3,
    height: 2.4,
    unit: "tile",
  });
});

test("Geometry v3 rejects duplicate slots and unstable animation pivots", () => {
  const desk = structuredClone(catalog.assets.find(({ id }) => id === "fixture.desk.surface"));
  assert.ok(desk);
  desk.attachmentSlots = [desk.attachmentSlots[0]!, desk.attachmentSlots[0]!];
  assert.match(validateOfficeGeometryV3(desk).join("\n"), /attachmentSlots\[1\]\.id/);

  const shell = structuredClone(catalog.assets.find(({ id }) => id === "fixture.vending.animated"));
  assert.ok(shell?.animation);
  (shell.animation as { stableBasePivot: boolean }).stableBasePivot = false;
  assert.match(validateOfficeGeometryV3(shell).join("\n"), /animation\.stableBasePivot/);
});

test("a supported prop inherits collision and sorting from its parent surface", () => {
  const prop = structuredClone(catalog.assets.find(({ id }) => id === "fixture.plant.upright"));
  assert.ok(prop);
  prop.id = "fixture.monitor.supported";
  prop.placementPlane = "furniture-surface";
  prop.footprint = null;
  prop.sortPivot = null;
  assert.deepEqual(validateOfficeGeometryV3(prop), []);
});
