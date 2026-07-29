import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { validateOfficeFacilityProductionManifest } from "../packages/contracts/src/officeFacilityProduction.ts";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = "assets/game/manifests/office-facility-vending-u01.json";
const auditPath = "assets/game/manifests/office-furniture-master-audit-v1.json";
const poseAuthorityPath =
  "assets/game/manifests/office-facility-interact-front-pose-authority-v1.json";
const behaviorReferencePath = "assets/game/manifests/office-interaction-assets.json";
const activeRegistryPath = "apps/web/src/features/office/components/officeAssetRegistry.ts";
const builderPath = "scripts/build-office-facility-vending-u01.py";
const processedRoot =
  "assets/game/processed/office-facility-family-v1/vending-u01";
const reviewRoot =
  "assets/art/layout-references/office-facility-family-v1/vending-u01";
const sourcePath =
  "assets/art/layout-references/mechanical-loops-sheet-modern-bright-v1-source.png";
const failures = [], readJson = (path) => JSON.parse(readFileSync(join(root, path), "utf8"));
const sha256 = (path) => {
  const bytes = readFileSync(join(root, path));
  const value = /\.(json|md|mjs|py|ts)$/.test(path) ? Buffer.from(
    bytes.toString("utf8").replaceAll("\r\n", "\n"), "utf8",
  ) : bytes;
  return createHash("sha256").update(value).digest("hex");
};
const add = (condition, message) => {
  if (!condition) failures.push(message);
};
const pngSize = (path) => {
  const bytes = readFileSync(join(root, path));
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (!bytes.subarray(0, 8).equals(signature)) {
    throw new Error(`Not a PNG: ${path}`);
  }
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
};
const recursiveFiles = (directory) => existsSync(join(root, directory))
  ? readdirSync(join(root, directory), { recursive: true })
    .filter((entry) => statSync(join(root, directory, entry)).isFile())
    .map((entry) => join(directory, entry).replaceAll("\\", "/"))
    .sort()
  : [];
const same = (first, second) => JSON.stringify(first) === JSON.stringify(second);
try {
  const manifest = readJson(manifestPath);
  const audit = readJson(auditPath);
  const poseAuthority = readJson(poseAuthorityPath);
  for (const issue of validateOfficeFacilityProductionManifest(manifest)) {
    failures.push(`Facility production contract: ${issue}`);
  }
  add(
    manifest.id === "office.facility.vending-machine.u01"
      && manifest.familyId === "vending.machine.modern"
      && manifest.revision === "u01",
    "Vending U01 identity changed",
  );
  add(
    manifest.status === "owner-review-f8-pending"
      && manifest.ownerDecision === null
      && manifest.developmentOnly === true
      && manifest.activeOfficePromotion === false
      && manifest.gates?.F8?.status === "pending-owner-review"
      && manifest.gates?.F9?.status === "blocked"
      && manifest.gates?.F10?.status === "blocked",
    "U01 must stop at independent F8 owner review",
  );
  add(
    Object.values(manifest.sourcePolicy ?? {}).every((value) => value === false),
    "Every U01 source-policy exception must remain disabled",
  );
  const recordPrefix =
    "modern-bright-library-v1:env-07-animated-mechanical:vending.machine.loop.";
  const expectedFrames = {
    a: { recordId: `${recordPrefix}a`, sourceBounds: [0, 0, 314, 314], ownedBounds: [72, 47, 272, 322], selectedPixelCount: 52209 },
    b: { recordId: `${recordPrefix}b`, sourceBounds: [314, 0, 627, 314], ownedBounds: [375, 47, 574, 322], selectedPixelCount: 51759 },
    c: { recordId: `${recordPrefix}c`, sourceBounds: [627, 0, 940, 314], ownedBounds: [678, 47, 878, 322], selectedPixelCount: 51748 },
    d: { recordId: `${recordPrefix}d`, sourceBounds: [940, 0, 1254, 314], ownedBounds: [981, 47, 1180, 322], selectedPixelCount: 51743 },
  };
  add(
    manifest.source?.kind === "audited-original-mechanical-loop-master"
      && manifest.source?.path === sourcePath
      && manifest.source?.sha256 === sha256(sourcePath)
      && manifest.source?.extractionMethod === "full-master-component-ownership"
      && manifest.source?.frames?.length === 4,
    "U01 must start from the exact audited original mechanical-loop master",
  );
  const auditById = new Map(
    audit.records?.map((record) => [record.recordId, record]),
  );
  for (const frame of manifest.source?.frames ?? []) {
    const expected = expectedFrames[frame.frameId];
    const record = auditById.get(frame.auditRecordId);
    add(Boolean(expected), `Unexpected source frame ${frame.frameId}`);
    if (!expected) continue;
    add(
      frame.auditRecordId === expected.recordId
        && same(frame.sourceBounds, expected.sourceBounds)
        && same(frame.ownedBounds, expected.ownedBounds)
        && frame.selectedComponentCount === 1
        && frame.selectedPixelCount === expected.selectedPixelCount
        && frame.touchesNominalCellBoundary === true
        && frame.touchesMasterBoundary === false
        && frame.sourcePixelsResampled === false
        && frame.boundaryReview?.status === "passed-complete-silhouette",
      `Frame ${frame.frameId} full-master ownership changed`,
    );
    add(
      record?.sourcePath === sourcePath
        && record?.sourceSha256 === manifest.source.sha256
        && record?.orientation === "front"
        && record?.animationFrame === frame.frameId
        && record?.currentDecision?.decision
          === "salvage-full-master-and-decompose"
        && record?.currentDecision?.masterPixelsSalvageable === true,
      `Audit no longer permits frame ${frame.frameId}`,
    );
    add(
      existsSync(join(root, frame.authoringCutout))
        && frame.authoringCutoutSha256 === sha256(frame.authoringCutout)
        && same(pngSize(frame.authoringCutout), [256, 384]),
      `Frame ${frame.frameId} cutout is missing or stale`,
    );
  }
  for (const field of ["keyedSource", "ownershipMask"]) {
    const evidence = manifest.source?.[field];
    add(
      existsSync(join(root, evidence?.file ?? ""))
        && evidence?.sha256 === sha256(evidence.file)
        && same(pngSize(evidence.file), [1254, 1254]),
      `${field} evidence is missing or stale`,
    );
  }
  add(
    same(manifest.render?.authoringCanvas, [256, 384])
      && same(manifest.render?.runtimeCanvas, [64, 96])
      && manifest.render?.uniformIntegerDivisor === 4
      && manifest.render?.nonUniformScaling === false
      && manifest.render?.anchor === "bottom-center"
      && same(manifest.render?.requiredOrientations, ["front"]),
    "U01 render contract must remain front-only 64x96 with uniform 4:1 scale",
  );
  add(
    same(manifest.geometry?.physicalScale, {
      width: 2, depth: 1, height: 3, unit: "tile",
    })
      && same(manifest.geometry?.footprint, {
        width: 2, depth: 1, unit: "tile",
      })
      && same(manifest.geometry?.basePivot, { x: 1, y: 1, unit: "tile" })
      && same(manifest.geometry?.sortPivot, { x: 1, y: 1, unit: "tile" })
      && same(manifest.geometry?.renderBounds, {
        width: 64, height: 96, unit: "authoring-pixel",
      })
      && manifest.geometry?.assetType === "animated-shell"
      && manifest.geometry?.orientation === "front"
      && manifest.geometry?.animation?.frameCount === 4,
    "U01 physical, footprint, pivot, or animation geometry changed",
  );
  const expectedPartRoles = [
    "static-shell",
    "animation-viewport",
    "animation-viewport",
    "animation-viewport",
    "animation-viewport",
    "pickup-tray-empty",
    "effect-overlay",
    "held-output",
  ];
  add(
    same(manifest.parts?.map(({ role }) => role), expectedPartRoles),
    "U01 must keep shell, four viewports, empty tray, effect, and held output separate",
  );
  for (const part of manifest.parts ?? []) {
    for (const [path, expectedHash, size] of [
      [part.authoringFile, part.authoringSha256, [256, 384]],
      [part.runtimeFile, part.runtimeSha256, [64, 96]],
    ]) {
      add(existsSync(join(root, path)), `Missing U01 part: ${path}`);
      if (!existsSync(join(root, path))) continue;
      add(sha256(path) === expectedHash, `Hash mismatch: ${path}`);
      add(same(pngSize(path), size), `Size mismatch: ${path}`);
    }
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
      && same(animation?.frames?.map(({ effectPartIds }) => effectPartIds.length), [0, 0, 1, 0]),
    "Four-frame viewport locality or shell/pivot invariance changed",
  );
  for (const frame of animation?.frames ?? []) {
    for (const [path, expectedHash, size] of [
      [frame.authoringCompositeFile, frame.authoringCompositeSha256, [256, 384]],
      [frame.runtimeCompositeFile, frame.runtimeCompositeSha256, [64, 96]],
    ]) {
      add(
        existsSync(join(root, path))
          && sha256(path) === expectedHash
          && same(pngSize(path), size),
        `Animation composite is missing or stale: ${path}`,
      );
    }
  }
  add(
    manifest.outputHandoff?.productEmbeddedInShell === false
      && manifest.outputHandoff?.productEmbeddedInViewportFrames === false
      && manifest.outputHandoff?.transition === "pickup-tray-to-held-prop-layer"
      && same(manifest.outputHandoff?.heldVisiblePoseFrames, [2, 3, 4])
      && Object.values(manifest.quality?.embeddedProductPixelsByFrame ?? {})
        .every((count) => count === 0)
      && manifest.quality?.visibleMagentaPixels === 0
      && manifest.quality?.heldProductPixelCount > 500
      && manifest.quality?.effectPixelCount > 0,
    "Neutral tray, effect, or held-output separation failed",
  );
  const slot = manifest.interaction?.slot;
  add(
    manifest.interaction?.capacity === 1
      && manifest.interaction?.atomicReservation === true
      && manifest.interaction?.releaseOnFailure === true
      && same(manifest.interaction?.states, [
        "available",
        "reserved",
        "approaching",
        "interacting",
        "dispensing",
        "releasing",
      ])
      && same(slot?.stand, { x: 1, y: 1 })
      && same(slot?.approach, { x: 1, y: 2 })
      && same(slot?.exit, { x: 0, y: 2 })
      && slot?.facing === "front"
      && slot?.action === "use-vending-machine"
      && slot?.visualPose === "interact-front"
      && slot?.action !== slot?.visualPose,
    "U01 interaction cells, states, or semantic action changed",
  );
  const roster = manifest.rosterValidation;
  add(
    roster?.poseAuthority?.manifest === poseAuthorityPath
      && roster?.poseAuthority?.manifestSha256 === sha256(poseAuthorityPath)
      && roster?.poseAuthority?.status === "frozen-prototype-internal"
      && roster?.poseAuthority?.activeOfficeImported === false
      && poseAuthority?.pendingCommercialReview === true
      && poseAuthority?.activeOfficeImported === false,
    "Interact-front authority is missing, stale, or over-promoted",
  );
  add(
    roster?.row === 10
      && roster?.activeFrames === 6
      && roster?.characterCount === 18
      && roster?.validatedPoseCases === 108
      && roster?.perCharacterFacilityScaling === false
      && roster?.perCharacterActorOffsets === false
      && same(roster?.sharedActorPosition, [96, 96])
      && roster?.characters?.length === 18
      && poseAuthority?.poseCaseCount === 108,
    "Roster validation must cover 18 actors x 6 frames without offsets",
  );
  const characterIds = new Set();
  let poseCases = 0;
  for (const character of roster?.characters ?? []) {
    characterIds.add(character.id);
    add(
      character.sha256 === sha256(character.sheet)
        && character.frames?.length === 6,
      `${character.id} sheet or frame count changed`,
    );
    for (const [frameIndex, frame] of character.frames.entries()) {
      poseCases += 1;
      add(
        frame.frame === frameIndex
          && same(frame.actorPosition, [96, 96])
          && frame.actorInsideReviewCard === true
          && frame.heldAssetVisible === [2, 3, 4].includes(frameIndex),
        `${character.id} frame ${frameIndex} failed interact-front fit`,
      );
    }
  }
  add(characterIds.size === 18 && poseCases === 108, "The 108 pose cases are incomplete");
  const reservation = manifest.reservationValidation;
  add(
    reservation?.durationSeconds === 30
      && reservation?.actorCount === 2
      && reservation?.maximumConcurrentReservations === 1
      && reservation?.collisionCount === 0
      && reservation?.blockedAttemptCount === 1
      && reservation?.failureCount === 1
      && reservation?.retrySuccessCount === 1
      && reservation?.failureReleaseSecond === 7
      && reservation?.retryAcquireSecond === 17
      && reservation?.releasedAtEnd === true
      && reservation?.samples?.length === 31,
    "The 30-second contention/failure/retry proof changed",
  );
  for (const [second, sample] of (reservation?.samples ?? []).entries()) {
    const cells = Object.values(sample.actorCells ?? {})
      .filter((cell) => cell !== null)
      .map((cell) => JSON.stringify(cell));
    add(
      sample.second === second
        && new Set(cells).size === cells.length,
      `Reservation sample ${second} contains a route collision`,
    );
  }
  add(
    reservation?.samples?.[2]?.heldBy === "agent-alpha"
      && reservation?.samples?.[2]?.actorStates?.["agent-beta"] === "blocked"
      && reservation?.samples?.[7]?.heldBy === null
      && reservation?.samples?.[8]?.heldBy === "agent-beta"
      && reservation?.samples?.[17]?.heldBy === "agent-alpha"
      && reservation?.samples?.[30]?.heldBy === null,
    "Atomic wait, failure release, or retry samples changed",
  );
  const expectedReviews = [
    ["01-source-ownership.png", [1600, 1000]],
    ["02-alpha-parts.png", [1600, 1000]],
    ["03-clean-front.png", [1400, 900]],
    ["04-geometry-grid-routes.png", [1200, 950]],
    ["05-animation-viewport.png", [1600, 900]],
    ["06-output-handoff.png", [1500, 900]],
    ["07-roster-fit-18x6.png", [1800, 1220]],
    ["08-reservation-timeline-30s.png", [1600, 900]],
  ].map(([name, size]) => [`${reviewRoot}/${name}`, size]);
  add(
    same(manifest.reviewOutputs, expectedReviews.map(([path]) => path)),
    "U01 review-output list changed",
  );
  for (const [index, [path, size]] of expectedReviews.entries()) {
    const evidence = manifest.reviewEvidence?.[index];
    add(existsSync(join(root, path)), `Missing U01 review board: ${path}`);
    if (!existsSync(join(root, path))) continue;
    add(
      same(pngSize(path), size)
        && evidence?.path === path
        && evidence?.sha256 === sha256(path)
        && same(evidence?.size, size),
      `Review evidence mismatch: ${path}`,
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
    same(recursiveFiles(processedRoot), expectedProcessed),
    "U01 processed directory contains missing or unexpected files",
  );
  add(
    same(recursiveFiles(reviewRoot), expectedReviews.map(([path]) => path).sort()),
    "U01 review directory contains missing or unexpected files",
  );
  const sideDecisions = manifest.rejectedOrientations?.map(
    (id) => auditById.get(id)?.currentDecision,
  );
  add(
    sideDecisions?.length === 2
      && sideDecisions.every(
        (decision) => decision?.decision
          === "reject-regenerate-orientation-if-required"
          && decision?.masterPixelsSalvageable === false,
      ),
    "Rejected vending side sources must remain blocked",
  );
  add(
    manifest.behaviorReference?.manifest === behaviorReferencePath
      && manifest.behaviorReference?.manifestSha256 === sha256(behaviorReferencePath)
      && manifest.behaviorReference?.purpose === "behavior-and-state-reference-only"
      && manifest.behaviorReference?.pixelReuse === false,
    "Staging vending may be used only as a behavior reference",
  );
  const activeRegistry = readFileSync(join(root, activeRegistryPath), "utf8");
  add(
    manifest.activeOfficeBaseline?.file === activeRegistryPath
      && manifest.activeOfficeBaseline?.sha256 === sha256(activeRegistryPath)
      && manifest.activeOfficeBaseline?.importsCandidate === false
      && !activeRegistry.includes("office-facility-family-v1")
      && !activeRegistry.includes("vending-u01"),
    "Active Office imported U01",
  );
  const builder = readFileSync(join(root, builderPath), "utf8");
  add(
    !builder.includes("processed/office-library-modern-bright-v1")
      && !builder.includes("office-interactions-v1/facility-overlays")
      && builder.includes("full-master-component-ownership")
      && builder.includes("stagingPixelReuse"),
    "U01 builder must re-extract the original master without processed pixels",
  );
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
}
if (failures.length > 0) {
  process.stderr.write(`${failures.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    "Vending U01 OK: four audited full-master components, 2x1x3 front-only "
      + "geometry, static shell/local viewport, separate empty tray/effect/"
      + "held output, 108 interact-front cases, 30-second contention proof, "
      + "F8 pending, and Active Office unchanged.\n",
  );
}
