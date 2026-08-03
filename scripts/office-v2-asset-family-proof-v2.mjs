import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { buildAssetExport, encodeRgbaPng, hashBytes } from "./office-v2-asset-factory.mjs";
import { decodePng } from "./office-v2-asset-admission-png.mjs";
import { buildReviewBoards } from "./office-v2-asset-boards.mjs";
import { buildAssetRegistry } from "./office-v2-asset-registry.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const FAMILY = "workstation-basic";
const VERSION = 2;
const MASKS = Object.freeze([0, 2, 8, 10]);
const WIDTH = 176;
const HEIGHT = 96;
const SCALE = 2;
const SOCKET = Object.freeze({ x: 56, y: 56 });
const SEAM_TRANSLATION = Object.freeze({ x: 64, y: 32 });
const BACKGROUNDS = Object.freeze({ light: [245, 242, 234, 255], dark: [24, 28, 36, 255] });
const COLORS = Object.freeze({
  transparent: [0, 0, 0, 0],
  outline: [38, 31, 28, 255],
  topLight: [214, 164, 96, 255],
  woodMid: [165, 103, 56, 255],
  southShadow: [101, 58, 44, 255],
  eastMid: [139, 82, 50, 255],
  metal: [88, 105, 112, 255],
  accent: [74, 157, 161, 255],
  actorSkin: [221, 156, 105, 255],
  actorCloth: [52, 95, 131, 255],
  contactHighlight: [255, 214, 84, 255],
});

function canonical(value, path = "$") {
  if (value instanceof Uint8Array) return `[${[...value].join(",")}]`;
  if (value === null || typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`Non-finite number at ${path}.`);
    return Object.is(value, -0) ? "0" : JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map((entry, index) => canonical(entry, `${path}[${index}]`)).join(",")}]`;
  if (typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype) throw new Error(`Non-JSON value at ${path}.`);
  return `{${Object.keys(value).sort().map((key) => {
    if (value[key] === undefined) throw new Error(`Undefined value at ${path}.${key}.`);
    return `${JSON.stringify(key)}:${canonical(value[key], `${path}.${key}`)}`;
  }).join(",")}}`;
}

function hashObject(value) { return hashBytes(Buffer.from(canonical(value), "utf8")); }
function cloneColor(value) { return [...value]; }
function fail(code, message, context = {}) { const error = new Error(`[${code}] ${message}`); error.code = code; error.context = context; throw error; }

function line(pixels, x0, y0, x1, y1, color) {
  let x = x0;
  let y = y0;
  const dx = Math.abs(x1 - x0);
  const sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0);
  const sy = y0 < y1 ? 1 : -1;
  let error = dx + dy;
  while (true) {
    put(pixels, x, y, color);
    if (x === x1 && y === y1) return;
    const double = 2 * error;
    if (double >= dy) { error += dy; x += sx; }
    if (double <= dx) { error += dx; y += sy; }
  }
}

function put(pixels, x, y, color) {
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) return;
  pixels.set(color, (y * WIDTH + x) * 4);
}

function insideConvexPolygon(x, y, points) {
  let positive = false;
  let negative = false;
  for (let index = 0; index < points.length; index += 1) {
    const left = points[index];
    const right = points[(index + 1) % points.length];
    const cross = (right.x - left.x) * (y - left.y) - (right.y - left.y) * (x - left.x);
    positive ||= cross > 0;
    negative ||= cross < 0;
    if (positive && negative) return false;
  }
  return true;
}

function polygon(pixels, points, color) {
  const minX = Math.max(0, Math.min(...points.map(({ x }) => x)));
  const maxX = Math.min(WIDTH - 1, Math.max(...points.map(({ x }) => x)));
  const minY = Math.max(0, Math.min(...points.map(({ y }) => y)));
  const maxY = Math.min(HEIGHT - 1, Math.max(...points.map(({ y }) => y)));
  for (let y = minY; y <= maxY; y += 1) for (let x = minX; x <= maxX; x += 1) if (insideConvexPolygon(x, y, points)) put(pixels, x, y, color);
}

function drawCap(pixels, from, to, open, direction) {
  line(pixels, from.x, from.y, to.x, to.y, COLORS.outline);
  if (open) {
    const midX = Math.round((from.x + to.x) / 2);
    const midY = Math.round((from.y + to.y) / 2);
    put(pixels, midX, midY, COLORS.contactHighlight);
    return;
  }
  const shift = direction === "west" ? { x: 4, y: 2 } : { x: -4, y: -2 };
  line(pixels, from.x + shift.x, from.y + shift.y, to.x + shift.x, to.y + shift.y, COLORS.metal);
  line(pixels, from.x + shift.x - 1, from.y + shift.y, to.x + shift.x - 1, to.y + shift.y, COLORS.outline);
}

function pixelCanvas(frame) {
  const pixels = new Uint8Array(WIDTH * HEIGHT * 4);
  const north = { x: 56, y: 24 };
  const east = { x: 120, y: 56 };
  const south = { x: 88, y: 72 };
  const west = { x: 24, y: 40 };
  const top = [north, east, south, west];
  const accent = Array.isArray(frame.accent) && frame.accent.length === 4 ? frame.accent : COLORS.accent;

  polygon(pixels, top, COLORS.woodMid);
  polygon(pixels, [west, south, { x: south.x - 6, y: south.y - 3 }, { x: west.x + 6, y: west.y - 3 }], COLORS.southShadow);
  polygon(pixels, [east, south, { x: south.x - 4, y: south.y - 2 }, { x: east.x - 4, y: east.y - 2 }], COLORS.eastMid);
  polygon(pixels, [{ x: 56, y: 28 }, { x: 116, y: 58 }, { x: 86, y: 68 }, { x: 28, y: 39 }], COLORS.topLight);

  line(pixels, north.x, north.y, east.x, east.y, COLORS.outline);
  line(pixels, east.x, east.y, south.x, south.y, COLORS.outline);
  line(pixels, south.x, south.y, west.x, west.y, COLORS.outline);
  line(pixels, west.x, west.y, north.x, north.y, COLORS.outline);
  drawCap(pixels, north, west, Boolean(frame.mask & 8), "west");
  drawCap(pixels, east, south, Boolean(frame.mask & 2), "east");

  polygon(pixels, [{ x: 56, y: 31 }, { x: 72, y: 39 }, { x: 64, y: 43 }, { x: 48, y: 35 }], COLORS.metal);
  line(pixels, 56, 43, 56, 50, COLORS.outline);
  line(pixels, 64, 43, 64, 50, COLORS.outline);
  polygon(pixels, [{ x: 48, y: 49 }, { x: 64, y: 57 }, { x: 60, y: 59 }, { x: 44, y: 51 }], accent);
  line(pixels, 32, 47, 32, 66, COLORS.outline);
  line(pixels, 96, 58, 96, 70, COLORS.outline);
  line(pixels, 34, 65, 48, 58, COLORS.metal);
  line(pixels, 94, 69, 80, 62, COLORS.metal);
  put(pixels, SOCKET.x, SOCKET.y, COLORS.contactHighlight);
  return pixels;
}

function readInputs(sourcePath, recipePath) {
  const source = JSON.parse(readFileSync(sourcePath, "utf8"));
  const recipe = JSON.parse(readFileSync(recipePath, "utf8"));
  const contract = JSON.parse(readFileSync(join(ROOT, "assets/office-v2/contracts/workstation-basic/v2/visual-contract.json"), "utf8"));
  if (source.schemaVersion !== "office-source-procedural-v1") fail("asset.family.source-schema", "V2 proof source must use the procedural source schema.");
  if (recipe.schemaVersion !== "office-export-recipe-v1") fail("asset.family.recipe-schema", "V2 proof recipe must use the export recipe schema.");
  if (source.familyId !== FAMILY || source.familyVersion !== VERSION || recipe.familyId !== FAMILY || recipe.familyVersion !== VERSION) fail("asset.family.version-invalid", "V2 source and recipe must agree on the workstation family version.");
  if (contract.status !== "frozen-for-rework" || contract.familyVersion !== VERSION || contract.projection.id !== "office-projection-v1" || contract.projection.ratio !== "2:1") fail("asset.family.contract-invalid", "The frozen V2 visual contract is missing or does not declare the required projection.");
  if (contract.native.canvas.widthPx !== WIDTH || contract.native.canvas.heightPx !== HEIGHT || contract.native.filter !== "nearest") fail("asset.family.canvas-invalid", "V2 source canvas must match the frozen native nearest-neighbor canvas.");
  const masks = source.frames.map(({ mask }) => mask).sort((left, right) => left - right);
  if (masks.join(",") !== MASKS.join(",")) fail("asset.family.mask-set-invalid", "The V2 proof family must contain masks 0, 2, 8, and 10.", { masks });
  return { source, recipe, contract };
}

function factorySource(description, recipe) {
  const outputByFrame = new Map(recipe.outputs.filter(({ kind }) => kind === "png").map((output) => [output.frameId, output.path]));
  return {
    schemaVersion: "office-source-pixels-v1",
    familyId: FAMILY,
    familyVersion: VERSION,
    sourceId: `${description.sourceId}-pixels`,
    metadata: { authoring: description.authoring, licenseStatus: description.licenseStatus, commercialStatus: description.commercialStatus, reviewState: description.reviewState, algorithm: description.algorithm, projectionId: "office-projection-v1", filter: "nearest" },
    frames: description.frames.map((frame) => ({
      frameId: frame.frameId,
      outputPath: outputByFrame.get(frame.frameId),
      widthPx: WIDTH,
      heightPx: HEIGHT,
      rgba: pixelCanvas(frame),
      mask: frame.mask,
      contacts: frame.contacts,
      masks: [frame.mask],
      socket: frame.socket,
      metadata: { variant: frame.variant, mask: frame.mask, projectionId: "office-projection-v1", nativeFilter: "nearest" },
    })),
  };
}

function boardInput(source, factoryReport) {
  return {
    schemaVersion: "office-asset-board-input-v1",
    familyId: FAMILY,
    familyVersion: VERSION,
    sourceSha256: factoryReport.sourceSha256,
    recipeSha256: factoryReport.recipeSha256,
    styleProfile: { id: "office-pixel", version: 1, projectionId: "office-projection-v1", ratio: "2:1", lightDirection: "northwest", filter: "nearest" },
    geometry: { id: "workstation-geometry", version: 1, projectionId: "office-projection-v1", footprint: { widthCells: 2, depthCells: 1 }, clearance: { widthCells: 3, depthCells: 2 }, visualHeightPx: 48, spriteOriginPx: { x: 56, y: 24 } },
    alphaPolicy: { border: "transparent", filter: "nearest", translucentPixels: "forbidden" },
    nativeScale: { tileWidthPx: 64, tileHeightPx: 32, elevationHeightPx: 16, filter: "nearest", scaleRule: "integer-only" },
    palette: { colors: Object.values(COLORS).filter((color) => color[3] !== 0) },
    connectivity: { familyId: FAMILY, supportedMasks: MASKS, seamPolicy: "exact", socketId: "seated", bitDirections: { north: 1, east: 2, south: 4, west: 8 }, westSeam: { from: { x: 56, y: 24 }, to: { x: 24, y: 40 } }, eastSeam: { from: { x: 120, y: 56 }, to: { x: 88, y: 72 } } },
    review: { state: "pending-owner-review", geometry: "pending", visual: "pending", commercial: "pending" },
    frames: source.frames.map((frame) => ({ frameId: frame.frameId, widthPx: frame.widthPx, heightPx: frame.heightPx, rgba: frame.rgba, contacts: frame.contacts, masks: frame.masks })),
  };
}

function registryInput(source, factoryReport) {
  const runtimeHashes = new Map(factoryReport.outputs.filter(({ kind }) => kind === "png").map((output) => [output.frameId, output.sha256]));
  return {
    schemaVersion: "office-asset-registry-input-v1",
    family: { familyId: FAMILY, familyVersion: VERSION, projectionId: "office-projection-v1", geometryRef: { id: "workstation-geometry", version: 1 }, admission: "spec-only", approval: { geometry: "pending", visual: "pending", commercial: "pending" } },
    frames: source.frames.map((frame) => ({ frameId: frame.frameId, frameVersion: 1, variantId: frame.metadata.variant, widthPx: frame.widthPx, heightPx: frame.heightPx, orientation: "south", runtimePath: `office-v2/runtime/${FAMILY}/v${VERSION}/${frame.frameId}.png`, sha256: runtimeHashes.get(frame.frameId), lifecycleGroup: "workstations" })),
    atlas: { atlasId: "workstation-basic-v2-atlas", atlasVersion: 1, path: `office-v2/atlases/${FAMILY}/v${VERSION}.png`, sha256: hashObject({ family: FAMILY, version: VERSION, frames: source.frames.map(({ frameId }) => frameId), canvas: { widthPx: WIDTH, heightPx: HEIGHT } }), paddingPx: 1, extrusionPx: 1 },
    catalog: { catalogId: "office-assets-v2", catalogVersion: 1, admission: "spec-only" },
    sceneBundle: { bundleId: "ground-floor-office-v2", bundleVersion: 1, floorRef: { id: "ground-floor", version: 1 }, admission: "spec-only" },
  };
}

function candidateManifest(description, recipe, factoryReport, sourceDescriptionSha256, recipeDescriptionSha256) {
  return {
    schemaVersion: "office-asset-v1-candidate",
    familyId: FAMILY,
    familyVersion: VERSION,
    projectionId: "office-projection-v1",
    source: { sourceFile: `office-v2/sources/${FAMILY}/v${VERSION}/source.json`, sourceSha256: sourceDescriptionSha256, recipeFile: `office-v2/recipes/${FAMILY}/v${VERSION}/export.json`, recipeSha256: recipeDescriptionSha256, commercialStatus: description.commercialStatus, reviewerDecision: description.reviewState },
    outputHashes: Object.fromEntries(factoryReport.outputs.map(({ path, sha256 }) => [path, sha256])),
    approval: { geometry: "pending", visual: "pending", commercial: "pending" },
    admission: "spec-only",
    runtimeManifestPath: null,
  };
}

function writeBinary(root, relativePath, bytes) {
  const target = join(root, ...relativePath.split("/"));
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, bytes, { flag: "wx" });
  return target;
}

function writeJson(root, relativePath, value) { return writeBinary(root, relativePath, Buffer.from(canonical(value), "utf8")); }

function scaleRgba(input, widthPx, heightPx, scale) {
  const output = new Uint8Array(widthPx * scale * heightPx * scale * 4);
  const outputWidth = widthPx * scale;
  for (let y = 0; y < heightPx; y += 1) for (let x = 0; x < widthPx; x += 1) {
    const sourceOffset = (y * widthPx + x) * 4;
    for (let yy = 0; yy < scale; yy += 1) for (let xx = 0; xx < scale; xx += 1) output.set(input.slice(sourceOffset, sourceOffset + 4), ((y * scale + yy) * outputWidth + x * scale + xx) * 4);
  }
  return { widthPx: widthPx * scale, heightPx: heightPx * scale, rgba: output };
}

function solidCanvas(color) {
  const pixels = new Uint8Array(WIDTH * HEIGHT * 4);
  for (let index = 0; index < pixels.length; index += 4) pixels.set(color, index);
  return pixels;
}

function layer(target, targetWidth, targetHeight, source, sourceWidth, sourceHeight, offsetX, offsetY) {
  for (let y = 0; y < sourceHeight; y += 1) for (let x = 0; x < sourceWidth; x += 1) {
    const targetX = x + offsetX;
    const targetY = y + offsetY;
    if (targetX < 0 || targetY < 0 || targetX >= targetWidth || targetY >= targetHeight) continue;
    const sourceOffset = (y * sourceWidth + x) * 4;
    if (source[sourceOffset + 3] === 0) continue;
    target.set(source.slice(sourceOffset, sourceOffset + 4), (targetY * targetWidth + targetX) * 4);
  }
}

function backgroundPreview(rgba, background) {
  const output = solidCanvas(background);
  layer(output, WIDTH, HEIGHT, rgba, WIDTH, HEIGHT, 0, 0);
  return output;
}

function actorLayer() {
  const pixels = new Uint8Array(WIDTH * HEIGHT * 4);
  polygon(pixels, [{ x: 48, y: 41 }, { x: 60, y: 41 }, { x: 64, y: 51 }, { x: 50, y: 51 }], COLORS.actorCloth);
  polygon(pixels, [{ x: 49, y: 35 }, { x: 58, y: 35 }, { x: 60, y: 42 }, { x: 50, y: 42 }], COLORS.actorSkin);
  line(pixels, 50, 51, 55, 56, COLORS.actorCloth);
  line(pixels, 60, 51, 57, 56, COLORS.actorCloth);
  put(pixels, SOCKET.x, SOCKET.y, COLORS.contactHighlight);
  return pixels;
}

function buildReviewEvidence({ source, reportRoot, boards }) {
  const evidence = [];
  const record = (path, bytes, metadata = {}) => { writeBinary(reportRoot, path, bytes); evidence.push({ path, sha256: hashBytes(bytes), byteLength: bytes.length, ...metadata }); };
  const frames = new Map(source.frames.map((frame) => [frame.frameId, frame]));
  for (const frame of source.frames) {
    const light = backgroundPreview(frame.rgba, BACKGROUNDS.light);
    const dark = backgroundPreview(frame.rgba, BACKGROUNDS.dark);
    record(`review/background-light/${frame.frameId}.png`, encodeRgbaPng({ widthPx: WIDTH, heightPx: HEIGHT, rgba: light }), { kind: "background-preview", frameId: frame.frameId, background: "light", filter: "nearest" });
    record(`review/background-dark/${frame.frameId}.png`, encodeRgbaPng({ widthPx: WIDTH, heightPx: HEIGHT, rgba: dark }), { kind: "background-preview", frameId: frame.frameId, background: "dark", filter: "nearest" });
  }

  const boardsByKind = new Map();
  for (const output of boards.outputBytes) {
    const match = /office-v2\/review-boards\/[^/]+\/v\d+\/(native-scale|connectivity)\/(mask-(?:0|2|8|10))\.png/u.exec(output.path);
    if (match) boardsByKind.set(`${match[1]}:${match[2]}`, output.bytes);
  }
  for (const kind of ["native-scale", "connectivity"]) for (const frameId of ["mask-0", "mask-2", "mask-8", "mask-10"]) {
    const bytes = boardsByKind.get(`${kind}:${frameId}`);
    if (!bytes) fail("asset.family.board-missing", "Expected generated review board PNG is missing.", { kind, frameId });
    const decoded = decodePng(bytes);
    const enlarged = scaleRgba(decoded.rgba, decoded.widthPx, decoded.heightPx, SCALE);
    record(`review/enlarged-${kind}/${frameId}.png`, encodeRgbaPng(enlarged), { kind: `enlarged-${kind}`, frameId, scale: SCALE, filter: "nearest" });
  }

  const compositionWidth = WIDTH + SEAM_TRANSLATION.x * 2;
  const compositionHeight = HEIGHT + SEAM_TRANSLATION.y * 2;
  const composition = solidCanvas(BACKGROUNDS.light);
  const order = [["mask-2", 0, 0], ["mask-10", SEAM_TRANSLATION.x, SEAM_TRANSLATION.y], ["mask-8", SEAM_TRANSLATION.x * 2, SEAM_TRANSLATION.y * 2]];
  const compositionPixels = new Uint8Array(compositionWidth * compositionHeight * 4);
  for (let index = 0; index < compositionPixels.length; index += 4) compositionPixels.set(BACKGROUNDS.light, index);
  for (const [frameId, x, y] of order) layer(compositionPixels, compositionWidth, compositionHeight, frames.get(frameId).rgba, WIDTH, HEIGHT, x, y);
  record("review/three-workstation-seam-composition.png", encodeRgbaPng({ widthPx: compositionWidth, heightPx: compositionHeight, rgba: compositionPixels }), { kind: "three-workstation-seam-composition", order: order.map(([frameId]) => frameId), seamTranslationPx: SEAM_TRANSLATION, filter: "nearest" });

  const actor = actorLayer();
  const actorPreview = solidCanvas(BACKGROUNDS.light);
  layer(actorPreview, WIDTH, HEIGHT, frames.get("mask-0").rgba, WIDTH, HEIGHT, 0, 0);
  layer(actorPreview, WIDTH, HEIGHT, actor, WIDTH, HEIGHT, 0, 0);
  record("review/seated-actor-contact-overlay.png", encodeRgbaPng({ widthPx: WIDTH, heightPx: HEIGHT, rgba: actorPreview }), { kind: "seated-actor-contact-overlay", socket: SOCKET, filter: "nearest" });
  return evidence.sort((left, right) => left.path.localeCompare(right.path));
}

export function buildProofFamily({ sourcePath = join(ROOT, "assets/office-v2/sources/workstation-basic/v2/source.json"), recipePath = join(ROOT, "assets/office-v2/recipes/workstation-basic/v2/export.json"), outputRootA, outputRootB, reportRoot } = {}) {
  const { source: description, recipe, contract } = readInputs(sourcePath, recipePath);
  const generatedSource = factorySource(description, recipe);
  const reportA = buildAssetExport({ source: generatedSource, recipe, outputRoot: outputRootA });
  const reportB = buildAssetExport({ source: generatedSource, recipe, outputRoot: outputRootB });
  if (canonical(reportA) !== canonical(reportB)) fail("asset.family.build-not-identical", "Two clean V2 proof-family builds did not produce identical reports.");
  const outputsA = new Map(reportA.outputs.map(({ path, sha256 }) => [path, sha256]));
  const outputsB = new Map(reportB.outputs.map(({ path, sha256 }) => [path, sha256]));
  if (canonical(Object.fromEntries(outputsA)) !== canonical(Object.fromEntries(outputsB))) fail("asset.family.output-not-identical", "Two clean V2 proof-family builds did not produce identical output hashes.");

  const boards = buildReviewBoards({ input: boardInput(generatedSource, reportA), outputRoot: join(reportRoot, "boards") });
  const registry = buildAssetRegistry({ input: registryInput(generatedSource, reportA), outputRoot: join(reportRoot, "registry") });
  const review = { schemaVersion: "office-asset-review-v1", familyId: FAMILY, familyVersion: VERSION, state: "pending-owner-review", geometry: "pending", visual: "pending", commercial: "pending", reviewer: "unassigned", notes: "V2 is a spec-only rework candidate. V1 remains rejected historical evidence; technical determinism does not infer owner approval." };
  const sourceDescriptionSha256 = hashBytes(readFileSync(sourcePath));
  const recipeDescriptionSha256 = hashBytes(readFileSync(recipePath));
  const candidate = candidateManifest(description, recipe, reportA, sourceDescriptionSha256, recipeDescriptionSha256);
  const evidence = buildReviewEvidence({ source: generatedSource, reportRoot, boards });
  const report = {
    schemaVersion: "office-asset-family-proof-report-v1",
    taskId: "P5-W6.5-R1",
    familyId: FAMILY,
    familyVersion: VERSION,
    admission: "spec-only",
    runtimeAdmission: "blocked-until-explicit-geometry-visual-commercial-approval",
    visualContract: { file: "assets/office-v2/contracts/workstation-basic/v2/visual-contract.json", sha256: hashBytes(readFileSync(join(ROOT, "assets/office-v2/contracts/workstation-basic/v2/visual-contract.json"))), status: contract.status },
    review,
    supportedMasks: MASKS,
    seatedSocket: { id: "seated", spritePx: SOCKET, worldSubCell: { x: 4, y: 4, elevation: 0 } },
    seamComposition: { order: ["mask-2", "mask-10", "mask-8"], translationPx: SEAM_TRANSLATION },
    sourceDescriptionSha256,
    recipeDescriptionSha256,
    factory: { sourceSha256: reportA.sourceSha256, recipeSha256: reportA.recipeSha256, reportSha256: reportA.reportSha256, outputHashes: Object.fromEntries(reportA.outputs.map(({ path, sha256 }) => [path, sha256])), twoCleanBuilds: true, byteIdentical: true },
    boards: boards.report,
    registry: registry.report,
    candidateManifest: candidate,
    evidence,
    prohibitedRuntimePaths: ["assets/office-v2/runtime/", "assets/office-v2/manifests/"],
  };
  writeJson(reportRoot, "family.json", report);
  writeJson(reportRoot, "review.json", review);
  writeJson(reportRoot, "manifest-candidate.json", candidate);
  writeJson(reportRoot, "review/index.json", { schemaVersion: "office-asset-review-evidence-index-v1", familyId: FAMILY, familyVersion: VERSION, filter: "nearest", files: evidence });
  return { report, factory: reportA, boards, registry, source: generatedSource, evidence };
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  const reportRoot = join(ROOT, "assets/office-v2/reports/workstation-basic/v2");
  buildProofFamily({ outputRootA: join(reportRoot, "build-a"), outputRootB: join(reportRoot, "build-b"), reportRoot });
}
