import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  validateOfficeFacilityProductionManifest,
  type OfficeFacilityProductionManifest,
} from "../src/officeFacilityProduction.ts";

const manifest = JSON.parse(readFileSync(new URL(
  "../../../assets/game/manifests/office-facility-vending-u01.json",
  import.meta.url,
), "utf8")) as OfficeFacilityProductionManifest;

test("Vending U01 stops after F0-F7 for an independent F8 decision", () => {
  assert.deepEqual(validateOfficeFacilityProductionManifest(manifest), []);
  assert.equal(manifest.familyId, "vending.machine.modern");
  assert.equal(manifest.status, "owner-review-f8-pending");
  assert.equal(manifest.ownerDecision, null);
  for (const gate of ["F0", "F1", "F2", "F3", "F4", "F5", "F6", "F7"] as const) {
    assert.equal(manifest.gates[gate].status, "passed");
  }
  assert.equal(manifest.gates.F8.status, "pending-owner-review");
  assert.equal(manifest.gates.F9.status, "blocked");
  assert.equal(manifest.gates.F10.status, "blocked");
});

test("Vending U01 locks four front-only full-master ownership records", () => {
  assert.equal(manifest.source.frames.length, 4);
  assert.deepEqual(
    manifest.source.frames.map(({ frameId }) => frameId),
    ["a", "b", "c", "d"],
  );
  assert.ok(
    manifest.source.frames.every(
      ({ touchesNominalCellBoundary, touchesMasterBoundary, sourcePixelsResampled }) =>
        touchesNominalCellBoundary
        && !touchesMasterBoundary
        && !sourcePixelsResampled,
    ),
  );
  assert.deepEqual(manifest.render.requiredOrientations, ["front"]);
  assert.deepEqual(manifest.render.runtimeCanvas, [64, 96]);
  assert.deepEqual(manifest.geometry.physicalScale, {
    width: 2,
    depth: 1,
    height: 3,
    unit: "tile",
  });
});

test("Vending U01 keeps animation local and outputs item-neutral", () => {
  assert.equal(manifest.animation.frameCount, 4);
  assert.equal(manifest.animation.shellStableAcrossFrames, true);
  assert.equal(manifest.animation.outsideViewportChangedPixels, 0);
  assert.deepEqual(
    manifest.animation.frames.map(({ effectPartIds }) => effectPartIds.length),
    [0, 0, 1, 0],
  );
  assert.equal(manifest.outputHandoff.productEmbeddedInShell, false);
  assert.equal(manifest.outputHandoff.productEmbeddedInViewportFrames, false);
  assert.notEqual(
    manifest.outputHandoff.pickupTrayPartId,
    manifest.outputHandoff.heldAssetPartId,
  );
});

test("facility production rejects viewport escape and embedded products", () => {
  const invalid = structuredClone(manifest);
  (invalid.animation as { outsideViewportChangedPixels: number })
    .outsideViewportChangedPixels = 1;
  (invalid.outputHandoff as { productEmbeddedInShell: boolean })
    .productEmbeddedInShell = true;
  invalid.animation.viewportBoundsRuntime = [10, 32, 80, 94];
  const issues = validateOfficeFacilityProductionManifest(invalid).join("\n");
  assert.match(issues, /outside the local viewport/);
  assert.match(issues, /embedded in the machine/);
  assert.match(issues, /remain inside both canvases/);
});

test("facility production rejects processed sources and non-uniform scale", () => {
  const invalid = structuredClone(manifest);
  invalid.source.path =
    "assets/game/processed/office-library-modern-bright-v1/vending.png";
  (invalid.sourcePolicy as { processedCropDirectReuse: boolean })
    .processedCropDirectReuse = true;
  (invalid.render as { nonUniformScaling: boolean }).nonUniformScaling = true;
  const issues = validateOfficeFacilityProductionManifest(invalid).join("\n");
  assert.match(issues, /original layout-reference master/);
  assert.match(issues, /processedCropDirectReuse/);
  assert.match(issues, /non-uniform scaling/);
});

test("Vending U01 validates 108 poses without character-specific fixes", () => {
  const roster = manifest.rosterValidation;
  assert.equal(roster.characterCount, 18);
  assert.equal(roster.activeFrames, 6);
  assert.equal(roster.validatedPoseCases, 108);
  assert.equal(roster.perCharacterFacilityScaling, false);
  assert.equal(roster.perCharacterActorOffsets, false);
  assert.ok(
    roster.characters.every(
      ({ frames }) =>
        frames.length === 6
        && frames.every(({ actorPosition }) =>
          JSON.stringify(actorPosition) === JSON.stringify([96, 96])),
    ),
  );
});

test("facility production rejects magic offsets and shared route cells", () => {
  const invalid = structuredClone(manifest);
  invalid.rosterValidation.characters[0]!.frames[0]!.actorPosition = [97, 96];
  invalid.interaction.slot.exit = { ...invalid.interaction.slot.approach };
  const issues = validateOfficeFacilityProductionManifest(invalid).join("\n");
  assert.match(issues, /character-specific offset/);
  assert.match(issues, /must be distinct/);
});

test("Vending U01 proves capacity-one contention, failure, and retry", () => {
  const reservation = manifest.reservationValidation;
  assert.equal(reservation.durationSeconds, 30);
  assert.equal(reservation.actorCount, 2);
  assert.equal(reservation.maximumConcurrentReservations, 1);
  assert.equal(reservation.collisionCount, 0);
  assert.equal(reservation.blockedAttemptCount, 1);
  assert.equal(reservation.failureCount, 1);
  assert.equal(reservation.retrySuccessCount, 1);
  assert.equal(reservation.releasedAtEnd, true);
  assert.equal(reservation.samples.length, 31);
});
