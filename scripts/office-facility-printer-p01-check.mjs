import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  validateOfficeFacilityPrinterGeneratedPreflightManifest,
} from "../packages/contracts/src/officeFacilityPrinterGeneratedPreflight.ts";
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
  "assets/game/manifests/office-facility-printer-p01.json";
const builderPath = "scripts/build-office-facility-printer-p01.py";
const docsPath = "docs/art/OFFICE_FACILITY_PRINTER_P01.md";
const processedRoot =
  "assets/game/processed/office-facility-family-v1/printer-p01";
const reviewRoot =
  "assets/art/layout-references/office-facility-family-v1/printer-p01";
const sourceRoot = `${reviewRoot}/source`;
const promptPath = `${sourceRoot}/IMAGEGEN_PROMPTS.md`;
const sources = [
  ["identity-anchor", "01-printer-front-anchor-chroma.png", [887, 1774]],
  ["motion-parts-atlas", "02-printer-motion-parts-chroma.png", [1254, 1254]],
];
const reviews = [
  ["01-clean-front-identity.png", [1500, 900]],
  ["02-source-ownership-alpha.png", [1700, 950]],
  ["03-modular-parts.png", [1700, 950]],
  ["04-scale-2x2x4.png", [1600, 950]],
  ["05-footprint-approach-routes.png", [1700, 950]],
  ["06-processing-seam-loop.png", [1800, 900]],
  ["07-finite-output-sequence.png", [1900, 950]],
  ["08-i01-h01-two-instance-preview.png", [1900, 1050]],
];
const gifs = [
  ["printer-p01-processing-loop.gif", [384, 512], 5, 260],
  ["printer-p01-anna-paper.gif", [768, 512], 9, 260],
  ["printer-p01-anna-envelope.gif", [768, 512], 9, 260],
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
  for (const issue of
    validateOfficeFacilityPrinterGeneratedPreflightManifest(manifest)) {
    failures.push(`Printer P01 contract: ${issue}`);
  }

  add(
    manifest.sourcePolicy?.freshImageGeneration === true
      && manifest.sourcePolicy?.identityAnchorTextOnly === true
      && manifest.sourcePolicy?.originalMasterPixelReuse === false
      && manifest.sourcePolicy?.processedPrinterPixelReuse === false
      && manifest.sourcePolicy?.foreignFamilyPixelReuse === false
      && manifest.sourcePolicy?.activeOfficePixelReuse === false
      && manifest.sourcePolicy?.missingAssetFallback === false
      && manifest.sourcePolicy?.promptRecord?.file === promptPath
      && manifest.sourcePolicy?.promptRecord?.sha256 === sha256(promptPath)
      && manifest.sourcePolicy?.promptRecord?.tool === "built-in image_gen",
    "Printer P01 ImageGen source policy is stale",
  );
  for (const [index, [role, name, size]] of sources.entries()) {
    const path = `${sourceRoot}/${name}`;
    const source = manifest.sourcePolicy?.sourceFiles?.[index];
    add(
      source?.role === role
        && source.file === path
        && source.sha256 === sha256(path)
        && same(pngSize(path), size),
      `Printer P01 generated source changed: ${role}`,
    );
  }
  add(
    same(manifest.sourcePolicy?.motionAtlasReferenceInputs, [
      `${sourceRoot}/01-printer-front-anchor-chroma.png`,
    ]),
    "Printer P01 motion atlas identity input changed",
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
      && same(manifest.render?.requiredOrientations, ["front"])
      && same(manifest.render?.basePivotRuntime, [48, 124])
      && same(manifest.render?.sortPivotRuntime, [48, 124])
      && manifest.render?.collisionChangesDuringMotion === false
      && manifest.render?.footprintChangesDuringMotion === false,
    "Printer P01 2x2x4 geometry changed",
  );

  add(
    manifest.animation?.compositionFormula
      === "immutableShell + statusViewport[frame] + scannerLight[frame] + outputTray[state] + outputChild[state]"
      && same(
        manifest.animation?.processingLoop,
        ["A", "B", "C", "D", "A"],
      )
      && same(manifest.animation?.finiteOutputSequence, [
        "idle", "wake", "processing", "tray-half", "tray-open",
        "output-ready", "pickup", "tray-half", "tray-closed", "idle",
      ])
      && manifest.animation?.shellMoves === false
      && same(manifest.animation?.pivotDeltaPixels, [0, 0])
      && same(manifest.animation?.footprintDeltaTiles, [0, 0])
      && manifest.animation?.outputSelectionRandomPerFrame === false,
    "Printer P01 modular motion changed",
  );

  add(
    same(manifest.interaction?.jobOutputMap, {
      "print-document": "held.paper-sheet",
      "prepare-mail": "held.envelope",
    })
      && manifest.interaction?.outputSelectionRule
        === "job-driven-once-per-visit"
      && manifest.interaction?.propSocketRule
        === "midpoint-primary-secondary"
      && same(manifest.interaction?.attachmentDelta, [0, 0])
      && manifest.interaction?.newCoordinateSystem === false
      && same(
        manifest.interaction?.plannedInstanceIds,
        ["printer-01", "printer-02"],
      )
      && manifest.interaction?.plannedFamilyInstanceCount === 2
      && manifest.interaction?.capacityPerInstance === 1
      && manifest.interaction?.independentReservations === true,
    "Printer P01 I01/H01 or instance plan changed",
  );

  add(
    manifest.gates?.F0?.status === "passed"
      && manifest.gates?.F2?.status === "passed"
      && manifest.gates?.F3?.status === "pending-owner-review"
      && manifest.gates?.F4?.status === "blocked"
      && manifest.gates?.F8?.status === "blocked"
      && manifest.gates?.F9?.status === "blocked"
      && manifest.gates?.F10?.status === "blocked"
      && manifest.interaction?.reservationSlotContribution === 0
      && manifest.interaction
        ?.plannedReservationSlotContributionAfterF8 === 2
      && manifest.interaction?.facilityV1ReadySlotsBeforePrinterF8 === 18
      && manifest.interaction
        ?.facilityV1ReadySlotsAfterPrinterF8Target === 20
      && manifest.permissions?.fullSystemBuild === false
      && manifest.permissions?.reservationSlotActivation === false
      && manifest.permissions?.activeOfficePromotion === false
      && manifest.ownerDecision === null,
    "Printer P01 exceeded F3 preflight authority",
  );

  add(
    manifest.preflightValidation?.productionRosterCasesBuilt === 0
      && manifest.preflightValidation
        ?.reservationSimulationSecondsBuilt === 0
      && manifest.preflightValidation?.attachmentFailures === 0
      && manifest.preflightValidation?.foregroundMaskUses === 0
      && manifest.preflightValidation?.magicOffsetCases === 0
      && manifest.preflightValidation?.fallbackSocketCases === 0,
    "Printer P01 fabricated production proof",
  );

  const processedAssets = collectProcessedAssets(manifest);
  for (const [path, evidence] of processedAssets.entries()) {
    add(
      fileHashMatches(path, evidence.sha256, evidence.size),
      `Printer P01 processed asset is stale: ${path}`,
    );
  }
  add(
    processedAssets.size === 20
      && same(
        recursiveFiles(processedRoot),
        [...processedAssets.keys()].sort(),
      ),
    "Printer P01 processed directory changed",
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
    "Printer P01 review order changed",
  );
  for (const [index, [name, size]] of reviews.entries()) {
    const path = `${reviewRoot}/${name}`;
    const evidence = manifest.reviewEvidence?.[index];
    add(
      evidence?.kind === "png"
        && same(evidence.size, size)
        && fileHashMatches(path, evidence.sha256, size),
      `Printer P01 board is stale: ${path}`,
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
      `Printer P01 GIF is stale: ${path}`,
    );
  }
  add(
    same(recursiveFiles(reviewRoot), [
      ...expectedReviews,
      ...sources.map(([, name]) => `${sourceRoot}/${name}`),
      promptPath,
    ].sort()),
    "Printer P01 review/source directory changed",
  );

  for (const evidence of manifest.activeOfficeEvidence ?? []) {
    const content = readText(evidence.file);
    add(
      evidence.imported === false
        && !content.includes("printer-p01")
        && !content.includes("office.facility.printer.p01"),
      `Active Office imported Printer P01: ${evidence.file}`,
    );
  }

  const builder = readText(builderPath);
  add(
    builder.includes("chroma_key")
      && builder.includes("midpoint-primary-secondary")
      && builder.includes("reservationSlotContribution")
      && builder.includes('"fullSystemBuild": False')
      && builder.includes('"activeOfficePromotion": False'),
    "Printer P01 builder boundary changed",
  );
  const docs = readText(docsPath);
  add(
    docs.includes("Status: F3 owner review pending")
      && docs.includes("2 x 2 x 4")
      && docs.includes("A -> B -> C -> D -> A")
      && docs.includes("held.paper-sheet")
      && docs.includes("held.envelope")
      && docs.includes("18/20")
      && docs.includes("20/20")
      && docs.includes("F9-F10 remain blocked"),
    "Printer P01 documentation is incomplete",
  );

  const packageJson = readJson("package.json");
  add(
    packageJson.scripts?.["art:facility:printer:p01"]
      === "python scripts/build-office-facility-printer-p01.py"
      && packageJson.scripts?.["art:facility:printer:p01:rebuild:check"]
        === "python scripts/build-office-facility-printer-p01.py --check"
      && packageJson.scripts?.["art:facility:printer:p01:check"]
        === "node scripts/office-facility-printer-p01-check.mjs"
      && packageJson.scripts?.["art:facility:refrigerator:r01:check"]
        ?.includes("npm run art:facility:printer:p01:check")
      && packageJson.scripts?.check.includes(
        "npm run art:facility:refrigerator:r01:check",
      ),
    "Printer P01 package scripts are missing",
  );
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
}

if (failures.length) {
  process.stderr.write(`${failures.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    "Printer P01 check passed: fresh 2x2x4 identity, modular A-D-A "
      + "processing loop, finite tray output, I01/H01 previews, F3 pending, "
      + "zero active slots.\n",
  );
}
