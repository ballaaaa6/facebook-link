import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { validateOfficeWorkstationStep5R05 } from "../src/index.ts";

const manifestUrl = new URL(
  "../../../assets/game/manifests/office-workstation-step5-r05-calibration.json",
  import.meta.url,
);
const measurementUrl = new URL(
  "../../../assets/game/manifests/office-workstation-step5-r05-measurements.json",
  import.meta.url,
);
const activeOfficeUrl = new URL("../../../assets/game/maps/office-c-v2.json", import.meta.url);
const manifest = JSON.parse(readFileSync(manifestUrl, "utf8"));
const measurements = JSON.parse(readFileSync(measurementUrl, "utf8"));

test("R05-0 freezes the R04 failures without replacing accepted inputs", () => {
  assert.deepEqual(validateOfficeWorkstationStep5R05(manifest), []);
  assert.equal(manifest.acceptedInputs.desk.decision, "retain-byte-identical");
  assert.equal(manifest.acceptedInputs.charactersAndPoses.newCharacterOrPose, false);
  assert.deepEqual(manifest.acceptedInputs.charactersAndPoses.personStandard, [1, 1, 3]);
});

test("R05-1 separates reservation, visual pivot, and support height", () => {
  assert.equal(manifest.coordinateContract.reservationSpace, "top-down-world-grid");
  assert.equal(manifest.coordinateContract.supportAnchorDefault, "reservation-center");
  assert.equal(
    manifest.coordinateContract.drawFormula,
    "drawOrigin = project(worldSupportAnchor.xyz) - localVisualPivot.xy",
  );
  assert.equal(manifest.coordinateContract.orientationSpecificMagicOffsets, "forbidden");
  assert.deepEqual(manifest.componentContracts.chair.baseAndSeatVolume, [1, 1, 1]);
  assert.deepEqual(manifest.componentContracts.chair.backrestVolume, [1, 1, 1]);
  assert.deepEqual(manifest.componentContracts.monitor.reservation, [3, 1]);
  assert.deepEqual(manifest.componentContracts.keyboard.reservation, [1, 1]);
});

test("R05-3A accepts the keyboard and centers the monitor base in both views", () => {
  assert.equal(manifest.componentContracts.keyboard.decision, "owner-accepted-and-frozen");
  assert.deepEqual(manifest.componentContracts.keyboard.renderPixels, [48, 24]);
  assert.deepEqual(manifest.componentContracts.keyboard.localVisualPivot, [24, 12]);
  assert.deepEqual(manifest.componentContracts.monitor.supportFootprint, [1, 1]);
  assert.deepEqual(manifest.componentContracts.monitor.supportAnchorDeskLocal, [1.5, 0.5, 2]);
  assert.deepEqual(manifest.componentContracts.monitor.beforeCenterErrorPixels, {
    far: [0, 16], near: [0, 16],
  });
  assert.deepEqual(manifest.componentContracts.monitor.afterCenterErrorPixels, {
    far: [0, 0], near: [0, 0],
  });
});

test("R05-3A separates chair physical volumes from draw masks and aligns the seated pose", () => {
  const chair = manifest.componentContracts.chair;
  assert.deepEqual(chair.physicalParts, [
    { id: "base-seat", volume: [1, 1, 1], zRange: [0, 1] },
    { id: "backrest-arms", volume: [1, 1, 1], zRange: [1, 2] },
  ]);
  assert.deepEqual(chair.anchorProof.actorLogicalFloorSocketLocal, [48, 112]);
  assert.deepEqual(chair.anchorProof.seatPlaneCandidateLocal, [48, 80]);
  assert.equal(chair.anchorProof.seatHeightPixels, 32);
  assert.deepEqual(chair.anchorProof.contactErrorPixels, { front: [0, 0], back: [0, 0] });
  assert.equal(measurements.ownerFeedbackR05_3A.chairPerson.r04RejectedMasksAllowed, false);
  assert.equal(measurements.ownerFeedbackR05_3A.chairPerson.existingChairSourcePixelsAllowed, true);
});

test("R05-2 records the measurable R04 failures", () => {
  assert.deepEqual(measurements.rejectedR04Chair.frontLowerUpholsteryBandLocalY, [35, 44]);
  assert.deepEqual(measurements.rejectedR04Chair.backLowerUpholsteryBandLocalY, [40, 44]);
  assert.equal(measurements.rejectedR04Chair.declaredSeatSplitStartLocalY, 48);
  assert.equal(measurements.rejectedR04Chair.seatLayerContainsCushion, false);
  assert.deepEqual(measurements.rejectedR04Equipment.far.monitor.centerErrorPixels, { x: 0, y: 16 });
  assert.deepEqual(measurements.rejectedR04Equipment.near.monitor.centerErrorPixels, { x: 0, y: 16 });
  assert.deepEqual(measurements.rejectedR04Equipment.far.keyboard.centerErrorPixels, { x: 0, y: -4 });
  assert.deepEqual(measurements.rejectedR04Equipment.near.keyboard.centerErrorPixels, { x: 0, y: 0 });
  assert.equal(measurements.runtimeCharacter.pelvisContactPivot, null);
});

test("R05 records owner approval while preserving Active Office byte-for-byte", () => {
  const digest = (url: URL) => createHash("sha256").update(readFileSync(url)).digest("hex");
  assert.equal(digest(activeOfficeUrl), manifest.activeOfficeBaseline.sha256);
  assert.equal(manifest.status, "owner-anchor-proof-approved");
  assert.equal(manifest.nextScope, "R05-3B-authorized");
  assert.equal(manifest.permissions.newArtworkGeneration, false);
  assert.equal(manifest.permissions.singleSeatAssembly, false);
  assert.equal(manifest.permissions.activeOfficePromotion, false);
  assert.equal(manifest.reviewOutputs.length, 6);
});
