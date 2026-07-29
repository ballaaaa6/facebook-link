import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  validateOfficeFacilityServerRackPreflightManifest,
} from "../packages/contracts/src/officeFacilityServerRackPreflight.ts";
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
  "assets/game/manifests/office-facility-server-rack-n01.json";
const auditPath = "assets/game/manifests/office-furniture-master-audit-v1.json";
const docsPath = "docs/art/OFFICE_FACILITY_SERVER_RACK_N01.md";
const builderPath = "scripts/build-office-facility-server-rack-n01.py";
const processedRoot =
  "assets/game/processed/office-facility-family-v1/server-rack-n01";
const reviewRoot =
  "assets/art/layout-references/office-facility-family-v1/server-rack-n01";
const frames = ["a", "b", "c", "d"];
const reviews = [
  ["01-source-ownership.png", [1800, 1100]],
  ["02-clean-front-alpha.png", [1600, 1000]],
  ["03-parts-shell-status.png", [1700, 1000]],
  ["04-scale-actor-tablet.png", [1600, 1000]],
  ["05-geometry-footprint-approach.png", [1600, 1000]],
  ["06-status-loop-a-d-a.png", [1800, 950]],
  ["07-two-instance-preview.png", [1800, 1000]],
  ["08-inspect-tablet-preview.png", [1800, 1000]],
];
const gifs = [
  ["server-status-loop.gif", [512, 512], 4],
  ["anna-inspect-tablet.gif", [768, 512], 12],
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

function gifMatches(path, expectedHash, expectedSize) {
  return typeof path === "string"
    && existsSync(join(root, path))
    && sha256(path) === expectedHash
    && same(gifSize(path), expectedSize);
}

function assetPaths(manifest) {
  return [
    manifest.sourceAuthority.front.keyedAsset.file,
    manifest.sourceAuthority.front.ownershipMaskAsset.file,
    manifest.sourceAuthority.status.keyedAsset.file,
    ...Object.values(manifest.parts.front).map(({ file }) => file),
    ...Object.values(manifest.parts.shell).map(({ file }) => file),
    ...manifest.parts.statusFrames.flatMap((frame) => [
      frame.source.file,
      frame.authoring.file,
      frame.runtime.file,
      frame.composite.file,
    ]),
  ].sort();
}

function verifyPngAssets(manifest) {
  const assets = [
    manifest.sourceAuthority.front.keyedAsset,
    manifest.sourceAuthority.front.ownershipMaskAsset,
    manifest.sourceAuthority.status.keyedAsset,
    ...Object.values(manifest.parts.front),
    ...Object.values(manifest.parts.shell),
    ...manifest.parts.statusFrames.flatMap((frame) => [
      frame.source,
      frame.authoring,
      frame.runtime,
      frame.composite,
    ]),
  ];
  for (const asset of assets) {
    add(
      fileHashMatches(asset.file, asset.sha256, asset.size),
      `Server Rack processed asset is missing or stale: ${asset.file}`,
    );
  }
}

try {
  const manifest = readJson(manifestPath);
  const audit = readJson(auditPath);
  for (const issue of validateOfficeFacilityServerRackPreflightManifest(
    manifest,
  )) {
    failures.push(`Server Rack N01 contract: ${issue}`);
  }

  add(
    manifest.sourceAuthority.audit.file === auditPath
      && manifest.sourceAuthority.audit.sha256 === sha256(auditPath),
    "Server Rack source audit hash is stale",
  );
  const auditRecords = new Map(
    audit.records.map((record) => [record.recordId, record]),
  );
  const frontRecord = auditRecords.get(
    manifest.sourceAuthority.front.auditRecordId,
  );
  add(
    frontRecord?.sourcePath === manifest.sourceAuthority.front.sourceFile
      && frontRecord?.sourceSha256
        === manifest.sourceAuthority.front.sourceSha256
      && same(
        frontRecord?.sourceBounds,
        manifest.sourceAuthority.front.sourceBounds,
      )
      && frontRecord?.currentDecision?.decision
        === manifest.sourceAuthority.front.auditDecision,
    "Server Rack front no longer matches its current audit record",
  );
  for (const frame of manifest.sourceAuthority.status.frames) {
    const record = auditRecords.get(frame.auditRecordId);
    add(
      record?.sourcePath === manifest.sourceAuthority.status.sourceFile
        && record?.sourceSha256
          === manifest.sourceAuthority.status.sourceSha256
        && same(record?.sourceBounds, frame.sourceBounds)
        && record?.currentDecision?.masterPixelsSalvageable === true,
      `Server Rack status audit authority changed: ${frame.frameId}`,
    );
  }
  for (const side of manifest.sourceAuthority.rejectedSides) {
    const record = auditRecords.get(side.auditRecordId);
    add(
      record?.currentDecision?.decision === side.decision
        && record?.currentDecision?.masterPixelsSalvageable === false
        && side.used === false,
      `Rejected Server Rack side authority changed: ${side.auditRecordId}`,
    );
  }
  add(
    manifest.sourceAuthority.front.sourceSha256
      === sha256(manifest.sourceAuthority.front.sourceFile)
      && manifest.sourceAuthority.status.sourceSha256
        === sha256(manifest.sourceAuthority.status.sourceFile),
    "Server Rack original master hash is stale",
  );

  verifyPngAssets(manifest);
  add(
    same(recursiveFiles(processedRoot), assetPaths(manifest)),
    "Server Rack processed directory contains an unexpected file",
  );

  const expectedReviewPaths = [
    ...reviews.map(([name]) => `${reviewRoot}/${name}`),
    ...gifs.map(([name]) => `${reviewRoot}/${name}`),
  ];
  add(
    same(manifest.reviewOutputs, expectedReviewPaths)
      && same(
        manifest.reviewEvidence.map(({ path }) => path),
        expectedReviewPaths,
      )
      && same(recursiveFiles(reviewRoot), [...expectedReviewPaths].sort()),
    "Server Rack review output set changed",
  );
  for (const [index, [name, size]] of reviews.entries()) {
    const path = `${reviewRoot}/${name}`;
    const evidence = manifest.reviewEvidence[index];
    add(
      same(evidence.size, size)
        && fileHashMatches(path, evidence.sha256, size),
      `Server Rack review board is missing or stale: ${path}`,
    );
  }
  for (const [gifIndex, [name, size, frameCount]] of gifs.entries()) {
    const path = `${reviewRoot}/${name}`;
    const evidence = manifest.reviewEvidence[reviews.length + gifIndex];
    const gifRecord = gifIndex === 0
      ? manifest.statusLoop.gif
      : manifest.interactionPreview.gif;
    add(
      same(evidence.size, size)
        && gifMatches(path, evidence.sha256, size)
        && gifRecord.file === path
        && gifRecord.sha256 === evidence.sha256
        && gifRecord.frameCount === frameCount,
      `Server Rack review GIF is missing or stale: ${path}`,
    );
  }

  add(
    manifest.parts.statusFrames.every(
      (frame, index) => frame.frameId === frames[index],
    )
      && manifest.statusLoop.transitionChangedPixels.every(
        (pixels) => pixels > 0,
      )
      && manifest.statusLoop.shellChangedPixels === 0
      && manifest.statusLoop.outsideViewportChangedPixels === 0
      && same(manifest.statusLoop.pivotDeltaPixels, [0, 0])
      && manifest.statusLoop.closureMismatchPixels === 0,
    "Server Rack modular motion proof changed",
  );
  add(
    manifest.interactionPreview.timeline.length === 12
      && manifest.interactionPreview.timeline
        .filter(({ tabletVisible }) => tabletVisible)
        .every(({ attachmentDelta }) => same(attachmentDelta, [0, 0]))
      && manifest.interactionPreview.perCharacterOffsets === false
      && manifest.interactionPreview.missingSocketFallback === false
      && manifest.interactionPreview.countsTowardRosterValidation === false
      && manifest.interactionPreview.countsTowardReservationValidation
        === false,
    "Server Rack tablet preview claims invalid production evidence",
  );

  for (const evidence of manifest.activeOfficeEvidence) {
    const content = readText(evidence.file);
    add(
      evidence.imported === false
        && !content.includes("server-rack-n01")
        && !content.includes("office.facility.server-rack.n01"),
      `Active Office imported Server Rack N01: ${evidence.file}`,
    );
  }
  const builder = readText(builderPath);
  add(
    builder.includes("release-qa-noc-sheet-modern-bright-v1-source.png")
      && builder.includes(
        "mechanical-loops-sheet-modern-bright-v1-source.png",
      )
      && !builder.includes(
        "processed/office-library-modern-bright-v1/env-04-release-noc",
      )
      && !builder.includes(
        "processed/office-library-modern-bright-v1/env-12-facility-side",
      ),
    "Server Rack builder source isolation changed",
  );
  const docs = readText(docsPath);
  add(
    docs.includes("Status: visual preflight awaiting owner review")
      && docs.includes("`2 x 1 x 3`")
      && docs.includes("immutableShell + statusViewport[n]")
      && docs.includes("15/20")
      && docs.includes("17/20")
      && docs.includes("F4-F10 remain blocked")
      && docs.includes("does not contribute reservation slots"),
    "Server Rack documentation does not preserve the preflight stop",
  );
  const packageJson = readJson("package.json");
  add(
    packageJson.scripts?.["art:facility:server:n01"]
      === "python scripts/build-office-facility-server-rack-n01.py"
      && packageJson.scripts?.["art:facility:server:n01:rebuild:check"]
        === "python scripts/build-office-facility-server-rack-n01.py --check"
      && packageJson.scripts?.["art:facility:server:n01:check"]
        === "node scripts/office-facility-server-rack-n01-check.mjs"
      && packageJson.scripts?.check.includes(
        "npm run art:facility:server:n01:check",
      ),
    "Server Rack package scripts are missing",
  );
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
}

if (failures.length) {
  process.stderr.write(`${failures.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    "Server Rack N01 visual preflight OK: original-master front, "
      + "viewport-owned A-D-A status loop, exact 2x1x3 geometry, two-instance "
      + "preview, H01 tablet demo, F0-F3 passed, and F4-F10 blocked.\n",
  );
}
