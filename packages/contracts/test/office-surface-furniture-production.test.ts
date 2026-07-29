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

test("Counter Bar A01 stops at independent F8 owner review", () => {
  assert.deepEqual(validateOfficeSurfaceFurnitureProductionManifest(manifest), []);
  assert.equal(manifest.id, "office.furniture.counter-bar.a01");
  assert.equal(manifest.familyId, "counter.bar.modular");
  assert.equal(manifest.revision, "a01");
  assert.equal(manifest.status, "owner-review-f8-pending");
  assert.equal(manifest.gates.F8.status, "pending-owner-review");
  assert.equal(manifest.gates.F9.status, "blocked");
  assert.equal(manifest.gates.F10.status, "blocked");
  assert.equal(manifest.permissions.attachedCoffeeProduction, false);
  assert.equal(manifest.ownerDecision, null);
});

test("Counter Bar A01 exposes reusable surface geometry", () => {
  assert.deepEqual(manifest.render.runtimeCanvas, [224, 160]);
  assert.deepEqual(manifest.geometry.physicalScale, {
    width: 6,
    depth: 2,
    height: 2,
    unit: "tile",
  });
  assert.deepEqual(manifest.geometry.footprint, {
    width: 6,
    depth: 2,
    unit: "tile",
  });
  assert.equal(manifest.surfaceContract.slots.length, 5);
  assert.equal(manifest.surfaceContract.adjacentSpanGroups.length, 4);
  assert.equal(manifest.surfaceContract.useLanes.length, 5);
  assert.equal(manifest.surfaceContract.coffeeC01Imported, false);
});

test("Counter Bar A01 rejects reuse, magic attachment, and overlap", () => {
  const invalid = structuredClone(manifest);
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

test("Counter Bar A01 proves modular placement and reservation retry", () => {
  assert.equal(manifest.placementValidation.oneByOneCases, 5);
  assert.equal(manifest.placementValidation.twoByOneCases, 4);
  assert.equal(manifest.placementValidation.overlapRejections, 1);
  assert.equal(manifest.placementValidation.unsupportedChildRejections, 1);
  assert.equal(manifest.placementValidation.routeObstructionCount, 0);
  assert.equal(manifest.movementValidation.childAttachmentCases, 15);
  assert.equal(manifest.movementValidation.attachmentDeltaFailures, 0);
  assert.equal(manifest.reservationValidation.samples.length, 31);
  assert.equal(manifest.reservationValidation.blockedAttemptCount, 1);
  assert.equal(manifest.reservationValidation.failureCount, 1);
  assert.equal(manifest.reservationValidation.retrySuccessCount, 1);
  assert.equal(manifest.reservationValidation.samples.at(-1)?.heldBy, null);
});
