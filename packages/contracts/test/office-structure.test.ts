import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  validateOfficeMapV2,
  validateOfficeWorkstationDeploymentManifestV1,
  type OfficeMapV2,
  type OfficeWorkstationBundleV1,
} from "../src/index.ts";

function readJson(relative: string) {
  return JSON.parse(readFileSync(new URL(relative, import.meta.url), "utf8"));
}

const map = readJson("../../../assets/game/manifests/fixtures/office-structure-v2-valid.json") as OfficeMapV2;
const bundle = readJson("../../../assets/game/manifests/office-workstation-bundle-v1.json") as OfficeWorkstationBundleV1;
const presets = readJson("../../../assets/game/manifests/office-workstation-deployment-v1.json");

test("rejected Office Map v2 remains valid structural regression evidence", () => {
  assert.deepEqual(validateOfficeMapV2(map), []);
  assert.deepEqual(validateOfficeWorkstationDeploymentManifestV1(presets, bundle), []);
});

test("structural openings require wall parents and local viewports", () => {
  const invalid = structuredClone(map);
  const window = invalid.structures.find((item) => item.kind === "window-opening");
  assert.ok(window?.kind === "window-opening");
  window.parentWallId = "missing-wall";
  window.viewport.coordinateSpace = "world" as "viewport-local";
  const issues = validateOfficeMapV2(invalid).join("\n");
  assert.match(issues, /parentWallId/);
  assert.match(issues, /viewport-local/);
});

test("door portals remain inside openings and closed doors block routes", () => {
  const invalid = structuredClone(map);
  invalid.portals[0]!.cells[0]!.x = 3;
  invalid.portals[0]!.statePolicy.closed = "passable" as "blocked";
  const issues = validateOfficeMapV2(invalid).join("\n");
  assert.match(issues, /door opening/);
  assert.match(issues, /closed doors must block/);
});

test("wall structures never enter floor sorting", () => {
  const invalid = structuredClone(map);
  const wall = invalid.structures.find((item) => item.kind === "wall-segment");
  assert.ok(wall?.kind === "wall-segment");
  wall.floorYSort = true as false;
  const issues = validateOfficeMapV2(invalid).join("\n");
  assert.match(issues, /outside floor Y-sort/);
});

test("deployment presets cannot change desk geometry or reuse invalid slots", () => {
  const invalid = structuredClone(presets);
  invalid.presets[0].deskFamilyId = "desk.standard.unique";
  invalid.presets[0].equipment[1].slot.id = invalid.presets[0].equipment[0].slot.id;
  invalid.presets[0].equipment[1].slot.y = 3;
  const issues = validateOfficeWorkstationDeploymentManifestV1(invalid, bundle).join("\n");
  assert.match(issues, /cannot change desk geometry/);
  assert.match(issues, /unique/);
  assert.match(issues, /inside the support plane/);
});
