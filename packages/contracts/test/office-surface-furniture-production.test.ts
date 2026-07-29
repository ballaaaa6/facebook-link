import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  validateOfficeSurfaceFurnitureProductionManifest,
  type OfficeSurfaceFurnitureProductionManifest,
} from "../src/officeSurfaceFurnitureProduction.ts";

const manifest = JSON.parse(readFileSync(new URL(
  "../../../assets/game/manifests/office-furniture-counter-bar-a01.json",
  import.meta.url,
), "utf8")) as OfficeSurfaceFurnitureProductionManifest;
const revision = JSON.parse(readFileSync(new URL(
  "../../../assets/game/manifests/office-furniture-counter-bar-a01-r02.json",
  import.meta.url,
), "utf8")) as OfficeSurfaceFurnitureProductionManifest;

test("Counter Bar A01 remains rejected tapered-top evidence", () => {
  assert.deepEqual(validateOfficeSurfaceFurnitureProductionManifest(manifest), []);
  assert.equal(manifest.id, "office.furniture.counter-bar.a01");
  assert.equal(manifest.familyId, "counter.bar.modular");
  assert.equal(manifest.revision, "a01");
  assert.equal(manifest.status, "rejected");
  assert.equal(manifest.gates.F8.status, "blocked");
  assert.equal(manifest.gates.F9.status, "blocked");
  assert.equal(manifest.gates.F10.status, "blocked");
  assert.equal(manifest.permissions.attachedCoffeeProduction, false);
  assert.equal(manifest.permissions.ownerReview, false);
  assert.equal(manifest.ownerDecision?.decision, "rejected");
});

test("Counter Bar A01-r02 records its independent F8 approval", () => {
  assert.deepEqual(validateOfficeSurfaceFurnitureProductionManifest(revision), []);
  assert.equal(revision.id, "office.furniture.counter-bar.a01-r02");
  assert.equal(revision.status, "owner-approved");
  assert.equal(revision.gates.F8.status, "passed");
  assert.equal(revision.gates.F9.status, "blocked");
  assert.equal(revision.gates.F10.status, "blocked");
  assert.equal(revision.permissions.ownerReview, false);
  assert.equal(revision.permissions.attachedCoffeeProduction, true);
  assert.equal(revision.ownerDecision?.decision, "approved");
});

test("Counter Bar A01-r02 exposes exact 6x2x2 support geometry", () => {
  assert.deepEqual(revision.render.runtimeCanvas, [256, 160]);
  assert.deepEqual(revision.geometry.physicalScale, {
    width: 6,
    depth: 2,
    height: 2,
    unit: "tile",
  });
  assert.deepEqual(revision.geometry.footprint, {
    width: 6,
    depth: 2,
    unit: "tile",
  });
  assert.deepEqual(revision.surfaceContract.projectedSupportBounds, [
    32, 22, 224, 86,
  ]);
  assert.deepEqual(revision.surfaceContract.visualTopBounds, [
    20, 21, 236, 93,
  ]);
  assert.equal(revision.surfaceContract.edgeSupportFailures, 0);
  assert.equal(revision.surfaceContract.slots.length, 12);
  assert.equal(revision.surfaceContract.adjacentSpanGroups.length, 10);
  assert.equal(revision.surfaceContract.twoByTwoSpanGroups?.length, 5);
  assert.equal(revision.surfaceContract.useLanes.length, 6);
  assert.equal(revision.surfaceContract.coffeeC01Imported, false);
});

test("surface furniture rejects reuse, magic attachment, and overlap", () => {
  const invalid = structuredClone(revision);
  (invalid.sourcePolicy as { activeOfficePixelReuse: boolean })
    .activeOfficePixelReuse = true;
  (invalid.spatial as { perSceneAttachmentOffsets: boolean })
    .perSceneAttachmentOffsets = true;
  (invalid.surfaceContract as { rejectOverlap: boolean })
    .rejectOverlap = false;
  const issues = validateOfficeSurfaceFurnitureProductionManifest(invalid)
    .join("\n");
  assert.match(issues, /activeOfficePixelReuse/);
  assert.match(issues, /semantic sockets without fallbacks/);
  assert.match(issues, /fail closed/);
});

test("Counter Bar A01-r02 proves placement and reservation retry", () => {
  assert.equal(revision.placementValidation.oneByOneCases, 12);
  assert.equal(revision.placementValidation.twoByOneCases, 10);
  assert.equal(revision.placementValidation.twoByTwoCases, 5);
  assert.equal(revision.placementValidation.overlapRejections, 1);
  assert.equal(revision.placementValidation.unsupportedChildRejections, 1);
  assert.equal(revision.placementValidation.routeObstructionCount, 0);
  assert.equal(revision.movementValidation.childAttachmentCases, 36);
  assert.equal(revision.movementValidation.attachmentDeltaFailures, 0);
  assert.equal(revision.reservationValidation.samples.length, 31);
  assert.equal(revision.reservationValidation.blockedAttemptCount, 1);
  assert.equal(revision.reservationValidation.failureCount, 1);
  assert.equal(revision.reservationValidation.retrySuccessCount, 1);
  assert.equal(revision.reservationValidation.samples.at(-1)?.heldBy, null);
});
