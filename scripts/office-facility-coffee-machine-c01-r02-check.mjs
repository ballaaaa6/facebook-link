import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  validateOfficeFacilityProductionManifest,
} from "../packages/contracts/src/officeFacilityProduction.ts";
import {
  hasExpectedCoffeeAnimation,
  hasExpectedCoffeeReservation,
  hasExpectedCoffeeRoster,
  hasExpectedPartInventory,
} from "./office-facility-coffee-machine-check-helpers.mjs";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const manifestPath =
  "assets/game/manifests/office-facility-coffee-machine-c01-r02.json";
const counterPath =
  "assets/game/manifests/office-furniture-counter-bar-a01-r02.json";
const heldPath = "assets/game/manifests/office-held-props-h01.json";
const sourcePath =
  "assets/art/layout-references/office-facility-coffee-machine-c01-r02-source.png";
const expectedSourceSha =
  "833fdf374a47487929fe67c9f9c7eba4f154754ddc2d234170444a80af438cc2";

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
  const held = readJson(heldPath);

  for (const issue of validateOfficeFacilityProductionManifest(manifest)) {
    failures.push(`Facility contract: ${issue}`);
  }

  add(
    manifest.schemaVersion === 2
      && manifest.id === "office.facility.coffee-machine.c01-r02"
      && manifest.familyId === "machine.coffee"
      && manifest.revision === "c01-r02",
    "Coffee C01-r02 identity changed",
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
    "Coffee C01-r02 must stop at independent F8 owner review",
  );
  add(
    ["F0", "F1", "F2", "F3", "F4", "F5", "F6", "F7"]
      .every((gate) => manifest.gates?.[gate]?.status === "passed")
      && manifest.gates?.F8?.status === "pending-owner-review"
      && manifest.gates?.F9?.status === "blocked"
      && manifest.gates?.F10?.status === "blocked",
    "Coffee C01-r02 gate state changed",
  );

  add(
    manifest.source?.kind === "generated-isolated-clean-source"
      && manifest.source?.path === sourcePath
      && manifest.source?.sha256 === expectedSourceSha
      && manifest.source?.extractionMethod
        === "generated-source-chroma-key"
      && manifest.source?.generation?.tool
        === "OpenAI built-in image generation"
      && sha256(sourcePath) === expectedSourceSha,
    "Coffee C01-r02 generated clean source authority changed",
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
            "owner-directive:coffee-c01-r02-2x2x2-clean-source:frame-",
          )
          && selectedComponentCount === 1
          && selectedPixelCount > 800_000
          && touchesNominalCellBoundary === false
          && touchesMasterBoundary === false
          && sourcePixelsResampled === false
          && sha256(authoringCutout) === authoringCutoutSha256,
      ),
    "Coffee C01-r02 must lock four generated-base frame records",
  );
  for (const evidence of [
    manifest.source?.keyedSource,
    manifest.source?.ownershipMask,
  ]) {
    add(
      evidence?.file?.startsWith(
        "assets/game/processed/office-facility-family-v1/"
        + "coffee-machine-c01-r02/",
      )
        && sha256(evidence.file) === evidence.sha256,
      "Coffee C01-r02 source evidence hash changed",
    );
  }

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
    JSON.stringify(manifest.sourceExclusions?.rejectedAuditRecordIds)
        === JSON.stringify(rejectedIds)
      && manifest.sourceExclusions?.processedCoffeeInputs?.length === 0
      && manifest.sourceExclusions?.historicalLoopInputs?.length === 0
      && manifest.sourceExclusions?.sideOrientationInputs?.length === 0,
    "Coffee C01-r02 source exclusions changed",
  );

  add(
    JSON.stringify(manifest.render) === JSON.stringify({
      authoringCanvas: [1536, 1536],
      runtimeCanvas: [96, 96],
      uniformIntegerDivisor: 16,
      nonUniformScaling: false,
      anchor: "bottom-center",
      requiredOrientations: ["front"],
    }),
    "Coffee C01-r02 render contract changed",
  );
  add(
    manifest.geometry?.placementPlane === "furniture-surface"
      && manifest.geometry?.assetType === "animated-shell"
      && JSON.stringify(manifest.geometry?.physicalScale)
        === JSON.stringify({
          width: 2,
          depth: 2,
          height: 2,
          unit: "tile",
        })
      && manifest.geometry?.footprint === null
      && manifest.geometry?.sortPivot === null
      && JSON.stringify(manifest.geometry?.basePivot)
        === '{"x":1,"y":2,"unit":"tile"}'
      && JSON.stringify(manifest.visualOccupancy?.physicalScale)
        === "[2,2,2]"
      && JSON.stringify(manifest.visualOccupancy?.visibleBoundsRuntime)
        === "[17,28,79,92]"
      && manifest.visualOccupancy?.sourceAspectPreserved === true
      && manifest.visualOccupancy?.uniformScalingOnly === true,
    "Coffee C01-r02 2x2x2 visual occupancy changed",
  );

  const parent = manifest.spatial?.supportParent;
  const counterSlots = counter.surfaceContract?.slots ?? [];
  const slotById = new Map(counterSlots.map((slot) => [slot.id, slot]));
  const supportBottom = counter.surfaceContract?.projectedSupportBounds?.[3];
  const expectedBlockSpans = counter.surfaceContract?.twoByTwoSpanGroups
    ?.map((span) => {
      const anchorSlotIds = span.slotIds.filter((id) =>
        id.includes(".front."));
      const anchorSlots = anchorSlotIds.map((id) => slotById.get(id));
      return {
        id: span.id,
        slotIds: span.slotIds,
        anchorSlotIds,
        useLaneIds: anchorSlots.map((slot) => slot?.pairedUseLaneId),
        parentSocket: [
          anchorSlots.reduce(
            (sum, slot) => sum + slot.localSocket[0],
            0,
          ) / 2,
          supportBottom,
        ],
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
      && JSON.stringify(parent?.compatibleBlockSpans)
        === JSON.stringify(expectedBlockSpans)
      && parent?.selectedBlockSpanId === "span.block.03-04"
      && JSON.stringify(parent?.occupiedSlotIds)
        === '["surface.back.03","surface.back.04","surface.front.03","surface.front.04"]'
      && JSON.stringify(parent?.selectedAnchorSlotIds)
        === '["surface.front.03","surface.front.04"]'
      && JSON.stringify(parent?.useLaneIds) === '["use.03","use.04"]'
      && parent?.anchorDerivation === "span-front-edge-midpoint"
      && JSON.stringify(parent?.selectedParentSocket) === "[128,86]"
      && JSON.stringify(parent?.attachmentDelta) === "[0,0]"
      && parent?.placementCases === 5
      && parent?.supportFailures === 0
      && parent?.nonOverlappingPacking?.capacity === 3
      && JSON.stringify(parent?.nonOverlappingPacking?.spanIds)
        === '["span.block.01-02","span.block.03-04","span.block.05-06"]'
      && parent?.nonOverlappingPacking?.overlapFailures === 0
      && parent?.activeOfficeImported === false,
    "Coffee C01-r02 parent-counter support contract changed",
  );
  add(
    JSON.stringify(manifest.spatial?.localSockets?.["base.support"])
      === "[48,92]"
      && manifest.spatial?.localSockets?.["base.floor"] === undefined
      && manifest.spatial?.localSockets?.["sort.floor"] === undefined
      && JSON.stringify(manifest.spatial?.localSockets?.["output.primary"])
        === "[48,61]"
      && JSON.stringify(manifest.spatial?.localSockets?.["effect.origin"])
        === "[48,55]"
      && manifest.spatial?.perSceneAttachmentOffsets === false
      && manifest.spatial?.centerToCenterAttachment === false
      && manifest.spatial?.missingSocketFallback === false,
    "Coffee C01-r02 local socket contract changed",
  );

  const expectedParts = [
    "coffee-machine-c01-r02.shell-static",
    "coffee-machine-c01-r02.viewport-a",
    "coffee-machine-c01-r02.viewport-b",
    "coffee-machine-c01-r02.viewport-c",
    "coffee-machine-c01-r02.viewport-d",
    "coffee-machine-c01-r02.output-bay-empty",
    "coffee-machine-c01-r02.effect-coffee-stream",
    "coffee-machine-c01-r02.effect-steam",
    "coffee-machine-c01-r02.held-coffee-mug",
  ];
  add(
    hasExpectedPartInventory(manifest.parts, expectedParts, sha256),
    "Coffee C01-r02 part inventory or hashes changed",
  );
  add(
    hasExpectedCoffeeAnimation(
      manifest.animation,
      "coffee-machine-c01-r02.shell-static",
      sha256,
    ),
    "Coffee C01-r02 local animation contract changed",
  );

  const heldRecord = held.props.find(({ id }) => id === "held.coffee-mug");
  add(
    held.status === "owner-approved"
      && manifest.outputHandoff?.emptyOutputPartId
        === "coffee-machine-c01-r02.output-bay-empty"
      && manifest.outputHandoff?.heldAssetId === "held.coffee-mug"
      && manifest.outputHandoff?.heldAssetRuntimeSha256
        === heldRecord?.runtimeSha256
      && JSON.stringify(manifest.outputHandoff?.effectPartIds)
        === JSON.stringify([
          "coffee-machine-c01-r02.effect-coffee-stream",
          "coffee-machine-c01-r02.effect-steam",
        ])
      && manifest.outputHandoff?.productEmbeddedInShell === false
      && manifest.outputHandoff?.productEmbeddedInViewportFrames === false
      && manifest.outputHandoff?.runtimeScale === 1
      && manifest.outputHandoff?.attachmentDeltaFailures === 0,
    "Coffee C01-r02 H01 output handoff changed",
  );

  add(
    hasExpectedCoffeeRoster(manifest.rosterValidation),
    "Coffee C01-r02 18x6 socket proof changed",
  );
  add(
    hasExpectedCoffeeReservation(manifest.reservationValidation),
    "Coffee C01-r02 reservation proof changed",
  );

  add(
    manifest.reviewOutputs?.length === 13
      && manifest.reviewOutputs.every(
        (path) =>
          path.startsWith(
            "assets/art/layout-references/office-facility-family-v1/"
            + "coffee-machine-c01-r02/",
          )
          && existsSync(resolve(root, path)),
      ),
    "Coffee C01-r02 review bundle is incomplete",
  );
  add(
    manifest.activeOfficeEvidence?.file
      === "apps/web/src/features/office/components/officeAssetRegistry.ts"
      && manifest.activeOfficeEvidence?.sha256
        === sha256(manifest.activeOfficeEvidence.file)
      && manifest.activeOfficeEvidence?.imported === false,
    "Coffee C01-r02 Active Office isolation evidence changed",
  );
} catch (error) {
  failures.push(String(error?.stack ?? error));
}

if (failures.length) {
  console.error("Coffee Machine C01-r02 check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  "Coffee Machine C01-r02 check passed: fresh generated source, "
  + "2x2x2 support geometry, owner-approved Counter A01-r02 parent, "
  + "5 block cases, exact 3-item packing, local coffee/steam, "
  + "108 pose cases, 30-second failure/retry, F0-F7 passed, F8 pending.",
);
