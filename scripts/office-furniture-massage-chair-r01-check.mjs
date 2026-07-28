import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  validateOfficeFurnitureFamilyManifest,
} from "../packages/contracts/src/officeFurnitureProduction.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = "assets/game/manifests/office-furniture-chair-massage-r01.json";
const auditPath = "assets/game/manifests/office-furniture-master-audit-v1.json";
const processedRoot = "assets/game/processed/office-furniture-family-v1/chair-massage-r01";
const reviewRoot = "assets/art/layout-references/office-furniture-family-v1/chair-massage-r01";
const activeRegistryPath = "apps/web/src/features/office/components/officeAssetRegistry.ts";
const failures = [];

const readJson = (path) => JSON.parse(readFileSync(join(root, path), "utf8"));
const sha256 = (path) => createHash("sha256")
  .update(readFileSync(join(root, path)))
  .digest("hex");
const add = (condition, message) => {
  if (!condition) failures.push(message);
};
const recursiveFiles = (directory) => existsSync(join(root, directory))
  ? readdirSync(join(root, directory), { recursive: true })
    .filter((entry) => statSync(join(root, directory, entry)).isFile())
    .map((entry) => join(directory, entry).replaceAll("\\", "/"))
    .sort()
  : [];
const pngSize = (path) => {
  const bytes = readFileSync(join(root, path));
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (!bytes.subarray(0, 8).equals(signature)) {
    throw new Error(`Not a PNG: ${path}`);
  }
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
};

try {
  const manifest = readJson(manifestPath);
  const audit = readJson(auditPath);
  for (const issue of validateOfficeFurnitureFamilyManifest(manifest)) {
    failures.push(`Furniture production contract: ${issue}`);
  }

  add(
    manifest.id === "office.furniture.chair-massage.r01"
      && manifest.familyId === "chair.massage.modern"
      && manifest.revision === "r01",
    "Massage-chair R01 identity changed",
  );
  add(
    manifest.status === "owner-review-f8-pending"
      && manifest.ownerDecision === null
      && manifest.developmentOnly === true
      && manifest.activeOfficePromotion === false,
    "Massage-chair R01 must remain isolated while F8 is pending",
  );

  const sourceRecord = audit.records?.find(
    ({ recordId }) => recordId === manifest.source?.auditRecordId,
  );
  add(Boolean(sourceRecord), "The source audit record is missing");
  add(
    sourceRecord?.recordId
      === "modern-bright-library-v1:env-05-facility-lounge:chair.massage.modern"
      && sourceRecord?.currentDecision?.decision
      === "salvage-full-master-and-decompose"
      && sourceRecord?.sourcePath === manifest.source?.path,
    "The master audit no longer permits this exact massage-chair source",
  );
  add(
    manifest.source?.sha256 === sha256(manifest.source?.path),
    "The original massage-chair master hash changed",
  );
  add(
    manifest.source?.path
      === "assets/art/layout-references/facility-lounge-sheet-modern-bright-v1-source.png"
      && !manifest.source.path.includes("/processed/"),
    "R01 must start from the original full master",
  );
  add(
    JSON.stringify(manifest.source?.sourceBounds) === JSON.stringify([0, 627, 314, 940])
      && JSON.stringify(manifest.source?.ownedBounds) === JSON.stringify([68, 661, 242, 930])
      && manifest.source?.extraction?.selectedComponentCount === 1
      && manifest.source?.extraction?.selectedPixelCount === 41388
      && manifest.source?.extraction?.discardedComponentCount === 22,
    "Full-master component-ownership evidence changed",
  );
  add(
    manifest.source?.extraction?.touchesNominalCellBoundary === false
      && manifest.source?.extraction?.touchesMasterBoundary === false
      && manifest.source?.extraction?.sourcePixelsResampled === false
      && JSON.stringify(manifest.source?.extraction?.padding)
      === JSON.stringify({ left: 9, top: 9, right: 9, bottom: 10 }),
    "Source isolation, padding, or no-resample evidence failed",
  );

  add(
    JSON.stringify(manifest.render?.authoringCanvas) === JSON.stringify([192, 288])
      && JSON.stringify(manifest.render?.runtimeCanvas) === JSON.stringify([64, 96])
      && manifest.render?.uniformIntegerDivisor === 3
      && manifest.render?.nonUniformScaling === false,
    "Massage-chair render scale must remain uniformly 3:1",
  );
  add(
    JSON.stringify(manifest.geometry?.physicalScale)
      === JSON.stringify({ width: 2, depth: 2, height: 2, unit: "tile" })
      && JSON.stringify(manifest.geometry?.footprint)
      === JSON.stringify({ width: 2, depth: 2, unit: "tile" })
      && JSON.stringify(manifest.geometry?.renderBounds)
      === JSON.stringify({ width: 64, height: 96, unit: "authoring-pixel" }),
    "Physical scale, footprint, and render bounds must remain separate",
  );
  add(
    JSON.stringify(manifest.geometry?.basePivot)
      === JSON.stringify({ x: 1, y: 2, unit: "tile" })
      && JSON.stringify(manifest.geometry?.sortPivot)
      === JSON.stringify({ x: 1, y: 2, unit: "tile" })
      && JSON.stringify(manifest.geometry?.renderOffset)
      === JSON.stringify({ x: -32, y: -96, unit: "authoring-pixel" }),
    "Base, sort, or render anchors changed",
  );

  const expectedParts = {
    shell: [
      `${processedRoot}/authoring/chair.massage.modern.r01.shell.png`,
      `${processedRoot}/runtime/chair.massage.modern.r01.shell.png`,
    ],
    rear: [
      `${processedRoot}/authoring/chair.massage.modern.r01.rear.png`,
      `${processedRoot}/runtime/chair.massage.modern.r01.rear.png`,
    ],
    foreground: [
      `${processedRoot}/authoring/chair.massage.modern.r01.foreground.png`,
      `${processedRoot}/runtime/chair.massage.modern.r01.foreground.png`,
    ],
  };
  add(
    JSON.stringify(manifest.parts?.map(({ role }) => role))
      === JSON.stringify(["shell", "rear", "foreground"]),
    "R01 must contain shell, rear, and foreground parts",
  );
  for (const part of manifest.parts ?? []) {
    const paths = expectedParts[part.role];
    add(
      paths?.[0] === part.authoringFile && paths?.[1] === part.runtimeFile,
      `${part.role} paths changed`,
    );
    for (const [path, expectedHash, size] of [
      [part.authoringFile, part.authoringSha256, [192, 288]],
      [part.runtimeFile, part.runtimeSha256, [64, 96]],
    ]) {
      add(existsSync(join(root, path)), `Missing part: ${path}`);
      if (!existsSync(join(root, path))) continue;
      add(sha256(path) === expectedHash, `Hash mismatch: ${path}`);
      add(JSON.stringify(pngSize(path)) === JSON.stringify(size), `Size mismatch: ${path}`);
    }
  }
  const ownershipPath = `${processedRoot}/authoring/chair.massage.modern.r01.ownership-mask.png`;
  add(
    manifest.partEvidence?.ownershipMask?.path === ownershipPath
      && manifest.partEvidence?.ownershipMask?.sha256 === sha256(ownershipPath)
      && JSON.stringify(pngSize(ownershipPath)) === JSON.stringify([192, 288]),
    "Ownership mask is missing or stale",
  );
  add(
    manifest.partEvidence?.authoringRecompositionPixelExact === true
      && manifest.partEvidence?.runtimeRecompositionPixelExact === true
      && manifest.quality?.visibleMagentaPixels === 0,
    "Layer recomposition or chroma contamination proof failed",
  );

  const slot = manifest.interaction?.slots?.[0];
  add(
    manifest.interaction?.capacity === 1
      && manifest.interaction?.atomicReservation === true
      && manifest.interaction?.releaseOnFailure === true
      && JSON.stringify(slot?.seat) === JSON.stringify({ x: 1, y: 1 })
      && JSON.stringify(slot?.approach) === JSON.stringify({ x: 1, y: 2 })
      && JSON.stringify(slot?.exit) === JSON.stringify({ x: 1, y: 3 }),
    "Seat, approach, exit, or reservation contract changed",
  );
  add(
    JSON.stringify(slot?.chairSeatAnchorRuntimePixel) === JSON.stringify([32, 50])
      && JSON.stringify(slot?.actorContactRuntimePixel) === JSON.stringify([48, 75])
      && slot?.action === "lounge-front",
    "Chair-to-actor socket changed",
  );

  const characters = manifest.rosterValidation?.characters ?? [];
  add(
    manifest.rosterValidation?.row === 12
      && manifest.rosterValidation?.activeFrames === 6
      && manifest.rosterValidation?.characterCount === 18
      && manifest.rosterValidation?.perCharacterFurnitureScaling === false
      && manifest.rosterValidation?.perCharacterSeatOffsets === false
      && characters.length === 18,
    "Roster validation must cover eighteen actors with one scale and socket",
  );
  const characterIds = new Set();
  let validatedFrames = 0;
  let minimumOverlap = Number.POSITIVE_INFINITY;
  for (const character of characters) {
    add(!characterIds.has(character.id), `Duplicate character: ${character.id}`);
    characterIds.add(character.id);
    add(character.sha256 === sha256(character.sheet), `${character.id} staging sheet changed`);
    add(character.frames?.length === 6, `${character.id} must validate six lounge frames`);
    for (const [frameIndex, frame] of (character.frames ?? []).entries()) {
      validatedFrames += 1;
      minimumOverlap = Math.min(minimumOverlap, frame.foregroundOverlapPixels);
      add(
        frame.frame === frameIndex
          && frame.actorInsideReviewCard === true
          && frame.foregroundOverlapPixels > 0,
        `${character.id} frame ${frameIndex} failed the seat lab`,
      );
    }
  }
  add(
    validatedFrames === 108
      && manifest.quality?.validatedCharacterFrames === 108
      && manifest.quality?.minimumForegroundOverlapPixels === minimumOverlap
      && minimumOverlap > 0,
    "The 108-frame roster proof is incomplete",
  );

  const reservation = manifest.reservationValidation;
  const visits = reservation?.visits ?? [];
  const samples = reservation?.samples ?? [];
  add(
    reservation?.durationSeconds === 30
      && reservation?.actorCount === 2
      && reservation?.maximumConcurrentReservations === 1
      && reservation?.collisionCount === 0
      && reservation?.releasedAtEnd === true
      && samples.length === 31,
    "The 30-second reservation proof failed",
  );
  for (const [second, sample] of samples.entries()) {
    const holders = visits.filter(
      ({ acquiredAt, releaseUntil }) => second >= acquiredAt && second < releaseUntil,
    );
    const expected = holders.length === 1 ? holders[0].actorId : null;
    add(
      sample.second === second
        && holders.length <= 1
        && sample.heldBy === expected,
      `Reservation sample ${second} is inconsistent`,
    );
  }

  const expectedReviews = [
    ["01-source-ownership.png", [1600, 1000]],
    ["02-alpha-parts.png", [1600, 1000]],
    ["03-geometry-grid.png", [1200, 1000]],
    ["04-six-frame-seat-lab.png", [1600, 1000]],
    ["05-roster-fit.png", [1600, 900]],
    ["06-reservation-timeline.png", [1600, 900]],
  ].map(([name, size]) => [`${reviewRoot}/${name}`, size]);
  add(
    JSON.stringify(manifest.reviewOutputs)
      === JSON.stringify(expectedReviews.map(([path]) => path)),
    "Review output list changed",
  );
  for (const [index, [path, size]] of expectedReviews.entries()) {
    const evidence = manifest.reviewEvidence?.[index];
    add(existsSync(join(root, path)), `Missing review board: ${path}`);
    if (!existsSync(join(root, path))) continue;
    add(
      JSON.stringify(pngSize(path)) === JSON.stringify(size)
        && evidence?.path === path
        && evidence?.sha256 === sha256(path)
        && JSON.stringify(evidence?.size) === JSON.stringify(size),
      `Review evidence mismatch: ${path}`,
    );
  }

  const expectedProcessedFiles = [
    ...Object.values(expectedParts).flat(),
    ownershipPath,
  ].sort();
  add(
    JSON.stringify(recursiveFiles(processedRoot))
      === JSON.stringify(expectedProcessedFiles),
    "Processed R01 directory contains missing or unexpected files",
  );
  add(
    JSON.stringify(recursiveFiles(reviewRoot))
      === JSON.stringify(expectedReviews.map(([path]) => path).sort()),
    "R01 review directory contains missing or unexpected files",
  );

  const sideRecords = new Map(
    audit.records
      ?.filter(({ recordId }) => manifest.rejectedOrientations?.includes(recordId))
      .map((record) => [record.recordId, record.currentDecision?.decision]),
  );
  add(
    sideRecords.size === 2
      && [...sideRecords.values()].every(
        (decision) => decision === "reject-regenerate-orientation-if-required",
      ),
    "Rejected left/right chair sources must remain blocked",
  );

  const activeRegistry = readFileSync(join(root, activeRegistryPath), "utf8");
  add(
    manifest.activeOfficeBaseline?.file === activeRegistryPath
      && manifest.activeOfficeBaseline?.sha256 === sha256(activeRegistryPath)
      && manifest.activeOfficeBaseline?.importsCandidate === false
      && !activeRegistry.includes("office-furniture-family-v1")
      && !activeRegistry.includes("chair-massage-r01"),
    "Active Office imported the F8-pending massage-chair candidate",
  );
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
}

if (failures.length > 0) {
  process.stderr.write(`${failures.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    "Massage chair R01 OK: audited full-master component, exact 3:1 scale, "
      + "pixel-exact layers, 108 roster frames, 30-second reservation proof, "
      + "F8 pending, and Active Office unchanged.\n",
  );
}
