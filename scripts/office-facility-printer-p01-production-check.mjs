import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  validateOfficeFacilityPrinterProductionManifest,
} from "../packages/contracts/src/officeFacilityPrinterProduction.ts";
import {
  fileHashMatches,
  pngSize,
  readJson,
  readText,
  recursiveFiles,
  root,
  same,
  sha256,
} from "./office-production-check-utils.mjs";

const manifestPath =
  "assets/game/manifests/office-facility-printer-p01-production.json";
const preflightPath =
  "assets/game/manifests/office-facility-printer-p01.json";
const builderPath =
  "scripts/build-office-facility-printer-p01-production.py";
const docsPath =
  "docs/art/OFFICE_FACILITY_PRINTER_P01_PRODUCTION.md";
const processedRoot =
  "assets/game/processed/office-facility-family-v1/"
  + "printer-p01-production";
const reviewRoot =
  "assets/art/layout-references/office-facility-family-v1/"
  + "printer-p01-production";
const reviews = [
  ["01-approved-preflight-hash-lock.png", [1600, 900]],
  ["02-clean-production-states.png", [1800, 950]],
  ["03-parts-alpha-ownership.png", [1800, 950]],
  ["04-two-instance-geometry.png", [1700, 950]],
  ["05-processing-a-d-a-proof.png", [1800, 900]],
  ["06-finite-tray-proof.png", [1800, 900]],
  ["07-output-child-lifecycle.png", [1800, 950]],
  ["08-routes-and-sockets.png", [1700, 950]],
  ["09-roster-108-cases.png", [1900, 1100]],
  ["10-primary-grip-108-cases.png", [1900, 1100]],
  ["11-paper-envelope-closeups.png", [1800, 1000]],
  ["12-alpha-contact-metrics.png", [1700, 900]],
  ["13-interruption-paths.png", [1800, 950]],
  ["14-three-user-two-printer-30s.png", [1900, 1050]],
];
const gifs = [
  ["printer-p01-production-paper.gif", [768, 512], 9, 260],
  ["printer-p01-production-envelope.gif", [768, 512], 9, 260],
  ["printer-p01-production-contention.gif", [960, 560], 10, 500],
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
  for (
    const issue of validateOfficeFacilityPrinterProductionManifest(manifest)
  ) {
    failures.push(`Printer P01 production contract: ${issue}`);
  }

  add(
    manifest.preflightAuthority?.manifest === preflightPath
      && manifest.preflightAuthority?.manifestSha256 === sha256(preflightPath)
      && preflight.status === "visual-motion-preflight-owner-approved"
      && preflight.ownerDecision?.decision === "approved"
      && preflight.ownerDecision?.approvedReviewHashes?.length === 12
      && manifest.preflightAuthority?.hashMismatchCount === 0,
    "Printer P01 production preflight authority is stale",
  );
  for (const approval of
    preflight.ownerDecision?.approvedReviewHashes ?? []) {
    add(
      existsSync(join(root, approval.path))
        && sha256(approval.path) === approval.sha256,
      `Printer P01 approved preflight file changed: ${approval.path}`,
    );
  }

  const processedAssets = collectProcessedAssets(manifest);
  for (const [path, evidence] of processedAssets) {
    add(
      fileHashMatches(path, evidence.sha256, evidence.size),
      `Printer P01 production asset is stale: ${path}`,
    );
  }
  add(
    processedAssets.size === 24
      && same(
        recursiveFiles(processedRoot),
        [...processedAssets.keys()].sort(),
      ),
    "Printer P01 production processed directory changed",
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
      )
      && same(recursiveFiles(reviewRoot), [...expectedReviews].sort()),
    "Printer P01 production review set changed",
  );
  for (const [index, [name, size]] of reviews.entries()) {
    const path = `${reviewRoot}/${name}`;
    const evidence = manifest.reviewEvidence?.[index];
    add(
      evidence?.kind === "png"
        && same(evidence.size, size)
        && same(pngSize(path), size)
        && sha256(path) === evidence.sha256,
      `Printer P01 production board is stale: ${path}`,
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
      `Printer P01 production GIF is stale: ${path}`,
    );
  }

  add(
    manifest.rosterValidation?.poseCases?.length === 108
      && manifest.propOverlayValidation?.cases?.length === 108
      && manifest.propOverlayValidation?.cases?.every(
        (entry) =>
          same(
            entry.actorPrimaryGripSocket,
            entry.resolvedPropPrimaryGrip,
          )
          && same(entry.primaryGripDelta, [0, 0])
          && entry.actorAlphaContactDistance <= 3
          && entry.propAlphaContactDistance === 0
          && entry.fullPropAlphaVisible === true
          && entry.midpointPlacementUsed === false
          && entry.magicOffset === false
          && entry.fallbackSocket === false,
      ),
    "Printer P01 production 108+108 matrix changed",
  );
  add(
    manifest.reservationValidation?.samples?.length === 31
      && manifest.reservationValidation?.actorCount === 3
      && manifest.reservationValidation
        ?.maximumConcurrentReservations === 2
      && manifest.reservationValidation
        ?.maximumPerInstanceReservations === 1
      && manifest.reservationValidation?.blockedAttemptCount === 1
      && manifest.reservationValidation?.failureCount === 1
      && manifest.reservationValidation?.releaseCount === 3
      && manifest.reservationValidation?.retrySuccessCount === 1
      && manifest.reservationValidation?.releasedAtEnd === true
      && manifest.reservationValidation?.orphanPropCountAtEnd === 0,
    "Printer P01 production 30-second proof changed",
  );

  for (const evidence of manifest.activeOfficeEvidence ?? []) {
    const content = readText(evidence.file);
    add(
      evidence.imported === false
        && !content.includes("printer-p01-production")
        && !content.includes("office.facility.printer.p01.production"),
      `Active Office imported Printer P01 production: ${evidence.file}`,
    );
  }

  const builder = readText(builderPath);
  add(
    builder.includes("approvedPreflightPixelsOnly")
      && builder.includes("primary-grip-to-primary-grip")
      && builder.includes('"reservationSlotContribution": 0')
      && builder.includes('"F8": pending')
      && builder.includes('"activeOfficePromotion": False'),
    "Printer P01 production builder boundary changed",
  );
  const docs = readText(docsPath);
  add(
    docs.includes("Status: F8 owner review pending")
      && docs.includes("108")
      && docs.includes("primary-grip-to-primary-grip")
      && docs.includes("three users")
      && docs.includes("18/20")
      && docs.includes("20/20")
      && docs.includes("F9-F10 remain blocked"),
    "Printer P01 production documentation is incomplete",
  );

  const packageJson = readJson("package.json");
  add(
    packageJson.scripts?.["art:facility:printer:p01:production"]
      === "python scripts/build-office-facility-printer-p01-production.py"
      && packageJson.scripts
        ?.["art:facility:printer:p01:production:rebuild:check"]
        === "python scripts/build-office-facility-printer-p01-production.py --check"
      && packageJson.scripts?.["art:facility:printer:p01:production:check"]
        === "node scripts/office-facility-printer-p01-production-check.mjs"
      && packageJson.scripts?.["art:facility:printer:p01:check"]
        ?.includes("office-facility-printer-p01-production-check.mjs"),
    "Printer P01 production package scripts are missing",
  );
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
}

if (failures.length) {
  process.stderr.write(`${failures.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    "Printer P01 production check passed: approved preflight pixels, "
      + "108 base poses, 108 exact primary-grip overlays, two independent "
      + "instances, three-user 30-second proof, F8 pending, zero slots.\n",
  );
}
