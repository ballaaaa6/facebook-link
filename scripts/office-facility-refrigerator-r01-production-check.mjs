import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  validateOfficeFacilityRefrigeratorProductionManifest,
} from "../packages/contracts/src/officeFacilityRefrigeratorProduction.ts";
import {
  fileHashMatches,
  readJson,
  readText,
  recursiveFiles,
  root,
  same,
  sha256,
} from "./office-production-check-utils.mjs";

const manifestPath =
  "assets/game/manifests/office-facility-refrigerator-r01-production.json";
const preflightPath =
  "assets/game/manifests/office-facility-refrigerator-r01.json";
const builderPath =
  "scripts/build-office-facility-refrigerator-r01-production.py";
const docsPath =
  "docs/art/OFFICE_FACILITY_REFRIGERATOR_R01_PRODUCTION.md";
const processedRoot =
  "assets/game/processed/office-facility-family-v1/"
  + "refrigerator-r01-production";
const reviewRoot =
  "assets/art/layout-references/office-facility-family-v1/"
  + "refrigerator-r01-production";
const reviews = [
  ["01-approved-preflight-hash-lock.png", [1600, 900]],
  ["02-clean-closed-half-open.png", [1600, 900]],
  ["03-production-parts-alpha.png", [1600, 900]],
  ["04-geometry-footprint-pivot-swing.png", [1600, 900]],
  ["05-finite-transition-proof.png", [1800, 900]],
  ["06-routes-sockets-handoff.png", [1700, 950]],
  ["07-roster-108-cases.png", [1800, 1050]],
  ["08-prop-overlay-108-cases.png", [1800, 1050]],
  ["09-water-yogurt-closeups.png", [1600, 950]],
  ["10-selection-stability-alternation.png", [1600, 900]],
  ["11-interruption-before-after-pickup.png", [1800, 950]],
  ["12-two-user-reservation-30s.png", [1800, 1000]],
];
const gifs = [
  ["refrigerator-r01-production-water.gif", [768, 512], 10, 260],
  ["refrigerator-r01-production-yogurt.gif", [768, 512], 10, 260],
  ["refrigerator-r01-production-two-user.gif", [900, 520], 9, 600],
];

const failures = [];
const add = (condition, message) => {
  if (!condition) failures.push(message);
};

function gifSize(path) {
  const bytes = readFileSync(join(root, path));
  const header = bytes.subarray(0, 6).toString("ascii");
  if (header !== "GIF87a" && header !== "GIF89a") {
    throw new Error(`Not a GIF: ${path}`);
  }
  return [bytes.readUInt16LE(6), bytes.readUInt16LE(8)];
}

function collectProcessedAssets(value, assets = new Map()) {
  if (Array.isArray(value)) {
    for (const entry of value) collectProcessedAssets(entry, assets);
    return assets;
  }
  if (!value || typeof value !== "object") return assets;
  if (
    typeof value.file === "string"
    && value.file.startsWith(`${processedRoot}/`)
    && typeof value.sha256 === "string"
    && Array.isArray(value.size)
  ) {
    assets.set(value.file, value);
  }
  for (const entry of Object.values(value)) {
    collectProcessedAssets(entry, assets);
  }
  return assets;
}

try {
  const manifest = readJson(manifestPath);
  const preflight = readJson(preflightPath);
  for (const issue of
    validateOfficeFacilityRefrigeratorProductionManifest(manifest)) {
    failures.push(`Refrigerator R01 production contract: ${issue}`);
  }

  add(
    manifest.preflightAuthority?.manifest === preflightPath
      && manifest.preflightAuthority?.manifestSha256 === sha256(preflightPath)
      && preflight.status === "visual-motion-preflight-owner-approved"
      && preflight.visualApproval?.status === "owner-approved"
      && preflight.visualApproval?.approvedReviewHashes?.length === 10
      && manifest.preflightAuthority?.hashMismatchCount === 0,
    "Refrigerator R01 production preflight authority is stale",
  );
  for (const approval of preflight.visualApproval?.approvedReviewHashes ?? []) {
    add(
      existsSync(join(root, approval.path))
        && sha256(approval.path) === approval.sha256,
      `Refrigerator R01 approved preflight file changed: ${approval.path}`,
    );
  }

  add(
    manifest.sourcePolicy?.approvedPreflightPixelsOnly === true
      && manifest.sourcePolicy?.newImageGeneration === false
      && manifest.sourcePolicy?.originalMasterPixelReuse === false
      && manifest.sourcePolicy?.processedForeignFamilyReuse === false
      && manifest.sourcePolicy?.activeOfficePixelReuse === false
      && manifest.sourcePolicy?.generativeRepair === false
      && manifest.sourcePolicy?.missingAssetFallback === false,
    "Refrigerator R01 production source isolation changed",
  );

  add(
    same(manifest.render?.physicalScale, {
      width: 2,
      depth: 2,
      height: 4,
      unit: "tile",
    })
      && same(manifest.render?.footprint, {
        width: 2,
        depth: 2,
        unit: "tile",
      })
      && same(manifest.render?.renderBox, {
        width: 3,
        height: 4,
        unit: "tile",
      })
      && same(manifest.render?.basePivotRuntime, [48, 124])
      && same(manifest.render?.sortPivotRuntime, [48, 124])
      && same(manifest.render?.requiredOrientations, ["front"])
      && manifest.render?.collisionChangesDuringMotion === false
      && manifest.render?.footprintChangesDuringMotion === false,
    "Refrigerator R01 production 2x2x4 geometry changed",
  );

  add(
    manifest.finiteAnimation?.kind === "reversible-finite-state"
      && manifest.finiteAnimation?.repeatingAmbientLoop === false
      && manifest.finiteAnimation?.compositionFormula
        === "immutableShell + lowerDoor[state]"
      && same(
        manifest.finiteAnimation?.productionTransition,
        ["closed", "half", "open", "half", "closed"],
      )
      && manifest.finiteAnimation?.transitionChangedPixels?.every(
        (count) => count > 0,
      )
      && same(
        manifest.finiteAnimation?.changedPixelsOutsideDoorSwingRegion,
        [0, 0, 0, 0],
      )
      && manifest.finiteAnimation?.shellChangedPixels === 0
      && same(manifest.finiteAnimation?.pivotDeltaPixels, [0, 0])
      && manifest.finiteAnimation?.closedEndpointMismatchPixels === 0,
    "Refrigerator R01 production finite door motion changed",
  );

  add(
    manifest.rosterValidation?.characterCount === 18
      && manifest.rosterValidation?.activeFrames === 6
      && manifest.rosterValidation?.poseCases?.length === 108
      && manifest.rosterValidation?.rootAlignmentFailures === 0
      && manifest.rosterValidation?.pivotDriftFailures === 0
      && manifest.rosterValidation?.routeFailures === 0
      && manifest.propOverlayValidation?.cases?.length === 108
      && manifest.propOverlayValidation?.selectionCases?.length === 72
      && manifest.propOverlayValidation?.attachmentFailures === 0
      && manifest.propOverlayValidation?.foregroundMaskUses === 0
      && manifest.propOverlayValidation?.magicOffsetCases === 0
      && manifest.propOverlayValidation?.fallbackSocketCases === 0,
    "Refrigerator R01 production 216-case matrix changed",
  );

  add(
    manifest.reservationValidation?.durationSeconds === 30
      && manifest.reservationValidation?.actorCount === 2
      && manifest.reservationValidation?.maximumConcurrentReservations === 1
      && manifest.reservationValidation?.blockedAttemptCount === 1
      && manifest.reservationValidation?.failureCount === 1
      && manifest.reservationValidation?.releaseCount === 3
      && manifest.reservationValidation?.retrySuccessCount === 1
      && manifest.reservationValidation
        ?.beforePickupInterruptionCount === 1
      && manifest.reservationValidation
        ?.afterPickupInterruptionCount === 1
      && manifest.reservationValidation?.releasedAtEnd === true
      && manifest.reservationValidation?.propAttachedAtEnd === false
      && manifest.reservationValidation?.samples?.length === 31,
    "Refrigerator R01 production reservation proof changed",
  );

  add(
    manifest.gates?.F4?.status === "passed"
      && manifest.gates?.F7?.status === "passed"
      && manifest.gates?.F8?.status === "pending-owner-review"
      && manifest.gates?.F9?.status === "blocked"
      && manifest.gates?.F10?.status === "blocked"
      && manifest.interaction?.reservationSlotContribution === 0
      && manifest.interaction
        ?.plannedReservationSlotContributionAfterF8 === 1
      && manifest.permissions?.reservationSlotActivation === false
      && manifest.permissions?.activeOfficePromotion === false
      && manifest.ownerDecision === null,
    "Refrigerator R01 production exceeded F8 review authority",
  );

  const processedAssets = collectProcessedAssets(manifest);
  for (const [path, evidence] of processedAssets.entries()) {
    add(
      fileHashMatches(path, evidence.sha256, evidence.size),
      `Refrigerator R01 production asset is stale: ${path}`,
    );
    add(
      evidence.sha256 === evidence.approvedPreflightSha256,
      `Refrigerator R01 production asset changed approved pixels: ${path}`,
    );
  }
  add(
    processedAssets.size === 11
      && same(
        recursiveFiles(processedRoot),
        [...processedAssets.keys()].sort(),
      ),
    "Refrigerator R01 production processed directory changed",
  );

  const expectedReviews = [
    ...reviews.map(([name]) => `${reviewRoot}/${name}`),
    ...gifs.map(([name]) => `${reviewRoot}/${name}`),
  ];
  add(
    same(manifest.reviewOutputs, expectedReviews)
      && same(
        manifest.reviewEvidence?.map(({ path }) => path),
        expectedReviews,
      ),
    "Refrigerator R01 production review order changed",
  );
  for (const [index, [name, size]] of reviews.entries()) {
    const path = `${reviewRoot}/${name}`;
    const evidence = manifest.reviewEvidence?.[index];
    add(
      evidence?.kind === "png"
        && same(evidence.size, size)
        && fileHashMatches(path, evidence.sha256, size),
      `Refrigerator R01 production board is stale: ${path}`,
    );
  }
  for (const [index, [name, size, frameCount, durationMs]] of gifs.entries()) {
    const path = `${reviewRoot}/${name}`;
    const evidence = manifest.reviewEvidence?.[reviews.length + index];
    add(
      evidence?.kind === "gif"
        && same(evidence.size, size)
        && evidence.frameCount === frameCount
        && evidence.durationMs === durationMs
        && existsSync(join(root, path))
        && same(gifSize(path), size)
        && sha256(path) === evidence.sha256,
      `Refrigerator R01 production GIF is stale: ${path}`,
    );
  }
  add(
    same(recursiveFiles(reviewRoot), expectedReviews.slice().sort()),
    "Refrigerator R01 production review directory changed",
  );

  for (const evidence of manifest.activeOfficeEvidence ?? []) {
    const content = readText(evidence.file);
    add(
      evidence.imported === false
        && !content.includes("refrigerator-r01-production")
        && !content.includes("office.facility.refrigerator.r01.production"),
      `Active Office imported Refrigerator R01 production: ${evidence.file}`,
    );
  }

  const builder = readText(builderPath);
  add(
    builder.includes("approvedPreflightPixelsOnly")
      && builder.includes('"newImageGeneration": False')
      && builder.includes('"newCoordinateSystem": False')
      && !builder.includes("remove_magenta_chroma")
      && !builder.includes("image_gen"),
    "Refrigerator R01 production builder may recreate approved art",
  );
  const docs = readText(docsPath);
  add(
    docs.includes("Status: F4-F7 complete; F8 owner review pending")
      && docs.includes("108 base pose cases")
      && docs.includes("108 prop-overlay cases")
      && docs.includes("30-second")
      && docs.includes("17/20")
      && docs.includes("18/20")
      && docs.includes("F9-F10 remain blocked"),
    "Refrigerator R01 production documentation is incomplete",
  );

  const packageJson = readJson("package.json");
  add(
    packageJson.scripts?.["art:facility:refrigerator:r01:production"]
      === "python scripts/build-office-facility-refrigerator-r01-production.py"
      && packageJson.scripts
        ?.["art:facility:refrigerator:r01:production:rebuild:check"]
        === "python scripts/build-office-facility-refrigerator-r01-production.py --check"
      && packageJson.scripts
        ?.["art:facility:refrigerator:r01:production:check"]
        === "node scripts/office-facility-refrigerator-r01-production-check.mjs"
      && packageJson.scripts?.["art:facility:refrigerator:r01:check"]
        ?.includes("office-facility-refrigerator-r01-production-check.mjs")
      && packageJson.scripts?.check.includes(
        "npm run art:facility:refrigerator:r01:check",
      ),
    "Refrigerator R01 production package scripts are missing",
  );
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
}

if (failures.length) {
  process.stderr.write(`${failures.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    "Refrigerator R01 production check passed: exact approved 2x2x4 "
      + "parts, reversible door, 108 poses, 108 H01 overlays, 30-second "
      + "capacity-one proof, F4-F7 passed, F8 pending, zero active slots.\n",
  );
}
