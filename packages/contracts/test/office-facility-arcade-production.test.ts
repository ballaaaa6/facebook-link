import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  type OfficeFacilityArcadeProductionManifest,
  validateOfficeFacilityArcadeProductionManifest,
} from "../src/officeFacilityArcadeProduction.ts";

const manifest = JSON.parse(readFileSync(new URL(
  "../../../assets/game/manifests/office-facility-arcade-machine-g02-production.json",
  import.meta.url,
), "utf8")) as OfficeFacilityArcadeProductionManifest;

test("Arcade G02 production records its independent F8 approval", () => {
  assert.deepEqual(validateOfficeFacilityArcadeProductionManifest(manifest), []);
  assert.equal(manifest.status, "owner-approved");
  assert.equal(manifest.gates.F7.status, "passed");
  assert.equal(manifest.gates.F8.status, "passed");
  assert.equal(manifest.gates.F9.status, "blocked");
  assert.equal(manifest.permissions.activeOfficePromotion, false);
  assert.equal(manifest.ownerDecision.decision, "approved");
});

test("Arcade G02 composes immutable parts across three seam loops", () => {
  assert.equal(
    manifest.animation.compositionFormula,
    "shell + viewport[n] + machineLocalControls",
  );
  assert.equal(manifest.parts.shell.length, 4);
  assert.equal(manifest.parts.controls.length, 4);
  assert.equal(manifest.parts.viewports.length, 12);
  assert.equal(manifest.animation.games.length, 3);
  assert.deepEqual(manifest.animation.transition, ["a", "b", "c", "d", "a"]);
  assert.equal(manifest.animation.shellChangedPixels, 0);
  assert.equal(manifest.animation.controlsChangedPixels, 0);
  assert.equal(manifest.animation.outsideViewportChangedPixels, 0);
  assert.equal(manifest.animation.closureMismatchPixels, 0);
  assert.deepEqual(manifest.animation.pivotDeltaPixels, [0, 0]);
});

test("Arcade G02 proves all I01 poses and four-orientation placements", () => {
  assert.equal(manifest.rosterValidation.characterCount, 18);
  assert.equal(manifest.rosterValidation.activeFrames, 6);
  assert.equal(manifest.rosterValidation.poseCases.length, 108);
  assert.equal(manifest.rosterValidation.orientationCases.length, 432);
  assert.equal(manifest.rosterValidation.rootAlignmentFailures, 0);
  assert.equal(manifest.rosterValidation.pivotDriftFailures, 0);
  assert.equal(manifest.rosterValidation.routeFailures, 0);
  assert.equal(manifest.rosterValidation.heldControllerCases, 0);
  assert.equal(manifest.spatial.perSceneOffsets, false);
  assert.equal(manifest.spatial.missingSocketFallback, false);
});

test("Arcade G02 capacity-one reservation releases cleanly after retry", () => {
  const result = manifest.reservationValidation;
  assert.equal(result.durationSeconds, 30);
  assert.equal(result.maximumConcurrentReservations, 1);
  assert.equal(result.collisionCount, 0);
  assert.equal(result.blockedAttemptCount, 1);
  assert.equal(result.failureCount, 1);
  assert.equal(result.releaseCount, 2);
  assert.equal(result.retrySuccessCount, 1);
  assert.equal(result.samples.length, 31);
  assert.equal(result.samples[30]?.heldBy, null);
  assert.equal(manifest.interaction.heldController, false);
  assert.equal(manifest.interaction.reservationSlotContribution, 1);
  assert.equal(manifest.interaction.facilityV1ReadySlotCountAfterApproval, 15);
});
