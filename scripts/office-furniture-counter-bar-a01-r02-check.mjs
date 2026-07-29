import { validateOfficeSurfaceFurnitureProductionManifest } from "../packages/contracts/src/officeSurfaceFurnitureProduction.ts";
import {
  fileHashMatches,
  readJson,
  readText,
  recursiveFiles,
  same,
  sha256,
} from "./office-production-check-utils.mjs";

const manifestPath = "assets/game/manifests/office-furniture-counter-bar-a01-r02.json";
const sourcePath = "assets/art/layout-references/office-furniture-counter-bar-a01-r02-source.png";
const outputRoot = "assets/game/processed/office-furniture-counter-bar-a01-r02";
const reviewRoot = "assets/art/layout-references/office-furniture-family-v1/counter-bar-a01-r02";
const builderPath = "scripts/build-office-furniture-counter-bar-a01-r02.py";
const failures = [];
const add = (condition, message) => {
  if (!condition) failures.push(message);
};

const outputFiles = [
  `${outputRoot}/authoring/counter-bar-a01-r02.normalized.png`,
  `${outputRoot}/authoring/parts/counter-bar-a01-r02.base-shell.png`,
  `${outputRoot}/authoring/parts/counter-bar-a01-r02.foreground-occlusion.png`,
  `${outputRoot}/authoring/parts/counter-bar-a01-r02.support-surface.png`,
  `${outputRoot}/authoring/source/counter-bar-a01-r02.geometry-normalized-source.png`,
  `${outputRoot}/authoring/source/counter-bar-a01-r02.keyed-source.png`,
  `${outputRoot}/authoring/source/counter-bar-a01-r02.ownership-mask.png`,
  `${outputRoot}/runtime/counter-bar-a01-r02.clean.png`,
  `${outputRoot}/runtime/parts/counter-bar-a01-r02.base-shell.png`,
  `${outputRoot}/runtime/parts/counter-bar-a01-r02.foreground-occlusion.png`,
  `${outputRoot}/runtime/parts/counter-bar-a01-r02.support-surface.png`,
];
const reviewNames = [
  "source-lineage-and-normalization",
  "exact-6x2x2-geometry",
  "alpha-parts",
  "clean-front",
  "twelve-surface-cells",
  "four-corner-edge-support",
  "modular-configurations",
  "spans-and-rejections",
  "use-lanes-and-routes",
  "movement-socket-proof",
  "reservation-timeline-30s",
  "layer-order",
];
const reviewFiles = reviewNames.map(
  (name, index) =>
    `${reviewRoot}/${String(index + 1).padStart(2, "0")}-${name}.png`,
);

try {
  const manifest = readJson(manifestPath);
  for (const issue of validateOfficeSurfaceFurnitureProductionManifest(manifest)) {
    failures.push(`Surface furniture contract: ${issue}`);
  }
  add(
    manifest.schemaVersion === 1
      && manifest.id === "office.furniture.counter-bar.a01-r02"
      && manifest.familyId === "counter.bar.modular"
      && manifest.revision === "a01-r02",
    "Counter Bar A01-r02 identity changed",
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
    "A01-r02 must stop at independent F8 owner review",
  );
  add(
    ["F0", "F1", "F2", "F3", "F4", "F5", "F6", "F7"]
      .every((gate) => manifest.gates?.[gate]?.status === "passed")
      && manifest.gates?.F8?.status === "pending-owner-review"
      && manifest.gates?.F9?.status === "blocked"
      && manifest.gates?.F10?.status === "blocked",
    "A01-r02 gate state changed",
  );
  add(
    Object.values(manifest.sourcePolicy ?? {})
      .every((setting) => setting === false),
    "A01-r02 source reuse and fallback policy must remain disabled",
  );

  const source = manifest.source;
  add(
    source?.kind === "generated-isolated-clean-source"
      && source?.path === sourcePath
      && source?.sha256 === sha256(sourcePath)
      && source?.generation?.workflow === "built-in-imagegen"
      && source?.generation?.inputImageCount === 0
      && source?.generation?.conceptPixelsAsSource === false
      && source?.generation?.geometryCorrectionCount === 2
      && source?.extractionMethod === "generated-source-chroma-key"
      && same(source?.sampledKeyRgb, [240, 12, 224])
      && same(source?.sourceSize, [1536, 1024])
      && same(source?.ownedBounds, [123, 99, 1414, 922])
      && source?.connectedComponentCount === 1
      && source?.selectedVisiblePixels === 1051378
      && source?.sourcePixelsResampled === false
      && source?.canvasContact === false
      && same(source?.authoringPadding, {
        left: 122,
        top: 127,
        right: 123,
        bottom: 60,
      }),
    "A01-r02 fresh source ownership or chroma metrics changed",
  );
  add(
    source?.geometryNormalization?.method
        === "orthographic-row-removal-without-resampling"
      && same(source?.geometryNormalization?.sourceSurfaceBounds, [
        123, 99, 1414, 579,
      ])
      && same(source?.geometryNormalization?.removedRows, [529, 579])
      && source?.geometryNormalization?.preservedFrontAssemblyFromRow === 579
      && same(source?.geometryNormalization?.outputSurfaceBounds, [
        123, 99, 1414, 529,
      ])
      && source?.geometryNormalization?.pixelsResampled === false,
    "A01-r02 orthographic row normalization changed",
  );
  for (const item of [
    source?.keyedSource,
    source?.ownershipMask,
    source?.geometryNormalizedSource,
    source?.normalizedCutout,
  ]) {
    add(
      fileHashMatches(item?.file, item?.sha256),
      `A01-r02 source evidence is missing or stale: ${item?.file}`,
    );
  }

  add(
    same(manifest.render?.authoringCanvas, [1536, 960])
      && same(manifest.render?.runtimeCanvas, [256, 160])
      && manifest.render?.uniformIntegerDivisor === 6
      && manifest.render?.nonUniformScaling === false
      && manifest.render?.orientation === "front"
      && manifest.render?.anchor === "bottom-center"
      && manifest.render?.projection?.screenX === "worldX * 32"
      && manifest.render?.projection?.screenY
        === "worldY * 32 - worldZ * 32"
      && manifest.render?.projection?.perspective === false,
    "A01-r02 render envelope or projection changed",
  );
  add(
    fileHashMatches(
      manifest.cleanAsset?.file,
      manifest.cleanAsset?.sha256,
      [256, 160],
    ),
    "A01-r02 clean runtime asset is missing or stale",
  );

  const geometry = manifest.geometry;
  add(
    geometry?.assetType === "surface-furniture"
      && geometry?.placementPlane === "floor"
      && same(geometry?.physicalScale, {
        width: 6,
        depth: 2,
        height: 2,
        unit: "tile",
      })
      && same(geometry?.footprint, { width: 6, depth: 2, unit: "tile" })
      && same(geometry?.supportPlane, {
        id: "counter.bar.a01-r02-surface",
        width: 6,
        depth: 2,
        height: 2,
        unit: "tile",
      })
      && same(geometry?.basePivot, { x: 3, y: 2, unit: "tile" })
      && same(geometry?.sortPivot, { x: 3, y: 2, unit: "tile" })
      && geometry?.attachmentSlots?.length === 12
      && geometry?.seatSlots?.length === 0
      && geometry?.orientation === "front",
    "A01-r02 physical Geometry v3 changed",
  );
  add(
    same(manifest.parts?.map(({ role }) => role), [
      "base-shell",
      "support-surface",
      "foreground-occlusion",
    ]),
    "A01-r02 production parts are not independently layered",
  );
  for (const part of manifest.parts ?? []) {
    add(
      fileHashMatches(part.authoringFile, part.authoringSha256, [1536, 960])
        && fileHashMatches(part.runtimeFile, part.runtimeSha256, [256, 160]),
      `A01-r02 part is missing or stale: ${part.id}`,
    );
  }

  const surface = manifest.surfaceContract;
  const expectedXs = [48, 80, 112, 144, 176, 208];
  add(
    surface?.slots?.length === 12
      && same(
        surface?.slots?.slice(0, 6).map(({ localSocket }) => localSocket),
        expectedXs.map((x) => [x, 38]),
      )
      && same(
        surface?.slots?.slice(6).map(({ localSocket }) => localSocket),
        expectedXs.map((x) => [x, 70]),
      )
      && surface?.adjacentSpanGroups?.length === 10
      && surface?.twoByTwoSpanGroups?.length === 5
      && surface?.useLanes?.length === 6
      && same(surface?.projectedSupportBounds, [32, 22, 224, 86])
      && same(surface?.visualTopBounds, [20, 21, 236, 93])
      && surface?.edgeSupportFailures === 0
      && surface?.atomicOccupancy === true
      && surface?.rejectOverlap === true
      && surface?.rejectUnsupportedChild === true
      && surface?.childInteractionDelegated === true
      && surface?.coffeeC01Imported === false,
    "A01-r02 cells, spans, edge support, or Coffee isolation changed",
  );
  add(
    same(manifest.spatial?.localSockets?.["root.floor"], [128, 150])
      && same(manifest.spatial?.localSockets?.["sort.floor"], [128, 150])
      && manifest.spatial?.attachmentFormula
        === "parent-socket-minus-child-socket"
      && manifest.spatial?.perSceneAttachmentOffsets === false
      && manifest.spatial?.centerFallback === false
      && manifest.spatial?.missingSocketFallback === false
      && manifest.spatial?.attachmentDeltaFailures === 0,
    "A01-r02 semantic socket system changed",
  );

  const placement = manifest.placementValidation;
  add(
    placement?.oneByOneCases === 12
      && placement?.twoByOneCases === 10
      && placement?.twoByTwoCases === 5
      && placement?.configurationCount === 7
      && placement?.configurations?.length === 7
      && placement?.overlapRejections === 1
      && placement?.unsupportedChildRejections === 1
      && placement?.routeObstructionCount === 0
      && placement?.attachmentDeltaFailures === 0,
    "A01-r02 placement and rejection proof changed",
  );
  add(
    same(manifest.movementValidation?.worldPositions, [[0, 0], [4, 3], [9, 6]])
      && manifest.movementValidation?.childAttachmentCases === 36
      && manifest.movementValidation?.attachmentDeltaFailures === 0
      && manifest.movementValidation?.propFollowFailures === 0,
    "A01-r02 movement proof changed",
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
      && reservation?.samples?.at(-1)?.heldBy === null,
    "A01-r02 contention, failure, or retry proof changed",
  );

  add(
    same(recursiveFiles(outputRoot), outputFiles),
    "A01-r02 processed output inventory changed",
  );
  add(
    same(recursiveFiles(reviewRoot), reviewFiles)
      && same(manifest.reviewOutputs?.map(({ file }) => file), reviewFiles),
    "A01-r02 owner-review inventory changed",
  );
  for (const review of manifest.reviewOutputs ?? []) {
    add(
      fileHashMatches(review.file, review.sha256, [1600, 1000]),
      `A01-r02 review board is missing or stale: ${review.file}`,
    );
  }
  const builder = readText(builderPath);
  add(
    !builder.includes("office-furniture-counter-bar-a01-source.png")
      && !builder.includes("officeAssetRegistry")
      && !builder.includes("office-furniture-master-audit-v1")
      && !builder.includes("office-facility-coffee-machine"),
    "A01-r02 builder gained an old, rejected, Active Office, or Coffee input",
  );
} catch (error) {
  failures.push(String(error?.stack ?? error));
}

if (failures.length) {
  console.error("Counter Bar A01-r02 check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  "Counter Bar A01-r02 check passed: fresh source, exact 6x2x2 geometry, "
  + "12 fully supported cells, 10 2x1 spans, 5 2x2 spans, 36 movement "
  + "cases, reservation proof, F0-F7 passed, F8 pending.",
);
