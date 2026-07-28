import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = "assets/game/manifests/office-workstation-step5-r05-final.json";
const mapPath = "assets/game/maps/office-ten-r05.json";
const outputDirectory = "assets/game/processed/office-workstation-v3/step5-r05-final";
const reviewDirectory = "assets/art/layout-references/office-workstation-v3/step5-r05-final";
const activeRegistryPath = "apps/web/src/features/office/components/officeAssetRegistry.ts";
const runtimeDirectory = "apps/web/src/features/office/lab/workstation-r05";
const failures = [];

const readJson = (path) => JSON.parse(readFileSync(join(root, path), "utf8"));
const sha256 = (path) => createHash("sha256").update(readFileSync(join(root, path))).digest("hex");
const add = (condition, message) => { if (!condition) failures.push(message); };
const files = (directory) => existsSync(join(root, directory))
  ? readdirSync(join(root, directory), { recursive: true })
    .filter((entry) => statSync(join(root, directory, entry)).isFile())
    .map((entry) => join(directory, entry).replaceAll("\\", "/")).sort()
  : [];
const imageSize = (path) => {
  const value = readFileSync(join(root, path));
  if (value.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return { width: value.readUInt32BE(16), height: value.readUInt32BE(20) };
  }
  if (value[0] === 0xff && value[1] === 0xd8) {
    let offset = 2;
    while (offset + 8 < value.length) {
      while (value[offset] === 0xff) offset += 1;
      const marker = value[offset];
      offset += 1;
      if (marker === 0xd8 || marker === 0xd9) continue;
      const length = value.readUInt16BE(offset);
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        return { height: value.readUInt16BE(offset + 3), width: value.readUInt16BE(offset + 5) };
      }
      offset += length;
    }
  }
  throw new Error(`Unsupported image format: ${path}`);
};

try {
  const manifest = readJson(manifestPath);
  const map = readJson(mapPath);
  add(manifest.version === 6 && manifest.geometrySchemaVersion === 7,
    "R05 final must use manifest v6 and Geometry v7");
  add(manifest.status === "rejected-composition"
    && JSON.stringify(manifest.completedScope) === JSON.stringify(["R05-3B", "R05-4", "R05-5"]),
  "R05 final must remain rejected composition evidence");
  add(manifest.rejectedOn === "2026-07-28"
    && manifest.supersededBy === "office.workstation.step5.r05.r02"
    && manifest.rejectionReasons?.length === 3,
  "R05 final rejection record is missing or stale");
  add(manifest.ownerDecision?.r05_3a === "approved", "R05 final must inherit owner approval of R05-3A");
  add(manifest.activeOfficeBaseline?.sha256 === sha256(manifest.activeOfficeBaseline.file),
    "Active Office changed during R05 final work");
  add(manifest.sourceBackground?.sha256 === sha256(manifest.sourceBackground.file),
    "Approved Office background changed during R05 final work");
  add(manifest.tenSeatMap?.file === mapPath && manifest.tenSeatMap?.sha256 === sha256(mapPath),
    "R05 final map is missing or stale");

  const chair = manifest.components?.chair;
  add(chair?.decision === "real-source-normalized-without-scaling"
    && JSON.stringify(chair?.physicalParts) === JSON.stringify(["base-seat", "backrest-arms"])
    && JSON.stringify(chair?.renderMasks) === JSON.stringify(["rear", "foreground"])
    && JSON.stringify(chair?.sourceOriginLocal) === JSON.stringify([16, 32])
    && JSON.stringify(chair?.seatSocketLocal) === JSON.stringify([48, 80])
    && JSON.stringify(chair?.floorSocketLocal) === JSON.stringify([48, 112])
    && JSON.stringify(chair?.contactErrorPixels) === JSON.stringify({ far: [0, 0], near: [0, 0] })
    && chair?.sourcePixelReconstruction === true,
  "R05 final chair must use the real source pixels and approved sockets");
  for (const source of Object.values(chair?.source ?? {})) {
    add(typeof source?.path === "string" && source?.sha256 === sha256(source.path),
      "R05 final chair source is missing or changed");
  }
  for (const asset of Object.values(chair?.assets ?? {})) {
    add(typeof asset?.path === "string" && asset?.sha256 === sha256(asset.path),
      `R05 final chair derivative is missing or changed: ${asset?.path ?? "unknown"}`);
  }

  const monitor = manifest.components?.monitor;
  add(monitor?.decision === "owner-accepted-and-frozen"
    && JSON.stringify(monitor?.reservation) === JSON.stringify([3, 1])
    && JSON.stringify(monitor?.renderPixels) === JSON.stringify([52, 40])
    && JSON.stringify(monitor?.localVisualPivot) === JSON.stringify([26, 40])
    && JSON.stringify(monitor?.centerErrorPixels) === JSON.stringify({ far: [0, 0], near: [0, 0] }),
  "R05 final monitor acceptance changed");
  for (const key of ["front", "back"]) {
    const asset = monitor?.[key];
    add(typeof asset?.path === "string" && asset?.sha256 === sha256(asset.path),
      `R05 final monitor ${key} asset is missing or changed`);
  }
  const keyboard = manifest.components?.keyboard;
  add(keyboard?.decision === "owner-accepted-and-frozen"
    && JSON.stringify(keyboard?.reservation) === JSON.stringify([1, 1])
    && JSON.stringify(keyboard?.renderPixels) === JSON.stringify([48, 24])
    && keyboard?.asset?.sha256 === sha256(keyboard.asset.path),
  "R05 final keyboard acceptance changed");
  add(manifest.components?.characters?.count === 10
    && manifest.components?.characters?.newCharacterOrPose === false,
  "R05 final must use exactly ten existing characters and poses");
  add(manifest.station?.animation?.frames === 6
    && manifest.station?.animation?.maximumAnchorDriftPixels === 0,
  "R05 final six-frame station anchors must remain stable");

  add(map.id === "office-ten-r05-isolated" && map.status === "rejected-composition"
    && map.developmentOnly === true && map.activeOfficePromotion === false,
  "R05 ten-seat map must remain rejected and isolated");
  add(map.workstations?.length === 10, "R05 ten-seat map must contain exactly ten workstations");
  add(JSON.stringify(map.layout?.deskOriginsX) === JSON.stringify([4, 7, 10, 13, 16])
    && map.layout?.horizontalJoinCount === 8
    && map.layout?.horizontalGapPixels === 0
    && map.layout?.horizontalOverlapPixels === 0,
  "R05 desk banks must contain eight zero-gap, zero-overlap horizontal joins");
  add(map.workstations?.filter(({ orientation }) => orientation === "far").length === 5
    && map.workstations?.filter(({ orientation }) => orientation === "near").length === 5,
  "R05 ten-seat map must contain five far and five near stations");
  for (const station of map.workstations ?? []) {
    add(station.desk?.width === 3 && station.desk?.depth === 2,
      `${station.id} desk must be 3x2`);
    add(station.chair?.width === 1 && station.chair?.depth === 1 && station.chair?.height === 2,
      `${station.id} chair must be 1x1x2`);
    add(station.person?.width === 1 && station.person?.depth === 1 && station.person?.height === 3,
      `${station.id} person must be 1x1x3`);
    add(station.desk.x >= 0 && station.desk.x + station.desk.width <= 24,
      `${station.id} leaves the left work zone`);
  }
  add(JSON.stringify(map.legacyFurnitureReferences) === JSON.stringify([]) && map.otherFurnitureCount === 0,
    "R05 candidate must not reuse old Office furniture");

  const expectedAssets = [];
  for (const orientation of ["front", "back"]) {
    for (const role of ["backrest-arms", "base-seat", "foreground", "full", "rear"]) {
      expectedAssets.push(`${outputDirectory}/chair.office.modern.r05.${orientation}.${role}.png`);
    }
  }
  const expectedCaptures = [
    `${outputDirectory}/qa/01-browser-ten-clean.jpg`,
    `${outputDirectory}/qa/02-browser-ten-debug.jpg`,
    `${outputDirectory}/qa/03-browser-single-clean.jpg`,
    `${outputDirectory}/qa/04-browser-single-debug.jpg`,
  ];
  add(JSON.stringify(files(outputDirectory)) === JSON.stringify([...expectedAssets, ...expectedCaptures].sort()),
    "R05 processed directory must contain exactly ten real-chair derivatives and four browser captures");
  for (const path of expectedAssets) {
    const size = imageSize(path);
    add(size.width === 96 && size.height === 112, `${path} must be 96x112`);
  }
  add(manifest.browserValidation?.requiredSeconds === 60
    && manifest.browserValidation?.completedSeconds === 60
    && manifest.browserValidation?.consoleErrors === 0
    && manifest.browserValidation?.consoleWarnings === 0
    && manifest.browserValidation?.brokenImages === 0
    && manifest.browserValidation?.maximumAnchorDriftPixels === 0
    && JSON.stringify(manifest.browserValidation?.captures) === JSON.stringify(expectedCaptures),
  "R05 browser validation must record the complete 60-second clean/debug evidence set");
  for (const path of expectedCaptures) {
    const size = imageSize(path);
    add(size.width === 1600 && size.height === 1064, `${path} must be 1600x1064`);
  }

  const expectedReviews = [
    `${reviewDirectory}/01-real-chair-source-to-final-layers.png`,
    `${reviewDirectory}/02-real-chair-approved-pose-front-back.png`,
    `${reviewDirectory}/03-real-chair-six-frame-contact.png`,
    `${reviewDirectory}/04-single-workstation-clean-debug.png`,
    `${reviewDirectory}/05-ten-seat-office-clean.png`,
    `${reviewDirectory}/06-ten-seat-office-grid-debug.png`,
    `${reviewDirectory}/07-rejected-v1-before-r05-after.png`,
  ];
  add(JSON.stringify(manifest.reviewOutputs) === JSON.stringify(expectedReviews),
    "R05 final manifest must list seven consolidated review boards");
  add(JSON.stringify(files(reviewDirectory)) === JSON.stringify(expectedReviews),
    "R05 final review directory must contain exactly seven boards");
  for (const path of expectedReviews) {
    const size = imageSize(path);
    add(size.width === 1600 && size.height === 1000, `${path} must be 1600x1000`);
  }

  add(manifest.permissions?.historicalRegressionEvidence === true
    && manifest.permissions?.isolatedRenderer === false
    && manifest.permissions?.singleSeatAssembly === false
    && manifest.permissions?.tenSeatAssembly === false
    && manifest.permissions?.newCharacterOrPose === false
    && manifest.permissions?.otherFurniture === false
    && manifest.permissions?.step24 === false
    && manifest.permissions?.activeOfficePromotion === false,
  "R05 final permissions must allow only historical regression evidence");
  add(manifest.runtimePolicy?.mockupChairAllowed === false
    && manifest.runtimePolicy?.legacyCandidateAllowed === false
    && manifest.runtimePolicy?.developmentOnly === true,
  "R05 runtime policy must deny mockup chair and legacy candidate");
  const activeRegistry = readFileSync(join(root, activeRegistryPath), "utf8");
  add(!activeRegistry.includes("step5-r05-final") && !activeRegistry.includes("chair.office.modern.r05"),
    "Active Office registry imports R05 final review assets");
  if (existsSync(join(root, runtimeDirectory))) {
    const runtime = files(runtimeDirectory).map((path) => readFileSync(join(root, path), "utf8")).join("\n");
    add(!runtime.includes("chair_anchor_layers") && !runtime.includes("office-candidate-v1"),
      "R05 runtime imports a mockup chair or rejected candidate");
  }
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
}

if (failures.length > 0) {
  process.stderr.write(`${failures.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    "Step 5 R05 final historical check OK: rejected composition evidence is reproducible, all execution permissions are revoked, and Active Office is unchanged.\n",
  );
}
