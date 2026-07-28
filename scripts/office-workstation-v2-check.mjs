import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = "assets/game/manifests/office-workstation-bundle-v2.json";
const lockPath = "assets/game/manifests/office-generated-art.lock.json";
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const failures = [];

function add(condition, message) {
  if (!condition) failures.push(message);
}

function projectPath(repoPath) {
  const absolute = resolve(root, repoPath);
  add(absolute.startsWith(resolve(root)), `Path leaves repository: ${repoPath}`);
  return absolute;
}

function readJson(repoPath) {
  return JSON.parse(readFileSync(projectPath(repoPath), "utf8"));
}

function sha256(repoPath) {
  return createHash("sha256").update(readFileSync(projectPath(repoPath))).digest("hex");
}

function pngInfo(repoPath) {
  const path = projectPath(repoPath);
  if (!existsSync(path)) {
    failures.push(`Missing PNG: ${repoPath}`);
    return null;
  }
  const bytes = readFileSync(path);
  if (bytes.length < 33 || !bytes.subarray(0, 8).equals(pngSignature)) {
    failures.push(`Invalid PNG signature: ${repoPath}`);
    return null;
  }
  add(bytes.readUInt32BE(8) === 13 && bytes.toString("ascii", 12, 16) === "IHDR",
    `Missing canonical IHDR: ${repoPath}`);
  add(bytes.includes(Buffer.from("IDAT")), `PNG has no image payload: ${repoPath}`);
  add(bytes.includes(Buffer.from("IEND")), `PNG has no end chunk: ${repoPath}`);
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
    bitDepth: bytes[24],
    colorType: bytes[25],
  };
}

function checkPng(repoPath, width, height, allowedColorTypes) {
  const info = pngInfo(repoPath);
  if (!info) return;
  add(info.width === width && info.height === height,
    `${repoPath} must be ${width} x ${height}, received ${info.width} x ${info.height}`);
  add(info.bitDepth === 8, `${repoPath} must use 8-bit channels`);
  add(allowedColorTypes.includes(info.colorType),
    `${repoPath} has unsupported PNG color type ${info.colorType}`);
}

const manifest = readJson(manifestPath);
const lock = readJson(lockPath);
add(manifest.version === 2, "Workstation Bundle v2 version must equal 2");
add(manifest.status === "step4-accepted", "Workstation Bundle v2 must record the accepted Step 4 desk");
add(manifest.approvalRecord?.decision === "accepted", "Workstation Bundle v2 must record owner acceptance");
add(manifest.permissions?.bareDeskArtwork === true, "Bare desk artwork must remain authorized");
for (const permission of [
  "singleSeatAssembly",
  "tenSeatSceneAssembly",
  "rendererImplementation",
  "activeOfficePromotion",
]) {
  add(manifest.permissions?.[permission] === false, `permissions.${permission} must remain false`);
}
add(manifest.source?.commercialReviewRequired === true,
  "Future commercial use must remain blocked pending a separate review");

const sourceChecks = [
  [manifest.source?.chromaFile, manifest.source?.chromaSha256, [2, 6]],
  [manifest.source?.alphaFile, manifest.source?.alphaSha256, [6]],
];
for (const [path, expectedHash, colorTypes] of sourceChecks) {
  add(typeof path === "string" && path.length > 0, "Workstation source path is missing");
  if (typeof path !== "string" || !existsSync(projectPath(path))) continue;
  add(sha256(path) === expectedHash, `Source hash changed: ${path}`);
  add(lock.inputs?.[path] === sha256(path), `Generated-art lock does not protect source: ${path}`);
  checkPng(path, 1604, 981, colorTypes);
}

const desk = manifest.deskFamily;
add(desk?.footprint?.width === 3 && desk?.footprint?.depth === 2,
  "Desk footprint must equal 3 x 2");
add(desk?.supportPlane?.width === 3 && desk?.supportPlane?.depth === 2,
  "Complete tabletop must equal the 3 x 2 support plane");
add(desk?.employeeEdge === null, "Rejected employee edge cannot return");
add(desk?.renderBounds?.width === 96 && desk?.renderBounds?.height === 128,
  "Desk render bounds must equal 96 x 128");
add(desk?.normalization?.tabletopHeightRatio >= 0.4,
  "Elevated camera must expose at least 40 percent tabletop height");

const processedPaths = [];
for (const orientation of ["front", "back"]) {
  const record = desk?.orientations?.[orientation];
  add(Boolean(record), `Missing ${orientation} desk orientation`);
  if (!record) continue;
  processedPaths.push(record.compositeFile, ...Object.values(record.parts ?? {}));
}
add(new Set(processedPaths).size === 10, "Front/back composites and eight semantic layers must be unique");
for (const path of processedPaths) {
  checkPng(path, 96, 128, [6]);
  if (existsSync(projectPath(path))) {
    add(lock.outputs?.[path] === sha256(path), `Generated-art lock is stale for ${path}`);
  }
}

const reviewSizes = new Map([
  ["01-desk-front-back-v2.png", [1400, 900]],
  ["02-semantic-layers-v2.png", [1400, 820]],
  ["03-adjacency-footprint-proof-v2.png", [1400, 900]],
  ["00-step4-review-contact-sheet-v2.png", [1600, 1100]],
]);
const reviewOutputs = manifest.qa?.reviewOutputs ?? [];
add(reviewOutputs.length === 4 && new Set(reviewOutputs).size === 4,
  "Step 4 must expose exactly four unique review boards");
for (const path of reviewOutputs) {
  const name = path.split("/").at(-1);
  const size = reviewSizes.get(name);
  add(Boolean(size), `Unexpected Step 4 review output: ${path}`);
  if (!size) continue;
  checkPng(path, size[0], size[1], [6]);
  if (existsSync(projectPath(path))) {
    add(lock.outputs?.[path] === sha256(path), `Generated-art lock is stale for ${path}`);
  }
}

if (failures.length > 0) {
  process.stderr.write(`${failures.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    "Workstation v2 Step 4 portable check OK: source, 10 processed PNGs, and 4 review boards locked without Pillow.\n",
  );
}
