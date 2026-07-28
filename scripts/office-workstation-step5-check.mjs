import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = "assets/game/manifests/office-workstation-step5-single-seat-v2.json";
const rejectedPath = "assets/game/manifests/office-workstation-step5-single-seat-v1.json";
const scalePath = "assets/game/manifests/office-character-scale-standard-v1.json";
const featureDirectory = "apps/web/src/features/office/lab/workstation-v2-step5";
const manifest = JSON.parse(readFileSync(join(root, manifestPath), "utf8"));
const rejected = JSON.parse(readFileSync(join(root, rejectedPath), "utf8"));
const scale = JSON.parse(readFileSync(join(root, scalePath), "utf8"));
const failures = [];

function add(condition, message) {
  if (!condition) failures.push(message);
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(join(root, path))).digest("hex");
}

function pngSize(path) {
  const bytes = readFileSync(join(root, path));
  add(bytes.subarray(1, 4).toString("ascii") === "PNG", `${path}: must be a PNG`);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

function recursiveSource(directory) {
  const files = [];
  function visit(path) {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const target = join(path, entry.name);
      if (entry.isDirectory()) visit(target);
      else if ([".ts", ".tsx", ".css"].includes(extname(entry.name))) files.push(target);
    }
  }
  visit(join(root, directory));
  return files;
}

add(rejected.status === "rejected-visual" && rejected.reviewDecision?.status === "changes-requested",
  "Step 5 v1 must remain rejected visual evidence");
add(manifest.version === 2 && manifest.geometrySchemaVersion === 4, "Step 5 r02 must use Geometry v4");
add(manifest.status === "owner-review", "Step 5 r02 must stop at owner review");
add(manifest.permissions?.isolatedLabRenderer === true && manifest.permissions?.singleSeatAssembly === true,
  "Step 5 r02 isolated single-seat renderer must be authorized");
add(manifest.permissions?.deterministicDerivedAssets === true, "Step 5 r02 derived masks/crop must be authorized");
for (const key of ["newArtworkGeneration", "rosterWideCalibration", "tenSeatSceneAssembly", "activeOfficePromotion"]) {
  add(manifest.permissions?.[key] === false, `Step 5 r02 permissions.${key} must remain false`);
}
add(manifest.lab?.developmentOnly === true && manifest.lab?.productionReachable === false,
  "Step 5 r02 route must remain development-only");
add(manifest.lab?.stationCount === 1 && manifest.lab?.reviewViewCount === 2,
  "Step 5 r02 must contain one station rendered in two views");
add(manifest.lockedInputs?.length === 24, "Step 5 r02 must lock exactly 24 source and derived inputs");

add(scale.standard?.floorFootprint?.width === 1 && scale.standard?.floorFootprint?.depth === 1,
  "Current Office person floor footprint must equal 1 x 1");
add(scale.standard?.logicalVolume?.width === 1 && scale.standard?.logicalVolume?.depth === 1
  && scale.standard?.logicalVolume?.height === 3, "Current Office person logical volume must equal 1 x 1 x 3");
add(scale.standard?.sourceFramePixels?.width === 96 && scale.standard?.sourceFramePixels?.height === 104,
  "Current Office reference frame must equal 96 x 104 at tile 32");
add(scale.renderPolicy?.visualOverflowAllowed === true && scale.renderPolicy?.clipToFootprint === false,
  "Character visible pixels must be allowed outside the logical footprint");
add(sha256(scalePath) === manifest.characterScaleAuthority?.sha256, "Character scale authority changed");

add(manifest.station?.equipment?.chair?.footprint?.width === 1
  && manifest.station?.equipment?.chair?.footprint?.depth === 1
  && manifest.station?.equipment?.chair?.logicalVolume?.height === 2,
"Chair must reserve 1 x 1 floor space and stand two logical units tall");
add(manifest.orientations?.far?.deskSide === "public-side"
  && manifest.deskSides?.["public-side"]?.assetView === "back", "Far view must use the public/modesty-panel side");
add(manifest.orientations?.near?.deskSide === "seat-side"
  && manifest.deskSides?.["seat-side"]?.assetView === "front", "Near view must use the seat/drawer side");
add(manifest.station?.equipment?.keyboard?.fullSpriteRequired === true
  && manifest.station?.equipment?.keyboard?.renderPixels?.width === 72, "Step 5 r02 must show the full keyboard");

for (const input of manifest.lockedInputs ?? []) {
  add(typeof input.path === "string" && existsSync(join(root, input.path)), `Missing Step 5 r02 input: ${input.path}`);
  if (typeof input.path === "string" && existsSync(join(root, input.path))) {
    add(sha256(input.path) === input.sha256, `Changed Step 5 r02 input: ${input.path}`);
  }
}

const baseline = manifest.activeOfficeBaseline;
add(existsSync(join(root, baseline.file)), "Active Office baseline is missing");
if (existsSync(join(root, baseline.file))) add(sha256(baseline.file) === baseline.sha256, "Active Office changed during Step 5 r02");

const expectedSizes = [
  { width: 1280, height: 720 },
  { width: 1280, height: 720 },
  { width: 1280, height: 720 },
  { width: 1280, height: 720 },
  { width: 1600, height: 1080 },
];
add(manifest.reviewOutputs?.length === expectedSizes.length, "Step 5 r02 must list exactly five review images");
for (const [index, output] of (manifest.reviewOutputs ?? []).entries()) {
  add(existsSync(join(root, output)), `Missing Step 5 r02 review output: ${output}`);
  if (existsSync(join(root, output))) {
    add(JSON.stringify(pngSize(output)) === JSON.stringify(expectedSizes[index]), `${output}: has unexpected dimensions`);
  }
}

const sourceText = recursiveSource(featureDirectory).map((path) => readFileSync(path, "utf8")).join("\n");
for (const denied of manifest.denyList ?? []) add(!sourceText.includes(denied), `Step 5 r02 imports denied input: ${denied}`);
for (const required of [
  "office-workstation-step5-single-seat-v2.json",
  "office-character-scale-standard-v1.json",
  "desk.workstation.modern.v2.back.png",
  "desk.workstation.modern.v2.front.png",
  "chair.office.modern.front.backrest.png",
  "chair.office.modern.back.seat-base.png",
  "keyboard.workstation.full-tight.png",
  "runtime-spritesheet-v3.webp",
]) add(sourceText.includes(required), `Step 5 r02 feature does not reference required input: ${required}`);
const mainSource = readFileSync(join(root, "apps/web/src/main.tsx"), "utf8");
add(mainSource.includes('requestedLab === "office-workstation-v2-step5"'), "Step 5 r02 lab route is missing");
add(mainSource.includes("import.meta.env.DEV"), "Step 5 r02 lab must remain development-only");

if (failures.length > 0) {
  process.stderr.write(`${failures.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    "Workstation Step 5 r02 check OK: person 1 x 1 x 3, chair 1 x 1 x 2, corrected desk sides, five review images; Active Office unchanged.\n",
  );
}
