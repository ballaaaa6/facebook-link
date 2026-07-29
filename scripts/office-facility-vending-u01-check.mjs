import { validateOfficeFacilityProductionManifest } from "../packages/contracts/src/officeFacilityProduction.ts";
import { fileHashMatches, readJson, readText, recursiveFiles as files, same, sha256 } from "./office-production-check-utils.mjs";
const manifestPath = "assets/game/manifests/office-facility-vending-u01.json";
const auditPath = "assets/game/manifests/office-furniture-master-audit-v1.json";
const actionPath = "assets/game/manifests/office-character-action-sockets-i01.json";
const heldPath = "assets/game/manifests/office-held-props-h01.json";
const spatialPath = "assets/game/manifests/office-spatial-authority-i01.json";
const behaviorPath = "assets/game/manifests/office-interaction-assets.json";
const activePath =
  "apps/web/src/features/office/components/officeAssetRegistry.ts";
const builderPath = "scripts/build-office-facility-vending-u01.py";
const sourcePath =
  "assets/art/layout-references/mechanical-loops-sheet-modern-bright-v1-source.png";
const processedRoot = "assets/game/processed/office-facility-family-v1/vending-u01-r03";
const reviewRoot = "assets/art/layout-references/office-facility-family-v1/vending-u01-r03";
const failures = [];
const add = (condition, message) => {
  if (!condition) failures.push(message);
};
try {
  const manifest = readJson(manifestPath);
  const audit = readJson(auditPath);
  const actions = readJson(actionPath);
  const held = readJson(heldPath);
  const spatial = readJson(spatialPath);
  for (const issue of validateOfficeFacilityProductionManifest(manifest)) {
    failures.push(`Facility production contract: ${issue}`);
  }

  add(
    manifest.schemaVersion === 2
      && manifest.id === "office.facility.vending-machine.u01"
      && manifest.familyId === "vending.machine.modern"
      && manifest.revision === "u01-r03",
    "Vending U01-r03 identity changed",
  );
  add(
    manifest.status === "owner-review-f8-pending"
      && manifest.ownerDecision === null
      && manifest.gates?.F8?.status === "pending-owner-review"
      && manifest.gates?.F9?.status === "blocked"
      && manifest.gates?.F10?.status === "blocked"
      && manifest.activeOfficePromotion === false,
    "U01-r03 must stop at F8 with F9/F10 blocked",
  );
  add(
    [
      "processedCropDirectReuse",
      "activeOfficePixelReuse",
      "legacyOrRejectedPixelReuse",
      "stagingPixelReuse",
      "generativeRepair",
      "missingAssetFallback",
    ].every((key) => manifest.sourcePolicy?.[key] === false)
      && manifest.sourcePolicy?.sharedProductionAssetDependency
        === "office.held-props.h01",
    "U01-r03 source policy or H01 dependency changed",
  );

  const prefix = "modern-bright-library-v1:env-07-animated-mechanical:"
    + "vending.machine.loop.";
  const expectedFrames = {
    a: [[0, 0, 314, 314], [72, 47, 272, 322], 52209],
    b: [[314, 0, 627, 314], [375, 47, 574, 322], 51759],
    c: [[627, 0, 940, 314], [678, 47, 878, 322], 51748],
    d: [[940, 0, 1254, 314], [981, 47, 1180, 322], 51743],
  };
  add(
    manifest.source?.path === sourcePath
      && manifest.source?.sha256 === sha256(sourcePath)
      && manifest.source?.extractionMethod === "full-master-component-ownership"
      && manifest.source?.frames?.length === 4,
    "U01-r03 must use the audited original mechanical-loop master",
  );
  const auditById = new Map(
    audit.records.map((record) => [record.recordId, record]),
  );
  for (const frame of manifest.source?.frames ?? []) {
    const expected = expectedFrames[frame.frameId];
    const auditRecord = auditById.get(frame.auditRecordId);
    add(
      Boolean(expected)
        && frame.auditRecordId === `${prefix}${frame.frameId}`
        && same(frame.sourceBounds, expected?.[0])
        && same(frame.ownedBounds, expected?.[1])
        && frame.selectedPixelCount === expected?.[2]
        && frame.selectedComponentCount === 1
        && frame.touchesNominalCellBoundary === true
        && frame.touchesMasterBoundary === false
        && frame.sourcePixelsResampled === false
        && frame.boundaryReview?.status === "passed-complete-silhouette"
        && auditRecord?.currentDecision?.masterPixelsSalvageable === true
        && auditRecord?.orientation === "front"
        && fileHashMatches(
          frame.authoringCutout,
          frame.authoringCutoutSha256,
          [256, 384],
        ),
      `Source ownership changed for frame ${frame.frameId}`,
    );
  }
  for (const key of ["keyedSource", "ownershipMask"]) {
    const evidence = manifest.source?.[key];
    add(
      fileHashMatches(evidence?.file, evidence?.sha256, [1254, 1254]),
      `${key} evidence is missing or stale`,
    );
  }

  add(
    same(manifest.render?.authoringCanvas, [256, 384])
      && same(manifest.render?.runtimeCanvas, [64, 96])
      && manifest.render?.uniformIntegerDivisor === 4
      && manifest.render?.anchor === "bottom-center"
      && same(manifest.render?.requiredOrientations, ["front"])
      && same(manifest.geometry?.physicalScale, {
        width: 2, depth: 1, height: 3, unit: "tile",
      })
      && same(manifest.geometry?.footprint, {
        width: 2, depth: 1, unit: "tile",
      })
      && same(manifest.geometry?.basePivot, { x: 1, y: 1, unit: "tile" })
      && same(manifest.geometry?.sortPivot, { x: 1, y: 1, unit: "tile" }),
    "U01-r03 render or 2x1x3 geometry changed",
  );
  add(
    manifest.spatial?.authority?.file === spatialPath
      && manifest.spatial?.authority?.sha256 === sha256(spatialPath)
      && same(manifest.spatial?.localSockets, {
        "base.floor": [32, 96],
        "sort.floor": [32, 96],
        "interaction.target": [48, 96],
        "output.primary": [32, 78],
        "effect.origin": [27, 81],
        "viewport.origin": [10, 32],
      })
      && manifest.spatial?.centerToCenterAttachment === false
      && manifest.spatial?.perSceneAttachmentOffsets === false
      && manifest.spatial?.missingSocketFallback === false,
    "U01-r03 spatial socket contract changed",
  );

  const roles = manifest.parts?.map(({ role }) => role);
  add(
    same(roles, [
      "static-shell",
      "animation-viewport",
      "animation-viewport",
      "animation-viewport",
      "animation-viewport",
      "pickup-tray-empty",
      "effect-overlay",
      "held-output",
    ]),
    "U01-r03 parts are not independently layered",
  );
  for (const part of manifest.parts ?? []) {
    const heldOutput = part.role === "held-output";
    add(
      fileHashMatches(
        part.authoringFile,
        part.authoringSha256,
        heldOutput ? [40, 40] : [256, 384],
      )
        && fileHashMatches(
          part.runtimeFile,
          part.runtimeSha256,
          heldOutput ? [20, 20] : [64, 96],
        ),
      `Part is missing or stale: ${part.id}`,
    );
  }
  const animation = manifest.animation;
  add(
    animation?.frameCount === 4
      && same(animation?.viewportBoundsAuthoring, [40, 128, 220, 376])
      && same(animation?.viewportBoundsRuntime, [10, 32, 55, 94])
      && animation?.shellStableAcrossFrames === true
      && animation?.basePivotStableAcrossFrames === true
      && animation?.sortPivotStableAcrossFrames === true
      && animation?.outsideViewportChangedPixels === 0
      && same(animation?.frames?.map(({ id }) => id), ["a", "b", "c", "d"])
      && same(
        animation?.frames?.map(({ effectPartIds }) => effectPartIds.length),
        [0, 0, 1, 0],
      ),
    "U01-r03 viewport locality or shell invariance changed",
  );
  for (const frame of animation?.frames ?? []) {
    add(
      fileHashMatches(
        frame.authoringCompositeFile,
        frame.authoringCompositeSha256,
        [256, 384],
      )
        && fileHashMatches(
          frame.runtimeCompositeFile,
          frame.runtimeCompositeSha256,
          [64, 96],
        ),
      `Animation composite is missing or stale: ${frame.id}`,
    );
  }

  const soda = held.props?.find(({ id }) => id === "held.soda-can");
  const handoff = manifest.outputHandoff;
  const expectedParents = [null, null, "facility.output.primary",
    "actor.hand.primary.grip", "actor.hand.primary.grip", null];
  add(
    handoff?.heldAssetManifest === heldPath
      && handoff?.heldAssetManifestSha256 === sha256(heldPath)
      && handoff?.heldAssetId === "held.soda-can"
      && handoff?.heldAssetRuntimeSha256 === soda?.runtimeSha256
      && handoff?.transition === "facility-output-socket-to-actor-hand-socket"
      && same(handoff?.heldVisiblePoseFrames, [2, 3, 4])
      && same(
        handoff?.timeline?.map(({ attachmentParent }) => attachmentParent),
        expectedParents,
      )
      && handoff?.runtimeScale === 1
      && handoff?.propGripSocketId === "visual.center"
      && handoff?.attachmentMode === "front-overlay"
      && same(handoff?.renderOrder, ["actor-body", "held-prop"])
      && handoff?.handForegroundMaskRequired === false
      && handoff?.foregroundMaskUses === 0
      && handoff?.visibleAlphaFailures === 0
      && handoff?.attachmentDeltaFailures === 0
      && handoff?.productEmbeddedInShell === false
      && handoff?.productEmbeddedInViewportFrames === false,
    "H01 output handoff is missing, stale, or socket-inexact",
  );
  add(
    Object.values(manifest.quality?.embeddedProductPixelsByFrame ?? {})
      .every((count) => count === 0)
      && manifest.quality?.visibleMagentaPixels === 0
      && manifest.quality?.machineProductRemovalPixelCount > 500
      && manifest.quality?.effectPixelCount > 0
      && manifest.quality?.attachmentDeltaFailures === 0,
    "Item-neutral machine or output quality checks failed",
  );

  const slot = manifest.interaction?.slot;
  add(
    manifest.interaction?.capacity === 1
      && manifest.interaction?.atomicReservation === true
      && manifest.interaction?.releaseOnFailure === true
      && same(slot?.stand, { x: 1, y: 1 })
      && same(slot?.approach, { x: 1, y: 2 })
      && same(slot?.exit, { x: 0, y: 2 })
      && slot?.visualPose === "interact-front",
    "U01-r03 interaction or reservation cells changed",
  );
  const roster = manifest.rosterValidation;
  add(
    roster?.poseAuthority?.manifest === actionPath
      && roster?.poseAuthority?.manifestSha256 === sha256(actionPath)
      && roster?.spatialAuthority?.manifest === spatialPath
      && roster?.spatialAuthority?.manifestSha256 === sha256(spatialPath)
      && roster?.heldPropAuthority?.manifest === heldPath
      && roster?.heldPropAuthority?.manifestSha256 === sha256(heldPath)
      && roster?.characterCount === 18
      && roster?.activeFrames === 6
      && roster?.validatedPoseCases === 108
      && roster?.visiblePropCases === 54
      && roster?.facilityOutputAttachmentCases === 18
      && roster?.actorHandAttachmentCases === 36
      && roster?.attachmentDeltaFailures === 0
      && roster?.frontOverlayCases === 36
      && roster?.foregroundMaskUses === 0
      && roster?.visibleAlphaFailures === 0
      && roster?.perCharacterFacilityScaling === false
      && roster?.perCharacterActorOffsets === false,
    "U01-r03 authority locks or 18x6 roster totals changed",
  );
  let poseCases = 0;
  for (const character of roster?.characters ?? []) {
    add(
      character.sha256 === sha256(character.sheet)
        && character.frames?.length === 6,
      `${character.id} source sheet or frame count changed`,
    );
    for (const [index, frame] of character.frames.entries()) {
      poseCases += 1;
      const parent = expectedParents[index];
      add(
        frame.frame === index
          && same(frame.actorPosition, [96, 96])
          && frame.actorInsideReviewCard === true
          && frame.attachmentParent === parent
          && frame.heldAssetVisible === (parent !== null)
          && (parent === null
            ? frame.attachmentDelta === null
            : same(frame.attachmentDelta, [0, 0]))
          && frame.foregroundMask === null
          && frame.foregroundMaskUsed === false
          && (parent === null
            ? frame.visiblePropAlphaFraction === null
            : frame.visiblePropAlphaFraction === 1)
          && (parent !== "actor.hand.primary.grip"
            || same(frame.renderOrder, ["actor-body", "held-prop"])),
        `${character.id} frame ${index} failed socket attachment`,
      );
    }
  }
  add(poseCases === 108 && actions.frameRecordCount === 108, "108 pose cases are incomplete");

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
      && reservation?.samples?.length === 31,
    "30-second contention, failure, or retry proof changed",
  );
  for (const [second, sample] of (reservation?.samples ?? []).entries()) {
    const occupied = Object.values(sample.actorCells ?? {})
      .filter((cell) => cell !== null)
      .map(JSON.stringify);
    add(
      sample.second === second && new Set(occupied).size === occupied.length,
      `Reservation sample ${second} contains a route collision`,
    );
  }

  const expectedReviews = [
    ["01-source-ownership.png", [1600, 1000]],
    ["02-alpha-parts.png", [1600, 1000]],
    ["03-clean-front.png", [1400, 900]],
    ["04-geometry-grid-routes.png", [1200, 950]],
    ["05-animation-viewport.png", [1600, 900]],
    ["06-output-handoff.png", [1500, 900]],
    ["07-roster-fit-18x6.png", [1800, 1220]],
    ["08-reservation-timeline-30s.png", [1600, 900]],
    ["09-socket-attachment-debug.png", [1800, 1220]],
    ["10-r02-r03-before-after.png", [1600, 1030]],
    ["11-three-character-six-frame-front-overlay.png", [2400, 1650]],
    ["12-three-character-hand-closeups-8x.png", [1800, 1480]],
  ].map(([name, size]) => [`${reviewRoot}/${name}`, size]);
  add(
    same(manifest.reviewOutputs, expectedReviews.map(([path]) => path)),
    "U01-r03 review output list changed",
  );
  for (const [index, [path, size]] of expectedReviews.entries()) {
    const evidence = manifest.reviewEvidence?.[index];
    add(
      fileHashMatches(path, evidence?.sha256, size)
        && evidence?.path === path
        && same(evidence?.size, size),
      `Review evidence is missing or stale: ${path}`,
    );
  }
  const expectedProcessed = [
    manifest.source.keyedSource.file,
    manifest.source.ownershipMask.file,
    ...manifest.source.frames.map(({ authoringCutout }) => authoringCutout),
    ...manifest.parts.flatMap(({ authoringFile, runtimeFile }) => [
      authoringFile,
      runtimeFile,
    ]),
    ...manifest.animation.frames.flatMap((frame) => [
      frame.authoringCompositeFile,
      frame.runtimeCompositeFile,
    ]),
  ].sort();
  add(same(files(processedRoot), expectedProcessed), "U01-r03 processed file set changed");
  add(
    same(files(reviewRoot), expectedReviews.map(([path]) => path).sort()),
    "U01-r03 review directory contains an unexpected file",
  );
  add(
    manifest.rejectedOrientations?.every((id) => {
      const decision = auditById.get(id)?.currentDecision;
      return decision?.decision === "reject-regenerate-orientation-if-required"
        && decision?.masterPixelsSalvageable === false;
    }),
    "Rejected left/right vending sources must remain blocked",
  );
  add(
    manifest.behaviorReference?.manifest === behaviorPath
      && manifest.behaviorReference?.manifestSha256 === sha256(behaviorPath)
      && manifest.behaviorReference?.pixelReuse === false,
    "Staging vending must remain behavior reference only",
  );
  const active = readText(activePath);
  add(
    manifest.activeOfficeBaseline?.file === activePath
      && manifest.activeOfficeBaseline?.sha256 === sha256(activePath)
      && manifest.activeOfficeBaseline?.importsCandidate === false
      && !active.includes("office-facility-family-v1")
      && !active.includes("vending-u01"),
    "Active Office imported U01-r03",
  );
  const builder = readText(builderPath);
  add(
    !builder.includes("processed/office-library-modern-bright-v1")
      && !builder.includes("office-interactions-v1/facility-overlays")
      && builder.includes("full-master-component-ownership")
      && builder.includes("office-held-props-h01.json"),
    "U01-r03 builder source isolation changed",
  );
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
}

if (failures.length) {
  process.stderr.write(`${failures.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    "Vending U01-r03 OK: audited front-only shell, exact I01/H01 front overlays "
      + "across 108 poses, 30-second capacity-one proof, F8 pending, "
      + "and Active Office unchanged.\n",
  );
}
