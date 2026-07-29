import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  validateOfficeFacilityServerRackGeneratedPreflightManifest,
} from "../packages/contracts/src/officeFacilityServerRackGeneratedPreflight.ts";
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
  "assets/game/manifests/office-facility-server-rack-n02.json";
const n01ManifestPath =
  "assets/game/manifests/office-facility-server-rack-n01.json";
const builderPath = "scripts/build-office-facility-server-rack-n02.py";
const docsPath = "docs/art/OFFICE_FACILITY_SERVER_RACK_N02.md";
const processedRoot =
  "assets/game/processed/office-facility-family-v1/server-rack-n02";
const reviewRoot =
  "assets/art/layout-references/office-facility-family-v1/server-rack-n02";
const sourceRoot = `${reviewRoot}/source`;
const promptPath = `${sourceRoot}/IMAGEGEN_PROMPTS.md`;
const sources = [
  ["front-anchor", "01-server-rack-front-anchor-chroma.png", [1024, 1536], 0],
  ["turnaround", "02-server-rack-turnaround-chroma.png", [1774, 887], 1],
  ["status-kit", "03-server-status-kit-chroma.png", [1254, 1254], 1],
];
const reviews = [
  ["01-four-side-turnaround.png", [1800, 1000]],
  ["02-alpha-source-ownership.png", [1800, 1100]],
  ["03-clean-four-orientations.png", [1800, 1000]],
  ["04-scale-2x2x4-vs-actor.png", [1600, 1000]],
  ["05-footprint-renderbox-approach.png", [1600, 1000]],
  ["06-parts-shell-status-composite.png", [1700, 1000]],
  ["07-status-loop-a-d-a.png", [1800, 950]],
  ["08-orientations-two-instances.png", [1800, 1000]],
  ["09-empty-hand-inspect-preview.png", [1800, 1000]],
];
const gifs = [
  ["server-rack-n02-status-loop.gif", [512, 512], 4, 220],
  ["anna-empty-hand-inspect.gif", [768, 512], 12, 240],
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

function gifMatches(path, expectedHash, size) {
  return typeof path === "string"
    && existsSync(join(root, path))
    && sha256(path) === expectedHash
    && same(gifSize(path), size);
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
  const n01 = readJson(n01ManifestPath);
  for (const issue of
    validateOfficeFacilityServerRackGeneratedPreflightManifest(manifest)) {
    failures.push(`Server Rack N02 contract: ${issue}`);
  }
  add(
    manifest.status === "visual-preflight-owner-approved"
      && manifest.productionStage === "visual-preflight-approved"
      && manifest.visualApproval?.status === "owner-approved"
      && manifest.visualApproval?.approvedOn === "2026-07-30"
      && manifest.visualApproval?.approvedRevision === "n02-preflight-r01"
      && manifest.visualApproval?.approvedReviewHashes?.length === 11
      && manifest.visualApproval.approvedReviewHashes.every(
        ({ path, sha256: expected }) =>
          manifest.reviewEvidence.some(
            (record) =>
              record.path === path
              && record.sha256 === expected
              && sha256(path) === expected,
          ),
      )
      && same(
        manifest.visualApproval?.unlocks,
        ["F4", "F5", "F6", "F7", "F8"],
      )
      && manifest.permissions?.fullSystemBuild === true,
    "Server Rack N02 exact visual approval or production authority changed",
  );

  add(
    n01.status === "superseded-owner-redesign-requested"
      && n01.ownerDecision?.supersededBy
        === "office.facility.server-rack.n02"
      && manifest.supersedes?.manifest === n01ManifestPath
      && manifest.supersedes?.manifestSha256 === sha256(n01ManifestPath),
    "Server Rack N02 no longer matches the N01 redesign decision",
  );
  add(
    manifest.generation?.workflow === "built-in-imagegen"
      && manifest.generation?.promptRecord?.file === promptPath
      && manifest.generation?.promptRecord?.sha256 === sha256(promptPath),
    "Server Rack N02 ImageGen prompt authority is stale",
  );
  for (const [index, [role, name, size, inputCount]] of sources.entries()) {
    const source = manifest.generation?.sources?.[index];
    const path = `${sourceRoot}/${name}`;
    add(
      source?.role === role
        && source.file === path
        && source.sha256 === sha256(path)
        && same(source.size, size)
        && source.inputImageCount === inputCount
        && source.identityReference
          === (index === 0 ? null : "front-anchor")
        && source.extractionMethod === "generated-source-chroma-key"
        && source.ownership?.length === [1, 4, 4][index]
        && source.ownership.every(
          (entry) =>
            entry.cellBoundaryContact === false
            && entry.visiblePixels > 0
            && entry.ownedComponentCount > 0
            && entry.ownedBounds[0] > entry.sourceCell[0]
            && entry.ownedBounds[1] > entry.sourceCell[1]
            && entry.ownedBounds[2] < entry.sourceCell[2]
            && entry.ownedBounds[3] < entry.sourceCell[3],
        ),
      `Server Rack N02 source ownership changed: ${role}`,
    );
  }

  add(
    same(manifest.render?.physicalScale, {
      width: 2, depth: 2, height: 4, unit: "tile",
    })
      && same(manifest.render?.footprint, {
        width: 2, depth: 2, unit: "tile",
      })
      && same(manifest.render?.renderBox, {
        width: 3, height: 4, unit: "tile",
      })
      && same(
        manifest.render?.requiredOrientations,
        ["front", "left", "right", "back"],
      )
      && manifest.render?.orientations?.length === 4
      && same(manifest.render?.basePivotRuntime, [48, 124])
      && same(manifest.render?.sortPivotRuntime, [48, 124]),
    "Server Rack N02 geometry or four-side identity changed",
  );
  add(
    manifest.statusLoop?.compositionFormula
      === "immutableShell[orientation] + statusViewport[n]"
      && same(manifest.statusLoop?.transition, ["a", "b", "c", "d", "a"])
      && manifest.statusLoop?.transitionChangedPixels.every(
        (pixels) => pixels > 0,
      )
      && manifest.statusLoop?.shellChangedPixels === 0
      && manifest.statusLoop?.outsideViewportChangedPixels === 0
      && same(manifest.statusLoop?.pivotDeltaPixels, [0, 0])
      && manifest.statusLoop?.closureMismatchPixels === 0,
    "Server Rack N02 modular status loop changed",
  );
  add(
    manifest.interactionPreview?.semanticAction === "inspect-front"
      && manifest.interactionPreview?.visualPoseAuthority === "interact-front"
      && manifest.interactionPreview?.heldProp === false
      && manifest.interactionPreview?.h01Dependency === false
      && manifest.interactionPreview?.handoff === false
      && manifest.interactionPreview?.timeline?.length === 12
      && manifest.interactionPreview.timeline.every(
        ({ heldPropVisible }) => heldPropVisible === false,
      )
      && manifest.interactionPreview?.placement?.magicOffset === false
      && manifest.interactionPreview?.placement?.missingSocketFallback
        === false
      && manifest.productionTargets?.builtPoseCases === 0
      && manifest.productionTargets?.builtOrientationCompositeCases === 0,
    "Server Rack N02 must remain an empty-hand non-production preview",
  );

  const processedAssets = collectProcessedAssets(manifest);
  for (const [path, evidence] of processedAssets.entries()) {
    add(
      fileHashMatches(path, evidence.sha256, evidence.size),
      `Server Rack N02 processed asset is missing or stale: ${path}`,
    );
  }
  add(
    same(
      recursiveFiles(processedRoot),
      [...processedAssets.keys()].sort(),
    ),
    "Server Rack N02 processed directory contains an unexpected file",
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
    "Server Rack N02 review output order changed",
  );
  for (const [index, [name, size]] of reviews.entries()) {
    const path = `${reviewRoot}/${name}`;
    const evidence = manifest.reviewEvidence[index];
    add(
      evidence.kind === "png"
        && same(evidence.size, size)
        && fileHashMatches(path, evidence.sha256, size),
      `Server Rack N02 review board is missing or stale: ${path}`,
    );
  }
  for (const [index, [name, size, frameCount, durationMs]] of gifs.entries()) {
    const path = `${reviewRoot}/${name}`;
    const evidence = manifest.reviewEvidence[reviews.length + index];
    add(
      evidence.kind === "gif"
        && evidence.frameCount === frameCount
        && evidence.durationMs === durationMs
        && same(evidence.size, size)
        && gifMatches(path, evidence.sha256, size),
      `Server Rack N02 review GIF is missing or stale: ${path}`,
    );
  }
  const expectedReviewFiles = [
    promptPath,
    ...sources.map(([, name]) => `${sourceRoot}/${name}`),
    ...expectedReviews,
  ].sort();
  add(
    same(recursiveFiles(reviewRoot), expectedReviewFiles),
    "Server Rack N02 review directory contains an unexpected file",
  );

  for (const evidence of manifest.activeOfficeEvidence ?? []) {
    const content = readText(evidence.file);
    add(
      evidence.imported === false
        && !content.includes("server-rack-n02")
        && !content.includes("office.facility.server-rack.n02"),
      `Active Office imported Server Rack N02: ${evidence.file}`,
    );
  }
  const builder = readText(builderPath);
  add(
    builder.includes("fresh built-in ImageGen sources")
      && builder.includes('"serverRackN01PixelReuse": False')
      && !builder.includes(
        "release-qa-noc-sheet-modern-bright-v1-source.png",
      )
      && !builder.includes(
        "mechanical-loops-sheet-modern-bright-v1-source.png",
      )
      && !builder.includes("office-held-props-h01.json"),
    "Server Rack N02 builder source or held-prop isolation changed",
  );
  const docs = readText(docsPath);
  add(
    docs.includes(
      "Status: visual preflight owner-approved; isolated production authorized",
    )
      && docs.includes("`2 x 2 x 4`")
      && docs.includes("front, left, right, and back")
      && docs.includes(
        "immutableShell[orientation] + statusViewport[n]",
      )
      && docs.includes("No held prop")
      && docs.includes("15/20")
      && docs.includes("17/20")
      && docs.includes("F4-F8 are authorized")
      && docs.includes("F9-F10 remain blocked"),
    "Server Rack N02 documentation does not preserve visual approval scope",
  );
  const packageJson = readJson("package.json");
  add(
    packageJson.scripts?.["art:facility:server:n02"]
      === "python scripts/build-office-facility-server-rack-n02.py"
      && packageJson.scripts?.["art:facility:server:n02:rebuild:check"]
        === "python scripts/build-office-facility-server-rack-n02.py --check"
      && packageJson.scripts?.["art:facility:server:n02:check"]
        === "node scripts/office-facility-server-rack-n02-check.mjs"
      && packageJson.scripts?.check.includes(
        "npm run art:facility:server:n02:check",
      ),
    "Server Rack N02 package scripts are missing",
  );
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
}

if (failures.length) {
  process.stderr.write(`${failures.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    "Server Rack N02 approved visual preflight OK: fresh 2x2x4 four-side family, "
      + "viewport-local A-D-A status loop, empty-hand I01 demo, two-instance "
      + "preview, F0-F3 passed, isolated F4-F8 production authorized, and "
      + "F9-F10 blocked.\n",
  );
}
