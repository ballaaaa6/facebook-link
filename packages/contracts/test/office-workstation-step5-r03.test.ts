import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  projectOfficeWorldPoint,
  validateOfficeCameraScaleBibleV3,
  validateOfficeWorkstationStep5ManifestV3,
} from "../src/index.ts";

const cameraUrl = new URL(
  "../../../assets/game/manifests/office-camera-scale-bible-v3.json",
  import.meta.url,
);
const manifestUrl = new URL(
  "../../../assets/game/manifests/office-workstation-step5-single-seat-v3.json",
  import.meta.url,
);
const measurementUrl = new URL(
  "../../../assets/game/manifests/office-workstation-step5-r03-measurements.json",
  import.meta.url,
);
const activeOfficeUrl = new URL("../../../assets/game/maps/office-c-v2.json", import.meta.url);
const camera = JSON.parse(readFileSync(cameraUrl, "utf8"));
const manifest = JSON.parse(readFileSync(manifestUrl, "utf8"));
const measurement = JSON.parse(readFileSync(measurementUrl, "utf8"));

test("R03 locks one 32-pixel orthographic projection with integer z levels", () => {
  assert.deepEqual(validateOfficeCameraScaleBibleV3(camera), []);
  assert.deepEqual(projectOfficeWorldPoint({ x: 3, y: 4, z: 0 }), { x: 96, y: 128 });
  assert.deepEqual(projectOfficeWorldPoint({ x: 3, y: 4, z: 2 }), { x: 96, y: 64 });
  assert.deepEqual(camera.world.levels, { floor: 0, chairSeat: 1, deskSupport: 2, personTop: 3 });
});

test("R03 defines correct footprints but stops before pixel-anchor and renderer work", () => {
  assert.deepEqual(validateOfficeWorkstationStep5ManifestV3(manifest), []);
  assert.deepEqual(manifest.stationStandard.person.logicalVolume, { width: 1, depth: 1, height: 3 });
  assert.deepEqual(manifest.stationStandard.chair.logicalVolume, { width: 1, depth: 1, height: 2 });
  assert.deepEqual(manifest.stationStandard.desk.supportPlanePixels, { width: 96, depth: 64 });
  assert.deepEqual(manifest.stationStandard.keyboard.reservation, { width: 1, depth: 1 });
  assert.equal(manifest.permissions.rendererImplementation, false);
  assert.equal(manifest.permissions.step6, false);
  assert.equal(manifest.permissions.activeOfficePromotion, false);
});

test("R03 records measured R02 failure rather than trusting declarations", () => {
  assert.equal(measurement.rejectedR02.measuredSurfaceDepthPixels, 30);
  assert.equal(measurement.rejectedR02.requiredSurfaceDepthPixels, 64);
  assert.equal(measurement.rejectedR02.surfaceDepthDeficitPixels, 34);
  assert.deepEqual(
    measurement.r03ProposedGeometry.keyboard.targetPixelsPreservingSourceAspect,
    [48, 24],
  );
  assert.equal(measurement.r03ProposedGeometry.chair.renderPixels, "unlocked");
});

test("R03 locks measurement evidence and preserves Active Office byte-for-byte", () => {
  const digest = (url: URL) => createHash("sha256").update(readFileSync(url)).digest("hex");
  assert.equal(digest(measurementUrl), manifest.measurementEvidence.sha256);
  assert.equal(digest(activeOfficeUrl), manifest.activeOfficeBaseline.sha256);
});

test("R03 validator rejects premature implementation authority", () => {
  const invalid = structuredClone(manifest);
  invalid.permissions.rendererImplementation = true;
  invalid.stationStandard.keyboard.reservation.width = 3;
  invalid.stationStandard.chair.renderEnvelope = { width: 44, height: 64 };
  const issues = validateOfficeWorkstationStep5ManifestV3(invalid).join("\n");
  assert.match(issues, /rendererImplementation/);
  assert.match(issues, /keyboard/);
  assert.match(issues, /chair/);
});
