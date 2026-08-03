import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { test } from "node:test";
import { deflateSync } from "node:zlib";
import {
  AssetAdmissionError,
  decodePng,
  formatAssetDiagnostic,
  inspectPixels,
  validateAssetManifest,
  validateAssetManifests,
  validateAssetResources,
  validateOrphanResources,
  validatePixelContext,
} from "./office-v2-asset-admission.mjs";

const SIGNATURE = Buffer.from("89504e470d0a1a0a", "hex");
const CRC_TABLE = new Uint32Array(256);
for (let index = 0; index < 256; index += 1) {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = (value & 1) ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  CRC_TABLE[index] = value >>> 0;
}
function crc32(bytes) { let value = 0xffffffff; for (const byte of bytes) value = CRC_TABLE[(value ^ byte) & 0xff] ^ (value >>> 8); return (value ^ 0xffffffff) >>> 0; }
function chunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii"); const result = Buffer.alloc(12 + data.length);
  result.writeUInt32BE(data.length, 0); typeBytes.copy(result, 4); data.copy(result, 8); result.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 8 + data.length); return result;
}
function paeth(left, above, upperLeft) { const estimate = left + above - upperLeft; const a = Math.abs(estimate - left); const b = Math.abs(estimate - above); const c = Math.abs(estimate - upperLeft); return a <= b && a <= c ? left : b <= c ? above : upperLeft; }
function makePng({ width = 2, height = 2, pixels = null, filters = [0], colorType = 6, bitDepth = 8, interlace = 0, raw = null, idat = null, includeIend = true } = {}) {
  const source = pixels ?? Array.from({ length: width * height }, (_, index) => [index * 7 % 256, 40, 80, index === 0 ? 0 : 255]);
  const rowBytes = width * 4; const scanlines = [];
  for (let row = 0; row < height; row += 1) {
    const original = Buffer.from(source.slice(row * width, (row + 1) * width).flat()); const filter = filters[row % filters.length]; const encoded = Buffer.alloc(rowBytes); const previous = row ? Buffer.from(source.slice((row - 1) * width, row * width).flat()) : Buffer.alloc(rowBytes);
    for (let index = 0; index < rowBytes; index += 1) {
      const left = index >= 4 ? original[index - 4] : 0; const above = previous[index]; const upperLeft = index >= 4 ? previous[index - 4] : 0;
      const predictor = filter === 0 ? 0 : filter === 1 ? left : filter === 2 ? above : filter === 3 ? Math.floor((left + above) / 2) : paeth(left, above, upperLeft);
      encoded[index] = (original[index] - predictor) & 0xff;
    }
    scanlines.push(Buffer.from([filter]), encoded);
  }
  const header = Buffer.alloc(13); header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4); header[8] = bitDepth; header[9] = colorType; header[10] = 0; header[11] = 0; header[12] = interlace;
  const data = raw ?? Buffer.concat(scanlines); const chunks = [chunk("IHDR", header), chunk("IDAT", idat ?? deflateSync(data))]; if (includeIend) chunks.push(chunk("IEND", Buffer.alloc(0))); return Buffer.concat([SIGNATURE, ...chunks]);
}
function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
const sourcePath = "office-v2/sources/synthetic/v1/source.bin";
const recipePath = "office-v2/recipes/synthetic/v1/recipe.json";
function manifestFor(png, overrides = {}) {
  const source = Buffer.from("synthetic-source"); const recipe = Buffer.from("synthetic-recipe"); const runtimePath = overrides.runtimePath ?? "office-v2/runtime/synthetic/v1/variant.png";
  const manifest = {
    schemaVersion: "office-asset-v1", familyId: overrides.familyId ?? "synthetic-family", familyVersion: 1, projectionId: "office-projection-v1",
    source: { schemaVersion: "office-provenance-v1", sourceId: "synthetic-source", sourceFile: sourcePath, authoringMethod: "hand-drawn", authorOrTool: "test", createdAt: "2026-08-03T00:00:00Z", licenseStatus: "project-owned", commercialStatus: "approved", sourceSha256: sha256(source), recipeFile: recipePath, recipeVersion: 1, recipeSha256: sha256(recipe), reviewerDecision: "approved" },
    geometry: { canvas: { widthPx: overrides.canvasWidth ?? 2, heightPx: overrides.canvasHeight ?? 2 }, footprint: [{ x: 0, y: 0 }], anchor: { x: 0, y: 0, elevation: 0 }, spriteOrigin: { xPx: 1, yPx: 1 }, groundContact: { xPx: 1, yPx: 1 }, visualHeightPx: 1, sockets: [] },
    render: { band: "world", pixelDensity: 1, filtering: "nearest", splitMode: "single" }, orientations: ["north"], variants: [{ id: "variant", file: runtimePath, sha256: sha256(png), orientation: "north", widthPx: overrides.width ?? 2, heightPx: overrides.height ?? 2 }], approval: { geometry: "approved", visual: "approved", commercial: "approved" },
  };
  return { manifest: { ...manifest, ...overrides.manifest }, resources: { source: new Map([[sourcePath, source]]), recipe: new Map([[recipePath, recipe]]), runtime: new Map([[runtimePath, png]]) } };
}
function codes(result) { return result.diagnostics.map((diagnostic) => diagnostic.code); }

test("decodes valid RGBA PNGs and all accepted filters with stable pixel digests", () => {
  const pixels = Array.from({ length: 10 }, (_, index) => [index, 30 + index, 70, index % 3 === 0 ? 0 : 255]);
  const decoded = decodePng(makePng({ width: 2, height: 5, pixels, filters: [0, 1, 2, 3, 4] }));
  assert.equal(decoded.widthPx, 2); assert.equal(decoded.heightPx, 5); assert.deepEqual([...decoded.rgba.slice(0, 8)], pixels.slice(0, 2).flat());
  assert.equal(decoded.pixelSha256, sha256(decoded.rgba)); assert.match(decoded.contentSha256, /^[0-9a-f]{64}$/);
  const inspection = inspectPixels(decoded); assert.equal(inspection.transparentPixels, 4); assert.equal(inspection.opaquePixels, 6); assert.equal(inspection.alpha.hasTransparency, true);
});

test("rejects PNG signature, CRC, truncation, and malformed compressed data with exact diagnostics", () => {
  const valid = makePng(); const badSignature = Buffer.from(valid); badSignature[0] ^= 1;
  assert.throws(() => decodePng(badSignature), (error) => error instanceof AssetAdmissionError && error.code === "asset.png-signature-invalid");
  const badCrc = Buffer.from(valid); badCrc[29] ^= 1;
  assert.throws(() => decodePng(badCrc), (error) => error.code === "asset.png-crc-mismatch");
  assert.throws(() => decodePng(valid.subarray(0, valid.length - 1)), (error) => error.code === "asset.png-truncated");
  const badIdat = makePng({ idat: Buffer.from("not-deflated") });
  assert.throws(() => decodePng(badIdat), (error) => error.code === "asset.png-decompression-failed");
});

test("rejects unsupported PNG color, bit-depth, interlace, and scanline filter values", () => {
  assert.throws(() => decodePng(makePng({ colorType: 2 })), (error) => error.code === "asset.png-unsupported-color-type");
  assert.throws(() => decodePng(makePng({ bitDepth: 4 })), (error) => error.code === "asset.png-unsupported-bit-depth");
  assert.throws(() => decodePng(makePng({ interlace: 1 })), (error) => error.code === "asset.png-unsupported-interlace");
  assert.throws(() => decodePng(makePng({ width: 1, height: 1, raw: Buffer.from([5, 0, 0, 0, 255]) })), (error) => error.code === "asset.png-filter-unsupported");
});

test("validates future alpha and pixel context without widening the V1 manifest", () => {
  const decoded = decodePng(makePng({ pixels: [[10, 20, 30, 0], [10, 20, 30, 255], [1, 2, 3, 255], [4, 5, 6, 255]] }));
  assert.deepEqual(codes(validatePixelContext(decoded, { alpha: { requireOpaque: true } })), ["asset.alpha-invalid"]);
  assert.deepEqual(codes(validatePixelContext(decoded, { pixels: { required: [{ x: 0, y: 0, rgba: [1, 2, 3, 255] }] } })), ["asset.pixel-mismatch"]);
  assert.deepEqual(codes(validatePixelContext(decoded, { palette: { allowed: [[10, 20, 30, 0], [10, 20, 30, 255], [1, 2, 3, 255], [4, 5, 6, 255]] }, contacts: [{ id: "seat", x: 1, y: 1, requiredAlpha: "opaque" }] })), []);
});

test("admits an immutable manifest and rejects hash and dimension drift", () => {
  const png = makePng(); const fixture = manifestFor(png); const before = structuredClone(fixture.manifest);
  const accepted = validateAssetManifest(fixture.manifest, { resources: fixture.resources }); assert.equal(accepted.ok, true); assert.deepEqual(fixture.manifest, before);
  const hashDrift = manifestFor(png, { manifest: { source: { ...fixture.manifest.source, sourceSha256: "0".repeat(64) } } });
  assert.deepEqual(codes(validateAssetManifest(hashDrift.manifest, { resources: fixture.resources })), ["asset.source-hash-mismatch"]);
  const dimensionDrift = manifestFor(png, { width: 1, canvasWidth: 2 });
  assert.deepEqual(codes(validateAssetManifest(dimensionDrift.manifest, { resources: dimensionDrift.resources })), ["asset.dimension-mismatch"]);
});

test("fails closed when resource bytes are not available and when files are missing", () => {
  const fixture = manifestFor(makePng());
  assert.deepEqual(codes(validateAssetManifest(fixture.manifest)), ["asset.resource-reader-missing"]);
  const missing = validateAssetManifest(fixture.manifest, { resources: { source: fixture.resources.source } });
  assert.deepEqual(codes(missing), ["asset.recipe-missing", "asset.runtime-missing"]);
});

test("rejects stage escapes and unapproved material before resource admission", () => {
  const png = makePng(); const escaped = manifestFor(png, { runtimePath: "office-v2/sources/synthetic/v1/not-runtime.png" });
  assert.deepEqual(codes(validateAssetManifest(escaped.manifest, { resources: escaped.resources })), ["asset.path-outside-stage"]);
  const unapproved = manifestFor(png, { manifest: { source: { ...manifestFor(png).manifest.source, commercialStatus: "pending-review", reviewerDecision: "pending" }, approval: { geometry: "approved", visual: "approved", commercial: "pending" } } });
  assert.deepEqual(codes(validateAssetManifest(unapproved.manifest, { resources: unapproved.resources })), ["asset.commercial-review"]);
});

test("rejects duplicate families/files/pixels and orphan stage resources", () => {
  const png = makePng(); const first = manifestFor(png); const duplicate = manifestFor(png); const familyResult = validateAssetManifests([first, duplicate], { resources: { source: new Map([[sourcePath, Buffer.from("synthetic-source")]]), recipe: new Map([[recipePath, Buffer.from("synthetic-recipe")]]), runtime: new Map([["office-v2/runtime/synthetic/v1/variant.png", png]]) } });
  assert.deepEqual(codes(familyResult), ["asset.family-duplicate", "asset.file-duplicate", "asset.pixel-duplicate"]);
  const second = manifestFor(png, { familyId: "second-family", runtimePath: "office-v2/runtime/second/v1/variant.png" });
  const resources = { source: new Map([[sourcePath, Buffer.from("synthetic-source")]]), recipe: new Map([[recipePath, Buffer.from("synthetic-recipe")]]), runtime: new Map([["office-v2/runtime/synthetic/v1/variant.png", png], ["office-v2/runtime/second/v1/variant.png", png]]) };
  assert.deepEqual(codes(validateAssetManifests([first, second], { resources })), ["asset.pixel-duplicate"]);
  const orphan = validateOrphanResources({ referencedPaths: new Set([sourcePath, recipePath, "office-v2/runtime/synthetic/v1/variant.png"]), stageFiles: { source: [sourcePath, "office-v2/sources/orphan.bin"], recipe: [recipePath], runtime: ["office-v2/runtime/synthetic/v1/variant.png"] } });
  assert.deepEqual(codes(orphan), ["asset.orphan-reference"]);
});

test("resource admission reports orphan closure and preserves exact zero-manifest CLI output", () => {
  const fixture = manifestFor(makePng()); const result = validateAssetResources({ manifests: [{ manifest: fixture.manifest }], resources: fixture.resources, stageFiles: { source: [sourcePath], recipe: [recipePath], runtime: ["office-v2/runtime/synthetic/v1/variant.png", "office-v2/runtime/orphan/v1/orphan.png"] } });
  assert.deepEqual(codes(result), ["asset.orphan-reference"]); assert.equal(formatAssetDiagnostic(result.diagnostics[0]), "[asset.orphan-reference] Stage resource is not referenced by an admitted manifest. {\"kind\":\"runtime\",\"file\":\"office-v2/runtime/orphan/v1/orphan.png\"}");
  const output = execFileSync(process.execPath, ["scripts/office-v2-asset-check.mjs"], { encoding: "utf8" });
  assert.equal(output, "Office V2 assets OK: no runtime manifests admitted; foundation state is valid.\n");
});
