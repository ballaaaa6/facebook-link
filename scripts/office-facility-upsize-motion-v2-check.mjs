import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  validateOfficeFacilityUpsizeMotionV2Manifest,
} from "../packages/contracts/src/officeFacilityUpsizeMotionV2.ts";
import {
  pngSize,
  readJson,
  readText,
  recursiveFiles,
  root,
  same,
  sha256,
} from "./office-production-check-utils.mjs";

const manifestPath =
  "assets/game/manifests/office-facility-upsize-motion-v2.json";
const processedRoot =
  "assets/game/processed/office-facility-upsize-motion-v2";
const reviewRoot =
  "assets/art/layout-references/office-facility-upsize-motion-v2";
const assetBuilder =
  "scripts/office_facility_upsize_motion_v2_assets.py";
const reviewBuilder =
  "scripts/build-office-facility-upsize-motion-v2.py";
const docsPath =
  "docs/art/OFFICE_FACILITY_UPSIZE_MOTION_V2.md";

const failures = [];
const add = (condition, message) => {
  if (!condition) failures.push(message);
};

const gifSize = (path) => {
  const bytes = readFileSync(join(root, path));
  add(
    ["GIF87a", "GIF89a"].includes(bytes.toString("ascii", 0, 6)),
    `${path} is not a GIF`,
  );
  return [bytes.readUInt16LE(6), bytes.readUInt16LE(8)];
};

function collectAssets(manifest) {
  const assets = new Map();
  const pending = [manifest];
  while (pending.length) {
    const value = pending.pop();
    if (!value || typeof value !== "object") continue;
    if (
      typeof value.file === "string"
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
  const manifest = readJson(manifestPath);
  for (const issue of validateOfficeFacilityUpsizeMotionV2Manifest(manifest)) {
    failures.push(`Motion V2 contract: ${issue}`);
  }

  add(
    manifest.decisionBoundary.productionV1.manifestSha256
      === sha256(manifest.decisionBoundary.productionV1.manifest),
    "rejected V1 evidence hash changed",
  );
  add(
    manifest.sourcePolicy.promptRecord.sha256
      === sha256(manifest.sourcePolicy.promptRecord.file),
    "ImageGen prompt record changed",
  );
  add(
    manifest.roomIsolation.f9ManifestSha256
      === sha256(manifest.roomIsolation.f9Manifest),
    "F9 isolation evidence changed",
  );

  const assets = collectAssets(manifest);
  for (const [path, record] of assets) {
    add(existsSync(join(root, path)), `missing asset: ${path}`);
    if (!existsSync(join(root, path))) continue;
    add(sha256(path) === record.sha256, `asset hash changed: ${path}`);
    const actualSize = path.endsWith(".gif") ? gifSize(path) : pngSize(path);
    add(same(actualSize, record.size), `asset size changed: ${path}`);
  }

  const expectedComponents = new Map([
    ["coffee-machine-c02", 12],
    ["water-dispenser-w02", 12],
    ["vending-machine-u02", 16],
    ["massage-chair-r03", 12],
  ]);
  const expectedReviewFiles = new Set([
    `${reviewRoot}/00-motion-v2-batch-review.png`,
    `${reviewRoot}/source/IMAGEGEN_PROMPTS.md`,
  ]);
  for (const family of manifest.families) {
    add(
      family.parts.length === expectedComponents.get(family.slug),
      `${family.slug} authored part count changed`,
    );
    add(
      family.parts.every(
        (part) =>
          part.sourceRecord.sourceCellTouchesAtlasBoundary === false
          && part.sourceRecord.role === part.role
          && part.sourceRecord.phase === part.phase,
      ),
      `${family.slug} source ownership changed`,
    );
    add(
      family.seamLoop.frames.every((frame) => frame.size[0] === 96),
      `${family.slug} runtime seam size changed`,
    );
    add(
      family.finiteUse.states.at(0) === family.finiteUse.states.at(-1)
        && family.finiteUse.frames.at(0).sha256
          === family.finiteUse.frames.at(-1).sha256,
      `${family.slug} finite sequence no longer returns to idle`,
    );
    expectedReviewFiles.add(family.atlas.chroma);
    expectedReviewFiles.add(family.atlas.alpha);
    expectedReviewFiles.add(family.seamLoop.gif.file);
    expectedReviewFiles.add(family.finiteUse.interactionGif.file);
    for (const review of family.reviewOutputs) {
      expectedReviewFiles.add(review.file);
    }
  }

  const expectedProcessed = [...assets.keys()]
    .filter((path) => path.startsWith(`${processedRoot}/`))
    .sort();
  add(
    same(recursiveFiles(processedRoot), expectedProcessed),
    "processed Motion V2 file set contains missing or untracked files",
  );
  add(
    same(recursiveFiles(reviewRoot), [...expectedReviewFiles].sort()),
    "review/source Motion V2 file set contains missing or untracked files",
  );

  const assetSource = readText(assetBuilder);
  const forbiddenRuntimeDrawing = [
    "ImageDraw",
    "draw.rectangle",
    "draw.rounded_rectangle",
    "draw.line",
    "draw.arc",
    "draw.ellipse",
    "draw.polygon",
    "putpixel(",
  ];
  add(
    forbiddenRuntimeDrawing.every((token) => !assetSource.includes(token)),
    "runtime asset compositor draws procedural effect pixels",
  );
  add(
    assetSource.includes("ImageOps.fit")
      && assetSource.includes("ImageOps.contain")
      && assetSource.includes("Image.Resampling.NEAREST")
      && assetSource.includes("alpha_composite"),
    "source-only crop/resize/composite pipeline changed",
  );

  const reviewSource = readText(reviewBuilder);
  const docs = readText(docsPath);
  const packageJson = readJson("package.json");
  add(
    reviewSource.includes("build_asset_outputs")
      && reviewSource.includes("visual owner review remains pending"),
    "review builder no longer consumes the source-only asset pipeline",
  );
  add(
    docs.includes("V1 motion artwork rejection")
      && docs.includes("No procedural runtime effect pixels")
      && docs.includes("pending-owner-review"),
    "Motion V2 documentation is incomplete",
  );
  add(
    packageJson.scripts["art:facility:upsize:motion:v2"]
      === "python scripts/build-office-facility-upsize-motion-v2.py"
      && packageJson.scripts["art:facility:upsize:motion:v2:rebuild:check"]
      === "python scripts/build-office-facility-upsize-motion-v2.py --check"
      && packageJson.scripts["art:facility:upsize:motion:v2:check"]
      === "node scripts/office-facility-upsize-motion-v2-check.mjs",
    "Motion V2 package commands are incomplete",
  );
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
}

if (failures.length) {
  console.error("Office Facility Motion Artwork V2 check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  "Office Facility Motion Artwork V2 check passed: "
  + "52 ImageGen-authored components, 16 A-D seam frames, "
  + "24 finite-use frames, four interaction GIFs; "
  + "procedural runtime effect drawing forbidden and visual review pending.",
);
