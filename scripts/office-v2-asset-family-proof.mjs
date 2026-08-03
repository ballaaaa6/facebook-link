import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { buildAssetExport, hashBytes } from "./office-v2-asset-factory.mjs";
import { buildReviewBoards } from "./office-v2-asset-boards.mjs";
import { buildAssetRegistry } from "./office-v2-asset-registry.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const FAMILY = "workstation-basic";
const VERSION = 1;
const MASKS = Object.freeze([0, 2, 8, 10]);
const COLORS = Object.freeze({ transparent: [0, 0, 0, 0], shadow: [34, 38, 48, 255], wood: [168, 112, 64, 255], edge: [232, 176, 96, 255], metal: [112, 128, 144, 255], accent: [72, 144, 160, 255] });

function canonical(value, path = "$") {
  if (value instanceof Uint8Array) return `[${[...value].join(",")}]`;
  if (value === null || typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") { if (!Number.isFinite(value)) throw new Error(`non-finite ${path}`); return Object.is(value, -0) ? "0" : JSON.stringify(value); }
  if (Array.isArray(value)) return `[${value.map((entry, index) => canonical(entry, `${path}[${index}]`)).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key], `${path}.${key}`)}`).join(",")}}`;
}

function hashObject(value) { return hashBytes(Buffer.from(canonical(value), "utf8")); }
function clone(value) { return structuredClone(value); }
function fail(code, message, context = {}) { const error = new Error(`[${code}] ${message}`); error.code = code; error.context = context; throw error; }

function pixelCanvas(frame) {
  const widthPx = 16;
  const heightPx = 16;
  const pixels = new Uint8Array(widthPx * heightPx * 4);
  const put = (xPx, yPx, color) => {
    if (xPx < 0 || xPx >= widthPx || yPx < 0 || yPx >= heightPx) return;
    pixels.set(color, (yPx * widthPx + xPx) * 4);
  };
  for (let y = 5; y <= 9; y += 1) for (let x = 3; x <= 12; x += 1) put(x, y, COLORS.wood);
  for (let x = 2; x <= 13; x += 1) put(x, 4, COLORS.edge);
  for (let x = 2; x <= 13; x += 1) put(x, 10, COLORS.shadow);
  for (const x of [3, 12]) for (let y = 10; y <= 13; y += 1) put(x, y, COLORS.metal);
  put(7, 6, frame.tint ?? COLORS.accent); put(8, 6, frame.tint ?? COLORS.accent);
  if (frame.mask & 2) for (let y = 6; y <= 9; y += 1) put(13, y, COLORS.edge);
  if (frame.mask & 8) for (let y = 6; y <= 9; y += 1) put(2, y, COLORS.edge);
  if (frame.mask === 0) put(5, 8, COLORS.metal);
  return pixels;
}

function readInputs(sourcePath, recipePath) {
  const source = JSON.parse(readFileSync(sourcePath, "utf8"));
  const recipe = JSON.parse(readFileSync(recipePath, "utf8"));
  if (source.schemaVersion !== "office-source-procedural-v1") fail("asset.family.source-schema", "Proof source must use the procedural source schema.");
  if (recipe.schemaVersion !== "office-export-recipe-v1") fail("asset.family.recipe-schema", "Proof recipe must use the export recipe schema.");
  const masks = source.frames.map(({ mask }) => mask).sort((left, right) => left - right);
  if (masks.join(",") !== MASKS.join(",")) fail("asset.family.mask-set-invalid", "The proof family must contain masks 0, 2, 8, and 10.", { masks });
  return { source, recipe };
}

function factorySource(description, recipe) {
  const outputByFrame = new Map(recipe.outputs.filter(({ kind }) => kind === "png").map((output) => [output.frameId, output.path]));
  return {
    schemaVersion: "office-source-pixels-v1",
    familyId: FAMILY,
    familyVersion: VERSION,
    sourceId: description.sourceId,
    metadata: { authoring: "project-owned-procedural", licenseStatus: "project-owned", commercialStatus: "pending-owner-review", reviewState: "pending-owner-review", algorithm: description.algorithm },
    frames: description.frames.map((frame) => ({
      frameId: frame.frameId,
      outputPath: outputByFrame.get(frame.frameId),
      widthPx: 16,
      heightPx: 16,
      rgba: pixelCanvas(frame),
      mask: frame.mask,
      contacts: frame.contacts,
      masks: [frame.mask],
      socket: frame.socket,
      metadata: { variant: frame.variant, mask: frame.mask },
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
    styleProfile: { id: "office-pixel", version: 1, palettePolicy: "bounded-project-owned" },
    geometry: { id: "workstation-geometry", version: 1, footprint: { widthCells: 2, depthCells: 1 }, clearance: { widthCells: 3, depthCells: 2 } },
    alphaPolicy: { border: "transparent", filter: "nearest" },
    nativeScale: { pixelsPerCell: 8, filter: "nearest" },
    palette: { colors: Object.values(COLORS).filter((color) => color[3] !== 0) },
    connectivity: { familyId: FAMILY, supportedMasks: MASKS, seamPolicy: "exact", socketId: "seated" },
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
    atlas: { atlasId: "workstation-basic-atlas", atlasVersion: 1, path: `office-v2/atlases/${FAMILY}/v${VERSION}.png`, sha256: hashObject({ family: FAMILY, version: VERSION, frames: source.frames.map(({ frameId }) => frameId) }), paddingPx: 1, extrusionPx: 1 },
    catalog: { catalogId: "office-assets", catalogVersion: 1, admission: "spec-only" },
    sceneBundle: { bundleId: "ground-floor-office", bundleVersion: 1, floorRef: { id: "ground-floor", version: 1 }, admission: "spec-only" },
  };
}

function candidateManifest(source, recipe, factoryReport) {
  return {
    schemaVersion: "office-asset-v1-candidate",
    familyId: FAMILY,
    familyVersion: VERSION,
    projectionId: "office-projection-v1",
    source: { sourceFile: `office-v2/sources/${FAMILY}/v${VERSION}/source.json`, sourceSha256: hashObject(source), recipeFile: `office-v2/recipes/${FAMILY}/v${VERSION}/export.json`, recipeSha256: hashObject(recipe), commercialStatus: "pending-owner-review", reviewerDecision: "pending-owner-review" },
    outputHashes: Object.fromEntries(factoryReport.outputs.map(({ path, sha256 }) => [path, sha256])),
    approval: { geometry: "pending", visual: "pending", commercial: "pending" },
    admission: "spec-only",
  };
}

export function buildProofFamily({ sourcePath = join(ROOT, "assets/office-v2/sources/workstation-basic/v1/source.json"), recipePath = join(ROOT, "assets/office-v2/recipes/workstation-basic/v1/export.json"), outputRootA, outputRootB, reportRoot } = {}) {
  const { source: description, recipe } = readInputs(sourcePath, recipePath);
  const generatedSource = factorySource(description, recipe);
  const reportA = buildAssetExport({ source: generatedSource, recipe, outputRoot: outputRootA });
  const reportB = buildAssetExport({ source: generatedSource, recipe, outputRoot: outputRootB });
  if (canonical(reportA) !== canonical(reportB)) fail("asset.family.build-not-identical", "Two clean proof-family builds did not produce identical reports.");
  const boards = buildReviewBoards({ input: boardInput(generatedSource, reportA), outputRoot: join(reportRoot, "boards") });
  const registry = buildAssetRegistry({ input: registryInput(generatedSource, reportA), outputRoot: join(reportRoot, "registry") });
  const review = { schemaVersion: "office-asset-review-v1", familyId: FAMILY, familyVersion: VERSION, state: "pending-owner-review", geometry: "pending", visual: "pending", commercial: "pending", reviewer: "unassigned", notes: "Technical evidence is complete; explicit owner review is still required before runtime admission." };
  const report = { schemaVersion: "office-asset-family-proof-report-v1", familyId: FAMILY, familyVersion: VERSION, admission: "spec-only", review, supportedMasks: MASKS, seatedSocket: "seated", sourceDescriptionSha256: hashBytes(readFileSync(sourcePath)), recipeFile: `office-v2/recipes/${FAMILY}/v${VERSION}/export.json`, factory: { sourceSha256: reportA.sourceSha256, recipeSha256: reportA.recipeSha256, reportSha256: reportA.reportSha256, outputHashes: Object.fromEntries(reportA.outputs.map(({ path, sha256 }) => [path, sha256])) }, boards: boards.report, registry: registry.report, candidateManifest: candidateManifest(description, recipe, reportA) };
  mkdirSync(dirname(join(reportRoot, "family.json")), { recursive: true });
  writeFileSync(join(reportRoot, "family.json"), canonical(report));
  writeFileSync(join(reportRoot, "review.json"), canonical(review));
  writeFileSync(join(reportRoot, "manifest-candidate.json"), canonical(report.candidateManifest));
  return { report, factory: reportA, boards, registry, source: generatedSource };
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  const reportRoot = join(ROOT, "assets/office-v2/reports/workstation-basic/v1");
  buildProofFamily({ outputRootA: join(reportRoot, "build-a"), outputRootB: join(reportRoot, "build-b"), reportRoot });
}
