import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { validateOfficeWorkstationStep5Manifest } from "../src/officeWorkstationStep5.ts";

const manifestUrl = new URL(
  "../../../assets/game/manifests/office-workstation-step5-single-seat-v1.json",
  import.meta.url,
);
const activeOfficeUrl = new URL("../../../assets/game/maps/office-c-v2.json", import.meta.url);
const manifest = JSON.parse(readFileSync(manifestUrl, "utf8"));

test("Step 5 authorizes only an isolated one-seat review lab", () => {
  assert.deepEqual(validateOfficeWorkstationStep5Manifest(manifest), []);
  assert.equal(manifest.permissions.singleSeatAssembly, true);
  assert.equal(manifest.permissions.newArtworkGeneration, false);
  assert.equal(manifest.permissions.rosterWideCalibration, false);
  assert.equal(manifest.permissions.tenSeatSceneAssembly, false);
  assert.equal(manifest.permissions.activeOfficePromotion, false);
  assert.equal(manifest.lab.stationCount, 1);
  assert.equal(manifest.lab.reviewViewCount, 2);
});

test("Step 5 preserves the Active Office baseline", () => {
  const hash = createHash("sha256").update(readFileSync(activeOfficeUrl)).digest("hex");
  assert.equal(hash, manifest.activeOfficeBaseline.sha256);
});

test("Step 5 rejects a chair inside the desk or a swapped equipment row", () => {
  const invalid = structuredClone(manifest);
  invalid.orientations.far.chairFootprintRelative.y = 0;
  invalid.orientations.near.monitorReservationRelative.y = 1;
  const issues = validateOfficeWorkstationStep5Manifest(invalid).join("\n");
  assert.match(issues, /chairFootprintRelative/);
  assert.match(issues, /monitorReservationRelative/);
});

test("Step 5 rejects ten-seat and Active Office permissions", () => {
  const invalid = structuredClone(manifest);
  invalid.permissions.tenSeatSceneAssembly = true;
  invalid.permissions.activeOfficePromotion = true;
  const issues = validateOfficeWorkstationStep5Manifest(invalid).join("\n");
  assert.match(issues, /tenSeatSceneAssembly/);
  assert.match(issues, /activeOfficePromotion/);
});
