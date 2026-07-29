import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  validateOfficeFacilityUpsizeBatchPreflightManifest,
  validateOfficeFacilityUpsizeGeneratedPreflightManifest,
} from "../packages/contracts/src/officeFacilityUpsizeGeneratedPreflight.ts";
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
  "assets/game/manifests/office-facility-upsize-2x2x4-preflight-v1.json";
const familyPaths = [
  "assets/game/manifests/office-facility-coffee-machine-c02.json",
  "assets/game/manifests/office-facility-water-dispenser-w02.json",
  "assets/game/manifests/office-facility-vending-u02.json",
  "assets/game/manifests/office-furniture-chair-massage-r03.json",
];
const processedRoot = "assets/game/processed/office-facility-upsize-v1";
const reviewRoot =
  "assets/art/layout-references/office-facility-upsize-v1";
const builderPath =
  "scripts/build-office-facility-upsize-preflight-v1.py";
const docsPath =
  "docs/art/OFFICE_FACILITY_UPSIZE_2X2X4_PREFLIGHT_V1.md";

const failures = [];
const add = (condition, message) => {
  if (!condition) failures.push(message);
};
const expectedProcessed = [];
const expectedReview = [];

try {
  const batch = readJson(batchPath);
  for (const issue of
    validateOfficeFacilityUpsizeBatchPreflightManifest(batch)) {
    failures.push(`Batch contract: ${issue}`);
  }

  for (const familyPath of familyPaths) {
    const manifest = readJson(familyPath);
    for (const issue of
      validateOfficeFacilityUpsizeGeneratedPreflightManifest(manifest)) {
      failures.push(`${manifest.id} contract: ${issue}`);
    }
    add(
      existsSync(join(root, manifest.supersedesAfterApproval.manifest))
        && manifest.supersedesAfterApproval.manifestSha256
          === sha256(manifest.supersedesAfterApproval.manifest),
      `${manifest.id} predecessor authority changed`,
    );
    for (const source of [
      manifest.sources.chromaMaster,
      manifest.sources.alphaMaster,
    ]) {
      add(
        fileHashMatches(source.file, source.sha256, source.size),
        `${manifest.id} generated source changed: ${source.file}`,
      );
      expectedReview.push(source.file);
    }
    for (const view of manifest.views) {
      for (const asset of [view.authoring, view.runtime]) {
        add(
          fileHashMatches(asset.file, asset.sha256, asset.size),
          `${manifest.id} view changed: ${asset.file}`,
        );
        expectedProcessed.push(asset.file);
      }
    }
    for (const review of manifest.reviewOutputs) {
      add(
        fileHashMatches(review.path, review.sha256, review.size),
        `${manifest.id} review evidence changed: ${review.path}`,
      );
      expectedReview.push(review.path);
    }
  }

  add(
    same(
      batch.families.map((family) => family.manifest),
      familyPaths,
    )
      && batch.families.every(
        (family) => family.sha256 === sha256(family.manifest),
      ),
    "Batch family manifest index changed",
  );
  add(
    batch.counterPolicy.manifestSha256
      === sha256(batch.counterPolicy.manifest)
      && batch.counterPolicy.deleteAsset === false,
    "Counter A01-r02 retention authority changed",
  );
  add(
    batch.f9Policy.currentF9ManifestSha256
      === sha256(batch.f9Policy.currentF9Manifest)
      && batch.f9Policy.currentF9Changed === false,
    "Current F9 isolation authority changed",
  );
  add(
    fileHashMatches(
      batch.reviewOutput.path,
      batch.reviewOutput.sha256,
      batch.reviewOutput.size,
    ),
    "Batch lineup changed",
  );
  expectedReview.push(batch.reviewOutput.path);

  add(
    same(recursiveFiles(processedRoot), expectedProcessed.sort()),
    "Processed 16-view file set contains missing or unexpected files",
  );
  add(
    same(recursiveFiles(reviewRoot), expectedReview.sort()),
    "Preflight review/source file set contains missing or unexpected files",
  );

  const docs = readText(docsPath);
  for (const required of [
    "built-in ImageGen",
    "2 x 2 x 4",
    "16",
    "Coffee Machine C02",
    "Water Dispenser W02",
    "Vending Machine U02",
    "Massage Chair R03",
    "Counter A01-r02",
    "C12",
    "pending-owner-review",
  ]) {
    add(docs.includes(required), `Preflight documentation omits ${required}`);
  }
  const packageJson = readText("package.json");
  for (const required of [
    `"art:facility:upsize:preflight": "python ${builderPath}"`,
    `"art:facility:upsize:preflight:rebuild:check": "python ${builderPath} --check"`,
    `"art:facility:upsize:preflight:check": "node scripts/office-facility-upsize-preflight-v1-check.mjs"`,
  ]) {
    add(packageJson.includes(required), `package.json omits ${required}`);
  }
  add(
    readText("docs/art/OFFICE_C_BOM.md")
      .includes("OFFICE_FACILITY_UPSIZE_2X2X4_PREFLIGHT_V1.md"),
    "Office C BOM does not route to the upsize preflight",
  );
  add(
    readText("docs/art/OFFICE_FURNITURE_PRODUCTION_GATES.md")
      .includes("office.facility-upsize.2x2x4.preflight.v1"),
    "Production gates do not record the upsize F3 stop",
  );
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
}

if (failures.length > 0) {
  console.error("Office Facility 2x2x4 preflight check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  "Office Facility 2x2x4 visual preflight check passed: "
    + "4 families, 16 isolated views, 5 planned slot transfers, "
    + "Counter retained, F9 unchanged, F3 owner review pending.",
);
