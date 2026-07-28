import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = "assets/game/manifests/office-workstation-step5-single-seat-v1.json";
const featureDirectory = "apps/web/src/features/office/lab/workstation-v2-step5";
const manifest = JSON.parse(readFileSync(join(root, manifestPath), "utf8"));
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

add(manifest.status === "owner-review", "Step 5 must stop at owner review");
add(manifest.permissions?.isolatedLabRenderer === true, "Step 5 isolated renderer must be authorized");
add(manifest.permissions?.singleSeatAssembly === true, "Step 5 single-seat assembly must be authorized");
for (const key of ["newArtworkGeneration", "rosterWideCalibration", "tenSeatSceneAssembly", "activeOfficePromotion"]) {
  add(manifest.permissions?.[key] === false, `Step 5 permissions.${key} must remain false`);
}
add(manifest.lab?.developmentOnly === true && manifest.lab?.productionReachable === false,
  "Step 5 route must remain development-only");
add(manifest.lab?.stationCount === 1 && manifest.lab?.reviewViewCount === 2,
  "Step 5 must contain one station rendered in two review views");
add(manifest.lockedInputs?.length === 18, "Step 5 must lock exactly 18 approved inputs");

for (const input of manifest.lockedInputs ?? []) {
  add(typeof input.path === "string" && existsSync(join(root, input.path)), `Missing Step 5 input: ${input.path}`);
  if (typeof input.path === "string" && existsSync(join(root, input.path))) {
    add(sha256(input.path) === input.sha256, `Changed Step 5 input: ${input.path}`);
  }
}

const baseline = manifest.activeOfficeBaseline;
add(existsSync(join(root, baseline.file)), "Active Office baseline is missing");
if (existsSync(join(root, baseline.file))) {
  add(sha256(baseline.file) === baseline.sha256, "Active Office changed during Step 5");
}

const expectedSizes = [
  { width: 1280, height: 720 },
  { width: 1280, height: 720 },
  { width: 1280, height: 720 },
  { width: 1280, height: 720 },
  { width: 1600, height: 1080 },
];
add(manifest.reviewOutputs?.length === expectedSizes.length, "Step 5 must list exactly five review images");
for (const [index, output] of (manifest.reviewOutputs ?? []).entries()) {
  add(existsSync(join(root, output)), `Missing Step 5 review output: ${output}`);
  if (existsSync(join(root, output))) {
    const size = pngSize(output);
    add(JSON.stringify(size) === JSON.stringify(expectedSizes[index]), `${output}: has unexpected dimensions`);
  }
}

const sources = recursiveSource(featureDirectory);
const sourceText = sources.map((path) => readFileSync(path, "utf8")).join("\n");
for (const denied of manifest.denyList ?? []) {
  add(!sourceText.includes(denied), `Step 5 feature imports denied input: ${denied}`);
}
for (const input of manifest.lockedInputs ?? []) {
  add(sourceText.includes(input.path), `Step 5 feature does not reference locked input: ${input.path}`);
}
const mainSource = readFileSync(join(root, "apps/web/src/main.tsx"), "utf8");
add(mainSource.includes('requestedLab === "office-workstation-v2-step5"'), "Step 5 lab route is missing");
add(mainSource.includes("import.meta.env.DEV"), "Lab routing must retain the development-only gate");

if (failures.length > 0) {
  process.stderr.write(`${failures.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    `Workstation Step 5 portable check OK: 18 inputs, 1 station, 2 views, 5 review images; Active Office unchanged.\n`,
  );
}
