import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  validateOfficeFacilityUpsizeBatchProductionManifest,
  validateOfficeFacilityUpsizeGeneratedProductionManifest,
} from "../packages/contracts/src/officeFacilityUpsizeGeneratedProduction.ts";
import {
  fileHashMatches,
  readJson,
  readText,
  recursiveFiles,
  root,
  same,
  sha256,
} from "./office-production-check-utils.mjs";

const batchPath =
  "assets/game/manifests/office-facility-upsize-2x2x4-production-v1.json";
const familyPaths = [
  "assets/game/manifests/office-facility-coffee-machine-c02-production.json",
  "assets/game/manifests/office-facility-water-dispenser-w02-production.json",
  "assets/game/manifests/office-facility-vending-u02-production.json",
  "assets/game/manifests/office-furniture-chair-massage-r03-production.json",
];
const processedRoot =
  "assets/game/processed/office-facility-upsize-production-v1";
const reviewRoot =
  "assets/art/layout-references/office-facility-upsize-production-v1";
const builderPath =
  "scripts/build-office-facility-upsize-production-v1.py";
const docsPath =
  "docs/art/OFFICE_FACILITY_UPSIZE_2X2X4_PRODUCTION_V1.md";

const failures = [];
const add = (condition, message) => {
  if (!condition) failures.push(message);
};

const gifSize = (path) => {
  const data = readFileSync(join(root, path));
  const validHeader = ["GIF87a", "GIF89a"].includes(
    data.toString("ascii", 0, 6),
  );
  if (!validHeader) throw new Error(`Not a GIF: ${path}`);
  return [data.readUInt16LE(6), data.readUInt16LE(8)];
};

function collectProcessedAssets(manifest) {
  const assets = new Map();
  const pending = [manifest];
  while (pending.length > 0) {
    const value = pending.pop();
    if (!value || typeof value !== "object") continue;
    if (
      typeof value.file === "string"
      && value.file.startsWith(`${processedRoot}/`)
      && typeof value.sha256 === "string"
      && Array.isArray(value.size)
    ) {
      assets.set(value.file, value);
    }
    pending.push(...Object.values(value));
  }
  return assets;
}

try {
  const batch = readJson(batchPath);
  for (const issue of
    validateOfficeFacilityUpsizeBatchProductionManifest(batch)) {
    failures.push(`Batch contract: ${issue}`);
  }
  const expectedProcessed = [];
  const expectedReview = [];

  for (const familyPath of familyPaths) {
    const manifest = readJson(familyPath);
    for (const issue of
      validateOfficeFacilityUpsizeGeneratedProductionManifest(manifest)) {
      failures.push(`${manifest.id} contract: ${issue}`);
    }
    add(
      existsSync(join(root, manifest.preflightAuthority.manifest))
        && manifest.preflightAuthority.manifestSha256
          === sha256(manifest.preflightAuthority.manifest),
      `${manifest.id} approved F3 authority changed`,
    );
    add(
      manifest.preflightAuthority.status
        === "visual-preflight-owner-approved"
        && manifest.preflightAuthority.hashMismatchCount === 0,
      `${manifest.id} does not consume exact approved F3 pixels`,
    );

    const assets = collectProcessedAssets(manifest);
    for (const [path, record] of assets) {
      add(
        fileHashMatches(path, record.sha256, record.size),
        `${manifest.id} production asset changed: ${path}`,
      );
      expectedProcessed.push(path);
    }
    for (const evidence of manifest.reviewEvidence) {
      const size = evidence.kind === "png"
        ? evidence.size
        : undefined;
      add(
        existsSync(join(root, evidence.path))
          && sha256(evidence.path) === evidence.sha256
          && (
            evidence.kind === "png"
              ? fileHashMatches(evidence.path, evidence.sha256, size)
              : same(gifSize(evidence.path), evidence.size)
          ),
        `${manifest.id} review evidence changed: ${evidence.path}`,
      );
      expectedReview.push(evidence.path);
    }
    add(
      manifest.animation.changedPixelsOutsideDeclaredRegions === 0
        && manifest.animation.shellMoves === false
        && same(manifest.animation.basePivotDeltaPixels, [0, 0])
        && same(manifest.animation.sortPivotDeltaPixels, [0, 0])
        && same(manifest.animation.footprintDeltaTiles, [0, 0]),
      `${manifest.id} shell, pivot, or footprint moved`,
    );
    add(
      manifest.rosterValidation.poseCaseCount === 108
        && manifest.spatial.orientationCaseCount === 432
        && manifest.rosterValidation.attachmentDeltaFailures === 0
        && manifest.rosterValidation.magicOffsetCases === 0
        && manifest.rosterValidation.fallbackSocketCases === 0,
      `${manifest.id} roster or coordinate proof changed`,
    );
    add(
      manifest.reservationValidation.durationSeconds === 30
        && manifest.reservationValidation.blockedAttemptCount === 1
        && manifest.reservationValidation.failureCount === 1
        && manifest.reservationValidation.retrySuccessCount === 1
        && manifest.reservationValidation.releasedAtEnd === true,
      `${manifest.id} reservation proof changed`,
    );
  }

  add(
    same(
      batch.families.map((family) => family.manifest),
      familyPaths,
    )
      && batch.families.every(
        (family) => family.sha256 === sha256(family.manifest),
      ),
    "Production batch family manifest index changed",
  );
  add(
    batch.preflightAuthority.manifestSha256
      === sha256(batch.preflightAuthority.manifest),
    "Production batch F3 authority changed",
  );
  add(
    batch.counterPolicy.manifestSha256
      === sha256(batch.counterPolicy.manifest)
      && batch.counterPolicy.deleteAsset === false,
    "Counter A01-r02 retention changed",
  );
  add(
    batch.f9Policy.currentF9ManifestSha256
      === sha256(batch.f9Policy.currentF9Manifest)
      && batch.f9Policy.currentF9Changed === false,
    "F9 v1 isolation changed",
  );
  add(
    fileHashMatches(
      batch.reviewOutput.path,
      batch.reviewOutput.sha256,
      batch.reviewOutput.size,
    ),
    "Production batch F8 review board changed",
  );
  expectedReview.push(batch.reviewOutput.path);

  add(
    same(
      recursiveFiles(processedRoot),
      [...new Set(expectedProcessed)].sort(),
    ),
    "Production processed tree contains missing or unexpected files",
  );
  add(
    same(
      recursiveFiles(reviewRoot),
      [...new Set(expectedReview)].sort(),
    ),
    "Production review tree contains missing or unexpected files",
  );
  const registry = readText(
    "apps/web/src/features/office/components/officeAssetRegistry.ts",
  );
  add(
    !registry.includes("office-facility-upsize-production-v1"),
    "Active Office registry imports the F8 review candidate",
  );

  const docs = readText(docsPath);
  for (const required of [
    "production-owner-review",
    "F8",
    "Coffee Machine C02",
    "Water Dispenser W02",
    "Vending Machine U02",
    "Massage Chair R03",
    "432",
    "20/20",
    "C12",
  ]) {
    add(docs.includes(required), `Production documentation omits ${required}`);
  }
  const packageJson = readText("package.json");
  for (const required of [
    `"art:facility:upsize:production": "python ${builderPath}"`,
    `"art:facility:upsize:production:rebuild:check": "python ${builderPath} --check"`,
    `"art:facility:upsize:production:check": "node scripts/office-facility-upsize-production-v1-check.mjs"`,
  ]) {
    add(packageJson.includes(required), `package.json omits ${required}`);
  }
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
}

if (failures.length > 0) {
  console.error("Office Facility 2x2x4 production check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  "Office Facility 2x2x4 production check passed: 4 families, "
    + "16 seam-loop frames, 432 roster poses, 1,728 orientation cases, "
    + "four 30-second reservation proofs; F8 review pending, slots inactive.",
);
