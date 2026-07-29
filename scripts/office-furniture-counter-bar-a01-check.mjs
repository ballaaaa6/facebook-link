import { validateOfficeSurfaceFurnitureProductionManifest } from "../packages/contracts/src/officeSurfaceFurnitureProduction.ts";
import {
  fileHashMatches,
  readJson,
  readText,
  recursiveFiles,
  same,
  sha256,
} from "./office-production-check-utils.mjs";

const manifestPath = "assets/game/manifests/office-furniture-counter-bar-a01.json";
const sourcePath = "assets/art/layout-references/office-furniture-counter-bar-a01-source.png";
const outputRoot = "assets/game/processed/office-furniture-counter-bar-a01";
const reviewRoot = "assets/art/layout-references/office-furniture-family-v1/counter-bar-a01";
const builderPath = "scripts/build-office-furniture-counter-bar-a01.py";
const failures = [];
const add = (condition, message) => {
  if (!condition) failures.push(message);
};

const expectedOutputFiles = [
  `${outputRoot}/authoring/counter-bar-a01.normalized.png`,
  `${outputRoot}/authoring/parts/counter-bar-a01.base-shell.png`,
  `${outputRoot}/authoring/parts/counter-bar-a01.foreground-occlusion.png`,
  `${outputRoot}/authoring/parts/counter-bar-a01.support-surface.png`,
  `${outputRoot}/authoring/source/counter-bar-a01.keyed-source.png`,
  `${outputRoot}/authoring/source/counter-bar-a01.ownership-mask.png`,
  `${outputRoot}/runtime/counter-bar-a01.clean.png`,
  `${outputRoot}/runtime/parts/counter-bar-a01.base-shell.png`,
  `${outputRoot}/runtime/parts/counter-bar-a01.foreground-occlusion.png`,
  `${outputRoot}/runtime/parts/counter-bar-a01.support-surface.png`,
];
const expectedReviewFiles = Array.from(
  { length: 11 },
  (_, index) => `${reviewRoot}/${String(index + 1).padStart(2, "0")}-${[
    "source-ownership",
    "alpha-parts",
    "clean-front",
    "orthographic-geometry",
    "support-slots",
    "modular-configurations",
    "span-and-rejection",
    "use-lanes-and-routes",
    "movement-socket-proof",
    "reservation-timeline-30s",
    "layer-order",
  ][index]}.png`,
);

try {
  const manifest = readJson(manifestPath);
  for (const issue of validateOfficeSurfaceFurnitureProductionManifest(manifest)) {
    failures.push(`Surface furniture contract: ${issue}`);
  }

  add(
    manifest.schemaVersion === 1
      && manifest.id === "office.furniture.counter-bar.a01"
      && manifest.familyId === "counter.bar.modular"
      && manifest.revision === "a01",
    "Counter Bar A01 identity changed",
  );
  add(
    manifest.status === "owner-review-f8-pending"
      && manifest.ownerDecision === null
      && manifest.developmentOnly === true
      && manifest.activeOfficePromotion === false
      && manifest.permissions?.isolatedFamilyLab === true
      && manifest.permissions?.ownerReview === true
      && manifest.permissions?.attachedCoffeeProduction === false
      && manifest.permissions?.furnitureOnlyRoom === false
      && manifest.permissions?.activeOfficePromotion === false,
    "Counter Bar A01 must stop at independent F8 owner review",
  );
  add(
    ["F0", "F1", "F2", "F3", "F4", "F5", "F6", "F7"]
      .every((gate) => manifest.gates?.[gate]?.status === "passed")
      && manifest.gates?.F8?.status === "pending-owner-review"
      && manifest.gates?.F9?.status === "blocked"
      && manifest.gates?.F10?.status === "blocked",
    "Counter Bar A01 gate state changed",
  );

  add(
    Object.values(manifest.sourcePolicy ?? {}).every((setting) => setting === false),
    "Counter Bar A01 source policy must keep every reuse and fallback disabled",
  );
  add(
    manifest.source?.kind === "generated-isolated-clean-source"
      && manifest.source?.path === sourcePath
      && manifest.source?.sha256 === sha256(sourcePath)
      && manifest.source?.generation?.workflow === "built-in-imagegen"
      && manifest.source?.generation?.inputImageCount === 0
      && manifest.source?.generation?.conceptPixelsAsSource === false
      && manifest.source?.generation?.geometryCorrectionCount === 2
      && manifest.source?.extractionMethod === "generated-source-chroma-key"
      && same(manifest.source?.sampledKeyRgb, [239, 7, 230])
      && same(manifest.source?.sourceSize, [1536, 1024])
      && same(manifest.source?.ownedBounds, [154, 158, 1383, 867])
      && manifest.source?.connectedComponentCount === 1
      && manifest.source?.selectedVisiblePixels === 833578
      && manifest.source?.sourcePixelsResampled === false
      && manifest.source?.canvasContact === false
      && same(manifest.source?.authoringPadding, {
        left: 57,
        top: 191,
        right: 58,
        bottom: 60,
      }),
    "Counter Bar A01 original source ownership or chroma metrics changed",
  );
  for (const evidence of [
    manifest.source?.keyedSource,
    manifest.source?.ownershipMask,
    manifest.source?.normalizedCutout,
  ]) {
    add(
      fileHashMatches(evidence?.file, evidence?.sha256),
      `Counter source evidence is missing or stale: ${evidence?.file}`,
    );
  }

  add(
    same(manifest.render?.authoringCanvas, [1344, 960])
      && same(manifest.render?.runtimeCanvas, [224, 160])
      && manifest.render?.uniformIntegerDivisor === 6
      && manifest.render?.nonUniformScaling === false
      && manifest.render?.orientation === "front"
      && manifest.render?.anchor === "bottom-center"
      && manifest.render?.projection?.screenX === "worldX * 32"
      && manifest.render?.projection?.screenY
        === "worldY * 32 - worldZ * 32"
      && manifest.render?.projection?.perspective === false,
    "Counter render envelope or orthographic projection changed",
  );
  add(
    fileHashMatches(
      manifest.cleanAsset?.file,
      manifest.cleanAsset?.sha256,
      [224, 160],
    ),
    "Counter runtime clean asset is missing or stale",
  );

  const geometry = manifest.geometry;
  add(
    geometry?.schemaVersion === 3
      && geometry?.assetType === "surface-furniture"
      && geometry?.placementPlane === "floor"
      && same(geometry?.physicalScale, {
        width: 6,
        depth: 2,
        height: 2,
        unit: "tile",
      })
      && same(geometry?.footprint, { width: 6, depth: 2, unit: "tile" })
      && same(geometry?.supportPlane, {
        id: "counter.bar.a01-surface",
        width: 6,
        depth: 2,
        height: 2,
        unit: "tile",
      })
      && same(geometry?.basePivot, { x: 3, y: 2, unit: "tile" })
      && same(geometry?.sortPivot, { x: 3, y: 2, unit: "tile" })
      && geometry?.attachmentSlots?.length === 5
      && geometry?.seatSlots?.length === 0
      && geometry?.orientation === "front",
    "Counter physical, support, or pivot Geometry v3 changed",
  );

  add(
    same(manifest.parts?.map(({ role }) => role), [
      "base-shell",
      "support-surface",
      "foreground-occlusion",
    ]),
    "Counter production parts are not independently layered",
  );
  for (const part of manifest.parts ?? []) {
    add(
      fileHashMatches(part.authoringFile, part.authoringSha256, [1344, 960])
        && fileHashMatches(part.runtimeFile, part.runtimeSha256, [224, 160]),
      `Counter part is missing or stale: ${part.id}`,
    );
  }

  const slots = manifest.surfaceContract?.slots ?? [];
  const expectedSockets = [
    [48, 54],
    [80, 54],
    [112, 54],
    [144, 54],
    [176, 54],
  ];
  add(
    slots.length === 5
      && same(slots.map(({ id }) => id), [
        "surface.01",
        "surface.02",
        "surface.03",
        "surface.04",
        "surface.05",
      ])
      && same(slots.map(({ localSocket }) => localSocket), expectedSockets)
      && slots.every(({ accepts }) =>
        same(accepts, ["equipment-1x1", "prop-1x1"]))
      && manifest.surfaceContract?.adjacentSpanGroups?.length === 4
      && manifest.surfaceContract?.useLanes?.length === 5
      && manifest.surfaceContract?.atomicOccupancy === true
      && manifest.surfaceContract?.rejectOverlap === true
      && manifest.surfaceContract?.rejectUnsupportedChild === true
      && manifest.surfaceContract?.childInteractionDelegated === true
      && manifest.surfaceContract?.coffeeC01Imported === false,
    "Counter modular support slots, spans, or Coffee isolation changed",
  );
  add(
    same(manifest.spatial?.localSockets?.["root.floor"], [112, 150])
      && same(manifest.spatial?.localSockets?.["sort.floor"], [112, 150])
      && manifest.spatial?.attachmentFormula === "parent-socket-minus-child-socket"
      && manifest.spatial?.perSceneAttachmentOffsets === false
      && manifest.spatial?.centerFallback === false
      && manifest.spatial?.missingSocketFallback === false
      && manifest.spatial?.attachmentDeltaFailures === 0,
    "Counter semantic socket system changed",
  );

  const placement = manifest.placementValidation;
  add(
    placement?.oneByOneCases === 5
      && placement?.twoByOneCases === 4
      && placement?.configurationCount === 5
      && placement?.configurations?.length === 5
      && placement?.overlapRejections === 1
      && placement?.unsupportedChildRejections === 1
      && placement?.routeObstructionCount === 0
      && placement?.attachmentDeltaFailures === 0,
    "Counter placement or fail-closed rejection proof changed",
  );
  add(
    same(manifest.movementValidation?.worldPositions, [[0, 0], [4, 3], [9, 6]])
      && manifest.movementValidation?.childAttachmentCases === 15
      && manifest.movementValidation?.attachmentDeltaFailures === 0
      && manifest.movementValidation?.propFollowFailures === 0,
    "Counter movement attachment proof changed",
  );

  const reservation = manifest.reservationValidation;
  add(
    reservation?.durationSeconds === 30
      && reservation?.contenderCount === 2
      && reservation?.maximumConcurrentReservations === 1
      && reservation?.blockedAttemptCount === 1
      && reservation?.failureCount === 1
      && reservation?.retrySuccessCount === 1
      && reservation?.releasedAtEnd === true
      && reservation?.samples?.length === 31
      && reservation.samples.at(-1)?.heldBy === null,
    "Counter 30-second contention, failure, or retry proof changed",
  );
  add(
    reservation?.samples?.every(({ heldBy }) =>
      heldBy === null || heldBy === "alpha" || heldBy === "beta"),
    "Counter reservation timeline contains an unknown holder",
  );

  add(
    same(recursiveFiles(outputRoot), expectedOutputFiles),
    "Counter processed output inventory changed",
  );
  add(
    same(recursiveFiles(reviewRoot), expectedReviewFiles)
      && same(manifest.reviewOutputs?.map(({ file }) => file), expectedReviewFiles),
    "Counter owner-review inventory changed",
  );
  for (const review of manifest.reviewOutputs ?? []) {
    add(
      fileHashMatches(review.file, review.sha256, [1600, 1000]),
      `Counter review board is missing or stale: ${review.file}`,
    );
  }
  const builder = readText(builderPath);
  add(
    !builder.includes("officeAssetRegistry")
      && !builder.includes("office-furniture-master-audit-v1")
      && !builder.includes("office-furniture-library")
      && !builder.includes("office-facility-coffee-machine"),
    "Counter builder gained a forbidden old-furniture or Coffee input",
  );
} catch (error) {
  failures.push(String(error?.stack ?? error));
}

if (failures.length) {
  console.error("Counter Bar A01 check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  "Counter Bar A01 check passed: original source, 6x2x2 Geometry v3, "
  + "five modular slots, four 2x1 spans, routes, movement, reservation, "
  + "F0-F7 passed, F8 pending, F9/F10 blocked.",
);
