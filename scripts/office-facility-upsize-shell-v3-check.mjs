import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  validateOfficeFacilityUpsizeShellV3,
} from "../packages/contracts/src/officeFacilityUpsizeShellV3.ts";
import {
  collectFileAssets,
  gifSize,
  pngSize,
  readJson,
  readText,
  recursiveFiles,
  root,
  same,
  sha256,
} from "./office-production-check-utils.mjs";

const manifestPath =
  "assets/game/manifests/office-facility-upsize-shell-v3.json";
const processedRoot =
  "assets/game/processed/office-facility-upsize-shell-v3";
const reviewRoot =
  "assets/art/layout-references/office-facility-upsize-shell-v3";
const assetBuilder =
  "scripts/office_facility_upsize_shell_v3_assets.py";
const reviewBuilder =
  "scripts/build-office-facility-upsize-shell-v3.py";
const docsPath =
  "docs/art/OFFICE_FACILITY_UPSIZE_SHELL_V3.md";

const failures = [];
const add = (condition, message) => {
  if (!condition) failures.push(message);
};

try {
  const manifest = readJson(manifestPath);
  for (const issue of validateOfficeFacilityUpsizeShellV3(manifest)) {
    failures.push(`Shell V3 contract: ${issue}`);
  }

  add(
    manifest.decisionBoundary.motionV2.manifestSha256
      === sha256(manifest.decisionBoundary.motionV2.manifest),
    "Motion V2 decision evidence hash changed",
  );
  add(
    manifest.sourcePolicy.promptRecord.sha256
      === sha256(manifest.sourcePolicy.promptRecord.file),
    "Shell V3 ImageGen prompt record changed",
  );
  add(
    manifest.roomIsolation.f9ManifestSha256
      === sha256(manifest.roomIsolation.f9Manifest),
    "F9 isolation evidence changed",
  );

  const assets = collectFileAssets(manifest);
  for (const [path, record] of assets) {
    add(existsSync(join(root, path)), `missing asset: ${path}`);
    if (!existsSync(join(root, path))) continue;
    add(sha256(path) === record.sha256, `asset hash changed: ${path}`);
    const actualSize = path.endsWith(".gif") ? gifSize(path) : pngSize(path);
    add(same(actualSize, record.size), `asset size changed: ${path}`);
  }

  const expectedParts = new Map([
    ["coffee-machine-c02", 12],
    ["water-dispenser-w02", 12],
    ["vending-machine-u02", 16],
    ["massage-chair-r03", 12],
  ]);
  const expectedReviewFiles = new Set([
    `${reviewRoot}/00-shell-v3-batch-review.png`,
    `${reviewRoot}/source/IMAGEGEN_PROMPTS.md`,
  ]);
  let partTotal = 0;
  for (const family of manifest.families) {
    partTotal += family.effectAuthority.parts.length;
    add(
      family.effectAuthority.parts.length === expectedParts.get(family.slug),
      `${family.slug} approved effect part count changed`,
    );
    add(
      same(
        family.shellSource.views.map((view) => view.view),
        ["front", "left", "right", "back"],
      ),
      `${family.slug} source turnaround order changed`,
    );
    add(
      same(Object.keys(family.runtimeShell.views), [
        "front",
        "left",
        "right",
        "back",
      ]),
      `${family.slug} runtime shell views changed`,
    );
    add(
      family.effectAuthority.parts.every(
        (part) =>
          part.approvedEffectSource.file.startsWith(
            "assets/game/processed/office-facility-upsize-motion-v2/",
          ),
      ),
      `${family.slug} no longer uses approved Motion V2 effect cutouts`,
    );
    add(
      family.seamLoop.frames.every((frame) => same(frame.size, [96, 128])),
      `${family.slug} runtime seam size changed`,
    );
    add(
      family.finiteUse.frames.at(0).sha256
        === family.finiteUse.frames.at(-1).sha256
      && family.finiteUse.idleReturnExact === true,
      `${family.slug} finite sequence no longer returns to exact idle`,
    );
    expectedReviewFiles.add(family.shellSource.chroma.file);
    expectedReviewFiles.add(family.shellSource.alpha.file);
    expectedReviewFiles.add(family.seamLoop.gif.file);
    expectedReviewFiles.add(family.finiteUse.interactionGif.file);
  }
  for (const review of manifest.reviews) {
    for (const artifact of review.artifacts) {
      expectedReviewFiles.add(artifact.file);
    }
  }
  add(partTotal === 52, `expected 52 approved effect parts, found ${partTotal}`);

  const expectedProcessed = [...assets.keys()]
    .filter((path) => path.startsWith(`${processedRoot}/`))
    .sort();
  add(
    same(recursiveFiles(processedRoot), expectedProcessed),
    "processed Shell V3 file set contains missing or untracked files",
  );
  add(
    same(recursiveFiles(reviewRoot), [...expectedReviewFiles].sort()),
    "review/source Shell V3 file set contains missing or untracked files",
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
    "runtime asset compositor draws procedural shell or effect pixels",
  );
  add(
    !assetSource.includes("office-facility-upsize-v1/")
      && !assetSource.includes("office-facility-upsize-production-v1/"),
    "Shell V3 compositor references rejected old shell pixels",
  );
  add(
    assetSource.includes("Image.Resampling.NEAREST")
      && assetSource.includes("alpha_composite")
      && assetSource.includes("approvedEffectSource"),
    "authored crop/resize/composite pipeline changed",
  );

  const reviewSource = readText(reviewBuilder);
  const docs = readText(docsPath);
  const packageJson = readJson("package.json");
  add(
    reviewSource.includes("build_asset_outputs")
      && reviewSource.includes("visual owner review remains pending"),
    "review builder no longer consumes the authored asset pipeline",
  );
  add(
    docs.includes("Motion V2 effects are accepted")
      && docs.includes("No old shell pixels")
      && docs.includes("pending-owner-review"),
    "Shell V3 documentation is incomplete",
  );
  add(
    packageJson.scripts["art:facility:upsize:shell:v3"]
      === "python scripts/build-office-facility-upsize-shell-v3.py"
      && packageJson.scripts["art:facility:upsize:shell:v3:rebuild:check"]
      === "python scripts/build-office-facility-upsize-shell-v3.py --check"
      && packageJson.scripts["art:facility:upsize:shell:v3:check"]
      === "node scripts/office-facility-upsize-shell-v3-check.mjs",
    "Shell V3 package commands are incomplete",
  );
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
}

if (failures.length) {
  console.error("Office Facility Integrated Shell V3 check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  "Office Facility Integrated Shell V3 check passed: "
  + "four fresh ImageGen shells, 16 authored views, "
  + "52 approved Motion V2 effect parts, 16 seam frames, "
  + "24 finite-use frames; old shell reuse and procedural drawing forbidden.",
);
