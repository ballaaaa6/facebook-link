import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  validateOfficeFacilityRefrigeratorGeneratedPreflightManifest,
} from "../packages/contracts/src/officeFacilityRefrigeratorGeneratedPreflight.ts";
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
  "assets/game/manifests/office-facility-refrigerator-r01.json";
const builderPath = "scripts/build-office-facility-refrigerator-r01.py";
const docsPath = "docs/art/OFFICE_FACILITY_REFRIGERATOR_R01.md";
const processedRoot =
  "assets/game/processed/office-facility-family-v1/refrigerator-r01";
const reviewRoot =
  "assets/art/layout-references/office-facility-family-v1/refrigerator-r01";
const sourceRoot = `${reviewRoot}/source`;
const promptPath = `${sourceRoot}/IMAGEGEN_PROMPTS.md`;
const sources = [
  ["front-anchor", "01-refrigerator-front-anchor-chroma.png", [1024, 1536], 0],
  ["motion-parts", "02-refrigerator-motion-parts-chroma.png", [1254, 1254], 1],
];
const reviews = [
  ["01-new-identity-closed-open.png", [1600, 1000]],
  ["02-alpha-source-ownership.png", [1800, 1100]],
  ["03-modular-shell-door-interior.png", [1700, 1050]],
  ["04-scale-2x2x4-and-geometry.png", [1600, 1000]],
  ["05-finite-open-close-transition.png", [1800, 950]],
  ["06-i01-h01-reuse-and-random-pool.png", [1800, 1050]],
  ["07-approach-output-and-interruption.png", [1700, 1000]],
  ["08-anna-open-pick-close-timeline.png", [1800, 1100]],
];
const gifs = [
  ["refrigerator-open-close.gif", [512, 512], 6, 260],
  ["anna-open-pick-close.gif", [768, 512], 12, 260],
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
    validateOfficeFacilityRefrigeratorGeneratedPreflightManifest(manifest)) {
    failures.push(`Refrigerator R01 contract: ${issue}`);
  }

  add(
    manifest.generation?.workflow === "built-in-imagegen"
      && manifest.generation?.promptRecord?.file === promptPath
      && manifest.generation?.promptRecord?.sha256 === sha256(promptPath),
    "Refrigerator R01 ImageGen prompt authority is stale",
  );
  for (const [index, [role, name, size, inputImageCount]] of
    sources.entries()) {
    const path = `${sourceRoot}/${name}`;
    const source = manifest.generation?.sources?.[index];
    add(
      source?.role === role
        && source.file === path
        && source.sha256 === sha256(path)
        && same(source.size, size)
        && source.inputImageCount === inputImageCount
        && source.identityReference
          === (index === 0 ? null : "front-anchor")
        && source.extractionMethod === "generated-source-chroma-key"
        && source.ownership?.length === [1, 4][index]
        && source.ownership.every(
          (entry) =>
            entry.cellBoundaryContact === false
            && entry.visiblePixels > 0,
        ),
      `Refrigerator R01 generated source changed: ${role}`,
    );
  }

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
    "Refrigerator R01 2x2x4 geometry changed",
  );

  add(
    manifest.finiteAnimation?.kind === "reversible-finite-state"
      && manifest.finiteAnimation?.repeatingAmbientLoop === false
      && manifest.finiteAnimation?.compositionFormula
        === "immutableShell + lowerDoor[state]"
      && same(
        manifest.finiteAnimation?.reviewTransition,
        ["closed", "half", "open", "half", "closed"],
      )
      && manifest.finiteAnimation.transitionChangedPixels.every(
        (count) => count > 0,
      )
      && same(
        manifest.finiteAnimation?.changedPixelsOutsideDoorSwingRegion,
        [0, 0, 0, 0],
      )
      && manifest.finiteAnimation?.shellChangedPixels === 0
      && same(manifest.finiteAnimation?.pivotDeltaPixels, [0, 0])
      && same(manifest.finiteAnimation?.footprintDeltaTiles, [0, 0])
      && manifest.finiteAnimation?.closedEndpointMismatchPixels === 0,
    "Refrigerator R01 modular finite motion changed",
  );

  add(
    manifest.interactionPreview?.semanticAction === "interact-use"
      && manifest.interactionPreview?.visualPoseAuthority === "interact-front"
      && same(
        manifest.interactionPreview?.selection?.pool,
        ["held.water-bottle", "held.yogurt-box"],
      )
      && manifest.interactionPreview?.selection?.selectedOncePerVisit === true
      && manifest.interactionPreview?.selection?.frameStable === true
      && manifest.interactionPreview?.handoff?.newCoordinateSystem === false
      && same(
        manifest.interactionPreview?.handoff?.attachmentDelta,
        [0, 0],
      )
      && manifest.interactionPreview?.handoff?.magicOffset === false
      && manifest.interactionPreview?.handoff?.missingSocketFallback === false
      && manifest.interactionPreview?.handoff?.foregroundMaskUses === 0
      && manifest.interactionPreview?.timeline?.length === 12
      && manifest.interactionPreview.timeline.every(
        ({ attachmentDelta, magicOffset, fallbackSocket }) =>
          (attachmentDelta === null || same(attachmentDelta, [0, 0]))
          && magicOffset === false
          && fallbackSocket === false,
      ),
    "Refrigerator R01 must reuse I01/H01 with zero attachment drift",
  );

  add(
    manifest.productionTargets?.builtPoseCases === 0
      && manifest.productionTargets?.builtPropOverlayCases === 0
      && manifest.productionTargets?.reservationSlotContribution === 0
      && manifest.productionTargets
        ?.plannedReservationSlotContributionAfterF8 === 1
      && manifest.productionTargets
        ?.facilityV1ReadySlotsBeforeRefrigeratorF8 === 17
      && manifest.productionTargets
        ?.facilityV1ReadySlotsAfterRefrigeratorF8Target === 18
      && manifest.permissions?.fullSystemBuild === true
      && manifest.permissions?.reservationSlotActivation === false,
    "Refrigerator R01 fabricated production or slot authority",
  );

  const processedAssets = collectProcessedAssets(manifest);
  for (const [path, evidence] of processedAssets.entries()) {
    add(
      fileHashMatches(path, evidence.sha256, evidence.size),
      `Refrigerator R01 processed asset is missing or stale: ${path}`,
    );
  }
  add(
    same(recursiveFiles(processedRoot), [...processedAssets.keys()].sort()),
    "Refrigerator R01 processed directory contains an unexpected file",
  );

  const expectedReviews = [
    ...reviews.map(([name]) => `${reviewRoot}/${name}`),
    ...gifs.map(([name]) => `${reviewRoot}/${name}`),
  ];
  add(
    same(manifest.reviewOutputs, expectedReviews)
      && same(
        manifest.reviewEvidence?.map(({ file }) => file),
        expectedReviews,
      ),
    "Refrigerator R01 review output order changed",
  );
  for (const [index, [name, size]] of reviews.entries()) {
    const path = `${reviewRoot}/${name}`;
    const evidence = manifest.reviewEvidence?.[index];
    add(
      evidence?.kind === "png"
        && same(evidence.size, size)
        && fileHashMatches(path, evidence.sha256, size),
      `Refrigerator R01 review board is missing or stale: ${path}`,
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
      `Refrigerator R01 review GIF is missing or stale: ${path}`,
    );
  }
  const expectedReviewFiles = [
    promptPath,
    ...sources.map(([, name]) => `${sourceRoot}/${name}`),
    ...expectedReviews,
  ].sort();
  add(
    same(recursiveFiles(reviewRoot), expectedReviewFiles),
    "Refrigerator R01 review directory contains an unexpected file",
  );

  for (const path of manifest.scopeExclusions ?? []) {
    if (!path.includes(".")) continue;
    const content = readText(path);
    add(
      !content.includes("refrigerator-r01")
        && !content.includes("office.facility.refrigerator.r01"),
      `Excluded runtime file imported Refrigerator R01: ${path}`,
    );
  }

  const builder = readText(builderPath);
  add(
    builder.includes("fresh front-only 2x2x4 refrigerator")
      && builder.includes('"originalMasterPixelReuse": False')
      && builder.includes('"newCoordinateSystem": False')
      && !builder.includes(
        "facility-lounge-sheet-modern-bright-v1-source.png",
      )
      && !builder.includes(
        "office-library-modern-bright-v1/env-05-facility-lounge/"
          + "refrigerator.modern.png",
      ),
    "Refrigerator R01 builder source or I01/H01 reuse changed",
  );

  const docs = readText(docsPath);
  add(
    docs.includes("Status: visual and motion preflight owner-approved")
      && docs.includes("`2 x 2 x 4`")
      && docs.includes("immutableShell + lowerDoor[state]")
      && docs.includes("held.water-bottle")
      && docs.includes("held.yogurt-box")
      && docs.includes("17/20")
      && docs.includes("18/20")
      && docs.includes("F4-F8 isolated production is authorized")
      && docs.includes("F9-F10 remain blocked"),
    "Refrigerator R01 documentation is incomplete",
  );

  const packageJson = readJson("package.json");
  add(
    packageJson.scripts?.["art:facility:refrigerator:r01"]
      === "python scripts/build-office-facility-refrigerator-r01.py"
      && packageJson.scripts
        ?.["art:facility:refrigerator:r01:rebuild:check"]
        === "python scripts/build-office-facility-refrigerator-r01.py --check"
      && packageJson.scripts?.["art:facility:refrigerator:r01:check"]
        === "node scripts/office-facility-refrigerator-r01-check.mjs"
          + " && node scripts/office-facility-refrigerator-r01-production-check.mjs"
          + " && npm run art:facility:printer:p01:check"
      && packageJson.scripts?.check.includes(
        "npm run art:facility:refrigerator:r01:check",
      ),
    "Refrigerator R01 package scripts are missing",
  );
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
}

if (failures.length) {
  process.stderr.write(`${failures.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    "Refrigerator R01 owner-approved visual-motion preflight OK: fresh 2x2x4 front family, "
      + "modular reversible door, existing I01/H01 handoff, stable two-prop "
      + "visit selection, exact review hashes locked, production unlocked, "
      + "zero active slots, and F4-F10 blocked.\n",
  );
}
