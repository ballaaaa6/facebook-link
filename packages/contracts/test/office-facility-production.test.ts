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
const waterManifest = JSON.parse(readFileSync(new URL(
  "../../../assets/game/manifests/office-facility-water-dispenser-w01.json",
  import.meta.url,
), "utf8")) as OfficeFacilityProductionManifest;
const coffeeManifest = JSON.parse(readFileSync(new URL(
  "../../../assets/game/manifests/office-facility-coffee-machine-c01.json",
  import.meta.url,
), "utf8")) as OfficeFacilityProductionManifest;

test("Coffee C01 stops at independent F8 owner review", () => {
  assert.deepEqual(validateOfficeFacilityProductionManifest(coffeeManifest), []);
  assert.equal(coffeeManifest.familyId, "machine.coffee");
  assert.equal(coffeeManifest.revision, "c01");
  assert.equal(coffeeManifest.status, "owner-review-f8-pending");
  assert.equal(coffeeManifest.source.kind, "audited-original-neutral-master");
  assert.equal(coffeeManifest.source.frames.length, 4);
  assert.equal(coffeeManifest.gates.F8.status, "pending-owner-review");
  assert.equal(coffeeManifest.gates.F9.status, "blocked");
  assert.equal(coffeeManifest.gates.F10.status, "blocked");
  assert.equal(coffeeManifest.ownerDecision, null);
});

test("Coffee C01 uses one two-cell-deep counter column", () => {
  assert.deepEqual(coffeeManifest.geometry.physicalScale, {
    width: 1,
    depth: 2,
    height: 2,
    unit: "tile",
  });
  assert.equal(coffeeManifest.geometry.placementPlane, "furniture-surface");
  assert.equal(coffeeManifest.geometry.footprint, null);
  assert.deepEqual(coffeeManifest.render.runtimeCanvas, [64, 96]);
  assert.deepEqual(coffeeManifest.geometryCalibration?.auditRenderBox, [1, 3]);
  assert.deepEqual(coffeeManifest.geometryCalibration?.guideRenderBox, [1, 2]);
  assert.deepEqual(coffeeManifest.geometryCalibration?.selectedRenderBox, [2, 3]);
  assert.equal(coffeeManifest.geometryCalibration?.sourceAspectPreserved, true);
  assert.equal(coffeeManifest.geometryCalibration?.uniformScalingOnly, true);
});

test("Coffee C01 attaches to owner-approved Counter A01-r02", () => {
  const parent = coffeeManifest.spatial.supportParent;
  assert.ok(parent);
  assert.equal(parent.authority.status, "owner-approved");
  assert.equal(parent.selectedDepthSpanId, "surface.depth.03");
  assert.deepEqual(
    parent.occupiedSlotIds,
    ["surface.back.03", "surface.front.03"],
  );
  assert.equal(parent.selectedAnchorSlotId, "surface.front.03");
  assert.equal(parent.useLaneId, "use.03");
  assert.deepEqual(parent.selectedParentSocket, [112, 70]);
  assert.deepEqual(parent.attachmentDelta, [0, 0]);
  assert.equal(parent.compatibleDepthSpans.length, 6);
  assert.equal(parent.placementCases, 6);
  assert.equal(parent.supportFailures, 0);
  assert.deepEqual(
    coffeeManifest.spatial.localSockets["base.support"],
    [32, 96],
  );
  assert.equal(coffeeManifest.spatial.localSockets["base.floor"], undefined);
});

test("Coffee C01 keeps Coffee, steam, empty bay, and H01 mug separate", () => {
  assert.equal(coffeeManifest.animation.frameCount, 4);
  assert.equal(coffeeManifest.animation.outsideViewportChangedPixels, 0);
  assert.deepEqual(
    coffeeManifest.animation.frames.map(({ effectPartIds }) =>
      effectPartIds.length),
    [0, 0, 2, 0],
  );
  assert.equal(coffeeManifest.outputHandoff.productEmbeddedInShell, false);
  assert.equal(
    coffeeManifest.outputHandoff.productEmbeddedInViewportFrames,
    false,
  );
  assert.equal(coffeeManifest.outputHandoff.heldAssetId, "held.coffee-mug");
  assert.equal(coffeeManifest.outputHandoff.runtimeScale, 1);
  assert.equal(coffeeManifest.outputHandoff.attachmentDeltaFailures, 0);
});

test("Coffee C01 proves 108 poses and capacity-one failure retry", () => {
  assert.equal(coffeeManifest.rosterValidation.characterCount, 18);
  assert.equal(coffeeManifest.rosterValidation.activeFrames, 6);
  assert.equal(coffeeManifest.rosterValidation.validatedPoseCases, 108);
  assert.equal(coffeeManifest.rosterValidation.visiblePropCases, 54);
  assert.equal(coffeeManifest.rosterValidation.attachmentDeltaFailures, 0);
  assert.equal(coffeeManifest.reservationValidation.durationSeconds, 30);
  assert.equal(coffeeManifest.reservationValidation.actorCount, 2);
  assert.equal(
    coffeeManifest.reservationValidation.maximumConcurrentReservations,
    1,
  );
  assert.equal(coffeeManifest.reservationValidation.blockedAttemptCount, 1);
  assert.equal(coffeeManifest.reservationValidation.failureCount, 1);
  assert.equal(coffeeManifest.reservationValidation.retrySuccessCount, 1);
  assert.equal(coffeeManifest.reservationValidation.releasedAtEnd, true);
});

test("facility production rejects invalid parent support and fractional drift", () => {
  const invalid = structuredClone(coffeeManifest);
  invalid.spatial.supportParent!.authority.status =
    "owner-review-f8-pending" as "owner-approved";
  invalid.spatial.supportParent!.attachmentDelta = [1, 0] as [0, 0];
  (invalid.spatial.supportParent as { supportFailures: number })
    .supportFailures = 1;
  invalid.interaction.slot.stand = { x: 2.25, y: 2.5 };
  const issues = validateOfficeFacilityProductionManifest(invalid).join("\n");
  assert.match(issues, /support parent authority must be owner-approved/);
  assert.match(issues, /zero drift/);
  assert.match(issues, /half-tile cells/);
});

test("Water W01 records its independent F8 approval", () => {
  assert.deepEqual(validateOfficeFacilityProductionManifest(waterManifest), []);
  assert.equal(waterManifest.familyId, "dispenser.water");
  assert.equal(waterManifest.revision, "w01");
  assert.equal(waterManifest.status, "owner-approved");
  assert.equal(waterManifest.ownerDecision?.decision, "approved");
  assert.equal(waterManifest.ownerDecision?.decidedOn, "2026-07-29");
  assert.equal(waterManifest.source.kind, "generated-isolated-clean-source");
  assert.equal(waterManifest.source.extractionMethod, "generated-source-chroma-key");
  assert.deepEqual(waterManifest.render.runtimeCanvas, [64, 128]);
  assert.deepEqual(waterManifest.geometry.physicalScale, {
    width: 1,
    depth: 1,
    height: 4,
    unit: "tile",
  });
  assert.equal(
    waterManifest.outputHandoff.heldAssetId,
    "held.water-cup-clear",
  );
  assert.ok(waterManifest.outputHandoff.emptyOutputPartId);
  assert.equal(waterManifest.outputHandoff.pickupTrayPartId, undefined);
  assert.equal(waterManifest.gates.F8.status, "passed");
  assert.equal(waterManifest.permissions.ownerReview, false);
  assert.equal(waterManifest.permissions.otherFacilityFamilies, true);
  assert.equal(waterManifest.permissions.furnitureOnlyRoom, false);
});

test("Vending U01-r03 records its independent F8 approval", () => {
  assert.deepEqual(validateOfficeFacilityProductionManifest(manifest), []);
  assert.equal(manifest.schemaVersion, 2);
  assert.equal(manifest.revision, "u01-r03");
  assert.equal(manifest.familyId, "vending.machine.modern");
  assert.equal(manifest.status, "owner-approved");
  assert.equal(manifest.ownerDecision?.decision, "approved");
  assert.equal(manifest.ownerDecision?.decidedOn, "2026-07-29");
  for (const gate of ["F0", "F1", "F2", "F3", "F4", "F5", "F6", "F7"] as const) {
    assert.equal(manifest.gates[gate].status, "passed");
  }
  assert.equal(manifest.gates.F8.status, "passed");
  assert.equal(manifest.gates.F9.status, "blocked");
  assert.equal(manifest.gates.F10.status, "blocked");
  assert.equal(manifest.permissions.otherFacilityFamilies, true);
  assert.equal(manifest.permissions.furnitureOnlyRoom, false);
});

test("Vending U01-r03 locks four front-only full-master ownership records", () => {
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

test("Vending U01-r03 keeps animation local and outputs item-neutral", () => {
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
  assert.equal(
    manifest.outputHandoff.transition,
    "facility-output-socket-to-actor-hand-socket",
  );
  assert.equal(manifest.outputHandoff.heldAssetId, "held.soda-can");
  assert.equal(manifest.outputHandoff.runtimeScale, 1);
  assert.equal(manifest.outputHandoff.attachmentMode, "front-overlay");
  assert.deepEqual(manifest.outputHandoff.renderOrder, ["actor-body", "held-prop"]);
  assert.equal(manifest.outputHandoff.handForegroundMaskRequired, false);
  assert.equal(manifest.outputHandoff.foregroundMaskUses, 0);
  assert.equal(manifest.outputHandoff.visibleAlphaFailures, 0);
  assert.equal(manifest.outputHandoff.attachmentDeltaFailures, 0);
  assert.deepEqual(
    manifest.outputHandoff.timeline.map(({ attachmentParent }) => attachmentParent),
    [
      null,
      null,
      "facility.output.primary",
      "actor.hand.primary.grip",
      "actor.hand.primary.grip",
      null,
    ],
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

test("Vending U01-r03 validates front-overlay props without magic fixes", () => {
  const roster = manifest.rosterValidation;
  assert.equal(roster.characterCount, 18);
  assert.equal(roster.activeFrames, 6);
  assert.equal(roster.validatedPoseCases, 108);
  assert.equal(roster.visiblePropCases, 54);
  assert.equal(roster.facilityOutputAttachmentCases, 18);
  assert.equal(roster.actorHandAttachmentCases, 36);
  assert.equal(roster.attachmentDeltaFailures, 0);
  assert.equal(roster.frontOverlayCases, 36);
  assert.equal(roster.foregroundMaskUses, 0);
  assert.equal(roster.visibleAlphaFailures, 0);
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
  assert.ok(
    roster.characters.every(({ frames }) =>
      frames.every(({
        attachmentParent,
        attachmentDelta,
        foregroundMask,
        foregroundMaskUsed,
        visiblePropAlphaFraction,
        renderOrder,
      }) =>
        attachmentParent === null
          ? attachmentDelta === null && visiblePropAlphaFraction === null
          : JSON.stringify(attachmentDelta) === "[0,0]"
            && foregroundMask === null
            && foregroundMaskUsed === false
            && visiblePropAlphaFraction === 1
            && (
              attachmentParent === "facility.output.primary"
              || JSON.stringify(renderOrder) === '["actor-body","held-prop"]'
            ))),
  );
});

test("facility production rejects magic offsets, socket drift, and shared route cells", () => {
  const invalid = structuredClone(manifest);
  invalid.rosterValidation.characters[0]!.frames[0]!.actorPosition = [97, 96];
  invalid.rosterValidation.characters[0]!.frames[3]!.attachmentDelta = [1, 0];
  invalid.interaction.slot.exit = { ...invalid.interaction.slot.approach };
  const issues = validateOfficeFacilityProductionManifest(invalid).join("\n");
  assert.match(issues, /character-specific offset/);
  assert.match(issues, /attachment does not resolve exactly/);
  assert.match(issues, /must be distinct/);
});

test("facility production rejects center anchors and a broken handoff timeline", () => {
  const invalid = structuredClone(manifest);
  (invalid.spatial as { centerToCenterAttachment: boolean })
    .centerToCenterAttachment = true;
  invalid.outputHandoff.timeline[3]!.attachmentParent =
    "facility.output.primary";
  const issues = validateOfficeFacilityProductionManifest(invalid).join("\n");
  assert.match(issues, /center anchors/);
  assert.match(issues, /timeline must move from facility output to actor hand/);
});

test("Vending U01-r03 proves capacity-one contention, failure, and retry", () => {
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
