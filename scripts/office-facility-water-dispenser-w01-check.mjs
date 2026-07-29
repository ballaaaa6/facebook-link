import { validateOfficeFacilityProductionManifest } from "../packages/contracts/src/officeFacilityProduction.ts";
import {
  fileHashMatches,
  readJson,
  readText,
  recursiveFiles as files,
  same,
  sha256,
} from "./office-production-check-utils.mjs";
import { checkWaterSourceContract } from "./office-facility-water-dispenser-w01-source-check.mjs";

const manifestPath = "assets/game/manifests/office-facility-water-dispenser-w01.json";
const auditPath = "assets/game/manifests/office-furniture-master-audit-v1.json";
const actionPath = "assets/game/manifests/office-character-action-sockets-i01.json";
const heldPath = "assets/game/manifests/office-held-props-h01.json";
const spatialPath = "assets/game/manifests/office-spatial-authority-i01.json";
const behaviorPath = "assets/game/manifests/office-interaction-assets.json";
const activePath = "apps/web/src/features/office/components/officeAssetRegistry.ts";
const builderPath = "scripts/build-office-facility-water-dispenser-w01.py";
const sourcePath = "assets/art/layout-references/office-facility-water-dispenser-w01-source.png";
const processedRoot = "assets/game/processed/office-facility-family-v1/water-dispenser-w01";
const reviewRoot = "assets/art/layout-references/office-facility-family-v1/water-dispenser-w01";
const failures = [];
const add = (condition, message) => {
  if (!condition) failures.push(message);
};

try {
  const manifest = readJson(manifestPath);
  const audit = readJson(auditPath);
  const actions = readJson(actionPath);
  const held = readJson(heldPath);
  for (const issue of validateOfficeFacilityProductionManifest(manifest)) {
    failures.push(`Facility production contract: ${issue}`);
  }

  add(
    manifest.schemaVersion === 2
      && manifest.id === "office.facility.water-dispenser.w01"
      && manifest.familyId === "dispenser.water"
      && manifest.revision === "w01",
    "Water W01 identity changed",
  );
  add(
    manifest.status === "owner-approved"
      && manifest.ownerDecision?.decision === "approved"
      && manifest.ownerDecision?.decidedOn === "2026-07-29"
      && manifest.gates?.F8?.status === "passed"
      && manifest.gates?.F9?.status === "blocked"
      && manifest.gates?.F10?.status === "blocked"
      && manifest.permissions?.familyLab === true
      && manifest.permissions?.ownerReview === false
      && manifest.permissions?.otherFacilityFamilies === true
      && manifest.permissions?.furnitureOnlyRoom === false
      && manifest.permissions?.activeOfficePromotion === false
      && manifest.activeOfficePromotion === false,
    "Water W01 approval must unlock only the next isolated facility family",
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
    "Water W01 source policy or H01 dependency changed",
  );

  failures.push(...checkWaterSourceContract({
    manifest,
    audit,
    sourcePath,
    spatialPath,
  }));

  const expectedRoles = [
    "static-shell",
    "animation-viewport",
    "animation-viewport",
    "animation-viewport",
    "animation-viewport",
    "output-bay-empty",
    "effect-overlay",
    "effect-overlay",
    "held-output",
  ];
  add(
    same(manifest.parts?.map(({ role }) => role), expectedRoles),
    "Water W01 parts are not independently layered",
  );
  for (const part of manifest.parts ?? []) {
    const heldOutput = part.role === "held-output";
    add(
      fileHashMatches(
        part.authoringFile,
        part.authoringSha256,
        heldOutput ? [40, 40] : [1024, 2048],
      )
        && fileHashMatches(
          part.runtimeFile,
          part.runtimeSha256,
          heldOutput ? [20, 20] : [64, 128],
        ),
      `Water W01 part is missing or stale: ${part.id}`,
    );
  }

  const animation = manifest.animation;
  add(
    animation?.frameCount === 4
      && same(animation?.viewportBoundsAuthoring, [320, 736, 704, 1312])
      && same(animation?.viewportBoundsRuntime, [20, 46, 44, 82])
      && animation?.shellStableAcrossFrames === true
      && animation?.basePivotStableAcrossFrames === true
      && animation?.sortPivotStableAcrossFrames === true
      && animation?.outsideViewportChangedPixels === 0
      && same(animation?.frames?.map(({ id }) => id), ["a", "b", "c", "d"])
      && same(
        animation?.frames?.map(({ effectPartIds }) => effectPartIds.length),
        [0, 1, 2, 0],
      ),
    "Water W01 viewport locality or shell invariance changed",
  );
  for (const frame of animation?.frames ?? []) {
    add(
      fileHashMatches(
        frame.authoringCompositeFile,
        frame.authoringCompositeSha256,
        [1024, 2048],
      )
        && fileHashMatches(
          frame.runtimeCompositeFile,
          frame.runtimeCompositeSha256,
          [64, 128],
        ),
      `Water W01 animation composite is missing or stale: ${frame.id}`,
    );
  }

  const cup = held.props?.find(({ id }) => id === "held.water-cup-clear");
  const handoff = manifest.outputHandoff;
  const expectedParents = [
    null,
    null,
    "facility.output.primary",
    "actor.hand.primary.grip",
    "actor.hand.primary.grip",
    null,
  ];
  add(
    handoff?.emptyOutputPartId?.endsWith("output-bay-empty")
      && handoff?.pickupTrayPartId === undefined
      && handoff?.heldAssetManifest === heldPath
      && handoff?.heldAssetManifestSha256 === sha256(heldPath)
      && handoff?.heldAssetId === "held.water-cup-clear"
      && handoff?.heldAssetRuntimeSha256 === cup?.runtimeSha256
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
    "Water W01 H01 output handoff is missing, stale, or socket-inexact",
  );
  add(
    manifest.quality?.sourceComponentCount === 1
      && manifest.quality?.sourceTouchesCanvas === false
      && manifest.quality?.sourcePixelsResampled === false
      && manifest.quality?.runtimeVisibleAspectRatio >= 4
      && manifest.quality?.visibleMagentaPixels === 0
      && manifest.quality?.waterEffectPixelCount > 1000
      && manifest.quality?.emptyOutputPixelCount > 100000
      && manifest.quality?.attachmentDeltaFailures === 0,
    "Water W01 tall clean-source or output quality checks failed",
  );

  const slot = manifest.interaction?.slot;
  add(
    manifest.interaction?.capacity === 1
      && manifest.interaction?.atomicReservation === true
      && manifest.interaction?.releaseOnFailure === true
      && same(slot?.stand, { x: 0, y: 1 })
      && same(slot?.approach, { x: 0, y: 2 })
      && same(slot?.exit, { x: -1, y: 2 })
      && slot?.visualPose === "interact-front"
      && slot?.action === "use-water-dispenser",
    "Water W01 interaction or reservation cells changed",
  );
  const roster = manifest.rosterValidation;
  add(
    roster?.poseAuthority?.manifest === actionPath
      && roster?.poseAuthority?.manifestSha256 === sha256(actionPath)
      && roster?.poseAuthority?.status === "owner-approved"
      && roster?.spatialAuthority?.manifest === spatialPath
      && roster?.spatialAuthority?.manifestSha256 === sha256(spatialPath)
      && roster?.spatialAuthority?.status === "owner-approved"
      && roster?.heldPropAuthority?.manifest === heldPath
      && roster?.heldPropAuthority?.manifestSha256 === sha256(heldPath)
      && roster?.heldPropAuthority?.assetId === "held.water-cup-clear"
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
    "Water W01 authority locks or 18x6 roster totals changed",
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
          && same(frame.actorPosition, [96, 112])
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
        `${character.id} frame ${index} failed Water W01 socket attachment`,
      );
    }
  }
  add(
    poseCases === 108 && actions.frameRecordCount === 108,
    "Water W01 108 pose cases are incomplete",
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
      && reservation?.samples?.length === 31,
    "Water W01 contention, failure, or retry proof changed",
  );
  for (const [second, sample] of (reservation?.samples ?? []).entries()) {
    const occupied = Object.values(sample.actorCells ?? {})
      .filter((cell) => cell !== null)
      .map(JSON.stringify);
    add(
      sample.second === second && new Set(occupied).size === occupied.length,
      `Water W01 reservation sample ${second} contains a collision`,
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
    ["10-shell-stability-difference.png", [1600, 1030]],
    ["11-three-character-six-frame-front-overlay.png", [2400, 1650]],
    ["12-three-character-hand-closeups-8x.png", [1800, 1480]],
  ].map(([name, size]) => [`${reviewRoot}/${name}`, size]);
  add(
    same(manifest.reviewOutputs, expectedReviews.map(([path]) => path)),
    "Water W01 review output list changed",
  );
  for (const [index, [path, size]] of expectedReviews.entries()) {
    const evidence = manifest.reviewEvidence?.[index];
    add(
      fileHashMatches(path, evidence?.sha256, size)
        && evidence?.path === path
        && same(evidence?.size, size),
      `Water W01 review evidence is missing or stale: ${path}`,
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
  add(
    same(files(processedRoot), expectedProcessed),
    "Water W01 processed file set changed",
  );
  add(
    same(files(reviewRoot), expectedReviews.map(([path]) => path).sort()),
    "Water W01 review directory contains an unexpected file",
  );
  add(
    manifest.behaviorReference?.manifest === behaviorPath
      && manifest.behaviorReference?.manifestSha256 === sha256(behaviorPath)
      && manifest.behaviorReference?.pixelReuse === false,
    "Water W01 behavior reference changed",
  );
  const active = readText(activePath);
  add(
    manifest.activeOfficeBaseline?.file === activePath
      && manifest.activeOfficeBaseline?.sha256 === sha256(activePath)
      && manifest.activeOfficeBaseline?.importsCandidate === false
      && !active.includes("water-dispenser-w01")
      && !active.includes("office-facility-water-dispenser"),
    "Active Office imported Water W01",
  );
  const builder = readText(builderPath);
  add(
    !builder.includes("processed/review-facility-completion-v1")
      && !builder.includes("dispenser.water.neutral.a.png")
      && builder.includes("generated-source-chroma-key")
      && builder.includes("office-held-props-h01.json"),
    "Water W01 builder source isolation changed",
  );
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
}

if (failures.length) {
  process.stderr.write(`${failures.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    "Water W01 OK: tall generated clean source, 1x1x4 geometry, local water "
      + "overlays, exact I01/H01 front overlays across 108 poses, 30-second "
      + "capacity-one proof, F8 approved, and Active Office unchanged.\n",
  );
}
