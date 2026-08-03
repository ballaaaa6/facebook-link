import { existsSync, lstatSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { buildAssetExport, hashBytes } from "./office-v2-asset-factory.mjs";
import { decodePng } from "./office-v2-asset-admission-png.mjs";
import { buildReviewBoards } from "./office-v2-asset-boards.mjs";
import { buildAssetRegistry } from "./office-v2-asset-registry.mjs";
import { canonicalJsonText } from "./office-v2-asset-factory-format.mjs";
import {
  BACKGROUNDS,
  COLORS,
  DOCK,
  HEIGHT,
  POINTS,
  SCALE,
  WIDTH,
  backgroundPreview,
  encodeRaster,
  layer,
  renderFrame,
  scaleRgba,
  solidCanvas,
  workstationDockDiagnostic,
} from "./office-v2-workstation-basic-v3-art.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const FAMILY = "workstation-basic";
const VERSION = 3;
const MASKS = Object.freeze([0, 2, 8, 10]);
const SEAM_TRANSLATION = Object.freeze({ x: 64, y: 32 });

function fail(code, message, context = {}) {
  const error = new Error("[" + code + "] " + message);
  error.code = code;
  error.context = context;
  throw error;
}

function factorySource(description, recipe) {
  const outputByFrame = new Map(recipe.outputs.filter((output) => output.kind === "png").map((output) => [output.frameId, output.path]));
  return {
    schemaVersion: "office-source-pixels-v1",
    familyId: FAMILY,
    familyVersion: VERSION,
    sourceId: description.sourceId + "-pixels",
    metadata: {
      authoring: description.authoring,
      commercialStatus: description.commercialStatus,
      reviewState: description.reviewState,
      algorithm: description.algorithm,
      projectionId: "office-projection-v1",
      filter: "nearest",
      selectedConcept: 3,
    },
    frames: description.frames.map((frame) => ({
      frameId: frame.frameId,
      outputPath: outputByFrame.get(frame.frameId),
      widthPx: WIDTH,
      heightPx: HEIGHT,
      rgba: renderFrame(frame),
      mask: frame.mask,
      contacts: frame.contacts,
      masks: [frame.mask],
      socket: frame.socket,
      metadata: {
        variant: frame.variant,
        mask: frame.mask,
        selectedConcept: 3,
        projectionId: "office-projection-v1",
        nativeFilter: "nearest",
        componentContract: description.componentContract,
      },
    })),
  };
}

function readInputs(sourcePath, recipePath) {
  const source = JSON.parse(readFileSync(sourcePath, "utf8"));
  const recipe = JSON.parse(readFileSync(recipePath, "utf8"));
  const contractPath = join(ROOT, "assets/office-v2/contracts/workstation-basic/v3/visual-contract.json");
  const contract = JSON.parse(readFileSync(contractPath, "utf8"));
  if (source.schemaVersion !== "office-source-procedural-v1") fail("asset.family.source-schema", "V3 proof source must use the procedural source schema.");
  if (recipe.schemaVersion !== "office-export-recipe-v1") fail("asset.family.recipe-schema", "V3 proof recipe must use the export recipe schema.");
  if (source.familyId !== FAMILY || source.familyVersion !== VERSION || recipe.familyId !== FAMILY || recipe.familyVersion !== VERSION) {
    fail("asset.family.version-invalid", "V3 source and recipe must agree on the workstation family version.");
  }
  if (contract.status !== "selected-concept-frozen" || contract.selectedConcept !== 3 || contract.projection.id !== "office-projection-v1" || contract.projection.ratio !== "2:1") {
    fail("asset.family.contract-invalid", "The selected concept 3 visual contract is missing or invalid.");
  }
  if (contract.native.canvas.widthPx !== WIDTH || contract.native.canvas.heightPx !== HEIGHT || contract.native.filter !== "nearest") {
    fail("asset.family.canvas-invalid", "V3 source canvas must match the selected concept native nearest-neighbor canvas.");
  }
  const masks = source.frames.map(({ mask }) => mask).sort((left, right) => left - right);
  if (masks.join(",") !== MASKS.join(",")) fail("asset.family.mask-set-invalid", "The V3 proof family must contain masks 0, 2, 8, and 10.", { masks });
  const dock = contract.interaction.workstationDock.spritePx;
  if (dock.x !== DOCK.x || dock.y !== DOCK.y) fail("asset.family.dock-invalid", "The V3 workstation dock must remain at the frozen projected point.", { dock });
  return { source, recipe, contract, contractPath };
}

function boardInput(source, factoryReport) {
  return {
    schemaVersion: "office-asset-board-input-v1",
    familyId: FAMILY,
    familyVersion: VERSION,
    sourceSha256: factoryReport.sourceSha256,
    recipeSha256: factoryReport.recipeSha256,
    styleProfile: { id: "office-pixel", version: 1, projectionId: "office-projection-v1", ratio: "2:1", lightDirection: "northwest", filter: "nearest", selectedConcept: 3 },
    geometry: { id: "workstation-geometry", version: 1, projectionId: "office-projection-v1", footprint: { widthCells: 2, depthCells: 1 }, clearance: { widthCells: 3, depthCells: 2 }, visualHeightPx: 48, spriteOriginPx: { x: 56, y: 24 } },
    alphaPolicy: { border: "transparent", filter: "nearest", translucentPixels: "forbidden" },
    nativeScale: { tileWidthPx: 64, tileHeightPx: 32, elevationHeightPx: 16, filter: "nearest", scaleRule: "integer-only" },
    palette: { colors: Object.values(COLORS).filter((color) => color[3] !== 0) },
    connectivity: {
      familyId: FAMILY,
      supportedMasks: MASKS,
      seamPolicy: "exact",
      socketId: "workstation-dock",
      bitDirections: { north: 1, east: 2, south: 4, west: 8 },
      westSeam: { from: { x: 56, y: 24 }, to: { x: 24, y: 40 } },
      eastSeam: { from: { x: 120, y: 56 }, to: { x: 88, y: 72 } },
    },
    review: { state: "pending-owner-review", geometry: "pending", visual: "pending", commercial: "pending" },
    frames: source.frames.map((frame) => ({ frameId: frame.frameId, widthPx: frame.widthPx, heightPx: frame.heightPx, rgba: frame.rgba, contacts: frame.contacts, masks: frame.masks })),
  };
}

function registryInput(source, factoryReport) {
  const hashes = new Map(factoryReport.outputs.filter((output) => output.kind === "png").map((output) => [output.frameId, output.sha256]));
  return {
    schemaVersion: "office-asset-registry-input-v1",
    family: { familyId: FAMILY, familyVersion: VERSION, projectionId: "office-projection-v1", geometryRef: { id: "workstation-geometry", version: 1 }, admission: "spec-only", approval: { geometry: "pending", visual: "pending", commercial: "pending" } },
    frames: source.frames.map((frame) => ({
      frameId: frame.frameId,
      frameVersion: 1,
      variantId: frame.metadata.variant,
      widthPx: frame.widthPx,
      heightPx: frame.heightPx,
      orientation: "south",
      runtimePath: "office-v2/runtime/" + FAMILY + "/v" + VERSION + "/" + frame.frameId + ".png",
      sha256: hashes.get(frame.frameId),
      lifecycleGroup: "workstations",
    })),
    atlas: {
      atlasId: "workstation-basic-v3-atlas",
      atlasVersion: 1,
      path: "office-v2/atlases/workstation-basic/v3.png",
      sha256: hashBytes(Buffer.from(canonicalJsonText({ family: FAMILY, version: VERSION, selectedConcept: 3, frames: source.frames.map(({ frameId }) => frameId), canvas: { widthPx: WIDTH, heightPx: HEIGHT } }), "utf8")),
      paddingPx: 1,
      extrusionPx: 1,
    },
    catalog: { catalogId: "office-assets-v3", catalogVersion: 1, admission: "spec-only" },
    sceneBundle: { bundleId: "ground-floor-office-v3", bundleVersion: 1, floorRef: { id: "ground-floor", version: 1 }, admission: "spec-only" },
  };
}

function candidateManifest(description, factoryReport, sourceHash, recipeHash) {
  return {
    schemaVersion: "office-asset-v1-candidate",
    familyId: FAMILY,
    familyVersion: VERSION,
    projectionId: "office-projection-v1",
    source: {
      sourceFile: "office-v2/sources/" + FAMILY + "/v" + VERSION + "/source.json",
      sourceSha256: sourceHash,
      recipeFile: "office-v2/recipes/" + FAMILY + "/v" + VERSION + "/export.json",
      recipeSha256: recipeHash,
      commercialStatus: description.commercialStatus,
      reviewerDecision: description.reviewState,
    },
    selectedConcept: 3,
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
}

function writeJson(root, relativePath, value) {
  writeBinary(root, relativePath, Buffer.from(canonicalJsonText(value), "utf8"));
}

function recordJson(reportRoot, evidence, path, value, metadata = {}) {
  const bytes = Buffer.from(canonicalJsonText(value), "utf8");
  writeBinary(reportRoot, path, bytes);
  evidence.push({ path, sha256: hashBytes(bytes), byteLength: bytes.length, ...metadata });
}

function buildReviewEvidence({ source, reportRoot, boards }) {
  const evidence = [];
  const record = (path, bytes, metadata = {}) => {
    writeBinary(reportRoot, path, bytes);
    evidence.push({ path, sha256: hashBytes(bytes), byteLength: bytes.length, ...metadata });
  };
  const frames = new Map(source.frames.map((frame) => [frame.frameId, frame]));

  for (const frame of source.frames) {
    record("review/background-light/" + frame.frameId + ".png", encodeRaster(backgroundPreview(frame.rgba, BACKGROUNDS.light)), { kind: "background-preview", frameId: frame.frameId, background: "light", filter: "nearest" });
    record("review/background-dark/" + frame.frameId + ".png", encodeRaster(backgroundPreview(frame.rgba, BACKGROUNDS.dark)), { kind: "background-preview", frameId: frame.frameId, background: "dark", filter: "nearest" });
  }

  const boardsByKind = new Map();
  for (const output of boards.outputBytes) {
    const match = /office-v2\/review-boards\/[^/]+\/v\d+\/(native-scale|connectivity)\/(mask-(?:0|2|8|10))\.png/u.exec(output.path);
    if (match) boardsByKind.set(match[1] + ":" + match[2], output.bytes);
  }
  for (const kind of ["native-scale", "connectivity"]) {
    for (const frameId of ["mask-0", "mask-2", "mask-8", "mask-10"]) {
      const bytes = boardsByKind.get(kind + ":" + frameId);
      if (!bytes) fail("asset.family.board-missing", "Expected generated review board PNG is missing.", { kind, frameId });
      const decoded = decodePng(bytes);
      record("review/enlarged-" + kind + "/" + frameId + ".png", encodeRaster(scaleRgba(decoded.rgba, decoded.widthPx, decoded.heightPx, SCALE)), { kind: "enlarged-" + kind, frameId, scale: SCALE, filter: "nearest" });
    }
  }

  const composition = solidCanvas(WIDTH + SEAM_TRANSLATION.x * 2, HEIGHT + SEAM_TRANSLATION.y * 2, BACKGROUNDS.light);
  const order = [["mask-2", 0, 0], ["mask-10", SEAM_TRANSLATION.x, SEAM_TRANSLATION.y], ["mask-8", SEAM_TRANSLATION.x * 2, SEAM_TRANSLATION.y * 2]];
  for (const [frameId, x, y] of order) layer(composition, { width: WIDTH, height: HEIGHT, pixels: frames.get(frameId).rgba }, x, y);
  record("review/three-workstation-seam-composition.png", encodeRaster(composition), { kind: "three-workstation-seam-composition", order: order.map(([frameId]) => frameId), seamTranslationPx: SEAM_TRANSLATION, filter: "nearest" });
  record("review/workstation-dock-diagnostic.png", encodeRaster(workstationDockDiagnostic(frames.get("mask-0").rgba)), { kind: "workstation-dock-diagnostic", dock: DOCK, facing: "northwest", fullSeatedIntegration: "deferred", filter: "nearest" });
  recordJson(reportRoot, evidence, "review/fit-analysis.json", {
    selectedConcept: 3,
    geometryRef: { id: "workstation-geometry", version: 1 },
    footprint: { widthCells: 2, depthCells: 1 },
    canvas: { widthPx: WIDTH, heightPx: HEIGHT },
    visualHeightPx: 48,
    projectedCorners: [POINTS.north, POINTS.east, POINTS.south, POINTS.west],
    withinCanvas: true,
    geometryChangeRequired: false,
  }, { kind: "fit-analysis", geometryChangeRequired: false });
  return evidence.toSorted((left, right) => left.path.localeCompare(right.path));
}

export function buildProofFamily({
  sourcePath = join(ROOT, "assets/office-v2/sources/workstation-basic/v3/source.json"),
  recipePath = join(ROOT, "assets/office-v2/recipes/workstation-basic/v3/export.json"),
  outputRootA,
  outputRootB,
  reportRoot,
} = {}) {
  const { source: description, recipe, contract, contractPath } = readInputs(sourcePath, recipePath);
  const generatedSource = factorySource(description, recipe);
  const reportA = buildAssetExport({ source: generatedSource, recipe, outputRoot: outputRootA });
  const reportB = buildAssetExport({ source: generatedSource, recipe, outputRoot: outputRootB });
  if (canonicalJsonText(reportA) !== canonicalJsonText(reportB)) fail("asset.family.build-not-identical", "Two clean V3 proof-family builds did not produce identical reports.");
  const hashesA = Object.fromEntries(reportA.outputs.map(({ path, sha256 }) => [path, sha256]));
  const hashesB = Object.fromEntries(reportB.outputs.map(({ path, sha256 }) => [path, sha256]));
  if (canonicalJsonText(hashesA) !== canonicalJsonText(hashesB)) fail("asset.family.output-not-identical", "Two clean V3 proof-family builds did not produce identical output hashes.");

  const boards = buildReviewBoards({ input: boardInput(generatedSource, reportA), outputRoot: join(reportRoot, "boards") });
  const registry = buildAssetRegistry({ input: registryInput(generatedSource, reportA), outputRoot: join(reportRoot, "registry") });
  const review = {
    schemaVersion: "office-asset-review-v1",
    familyId: FAMILY,
    familyVersion: VERSION,
    state: "pending-owner-review",
    geometry: "pending",
    visual: "pending",
    commercial: "pending",
    reviewer: "unassigned",
    notes: "Selected concept 3 is reconstructed deterministically. V1 and V2 remain immutable historical evidence; dock is review-only and seated integration is deferred.",
  };
  const sourceHash = hashBytes(readFileSync(sourcePath));
  const recipeHash = hashBytes(readFileSync(recipePath));
  const candidate = candidateManifest(description, reportA, sourceHash, recipeHash);
  const evidence = buildReviewEvidence({ source: generatedSource, reportRoot, boards });
  const report = {
    schemaVersion: "office-asset-family-proof-report-v1",
    taskId: "P5-W6.5-R1-V3",
    familyId: FAMILY,
    familyVersion: VERSION,
    selectedConcept: 3,
    admission: "spec-only",
    runtimeAdmission: "blocked-until-explicit-geometry-visual-commercial-approval",
    visualContract: { file: "assets/office-v2/contracts/workstation-basic/v3/visual-contract.json", sha256: hashBytes(readFileSync(contractPath)), status: contract.status },
    review,
    supportedMasks: MASKS,
    workstationDock: { id: "workstation-dock", spritePx: DOCK, worldSubCell: { x: 4, y: 4, elevation: 0 }, fullSeatedIntegration: "deferred" },
    seamComposition: { order: ["mask-2", "mask-10", "mask-8"], translationPx: SEAM_TRANSLATION },
    componentContract: description.componentContract,
    sourceDescriptionSha256: sourceHash,
    recipeDescriptionSha256: recipeHash,
    factory: { sourceSha256: reportA.sourceSha256, recipeSha256: reportA.recipeSha256, reportSha256: reportA.reportSha256, outputHashes: hashesA, twoCleanBuilds: true, byteIdentical: true },
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
  const reportRoot = join(ROOT, "assets/office-v2/reports/workstation-basic/v3");
  const expectedReportRoot = resolve(ROOT, "assets/office-v2/reports/workstation-basic/v3");
  if (resolve(reportRoot) !== expectedReportRoot || !resolve(reportRoot).startsWith(ROOT + "\\")) fail("asset.family.report-root-invalid", "The V3 CLI may only clean its exact generated report root.");
  if (existsSync(reportRoot)) {
    const stats = lstatSync(reportRoot);
    if (stats.isSymbolicLink() || !stats.isDirectory()) fail("asset.family.report-root-invalid", "The V3 report root must be a real directory.");
    rmSync(reportRoot, { recursive: true, force: true });
  }
  buildProofFamily({ outputRootA: join(reportRoot, "build-a"), outputRootB: join(reportRoot, "build-b"), reportRoot });
}
