import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  officeFullGridCellBounds,
  officeFullGridCellLabel,
  officeFullGridReviewOutput,
  validateOfficeFullGrid,
  type OfficeFullGridManifest,
  type OfficeFullGridMap,
} from "../src/index.ts";

const root = new URL("../../../", import.meta.url);
const readJson = (path: string) => JSON.parse(readFileSync(new URL(path, root), "utf8"));
const digest = (path: string) => createHash("sha256").update(readFileSync(new URL(path, root))).digest("hex");
const map = readJson("assets/game/maps/office-full-grid-v1.json") as OfficeFullGridMap;
const manifest = readJson("assets/game/manifests/office-full-grid-v1.json") as OfficeFullGridManifest;

test("full Office image is covered by neutral A1-style coordinates", () => {
  assert.deepEqual(validateOfficeFullGrid(map), []);
  assert.equal(officeFullGridCellLabel(0, 0), "A1");
  assert.equal(officeFullGridCellLabel(25, 0), "Z1");
  assert.equal(officeFullGridCellLabel(26, 0), "AA1");
  assert.equal(officeFullGridCellLabel(42, 23), "AQ24");
  assert.deepEqual(officeFullGridCellBounds(map, 0, 0), {
    left: 0, top: 0, right: 39, bottom: 39, width: 39, height: 39,
  });
  const last = officeFullGridCellBounds(map, 42, 23);
  assert.equal(last.right, 1672);
  assert.equal(last.bottom, 941);
});

test("the coordinate map contains no inferred floor, wall, pillar, or furniture zones", () => {
  assert.deepEqual(map.classifications, []);
  assert.equal(map.rules.ownerAssignsAllZones, true);
  assert.equal(map.rules.inferredFloorOrWallZones, false);
  assert.equal(map.rules.newFurnitureOrArt, false);
  assert.equal(map.activeOfficePromotion, false);
});

test("the numbered review image is deterministic and Active Office is unchanged", () => {
  assert.equal(manifest.reviewOutput.file, officeFullGridReviewOutput);
  assert.equal(digest(manifest.map.file), manifest.map.sha256);
  assert.equal(digest(manifest.reviewOutput.file), manifest.reviewOutput.sha256);
  assert.equal(digest(manifest.activeOfficeBaseline.file), manifest.activeOfficeBaseline.sha256);
  assert.equal(digest(map.sourceBackground.file), map.sourceBackground.sha256);
});
