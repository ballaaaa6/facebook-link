import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { validateOfficeFurnitureFamilyManifest } from "../packages/contracts/src/officeFurnitureProduction.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const batchPath = "assets/game/manifests/office-furniture-seating-s01.json";
const auditPath = "assets/game/manifests/office-furniture-master-audit-v1.json";
const posePath = "assets/game/manifests/office-character-seat-sockets-v1.json";
const r05Path = "assets/game/manifests/office-workstation-step5-r05-r02.json";
const activePath = "apps/web/src/features/office/components/officeAssetRegistry.ts";
const processedRoot = "assets/game/processed/office-furniture-family-v1/seating-s01";
const reviewRoot = "assets/art/layout-references/office-furniture-family-v1/seating-s01";
const failures = [];

const expected = [
  ["chair.reading", "chair-reading-r01", "office-furniture-chair-reading-r01.json", 1, 108, ["front"]],
  ["pouf.lounge", "pouf-lounge-r01", "office-furniture-pouf-lounge-r01.json", 1, 108, ["front"]],
  ["beanbag.lounge", "beanbag-lounge-r01", "office-furniture-beanbag-lounge-r01.json", 1, 108, ["front"]],
  ["stool.side", "stool-side-r01", "office-furniture-stool-side-r01.json", 1, 108, ["front"]],
  ["sofa.modern.two-seat", "sofa-modern-two-seat-r01", "office-furniture-sofa-modern-two-seat-r01.json", 2, 216, ["front"]],
  ["sofa.modern.three-seat", "sofa-modern-three-seat-r01", "office-furniture-sofa-modern-three-seat-r01.json", 3, 324, ["front"]],
  ["table.review.long.modern", "table-review-long-r01", "office-furniture-table-review-long-r01.json", 4, 432, ["back", "front"]],
];

const add = (condition, message) => {
  if (!condition) failures.push(message);
};
const readJson = (path) => JSON.parse(readFileSync(join(root, path), "utf8"));
const sha256 = (path) => createHash("sha256")
  .update(readFileSync(join(root, path)))
  .digest("hex");
const recursiveFiles = (directory) => existsSync(join(root, directory))
  ? readdirSync(join(root, directory), { recursive: true })
    .filter((entry) => statSync(join(root, directory, entry)).isFile())
    .map((entry) => join(directory, entry).replaceAll("\\", "/"))
    .sort()
  : [];
const pngSize = (path) => {
  const bytes = readFileSync(join(root, path));
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (!bytes.subarray(0, 8).equals(signature)) throw new Error(`Not PNG: ${path}`);
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
};

try {
  const batch = readJson(batchPath);
  const audit = readJson(auditPath);
  const pose = readJson(posePath);
  const r05 = readJson(r05Path);
  const authorityEntries = (pose.entries ?? [])
    .filter(({ seatCapability }) => seatCapability === "working-seated");
  const authorityBySlug = new Map(
    authorityEntries.map((entry) => [entry.slug, entry]),
  );

  add(
    batch.id === "office-furniture-seating-s01"
      && batch.status === "owner-review-f8-pending"
      && batch.familyCount === 7
      && batch.candidateSeatCapacity === 13
      && batch.existingApprovedMassageChairCapacity === 1
      && batch.validatedSeatFrameCases === 1404,
    "Seating S01 batch totals changed",
  );
  add(
    batch.productionPolicy?.sharedBatchTooling === true
      && batch.productionPolicy?.perFamilyF8Decision === true
      && batch.productionPolicy?.imageGenerationUsed === false
      && batch.productionPolicy?.processedCropDirectReuse === false
      && batch.productionPolicy?.activeOfficePromotion === false,
    "Seating S01 production isolation changed",
  );
  add(
    batch.orientationPolicy?.front === "working-front-seated row 14"
      && batch.orientationPolicy?.back === "working-back-seated row 13"
      && batch.orientationPolicy?.left === "blocked"
      && batch.orientationPolicy?.right === "blocked"
      && batch.orientationPolicy?.mirroringAllowed === false,
    "Seating S01 orientation policy changed",
  );
  add(
    pose.status === "owner-approved"
      && pose.schema === "office-character-seat-sockets"
      && authorityEntries.length === 18
      && pose.audit?.seatFrameRecordCount === 216,
    "Working-seat authority is missing or stale",
  );

  const expectedProcessed = [];
  const expectedReviews = [`${reviewRoot}/00-batch-overview.png`];
  let validatedCases = 0;
  for (const [
    familyId,
    key,
    filename,
    capacity,
    caseCount,
    orientations,
  ] of expected) {
    const manifestPath = `assets/game/manifests/${filename}`;
    const manifest = readJson(manifestPath);
    const batchRecord = batch.families?.find(
      (record) => record.familyId === familyId,
    );
    for (const issue of validateOfficeFurnitureFamilyManifest(manifest)) {
      failures.push(`${familyId} contract: ${issue}`);
    }
    add(
      manifest.id === `office.furniture.${key}`
        && manifest.familyId === familyId
        && manifest.revision === "r01"
        && manifest.status === "owner-review-f8-pending",
      `${familyId} identity or owner-review status changed`,
    );
    add(
      manifest.developmentOnly === true
        && manifest.activeOfficePromotion === false
        && manifest.ownerDecision === null
        && manifest.gates?.F7?.status === "passed"
        && manifest.gates?.F8?.status === "pending-owner-review"
        && manifest.gates?.F9?.status === "blocked"
        && manifest.gates?.F10?.status === "blocked",
      `${familyId} escaped its F8 stop gate`,
    );
    add(
      manifest.permissions?.familyLab === true
        && manifest.permissions?.ownerReview === true
        && manifest.permissions?.furnitureOnlyRoom === false
        && manifest.permissions?.otherFurnitureFamilies === false
        && manifest.permissions?.activeOfficePromotion === false,
      `${familyId} permissions changed`,
    );
    add(
      manifest.sourcePolicy?.processedCropDirectReuse === false
        && manifest.sourcePolicy?.activeOfficePixelReuse === false
        && manifest.sourcePolicy?.legacyOrRejectedPixelReuse === false
        && manifest.sourcePolicy?.generativeRepair === false
        && manifest.sourcePolicy?.missingAssetFallback === false,
      `${familyId} source policy changed`,
    );

    const auditRecord = audit.records?.find(
      ({ recordId }) => recordId === manifest.source?.auditRecordId,
    );
    add(
      auditRecord?.familyId === familyId
        && auditRecord?.sourcePath === manifest.source?.path
        && auditRecord?.sourceSha256 === manifest.source?.sha256
        && auditRecord?.currentDecision?.decision
          === "salvage-full-master-and-decompose"
        && auditRecord?.currentDecision?.masterPixelsSalvageable === true,
      `${familyId} no longer has an exact salvageable source authority`,
    );
    add(
      manifest.source?.sha256 === sha256(manifest.source?.path)
        && manifest.source?.path.startsWith("assets/art/layout-references/")
        && !manifest.source?.path.includes("/processed/")
        && manifest.source?.extraction?.selectedComponentCount === 1
        && manifest.source?.extraction?.selectedPixelCount > 1000
        && manifest.source?.extraction?.touchesMasterBoundary === false
        && manifest.source?.extraction?.sourcePixelsResampled === false,
      `${familyId} full-master component proof changed`,
    );
    if (manifest.source?.extraction?.touchesNominalCellBoundary) {
      add(
        manifest.source.extraction.boundaryReview?.status
          === "passed-complete-silhouette"
          && manifest.source.extraction.boundaryReview?.evidence
            === manifest.reviewOutputs?.[0],
        `${familyId} boundary-crossing evidence is missing`,
      );
    }

    add(
      manifest.interaction?.capacity === capacity
        && manifest.interaction?.slots?.length === capacity
        && manifest.geometry?.seatSlots?.length === capacity
        && manifest.quality?.validatedSeatFrameCases === caseCount,
      `${familyId} capacity or seat-case total changed`,
    );
    validatedCases += manifest.quality?.validatedSeatFrameCases ?? 0;
    const actualOrientations = [
      ...new Set(manifest.interaction?.slots?.map(({ facing }) => facing)),
    ].sort();
    add(
      JSON.stringify(actualOrientations) === JSON.stringify(orientations),
      `${familyId} orientation set changed`,
    );
    add(
      manifest.interaction?.slots?.every(
        ({ action, visualPose, facing }) => action !== visualPose
          && (facing === "front"
            ? visualPose === "working-front-seated"
            : visualPose === "working-back-seated"),
      ),
      `${familyId} semantic action and visual pose are conflated`,
    );

    const coveredSlots = new Set();
    let manifestCases = 0;
    let minimumOverlap = Number.POSITIVE_INFINITY;
    let minimumVisibleLowerBody = Number.POSITIVE_INFINITY;
    let minimumLowerBodyRatio = Number.POSITIVE_INFINITY;
    for (const validation of manifest.rosterValidations ?? []) {
      const orientation = validation.poseAuthority?.orientation;
      const row = orientation === "front" ? 14 : 13;
      add(
        validation.poseAuthority?.manifest === posePath
          && validation.poseAuthority?.manifestSha256 === sha256(posePath)
          && validation.poseAuthority?.status === "owner-approved"
          && validation.row === row
          && validation.poseAuthority?.row === row
          && validation.activeFrames === 6
          && validation.characterCount === 18
          && validation.perCharacterFurnitureScaling === false
          && validation.perCharacterSeatOffsets === false,
        `${familyId} ${orientation} pose authority changed`,
      );
      for (const slotId of validation.slotIds ?? []) coveredSlots.add(slotId);
      add(
        validation.characters?.length === 18,
        `${familyId} ${orientation} roster is incomplete`,
      );
      for (const character of validation.characters ?? []) {
        const authority = authorityBySlug.get(character.id);
        const authorityPose = authority?.orientations?.[orientation];
        add(
          character.sheet === authority?.source?.file
            && character.sha256 === authority?.source?.sha256
            && character.sha256 === sha256(character.sheet)
            && character.frames?.length === 6,
          `${familyId} ${character.id} source or frames changed`,
        );
        for (const [frameIndex, frame] of (character.frames ?? []).entries()) {
          const authorityFrame = authorityPose?.frames?.[frameIndex];
          add(
            frame.frame === frameIndex
              && JSON.stringify(frame.actorContactLocal)
                === JSON.stringify(authorityFrame?.seatContactLocal)
              && frame.actorInsideReviewCard === true
              && frame.foregroundOverlapPixels > 0
              && frame.slots?.length === validation.slotIds?.length
              && frame.slots?.every(
                (slot) => slot.actorInsideReviewCard === true
                  && slot.foregroundOverlapPixels > 0
                  && Number.isInteger(slot.lowerBodyPixels) && slot.lowerBodyPixels > 0
                  && slot.visibleLowerBodyPixels === slot.lowerBodyPixels
                  && slot.lowerBodyVisibilityRatio === 1,
              ),
            `${familyId} ${character.id} ${orientation} frame ${frameIndex} failed`,
          );
          manifestCases += frame.slots?.length ?? 0;
          for (const slot of frame.slots ?? []) {
            minimumOverlap = Math.min(minimumOverlap, slot.foregroundOverlapPixels);
            minimumVisibleLowerBody = Math.min(minimumVisibleLowerBody, slot.visibleLowerBodyPixels);
            minimumLowerBodyRatio = Math.min(minimumLowerBodyRatio, slot.lowerBodyVisibilityRatio);
          }
        }
      }
    }
    add(
      coveredSlots.size === capacity
        && manifestCases === caseCount
        && minimumOverlap === manifest.quality?.minimumForegroundOverlapPixels
        && minimumOverlap > 0
        && minimumVisibleLowerBody === manifest.quality?.minimumVisibleLowerBodyPixels
        && minimumVisibleLowerBody > 0
        && minimumLowerBodyRatio === manifest.quality?.minimumLowerBodyVisibilityRatio
        && minimumLowerBodyRatio === 1
        && manifest.quality?.allLowerBodyPixelsVisibleInSeatLayer === true,
      `${familyId} slot coverage, overlap, or lower-body proof changed`,
    );

    const reservation = manifest.reservationValidation;
    add(
      reservation?.durationSeconds === 30
        && reservation?.actorCount === capacity + 1
        && reservation?.maximumConcurrentReservations === capacity
        && reservation?.collisionCount === 0
        && reservation?.releasedAtEnd === true
        && reservation?.samples?.length === 31,
      `${familyId} reservation summary changed`,
    );
    for (const sample of reservation?.samples ?? []) {
      add(
        sample.holders?.length <= capacity
          && new Set(sample.holders).size === sample.holders?.length,
        `${familyId} reservation sample ${sample.second} exceeds capacity`,
      );
    }

    add(
      manifest.parts?.map(({ role }) => role).join(",")
        === "shell,rear,foreground"
        && manifest.partEvidence?.authoringRecompositionPixelExact === true
        && manifest.partEvidence?.runtimeRecompositionPixelExact === true
        && manifest.quality?.visibleMagentaPixels === 0,
      `${familyId} layer proof changed`,
    );
    for (const part of manifest.parts ?? []) {
      for (const [path, hash, size] of [
        [part.authoringFile, part.authoringSha256, manifest.render.authoringCanvas],
        [part.runtimeFile, part.runtimeSha256, manifest.render.runtimeCanvas],
      ]) {
        add(existsSync(join(root, path)), `Missing ${path}`);
        if (!existsSync(join(root, path))) continue;
        add(
          sha256(path) === hash
            && JSON.stringify(pngSize(path)) === JSON.stringify(size),
          `Hash or size changed: ${path}`,
        );
        expectedProcessed.push(path);
      }
    }
    const ownership = manifest.partEvidence?.ownershipMask;
    add(
      existsSync(join(root, ownership?.path ?? ""))
        && ownership?.sha256 === sha256(ownership.path)
        && JSON.stringify(pngSize(ownership.path))
          === JSON.stringify(manifest.render.authoringCanvas),
      `${familyId} ownership mask changed`,
    );
    expectedProcessed.push(ownership.path);

    add(
      manifest.reviewOutputs?.length === 6
        && manifest.reviewEvidence?.length === 6,
      `${familyId} review evidence count changed`,
    );
    for (const [index, review] of (manifest.reviewEvidence ?? []).entries()) {
      add(
        review.path === manifest.reviewOutputs[index]
          && existsSync(join(root, review.path))
          && review.sha256 === sha256(review.path)
          && JSON.stringify(review.size) === JSON.stringify(pngSize(review.path)),
        `${familyId} review evidence ${index} changed`,
      );
      expectedReviews.push(review.path);
    }
    add(
      batchRecord?.manifest === manifestPath
        && batchRecord?.manifestSha256 === sha256(manifestPath)
        && batchRecord?.capacity === capacity
        && batchRecord?.validatedSeatFrameCases === caseCount
        && JSON.stringify(batchRecord?.orientations)
          === JSON.stringify(orientations),
      `${familyId} batch record changed`,
    );

    if (familyId === "table.review.long.modern") {
      add(
        manifest.approvedDependencies?.length === 2
          && manifest.contextPermission?.r05WorkstationScopeRemainsUnchanged === true
          && manifest.contextPermission?.reviewTableContextOnly === true
          && manifest.contextPermission?.ownerApprovalRequired === true
          && r05.status === "owner-approved-p0-p3"
          && r05.permissions?.otherFurniture === false,
        "Review table escaped its R05 context-extension stop gate",
      );
      for (const dependency of manifest.approvedDependencies ?? []) {
        add(
          dependency.authorityManifest === r05Path
            && dependency.authorityManifestSha256 === sha256(r05Path)
            && dependency.scope === "review-table-f7-context-proof-only"
            && dependency.ownerReviewRequiredForNewContext === true,
          `Review chair ${dependency.id} authority changed`,
        );
        for (const file of Object.values(dependency.files ?? {})) {
          add(
            existsSync(join(root, file.path))
              && file.sha256 === sha256(file.path),
            `Review chair dependency changed: ${file.path}`,
          );
        }
      }
    }
  }

  add(validatedCases === 1404, "Family pose-case totals do not equal the batch");
  add(
    JSON.stringify(recursiveFiles(processedRoot))
      === JSON.stringify(expectedProcessed.sort()),
    "Seating S01 processed directory has missing or unexpected files",
  );
  add(
    JSON.stringify(recursiveFiles(reviewRoot))
      === JSON.stringify(expectedReviews.sort()),
    "Seating S01 review directory has missing or unexpected files",
  );
  const overview = batch.reviewOutputs?.[0];
  add(
    overview?.path === `${reviewRoot}/00-batch-overview.png`
      && overview?.sha256 === sha256(overview.path)
      && JSON.stringify(overview?.size) === JSON.stringify(pngSize(overview.path)),
    "Batch overview changed",
  );
  const active = readFileSync(join(root, activePath), "utf8");
  add(
    !active.includes("seating-s01")
      && !active.includes("chair-reading-r01")
      && !active.includes("table-review-long-r01"),
    "Active Office imported Seating S01",
  );
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
}

if (failures.length > 0) {
  process.stderr.write(`${failures.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    "Seating S01 OK: seven audited families, thirteen slots, 1,404 front/back "
      + "pose cases, capacity reservations, F8 pending, and Active Office unchanged.\n",
  );
}
