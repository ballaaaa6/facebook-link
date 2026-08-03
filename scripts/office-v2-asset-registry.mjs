import { existsSync, lstatSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { hashBytes } from "./office-v2-asset-factory.mjs";

const SLUG = /^[a-z0-9]+(?:[a-z0-9_-]*[a-z0-9])?$/u;
const SHA256 = /^[a-f0-9]{64}$/u;
const RUNTIME_PATH = /^office-v2\/runtime\/[a-z0-9/_-]+\.png$/u;
const ATLAS_PATH = /^office-v2\/atlases\/[a-z0-9/_-]+\.png$/u;
const FACING = new Set(["north", "east", "south", "west"]);

export class AssetRegistryError extends Error {
  constructor(code, message, context = {}) {
    super(`[${code}] ${message}${Object.keys(context).length ? ` ${JSON.stringify(context)}` : ""}`);
    this.name = "AssetRegistryError";
    this.code = code;
    this.context = Object.freeze({ ...context });
  }
}

function fail(code, message, context = {}) { throw new AssetRegistryError(code, message, context); }
function object(value, code, message, context = {}) { if (value === null || typeof value !== "object" || Array.isArray(value)) fail(code, message, context); return value; }
function slug(value, field) { if (typeof value !== "string" || !SLUG.test(value) || value === "latest") fail(`asset.registry.${field}-invalid`, `${field} must be a stable lower-case identifier.`, { field, value: value ?? null }); return value; }
function positive(value, field) { if (!Number.isSafeInteger(value) || value < 1) fail(`asset.registry.${field}-invalid`, `${field} must be a positive integer.`, { field, value: value ?? null }); return value; }
function digest(value, field) { if (typeof value !== "string" || !SHA256.test(value)) fail(`asset.registry.${field}-invalid`, `${field} must be a lower-case SHA-256 digest.`, { field }); return value; }
function ref(value, field) {
  object(value, `asset.registry.${field}-invalid`, `${field} must be a versioned reference.`);
  return { id: slug(value.id, `${field}-id`), version: positive(value.version, `${field}-version`) };
}
function sameRef(left, right) { return left.id === right.id && left.version === right.version; }
function assertAdmission(value, field = "admission") { if (!["spec-only", "runtime-approved"].includes(value)) fail(`asset.registry.${field}-invalid`, `${field} must be spec-only or runtime-approved.`, { value: value ?? null }); return value; }
function canonical(value, path = "$") {
  if (value instanceof Uint8Array) return `[${[...value].join(",")}]`;
  if (value === null || typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") { if (!Number.isFinite(value)) fail("asset.registry.metadata-invalid", "Registry metadata numbers must be finite.", { path }); return Object.is(value, -0) ? "0" : JSON.stringify(value); }
  if (Array.isArray(value)) return `[${value.map((entry, index) => canonical(entry, `${path}[${index}]`)).join(",")}]`;
  if (typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype) fail("asset.registry.metadata-invalid", "Registry metadata must be JSON-compatible.", { path });
  return `{${Object.keys(value).sort().map((key) => { if (value[key] === undefined) fail("asset.registry.metadata-invalid", "Registry metadata cannot contain undefined values.", { path: `${path}.${key}` }); return `${JSON.stringify(key)}:${canonical(value[key], `${path}.${key}`)}`; }).join(",")}}`;
}
function unique(values, code, field) {
  const seen = new Set();
  for (const value of values) { if (seen.has(value)) fail(code, `${field} must be unique.`, { value }); seen.add(value); }
}

function normalizeFamily(raw) {
  object(raw, "asset.registry.family-missing", "A family document is required.");
  const familyId = slug(raw.familyId ?? raw.id, "family-id");
  const familyVersion = positive(raw.familyVersion ?? raw.version, "family-version");
  if ((raw.projectionId ?? "office-projection-v1") !== "office-projection-v1") fail("asset.registry.projection-invalid", "Asset registry requires office-projection-v1.");
  const admission = assertAdmission(raw.admission ?? "spec-only", "family-admission");
  if (admission === "runtime-approved" && (!raw.approval || ["geometry", "visual", "commercial"].some((key) => raw.approval[key] !== "approved"))) fail("asset.registry.approval-required", "Runtime-approved registry input requires explicit geometry, visual, and commercial approvals.");
  return { ...raw, familyId, familyVersion, projectionId: "office-projection-v1", admission, geometryRef: ref(raw.geometryRef, "geometry") };
}

function normalizeFrames(rawFrames, family) {
  if (!Array.isArray(rawFrames) || rawFrames.length === 0) fail("asset.registry.frames-missing", "At least one frame is required for registry compilation.");
  const frameIds = new Set();
  const paths = new Set();
  const frames = rawFrames.map((raw, index) => {
    object(raw, "asset.registry.frame-invalid", "Every frame must be an object.", { index });
    const frameId = slug(raw.frameId ?? raw.id, "frame-id");
    const variantId = slug(raw.variantId ?? frameId, "variant-id");
    const frameVersion = positive(raw.frameVersion ?? raw.version ?? 1, "frame-version");
    const runtimePath = raw.runtimePath;
    if (typeof runtimePath !== "string" || !RUNTIME_PATH.test(runtimePath) || runtimePath.includes("latest")) fail("asset.registry.runtime-path-invalid", "Frame runtimePath must be an exact office-v2 runtime PNG path.", { frameId, runtimePath: runtimePath ?? null });
    if (frameIds.has(frameId)) fail("asset.registry.frame-duplicate", "Frame IDs must be unique.", { frameId });
    if (paths.has(runtimePath)) fail("asset.registry.runtime-duplicate", "Runtime paths must be unique.", { runtimePath });
    frameIds.add(frameId); paths.add(runtimePath);
    const geometryRef = raw.geometryRef === undefined ? family.geometryRef : ref(raw.geometryRef, "frame-geometry");
    if (!sameRef(geometryRef, family.geometryRef)) fail("asset.registry.geometry-mismatch", "Frame geometry must match the family geometry reference.", { frameId });
    if (!FACING.has(raw.orientation ?? "south")) fail("asset.registry.orientation-invalid", "Frame orientation must be one of the four cardinal facings.", { frameId });
    return { ...raw, frameId, variantId, frameVersion, geometryRef, orientation: raw.orientation ?? "south", runtimePath, sha256: digest(raw.sha256, "runtime-sha256"), lifecycleGroup: slug(raw.lifecycleGroup ?? "office-assets", "lifecycle-group"), widthPx: positive(raw.widthPx, "frame-width"), heightPx: positive(raw.heightPx, "frame-height") };
  });
  return frames;
}

function normalizeAtlas(raw, family, frames) {
  object(raw, "asset.registry.atlas-missing", "An atlas document is required.");
  const atlasId = slug(raw.atlasId ?? raw.id, "atlas-id");
  const atlasVersion = positive(raw.atlasVersion ?? raw.version, "atlas-version");
  if (typeof raw.path !== "string" || !ATLAS_PATH.test(raw.path) || raw.path.includes("latest")) fail("asset.registry.atlas-path-invalid", "Atlas path must be an exact office-v2 atlas PNG path.", { path: raw.path ?? null });
  const frameMap = new Map(frames.map((frame) => [frame.frameId, frame]));
  const sourceEntries = raw.entries ?? frames.map((frame, order) => ({ entryId: `${family.familyId}-${frame.frameId}`, frameId: frame.frameId, rect: { xPx: 0, yPx: 0, widthPx: frame.widthPx, heightPx: frame.heightPx }, order }));
  if (!Array.isArray(sourceEntries) || sourceEntries.length === 0) fail("asset.registry.atlas-entries-missing", "Atlas must declare at least one entry.");
  const entryIds = new Set();
  const entries = sourceEntries.map((rawEntry, index) => {
    object(rawEntry, "asset.registry.atlas-entry-invalid", "Every atlas entry must be an object.", { index });
    const frame = frameMap.get(rawEntry.frameId ?? rawEntry.frameRef?.id);
    if (!frame || (rawEntry.frameRef?.version !== undefined && rawEntry.frameRef.version !== frame.frameVersion)) fail("asset.registry.atlas-frame-missing", "Atlas entry references an unknown or incompatible frame.", { frameId: rawEntry.frameId ?? rawEntry.frameRef?.id });
    const entryId = slug(rawEntry.entryId ?? `${family.familyId}-${frame.frameId}`, "atlas-entry-id");
    if (entryIds.has(entryId)) fail("asset.registry.atlas-entry-duplicate", "Atlas entry IDs must be unique.", { entryId });
    entryIds.add(entryId);
    const rect = rawEntry.rect ?? { xPx: 0, yPx: 0, widthPx: frame.widthPx, heightPx: frame.heightPx };
    if (!Number.isInteger(rect.xPx) || !Number.isInteger(rect.yPx) || !Number.isInteger(rect.widthPx) || !Number.isInteger(rect.heightPx) || rect.xPx < 0 || rect.yPx < 0 || rect.widthPx < 1 || rect.heightPx < 1) fail("asset.registry.rect-invalid", "Atlas entry rect must be a positive pixel rectangle.", { entryId });
    return { entryId, familyRef: { id: family.familyId, version: family.familyVersion }, variantId: frame.variantId, frameRef: { id: frame.frameId, version: frame.frameVersion }, geometryRef: frame.geometryRef, orientation: frame.orientation, rect, order: Number.isInteger(rawEntry.order) ? rawEntry.order : index };
  });
  const frameIds = entries.map((entry) => entry.frameRef.id);
  unique(frameIds, "asset.registry.atlas-frame-duplicate", "Atlas frame references");
  if (frameIds.length !== frames.length) fail("asset.registry.atlas-frame-missing", "Atlas must contain exactly one entry for every frame.");
  return { schemaVersion: "office-atlas-v1", atlasId, atlasVersion, path: raw.path, sha256: digest(raw.sha256, "atlas-sha256"), paddingPx: raw.paddingPx ?? 0, extrusionPx: raw.extrusionPx ?? 0, rotation: "forbidden-v1", trimming: "forbidden-v1", entries: entries.sort((left, right) => left.entryId.localeCompare(right.entryId)).map((entry, order) => ({ ...entry, order })) };
}

function normalizeCatalog(raw, family, frames, atlas) {
  object(raw, "asset.registry.catalog-missing", "An asset catalog document is required.");
  const catalogId = slug(raw.catalogId ?? raw.id, "catalog-id");
  const catalogVersion = positive(raw.catalogVersion ?? raw.version, "catalog-version");
  const admission = assertAdmission(raw.admission ?? family.admission, "catalog-admission");
  if (admission === "runtime-approved" && family.admission !== "runtime-approved") fail("asset.registry.approval-required", "A runtime-approved catalog requires a runtime-approved family.");
  const atlasRef = { id: atlas.atlasId, version: atlas.atlasVersion };
  const atlasRefs = raw.atlasRefs ?? [atlasRef];
  if (!Array.isArray(atlasRefs) || !atlasRefs.length) fail("asset.registry.atlas-refs-missing", "Catalog must declare at least one atlas reference.");
  const normalizedAtlasRefs = atlasRefs.map((value) => ref(value, "atlas-ref"));
  if (!normalizedAtlasRefs.some((value) => sameRef(value, atlasRef))) fail("asset.registry.atlas-ref-missing", "Catalog must reference its compiled atlas.");
  const frameMap = new Map(frames.map((frame) => [frame.frameId, frame]));
  const sourceEntries = raw.entries ?? frames.map((frame) => ({ entryId: `${family.familyId}-${frame.frameId}`, frameId: frame.frameId }));
  if (!Array.isArray(sourceEntries) || !sourceEntries.length) fail("asset.registry.catalog-entries-missing", "Catalog must declare at least one entry.");
  const entryIds = new Set();
  const entries = sourceEntries.map((rawEntry, index) => {
    object(rawEntry, "asset.registry.catalog-entry-invalid", "Every catalog entry must be an object.", { index });
    const frame = frameMap.get(rawEntry.frameId ?? rawEntry.frameRef?.id);
    if (!frame) fail("asset.registry.catalog-frame-missing", "Catalog entry references an unknown frame.", { frameId: rawEntry.frameId ?? rawEntry.frameRef?.id });
    const entryId = slug(rawEntry.entryId ?? `${family.familyId}-${frame.frameId}`, "catalog-entry-id");
    if (entryIds.has(entryId)) fail("asset.registry.catalog-entry-duplicate", "Catalog entry IDs must be unique.", { entryId });
    entryIds.add(entryId);
    if (rawEntry.frameRef?.version !== undefined && rawEntry.frameRef.version !== frame.frameVersion) fail("asset.registry.version-mismatch", "Catalog frame reference version does not match the frame.", { entryId });
    return { entryId, familyRef: { id: family.familyId, version: family.familyVersion }, variantId: frame.variantId, frameRef: { id: frame.frameId, version: frame.frameVersion }, atlasRef, geometryRef: frame.geometryRef, runtimePath: frame.runtimePath, sha256: frame.sha256, lifecycleGroup: frame.lifecycleGroup, admission };
  });
  unique(entries.map((entry) => entry.frameRef.id), "asset.registry.catalog-frame-duplicate", "Catalog frame references");
  if (entries.length !== frames.length) fail("asset.registry.catalog-frame-missing", "Catalog must contain exactly one entry for every frame.");
  return { schemaVersion: "office-asset-catalog-v1", catalogId, catalogVersion, atlasRefs: normalizedAtlasRefs, entries: entries.sort((left, right) => left.entryId.localeCompare(right.entryId)), missingAssetPolicy: "fail-closed", admission };
}

function normalizeBundle(raw, family, catalog) {
  object(raw, "asset.registry.bundle-missing", "A scene bundle document is required.");
  const bundleId = slug(raw.bundleId ?? raw.id, "bundle-id");
  const bundleVersion = positive(raw.bundleVersion ?? raw.version, "bundle-version");
  const catalogRef = ref(raw.catalogRef ?? { id: catalog.catalogId, version: catalog.catalogVersion }, "catalog");
  if (!sameRef(catalogRef, { id: catalog.catalogId, version: catalog.catalogVersion })) fail("asset.registry.catalog-ref-mismatch", "Scene bundle catalogRef must match the compiled catalog.");
  const floorRef = ref(raw.floorRef, "floor");
  const admission = assertAdmission(raw.admission ?? catalog.admission, "bundle-admission");
  if (admission !== catalog.admission) fail("asset.registry.admission-mismatch", "Scene bundle admission must match its catalog.");
  const assetRefs = catalog.entries.map((entry) => ({ catalogEntryId: entry.entryId, familyRef: entry.familyRef, variantId: entry.variantId, frameRef: entry.frameRef, lifecycleGroup: entry.lifecycleGroup }));
  const lifecycle = { preloadOrder: assetRefs.map((entry) => entry.catalogEntryId), uploadOrder: assetRefs.map((entry) => entry.catalogEntryId), unloadOrder: [...assetRefs].reverse().map((entry) => entry.catalogEntryId), abortableLoad: true, idempotentUnload: true, referenceCounted: true };
  return { schemaVersion: "office-scene-bundle-v1", bundleId, bundleVersion, catalogRef, floorRef, assetRefs, lifecycle, floorSwitch: { preloadBeforeSwitch: true, releaseAfterSwitch: true, preserveWorldHash: true }, contextRecovery: { rebuildResources: true, renderLatestSnapshot: true, preserveSimulationHash: true, failClosedOnError: true }, missingAssetPolicy: "fail-closed", ...(raw.migrationRef ? { migrationRef: ref(raw.migrationRef, "migration") } : {}), admission };
}

function normalizeRuntimeFiles(rawFiles, requiredPaths, admission) {
  if (!Array.isArray(rawFiles)) fail("asset.registry.runtime-files-invalid", "runtimeFiles must be an array.");
  const paths = new Set();
  const files = rawFiles.map((raw, index) => {
    object(raw, "asset.registry.runtime-file-invalid", "Every runtime file must be an object.", { index });
    if (typeof raw.path !== "string" || (!RUNTIME_PATH.test(raw.path) && !ATLAS_PATH.test(raw.path)) || raw.path.includes("latest")) fail("asset.registry.runtime-path-invalid", "Runtime file path is outside the admitted asset stages.", { path: raw.path ?? null });
    if (paths.has(raw.path)) fail("asset.registry.runtime-duplicate", "Runtime file paths must be unique.", { path: raw.path });
    paths.add(raw.path);
    const expected = digest(raw.sha256, "runtime-sha256");
    if (raw.bytes !== undefined && hashBytes(raw.bytes) !== expected) fail("asset.registry.runtime-hash-mismatch", "Runtime bytes do not match the declared hash.", { path: raw.path });
    return { path: raw.path, sha256: expected, ...(raw.bytes === undefined ? {} : { byteLength: raw.bytes.length }) };
  });
  if (admission === "runtime-approved" || files.length > 0) {
    for (const path of requiredPaths) if (!paths.has(path)) fail("asset.registry.runtime-missing", "A required runtime or atlas file is missing.", { path });
    const required = new Set(requiredPaths);
    for (const file of files) if (!required.has(file.path)) fail("asset.registry.runtime-orphan", "A supplied runtime file is not referenced by the compiled closure.", { path: file.path });
  }
  return files;
}

function outputRoot(rootValue) {
  if (typeof rootValue !== "string" || !rootValue) fail("asset.registry.output-root-invalid", "outputRoot must be a non-empty path.");
  const root = resolve(rootValue);
  if (existsSync(root)) { const stats = lstatSync(root); if (stats.isSymbolicLink() || !stats.isDirectory()) fail("asset.registry.output-root-invalid", "outputRoot must be a non-symbolic-link directory."); if (readdirSync(root).length) fail("asset.registry.overwrite", "Registry output root must be clean."); }
  return root;
}

function writeOutputs(rootValue, outputs) {
  const root = outputRoot(rootValue);
  const created = [];
  try {
    for (const output of outputs) {
      if (isAbsolute(output.path) || output.path.includes("\\") || output.path.split("/").some((part) => !part || part === "." || part === "..")) fail("asset.registry.path-invalid", "Registry output paths must be safe relative paths.", { path: output.path });
      const target = resolve(root, ...output.path.split("/")); const check = relative(root, target);
      if (!check || check.startsWith("..") || isAbsolute(check)) fail("asset.registry.path-invalid", "Registry output escaped the clean root.", { path: output.path });
      mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, output.bytes, { flag: "wx" }); created.push(target);
    }
  } catch (error) {
    for (const file of created.reverse()) rmSync(file, { force: true });
    if (error instanceof AssetRegistryError) throw error;
    if (error?.code === "EEXIST") fail("asset.registry.overwrite", "Registry output already exists.");
    throw error;
  }
  return root;
}

function compile(input) {
  object(input, "asset.registry.input-invalid", "Registry input must be an object.");
  if (input.schemaVersion !== "office-asset-registry-input-v1") fail("asset.registry.schema-version-invalid", "Registry input must use office-asset-registry-input-v1.");
  const family = normalizeFamily(input.family);
  const frames = normalizeFrames(input.frames, family);
  const atlas = normalizeAtlas(input.atlas, family, frames);
  const catalog = normalizeCatalog(input.catalog, family, frames, atlas);
  const sceneBundle = normalizeBundle(input.sceneBundle, family, catalog);
  const requiredPaths = [atlas.path, ...frames.map((frame) => frame.runtimePath)];
  const runtimeFiles = normalizeRuntimeFiles(input.runtimeFiles ?? [], requiredPaths, family.admission);
  const familyRef = { id: family.familyId, version: family.familyVersion };
  const catalogRef = { id: catalog.catalogId, version: catalog.catalogVersion };
  const bundleRef = { id: sceneBundle.bundleId, version: sceneBundle.bundleVersion };
  const registryUnsigned = { schemaVersion: "office-asset-registry-v1", registryId: `${family.familyId}-registry`, registryVersion: 1, familyRef, atlasRefs: [{ id: atlas.atlasId, version: atlas.atlasVersion }], catalogRef, sceneBundleRef: bundleRef, entries: catalog.entries, missingAssetPolicy: "fail-closed", admission: family.admission };
  const registrySha256 = hashBytes(Buffer.from(canonical(registryUnsigned), "utf8"));
  const registry = { ...registryUnsigned, registrySha256 };
  const documents = { family, atlas, catalog, sceneBundle, registry };
  const outputDocs = [{ path: `office-v2/atlases/${atlas.atlasId}-v${atlas.atlasVersion}.json`, document: atlas }, { path: `office-v2/catalogs/${catalog.catalogId}-v${catalog.catalogVersion}.json`, document: catalog }, { path: `office-v2/bundles/${sceneBundle.bundleId}-v${sceneBundle.bundleVersion}.json`, document: sceneBundle }, { path: `office-v2/registries/${registry.registryId}-v1.json`, document: registry }];
  const outputBytes = outputDocs.map(({ path, document }) => ({ path, kind: "json", bytes: Buffer.from(canonical(document), "utf8"), sha256: hashBytes(Buffer.from(canonical(document), "utf8")) }));
  const report = { schemaVersion: "office-asset-registry-report-v1", familyRef, catalogRef, sceneBundleRef: bundleRef, requiredPaths: [...requiredPaths].sort(), runtimeFiles, registrySha256, documents };
  return { documents, registry, report: { ...report, reportSha256: hashBytes(Buffer.from(canonical(report), "utf8")) }, outputBytes };
}

export function compileAssetRegistry(input) { return compile(input); }
export function buildAssetRegistry({ input, outputRoot: root } = {}) { const result = compile(input); if (root !== undefined) writeOutputs(root, result.outputBytes); return result; }
export function reportText(report) { return canonical(report); }
