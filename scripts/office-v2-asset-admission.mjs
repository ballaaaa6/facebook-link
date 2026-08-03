import { isAbsolute, relative, resolve } from "node:path";
import {
  AssetAdmissionError,
  assetDiagnostic,
  decodePng,
  formatAssetDiagnostic,
  hashBytes,
  inspectPixels,
  pixelAt,
  validatePixelContext,
} from "./office-v2-asset-admission-png.mjs";

export {
  AssetAdmissionError,
  assetDiagnostic,
  decodePng,
  formatAssetDiagnostic,
  inspectPixels,
  pixelAt,
  validatePixelContext,
};

export const ASSET_SCHEMA_ID = "https://affiliate-operations.example/schemas/office-v2/asset.schema.json";

const STAGE_PREFIXES = Object.freeze({
  source: "office-v2/sources/",
  recipe: "office-v2/recipes/",
  runtime: "office-v2/runtime/",
});

function normalizedAssetPath(file) {
  if (typeof file !== "string" || !file || file.includes("\\") || file.startsWith("/") || /^[A-Za-z]:/.test(file)) return null;
  const segments = file.split("/");
  if (segments.some((segment) => !segment || segment === "." || segment === "..")) return null;
  return file;
}

function resourcePath(file, kind, options) {
  const normalized = normalizedAssetPath(file);
  const prefix = STAGE_PREFIXES[kind];
  if (!normalized || !prefix || !normalized.startsWith(prefix)) return null;
  if (!options.assetsRoot || !options.stageRoots?.[kind]) return normalized;
  const absolute = resolve(options.assetsRoot, normalized);
  const stage = resolve(options.stageRoots[kind]);
  const rest = relative(stage, absolute);
  return rest.startsWith("..") || isAbsolute(rest) ? null : normalized;
}

function resourceBytes(options, kind, path) {
  if (options.resources?.[kind] instanceof Map && options.resources[kind].has(path)) return options.resources[kind].get(path);
  if (options.resources?.[kind] && Object.prototype.hasOwnProperty.call(options.resources[kind], path)) return options.resources[kind][path];
  if (typeof options.readResource === "function") {
    const absolute = options.assetsRoot && options.stageRoots?.[kind] ? resolve(options.assetsRoot, path) : null;
    return options.readResource(path, kind, absolute);
  }
  return undefined;
}

function bytesOrNull(value) {
  if (value === undefined || value === null) return null;
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) return Buffer.from(value);
  if (typeof value === "string") return Buffer.from(value, "utf8");
  return null;
}

function basicManifestShape(manifest) {
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) return false;
  if (manifest.schemaVersion !== "office-asset-v1" || typeof manifest.familyId !== "string" || !Number.isInteger(manifest.familyVersion) || manifest.familyVersion < 1 || manifest.projectionId !== "office-projection-v1") return false;
  if (!manifest.source || !manifest.geometry?.canvas || !manifest.render || !Array.isArray(manifest.orientations) || !Array.isArray(manifest.variants) || !manifest.approval) return false;
  return manifest.variants.every((variant) => variant && typeof variant.id === "string" && typeof variant.file === "string" && typeof variant.sha256 === "string" && Number.isInteger(variant.widthPx) && Number.isInteger(variant.heightPx));
}

function schemaValid(manifest, options) {
  try {
    const validate = typeof options.schemaValidate === "function"
      ? options.schemaValidate
      : typeof options.schemaValidator === "function"
        ? options.schemaValidator
        : options.schemaValidator?.getSchema?.(ASSET_SCHEMA_ID);
    if (typeof validate !== "function") return basicManifestShape(manifest);
    return Boolean(validate(structuredClone(manifest)));
  }
  catch { return false; }
}

function statusApproved(manifest) {
  const source = manifest?.source;
  const approval = manifest?.approval;
  return source?.commercialStatus === "approved" && source?.reviewerDecision === "approved"
    && ["geometry", "visual", "commercial"].every((key) => approval?.[key] === "approved");
}

export function validateAssetManifest(manifest, options = {}) {
  const familyKey = `${manifest?.familyId ?? "unknown"}@${manifest?.familyVersion ?? "unknown"}`;
  const diagnostics = [];
  if (manifest?.source && !statusApproved(manifest)) {
    diagnostics.push(assetDiagnostic("asset.commercial-review", "Asset provenance and all runtime approvals must be approved.", { familyKey }));
    return { ok: false, diagnostics, familyKey, variants: 0, references: new Set(), runtime: [] };
  }
  if (!schemaValid(manifest, options)) {
    diagnostics.push(assetDiagnostic("asset.manifest-schema", "Asset manifest does not satisfy frozen office-asset-v1.", { familyKey, manifestPath: options.manifestPath ?? null }));
    return { ok: false, diagnostics, familyKey, variants: 0, references: new Set(), runtime: [] };
  }
  if (options.resources === undefined && typeof options.readResource !== "function") {
    diagnostics.push(assetDiagnostic("asset.resource-reader-missing", "Asset resource bytes are required for admission.", { familyKey }));
    return { ok: false, diagnostics, familyKey, variants: 0, references: new Set(), runtime: [] };
  }
  const references = new Set();
  const runtime = [];
  const addResource = (kind, file, expectedHash, label) => {
    const path = resourcePath(file, kind, options);
    if (!path) {
      diagnostics.push(assetDiagnostic("asset.path-outside-stage", `${label} file is outside its Office V2 stage root.`, { familyKey, kind, file }));
      return null;
    }
    references.add(path);
    if (!options.resources && !options.readResource) return null;
    const bytes = bytesOrNull(resourceBytes(options, kind, path));
    if (!bytes) {
      diagnostics.push(assetDiagnostic(`asset.${kind}-missing`, `Referenced ${kind} file is missing.`, { familyKey, kind, file: path }));
      return null;
    }
    if (hashBytes(bytes) !== expectedHash) diagnostics.push(assetDiagnostic(kind === "runtime" ? "asset.runtime-hash-mismatch" : "asset.source-hash-mismatch", `Referenced ${kind} SHA-256 does not match the manifest.`, { familyKey, kind, file: path }));
    return bytes;
  };
  addResource("source", manifest.source.sourceFile, manifest.source.sourceSha256, "Source");
  addResource("recipe", manifest.source.recipeFile, manifest.source.recipeSha256, "Recipe");
  const variantIds = new Set();
  for (const variant of manifest.variants) {
    if (variantIds.has(variant.id)) diagnostics.push(assetDiagnostic("asset.variant-duplicate", "Asset variant ID is duplicated within a family.", { familyKey, variantId: variant.id }));
    variantIds.add(variant.id);
    const bytes = addResource("runtime", variant.file, variant.sha256, "Runtime");
    const record = { variantId: variant.id, file: resourcePath(variant.file, "runtime", options), decoded: null };
    runtime.push(record);
    if (!bytes) continue;
    try {
      record.decoded = decodePng(bytes);
      if (record.decoded.widthPx !== variant.widthPx || record.decoded.heightPx !== variant.heightPx) diagnostics.push(assetDiagnostic("asset.dimension-mismatch", "Runtime PNG dimensions do not match the manifest variant.", { familyKey, variantId: variant.id, expected: { widthPx: variant.widthPx, heightPx: variant.heightPx }, actual: { widthPx: record.decoded.widthPx, heightPx: record.decoded.heightPx } }));
      if (record.decoded.widthPx !== manifest.geometry.canvas.widthPx || record.decoded.heightPx !== manifest.geometry.canvas.heightPx) diagnostics.push(assetDiagnostic("asset.canvas-dimension-mismatch", "Runtime PNG dimensions do not match the frozen asset canvas.", { familyKey, variantId: variant.id, expected: manifest.geometry.canvas, actual: { widthPx: record.decoded.widthPx, heightPx: record.decoded.heightPx } }));
      const context = options.pixelContexts?.[variant.id] ?? options.pixelContext;
      if (context) diagnostics.push(...validatePixelContext(record.decoded, context).diagnostics);
    } catch (error) {
      if (error instanceof AssetAdmissionError) diagnostics.push(...error.diagnostics.map((diagnostic) => assetDiagnostic(diagnostic.code, diagnostic.message, { familyKey, variantId: variant.id, ...diagnostic.context })));
      else diagnostics.push(assetDiagnostic("asset.png-decode-failed", "Runtime PNG could not be decoded.", { familyKey, variantId: variant.id }));
    }
  }
  return { ok: diagnostics.length === 0, diagnostics, familyKey, variants: manifest.variants.length, references, runtime };
}

export function validateAssetManifests(entries, options = {}) {
  const diagnostics = [];
  const familyKeys = new Set();
  const runtimeFiles = new Set();
  const pixelDigests = new Set();
  const references = new Set();
  let variants = 0;
  for (const entry of entries) {
    const manifest = entry?.manifest ?? entry;
    const result = validateAssetManifest(manifest, { ...options, manifestPath: entry?.manifestPath ?? options.manifestPath });
    diagnostics.push(...result.diagnostics);
    variants += result.variants;
    for (const reference of result.references) references.add(reference);
    if (familyKeys.has(result.familyKey)) diagnostics.push(assetDiagnostic("asset.family-duplicate", "Asset family version is duplicated.", { familyKey: result.familyKey }));
    familyKeys.add(result.familyKey);
    for (const record of result.runtime) {
      if (record.file && runtimeFiles.has(record.file)) diagnostics.push(assetDiagnostic("asset.file-duplicate", "Runtime file is reused by multiple variants.", { familyKey: result.familyKey, variantId: record.variantId, file: record.file }));
      if (record.file) runtimeFiles.add(record.file);
      if (record.decoded) {
        const digest = record.decoded.contentSha256;
        if (pixelDigests.has(digest)) diagnostics.push(assetDiagnostic("asset.pixel-duplicate", "Decoded runtime pixels are duplicated.", { familyKey: result.familyKey, variantId: record.variantId, contentSha256: digest }));
        pixelDigests.add(digest);
      }
    }
  }
  return { ok: diagnostics.length === 0, diagnostics, variants, references, familyCount: entries.length };
}

export function validateOrphanResources({ stageFiles = {}, referencedPaths = new Set() } = {}) {
  const diagnostics = [];
  for (const kind of Object.keys(STAGE_PREFIXES)) {
    for (const file of stageFiles[kind] ?? []) {
      const normalized = normalizedAssetPath(file);
      if (normalized && !referencedPaths.has(normalized)) diagnostics.push(assetDiagnostic("asset.orphan-reference", "Stage resource is not referenced by an admitted manifest.", { kind, file: normalized }));
    }
  }
  return { ok: diagnostics.length === 0, diagnostics };
}

export function validateAssetResources({ manifests = [], stageFiles = {}, ...options } = {}) {
  const admission = validateAssetManifests(manifests, options);
  const orphan = validateOrphanResources({ stageFiles, referencedPaths: admission.references });
  return { ...admission, ok: admission.ok && orphan.ok, diagnostics: [...admission.diagnostics, ...orphan.diagnostics] };
}

export const parsePng = decodePng;
export const validateManifest = validateAssetManifest;
export const validatePixelMetadata = validatePixelContext;
