import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  validateOfficeFacilityProductionManifest,
} from "../packages/contracts/src/officeFacilityProduction.ts";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const manifestPath =
  "assets/game/manifests/office-facility-coffee-machine-c01.json";
const counterPath =
  "assets/game/manifests/office-furniture-counter-bar-a01-r02.json";
const auditPath =
  "assets/game/manifests/office-furniture-master-audit-v1.json";
const heldPath = "assets/game/manifests/office-held-props-h01.json";
const sourcePath =
  "assets/art/layout-references/review-facility-completion-sheet-modern-bright-v1-source.png";
const expectedSourceSha =
  "fa66b2d4891d7dddc4f90469d61262803641956052f977c22f8cd29827029853";

function readJson(path) {
  return JSON.parse(readFileSync(resolve(root, path), "utf8"));
}

function sha256(path) {
  return createHash("sha256")
    .update(readFileSync(resolve(root, path)))
    .digest("hex");
}

const failures = [];
function add(condition, message) {
  if (!condition) failures.push(message);
}

try {
  const manifest = readJson(manifestPath);
  const counter = readJson(counterPath);
  const audit = readJson(auditPath);
  const held = readJson(heldPath);

  for (const issue of validateOfficeFacilityProductionManifest(manifest)) {
    failures.push(`Facility contract: ${issue}`);
  }

  add(
    manifest.schemaVersion === 2
      && manifest.id === "office.facility.coffee-machine.c01"
      && manifest.familyId === "machine.coffee"
      && manifest.revision === "c01",
    "Coffee C01 identity changed",
  );
  add(
    manifest.status === "owner-review-f8-pending"
      && manifest.ownerDecision === null
      && manifest.developmentOnly === true
      && manifest.activeOfficePromotion === false
      && manifest.permissions?.familyLab === true
      && manifest.permissions?.ownerReview === true
      && manifest.permissions?.furnitureOnlyRoom === false
      && manifest.permissions?.otherFacilityFamilies === false
      && manifest.permissions?.activeOfficePromotion === false,
    "Coffee C01 must stop at independent F8 owner review",
  );
  add(
    ["F0", "F1", "F2", "F3", "F4", "F5", "F6", "F7"]
      .every((gate) => manifest.gates?.[gate]?.status === "passed")
      && manifest.gates?.F8?.status === "pending-owner-review"
      && manifest.gates?.F9?.status === "blocked"
      && manifest.gates?.F10?.status === "blocked",
    "Coffee C01 gate state changed",
  );

  add(
    manifest.source?.kind === "audited-original-neutral-master"
      && manifest.source?.path === sourcePath
      && manifest.source?.sha256 === expectedSourceSha
      && manifest.source?.extractionMethod
        === "full-master-component-ownership"
      && sha256(sourcePath) === expectedSourceSha,
    "Coffee C01 original neutral source authority changed",
  );
  const frameIds = manifest.source?.frames?.map(({ frameId }) => frameId);
  add(
    JSON.stringify(frameIds) === JSON.stringify(["a", "b", "c", "d"])
      && manifest.source.frames.every(
        ({
          auditRecordId,
          selectedComponentCount,
          selectedPixelCount,
          touchesNominalCellBoundary,
          touchesMasterBoundary,
          sourcePixelsResampled,
          authoringCutout,
          authoringCutoutSha256,
        }) =>
          auditRecordId.startsWith(
            "review-facility-completion-v1:review-facility-completion:"
            + "machine.coffee.neutral.",
          )
          && selectedComponentCount === 1
          && selectedPixelCount > 40_000
          && touchesNominalCellBoundary === false
          && touchesMasterBoundary === false
          && sourcePixelsResampled === false
          && sha256(authoringCutout) === authoringCutoutSha256,
      ),
    "Coffee C01 must lock four complete unresampled neutral frames",
  );
  for (const evidence of [
    manifest.source?.keyedSource,
    manifest.source?.ownershipMask,
  ]) {
    add(
      evidence?.file?.startsWith(
        "assets/game/processed/office-facility-family-v1/"
        + "coffee-machine-c01/",
      )
        && sha256(evidence.file) === evidence.sha256,
      "Coffee C01 source evidence hash changed",
    );
  }

  const auditFamily = audit.families.find(
    ({ familyId }) => familyId === "machine.coffee",
  );
  const allowedIds = ["a", "b", "c", "d"].map(
    (frame) =>
      "review-facility-completion-v1:review-facility-completion:"
      + `machine.coffee.neutral.${frame}`,
  );
  const rejectedIds = [
    ...["a", "b", "c", "d"].map(
      (frame) =>
        "modern-bright-library-v1:env-08-animated-ambient:"
        + `machine.coffee.loop.${frame}`,
    ),
    "modern-bright-library-v1:env-12-facility-side-orientations:"
      + "machine.coffee.side-left",
    "modern-bright-library-v1:env-12-facility-side-orientations:"
      + "machine.coffee.side-right",
  ];
  add(
    JSON.stringify(auditFamily?.salvageableSourceRecords)
      === JSON.stringify(allowedIds)
      && JSON.stringify(auditFamily?.rejectedOrSupersededSourceRecords)
        === JSON.stringify(rejectedIds)
      && JSON.stringify(manifest.sourceExclusions?.rejectedAuditRecordIds)
        === JSON.stringify(rejectedIds)
      && manifest.sourceExclusions?.processedCoffeeInputs?.length === 0
      && manifest.sourceExclusions?.historicalLoopInputs?.length === 0
      && manifest.sourceExclusions?.sideOrientationInputs?.length === 0,
    "Coffee C01 source exclusions changed",
  );

  add(
    JSON.stringify(manifest.render) === JSON.stringify({
      authoringCanvas: [256, 384],
      runtimeCanvas: [64, 96],
      uniformIntegerDivisor: 4,
      nonUniformScaling: false,
      anchor: "bottom-center",
      requiredOrientations: ["front"],
    }),
    "Coffee C01 render contract changed",
  );
  add(
    manifest.geometry?.placementPlane === "furniture-surface"
      && manifest.geometry?.assetType === "animated-shell"
      && JSON.stringify(manifest.geometry?.physicalScale)
        === JSON.stringify({
          width: 1,
          depth: 2,
          height: 2,
          unit: "tile",
        })
      && manifest.geometry?.footprint === null
      && manifest.geometry?.sortPivot === null
      && JSON.stringify(manifest.geometry?.basePivot)
        === '{"x":0.5,"y":2,"unit":"tile"}'
      && JSON.stringify(manifest.geometryCalibration?.auditRenderBox)
        === "[1,3]"
      && JSON.stringify(manifest.geometryCalibration?.guideRenderBox)
        === "[1,2]"
      && JSON.stringify(manifest.geometryCalibration?.selectedRenderBox)
        === "[2,3]"
      && JSON.stringify(manifest.geometryCalibration?.selectedPhysicalScale)
        === "[1,2,2]"
      && manifest.geometryCalibration?.sourceAspectPreserved === true
      && manifest.geometryCalibration?.uniformScalingOnly === true,
    "Coffee C01 geometry calibration changed",
  );

  const parent = manifest.spatial?.supportParent;
  const counterSlots = counter.surfaceContract?.slots ?? [];
  const selectedCounterSlot = counterSlots.find(
    ({ id }) => id === "surface.front.03",
  );
  const expectedDepthSpans = Array.from({ length: 6 }, (_, index) => {
    const suffix = String(index + 1).padStart(2, "0");
    return {
      id: `surface.depth.${suffix}`,
      slotIds: [
        `surface.back.${suffix}`,
        `surface.front.${suffix}`,
      ],
      anchorSlotId: `surface.front.${suffix}`,
      useLaneId: `use.${suffix}`,
    };
  });
  add(
    counter.status === "owner-approved"
      && counter.gates?.F8?.status === "passed"
      && counter.permissions?.attachedCoffeeProduction === true
      && parent?.authority?.file === counterPath
      && parent?.authority?.sha256 === sha256(counterPath)
      && parent?.authority?.status === "owner-approved"
      && parent?.placementPlane === "furniture-surface"
      && parent?.supportPlaneId === counter.geometry?.supportPlane?.id
      && JSON.stringify(parent?.compatibleDepthSpans)
        === JSON.stringify(expectedDepthSpans)
      && expectedDepthSpans.every((span) =>
        span.slotIds.every((slotId) =>
          counterSlots.some((slot) =>
            slot.id === slotId
            && slot.pairedUseLaneId === span.useLaneId)))
      && parent?.selectedDepthSpanId === "surface.depth.03"
      && JSON.stringify(parent?.occupiedSlotIds)
        === '["surface.back.03","surface.front.03"]'
      && parent?.selectedAnchorSlotId === "surface.front.03"
      && parent?.useLaneId === "use.03"
      && JSON.stringify(parent?.selectedParentSocket)
        === JSON.stringify(selectedCounterSlot?.localSocket)
      && selectedCounterSlot?.pairedUseLaneId === "use.03"
      && JSON.stringify(parent?.attachmentDelta) === "[0,0]"
      && parent?.placementCases === 6
      && parent?.supportFailures === 0
      && parent?.activeOfficeImported === false,
    "Coffee C01 parent-counter support contract changed",
  );
  add(
    JSON.stringify(manifest.spatial?.localSockets?.["base.support"])
      === "[32,96]"
      && manifest.spatial?.localSockets?.["base.floor"] === undefined
      && manifest.spatial?.localSockets?.["sort.floor"] === undefined
      && JSON.stringify(manifest.spatial?.localSockets?.["output.primary"])
        === "[33,78]"
      && JSON.stringify(manifest.spatial?.localSockets?.["effect.origin"])
        === "[31,71]"
      && manifest.spatial?.perSceneAttachmentOffsets === false
      && manifest.spatial?.centerToCenterAttachment === false
      && manifest.spatial?.missingSocketFallback === false,
    "Coffee C01 local socket contract changed",
  );

  const partById = new Map(
    manifest.parts?.map((part) => [part.id, part]),
  );
  const expectedParts = [
    "coffee-machine-c01.shell-static",
    "coffee-machine-c01.viewport-a",
    "coffee-machine-c01.viewport-b",
    "coffee-machine-c01.viewport-c",
    "coffee-machine-c01.viewport-d",
    "coffee-machine-c01.output-bay-empty",
    "coffee-machine-c01.effect-coffee-stream",
    "coffee-machine-c01.effect-steam",
    "coffee-machine-c01.held-coffee-mug",
  ];
  add(
    expectedParts.every((id) => partById.has(id))
      && manifest.parts.length === expectedParts.length
      && manifest.parts.every(
        ({
          authoringFile,
          authoringSha256,
          runtimeFile,
          runtimeSha256,
        }) =>
          sha256(authoringFile) === authoringSha256
          && sha256(runtimeFile) === runtimeSha256,
      ),
    "Coffee C01 part inventory or hashes changed",
  );
  add(
    manifest.animation?.frameCount === 4
      && manifest.animation?.shellPartId
        === "coffee-machine-c01.shell-static"
      && manifest.animation?.shellStableAcrossFrames === true
      && manifest.animation?.basePivotStableAcrossFrames === true
      && manifest.animation?.sortPivotStableAcrossFrames === true
      && manifest.animation?.outsideViewportChangedPixels === 0
      && JSON.stringify(
        manifest.animation.frames.map(({ effectPartIds }) =>
          effectPartIds.length),
      ) === "[0,0,2,0]"
      && manifest.animation.frames.every(
        ({
          authoringCompositeFile,
          authoringCompositeSha256,
          runtimeCompositeFile,
          runtimeCompositeSha256,
        }) =>
          sha256(authoringCompositeFile) === authoringCompositeSha256
          && sha256(runtimeCompositeFile) === runtimeCompositeSha256,
      ),
    "Coffee C01 local animation contract changed",
  );

  const heldRecord = held.props.find(({ id }) => id === "held.coffee-mug");
  add(
    held.status === "owner-approved"
      && manifest.outputHandoff?.emptyOutputPartId
        === "coffee-machine-c01.output-bay-empty"
      && manifest.outputHandoff?.heldAssetId === "held.coffee-mug"
      && manifest.outputHandoff?.heldAssetRuntimeSha256
        === heldRecord?.runtimeSha256
      && JSON.stringify(manifest.outputHandoff?.effectPartIds)
        === JSON.stringify([
          "coffee-machine-c01.effect-coffee-stream",
          "coffee-machine-c01.effect-steam",
        ])
      && manifest.outputHandoff?.productEmbeddedInShell === false
      && manifest.outputHandoff?.productEmbeddedInViewportFrames === false
      && manifest.outputHandoff?.runtimeScale === 1
      && manifest.outputHandoff?.attachmentDeltaFailures === 0,
    "Coffee C01 H01 output handoff changed",
  );

  const roster = manifest.rosterValidation;
  add(
    roster?.characterCount === 18
      && roster?.activeFrames === 6
      && roster?.validatedPoseCases === 108
      && roster?.visiblePropCases === 54
      && roster?.facilityOutputAttachmentCases === 18
      && roster?.actorHandAttachmentCases === 36
      && roster?.frontOverlayCases === 36
      && roster?.attachmentDeltaFailures === 0
      && roster?.foregroundMaskUses === 0
      && roster?.visibleAlphaFailures === 0
      && roster?.perCharacterFacilityScaling === false
      && roster?.perCharacterActorOffsets === false
      && roster.characters.every(({ frames }) =>
        frames.length === 6
        && frames.every(({ attachmentDelta, visiblePropAlphaFraction }) =>
          attachmentDelta === null
            ? visiblePropAlphaFraction === null
            : JSON.stringify(attachmentDelta) === "[0,0]"
              && visiblePropAlphaFraction === 1)),
    "Coffee C01 18x6 socket proof changed",
  );
  const reservation = manifest.reservationValidation;
  add(
    reservation?.durationSeconds === 30
      && reservation?.actorCount === 2
      && reservation?.maximumConcurrentReservations === 1
      && reservation?.collisionCount === 0
      && reservation?.blockedAttemptCount === 1
      && reservation?.failureCount === 1
      && reservation?.retrySuccessCount === 1
      && reservation?.releasedAtEnd === true
      && reservation?.samples?.length === 31
      && reservation.samples.at(-1)?.heldBy === null,
    "Coffee C01 reservation proof changed",
  );

  add(
    manifest.reviewOutputs?.length === 12
      && manifest.reviewOutputs.every(
        (path) =>
          path.startsWith(
            "assets/art/layout-references/office-facility-family-v1/"
            + "coffee-machine-c01/",
          )
          && existsSync(resolve(root, path)),
      ),
    "Coffee C01 review bundle is incomplete",
  );
  add(
    manifest.activeOfficeEvidence?.file
      === "apps/web/src/features/office/components/officeAssetRegistry.ts"
      && manifest.activeOfficeEvidence?.sha256
        === sha256(manifest.activeOfficeEvidence.file)
      && manifest.activeOfficeEvidence?.imported === false,
    "Coffee C01 Active Office isolation evidence changed",
  );
} catch (error) {
  failures.push(String(error?.stack ?? error));
}

if (failures.length) {
  console.error("Coffee Machine C01 check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  "Coffee Machine C01 check passed: four fresh neutral-master frames, "
  + "1x2x2 support geometry in a 2x3 render envelope, owner-approved "
  + "Counter A01-r02 parent, 6 depth-span support cases, local coffee/steam, "
  + "108 pose cases, 30-second failure/retry, F0-F7 passed, F8 pending.",
);
