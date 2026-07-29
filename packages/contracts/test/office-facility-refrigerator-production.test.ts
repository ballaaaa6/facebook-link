import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  type OfficeFacilityRefrigeratorProductionManifest,
  validateOfficeFacilityRefrigeratorProductionManifest,
} from "../src/officeFacilityRefrigeratorProduction.ts";

const manifest = JSON.parse(readFileSync(new URL(
  "../../../assets/game/manifests/"
    + "office-facility-refrigerator-r01-production.json",
  import.meta.url,
), "utf8")) as OfficeFacilityRefrigeratorProductionManifest;

test("Refrigerator R01 production stops at F8 owner review", () => {
  assert.deepEqual(
    validateOfficeFacilityRefrigeratorProductionManifest(manifest),
    [],
  );
  assert.equal(manifest.gates.F4.status, "passed");
  assert.equal(manifest.gates.F7.status, "passed");
  assert.equal(manifest.gates.F8.status, "pending-owner-review");
  assert.equal(manifest.gates.F9.status, "blocked");
  assert.equal(manifest.permissions.reservationSlotActivation, false);
  assert.equal(manifest.interaction.reservationSlotContribution, 0);
  assert.equal(manifest.ownerDecision, null);
});

test("Refrigerator R01 production locks approved modular pixels", () => {
  assert.equal(manifest.sourcePolicy.approvedPreflightPixelsOnly, true);
  assert.equal(manifest.sourcePolicy.newImageGeneration, false);
  assert.deepEqual(
    manifest.finiteAnimation.productionTransition,
    ["closed", "half", "open", "half", "closed"],
  );
  assert.ok(
    manifest.finiteAnimation.transitionChangedPixels.every(
      (count) => count > 0,
    ),
  );
  assert.deepEqual(
    manifest.finiteAnimation.changedPixelsOutsideDoorSwingRegion,
    [0, 0, 0, 0],
  );
  assert.equal(manifest.finiteAnimation.shellChangedPixels, 0);
  assert.deepEqual(manifest.finiteAnimation.pivotDeltaPixels, [0, 0]);
  assert.equal(manifest.finiteAnimation.closedEndpointMismatchPixels, 0);
});

test("Refrigerator R01 proves 108 poses and 108 H01 overlays", () => {
  assert.equal(manifest.rosterValidation.poseCases.length, 108);
  assert.equal(manifest.rosterValidation.rootAlignmentFailures, 0);
  assert.equal(manifest.rosterValidation.pivotDriftFailures, 0);
  assert.equal(manifest.rosterValidation.routeFailures, 0);
  assert.equal(manifest.propOverlayValidation.cases.length, 108);
  assert.equal(manifest.propOverlayValidation.attachmentFailures, 0);
  assert.equal(manifest.propOverlayValidation.foregroundMaskUses, 0);
  assert.equal(manifest.propOverlayValidation.magicOffsetCases, 0);
  assert.equal(manifest.propOverlayValidation.fallbackSocketCases, 0);
  assert.ok(
    manifest.propOverlayValidation.cases.every(
      ({ attachmentDelta }) =>
        attachmentDelta[0] === 0 && attachmentDelta[1] === 0,
    ),
  );
});

test("Refrigerator R01 selection is stable and alternates visits", () => {
  const anna = manifest.propOverlayValidation.selectionCases.filter(
    ({ actorId }) => actorId === "anna",
  );
  assert.equal(anna.length, 4);
  assert.ok(anna.every(({ selectedOnce, frameStable }) =>
    selectedOnce && frameStable));
  assert.notEqual(anna[0]?.propId, anna[1]?.propId);
  assert.notEqual(anna[1]?.propId, anna[2]?.propId);
  assert.notEqual(anna[2]?.propId, anna[3]?.propId);
});

test("Refrigerator R01 proves capacity-one failure and retry", () => {
  const proof = manifest.reservationValidation;
  assert.equal(proof.durationSeconds, 30);
  assert.equal(proof.maximumConcurrentReservations, 1);
  assert.equal(proof.blockedAttemptCount, 1);
  assert.equal(proof.failureCount, 1);
  assert.equal(proof.releaseCount, 3);
  assert.equal(proof.retrySuccessCount, 1);
  assert.equal(proof.beforePickupInterruptionCount, 1);
  assert.equal(proof.afterPickupInterruptionCount, 1);
  assert.equal(proof.releasedAtEnd, true);
  assert.equal(proof.propAttachedAtEnd, false);
  assert.equal(proof.samples.at(-1)?.heldBy, null);
});

test("Refrigerator R01 rejects premature slot activation", () => {
  const invalid = structuredClone(manifest) as unknown as {
    interaction: Record<string, unknown>;
    permissions: Record<string, unknown>;
    gates: Record<string, Record<string, unknown>>;
  };
  invalid.interaction.reservationSlotContribution = 1;
  invalid.permissions.reservationSlotActivation = true;
  invalid.gates.F8.status = "passed";
  const issues = validateOfficeFacilityRefrigeratorProductionManifest(invalid);
  assert.ok(issues.some((issue) => issue.includes("slot stop")));
  assert.ok(issues.some((issue) => issue.includes("gates.F8")));
  assert.ok(issues.some((issue) => issue.includes("permission")));
});
