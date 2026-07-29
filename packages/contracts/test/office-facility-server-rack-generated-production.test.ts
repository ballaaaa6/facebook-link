import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  type OfficeFacilityServerRackGeneratedProductionManifest,
  validateOfficeFacilityServerRackGeneratedProductionManifest,
} from "../src/officeFacilityServerRackGeneratedProduction.ts";

const manifest = JSON.parse(readFileSync(new URL(
  "../../../assets/game/manifests/office-facility-server-rack-n02-production.json",
  import.meta.url,
), "utf8")) as OfficeFacilityServerRackGeneratedProductionManifest;

test("Server Rack N02 production is an isolated F8 review candidate", () => {
  assert.deepEqual(
    validateOfficeFacilityServerRackGeneratedProductionManifest(manifest),
    [],
  );
  assert.equal(manifest.status, "production-owner-review");
  assert.equal(manifest.gates.F4.status, "passed");
  assert.equal(manifest.gates.F7.status, "passed");
  assert.equal(manifest.gates.F8.status, "pending-owner-review");
  assert.equal(manifest.gates.F9.status, "blocked");
  assert.equal(manifest.permissions.reservationSlotActivation, false);
  assert.equal(manifest.ownerDecision, null);
});

test("Server Rack N02 production locks modular approved pixels", () => {
  assert.equal(manifest.sourcePolicy.approvedPreflightPixelsOnly, true);
  assert.equal(manifest.sourcePolicy.newImageGeneration, false);
  assert.equal(manifest.parts.shells.length, 4);
  assert.equal(manifest.parts.statusFrames.length, 4);
  assert.equal(manifest.parts.frontComposites.length, 4);
  assert.deepEqual(manifest.animation.transition, ["a", "b", "c", "d", "a"]);
  assert.ok(
    manifest.animation.transitionChangedPixels.every((pixels) => pixels > 0),
  );
  assert.equal(manifest.animation.shellChangedPixels, 0);
  assert.equal(manifest.animation.outsideViewportChangedPixels, 0);
  assert.deepEqual(manifest.animation.pivotDeltaPixels, [0, 0]);
  assert.equal(manifest.animation.closureMismatchPixels, 0);
});

test("Server Rack N02 proves 108 empty-hand and 432 orientation cases", () => {
  assert.equal(manifest.rosterValidation.poseCases.length, 108);
  assert.equal(manifest.rosterValidation.orientationCases.length, 432);
  assert.equal(manifest.rosterValidation.rootAlignmentFailures, 0);
  assert.equal(manifest.rosterValidation.pivotDriftFailures, 0);
  assert.equal(manifest.rosterValidation.routeFailures, 0);
  assert.equal(manifest.rosterValidation.heldPropCases, 0);
  assert.equal(manifest.rosterValidation.handoffCases, 0);
  assert.equal(manifest.interaction.heldProp, false);
  assert.equal(manifest.interaction.h01Dependency, false);
  assert.equal(manifest.interaction.handoff, false);
});

test("Server Rack N02 proves independent capacity-one reservations", () => {
  const proof = manifest.reservationValidation;
  assert.deepEqual(
    proof.instanceIds,
    ["server-rack-01", "server-rack-02"],
  );
  assert.equal(proof.capacityPerInstance, 1);
  assert.equal(proof.maximumConcurrentReservations, 2);
  assert.equal(proof.maximumPerInstanceReservations, 1);
  assert.equal(proof.blockedAttemptCount, 1);
  assert.equal(proof.failureCount, 1);
  assert.equal(proof.releaseCount, 3);
  assert.equal(proof.retrySuccessCount, 1);
  assert.equal(proof.releasedAtEnd, true);
  assert.deepEqual(proof.samples.at(-1)?.heldBy, {
    "server-rack-01": null,
    "server-rack-02": null,
  });
});

test("Server Rack N02 rejects premature slots and held props", () => {
  const invalid = structuredClone(manifest) as unknown as {
    interaction: Record<string, unknown>;
    permissions: Record<string, unknown>;
  };
  invalid.interaction.heldProp = true;
  invalid.interaction.reservationSlotContributionBeforeF8 = 2;
  invalid.permissions.reservationSlotActivation = true;
  const issues =
    validateOfficeFacilityServerRackGeneratedProductionManifest(invalid);
  assert.ok(issues.some((issue) => issue.includes("interaction")));
  assert.ok(issues.some((issue) => issue.includes("permission")));
});
