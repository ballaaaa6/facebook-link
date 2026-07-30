import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";
import { createOfficeSchemaValidator } from "./office-v2-knowledge-check.mjs";

const root = resolve(import.meta.dirname, "..");
const assetsRoot = join(root, "assets");
const officeRoot = join(assetsRoot, "office-v2");
const manifestRoot = join(officeRoot, "manifests");
const runtimeRoot = join(officeRoot, "runtime");
const sourceRoot = join(officeRoot, "sources");
const recipeRoot = join(officeRoot, "recipes");
const failures = [];

function collectJson(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).flatMap((name) => {
    const absolute = join(directory, name);
    return statSync(absolute).isDirectory()
      ? collectJson(absolute)
      : name.endsWith(".json") ? [absolute] : [];
  });
}

function pngDimensions(buffer) {
  const signature = "89504e470d0a1a0a";
  if (buffer.length < 24 || buffer.subarray(0, 8).toString("hex") !== signature) return null;
  return { widthPx: buffer.readUInt32BE(16), heightPx: buffer.readUInt32BE(20) };
}

function stagePath(file, stageRoot) {
  if (isAbsolute(file)) return null;
  const absolute = resolve(assetsRoot, file);
  const withinStage = relative(stageRoot, absolute);
  if (withinStage.startsWith("..") || isAbsolute(withinStage)) return null;
  return absolute;
}

function verifyInput(familyKey, label, file, expectedHash, stageRoot) {
  const absolute = stagePath(file, stageRoot);
  if (!absolute) {
    failures.push(`${familyKey}: ${label} file is outside its Office V2 stage root`);
    return;
  }
  if (!existsSync(absolute)) {
    failures.push(`${familyKey}: missing ${label} file ${file}`);
    return;
  }
  const sha256 = createHash("sha256").update(readFileSync(absolute)).digest("hex");
  if (sha256 !== expectedHash) failures.push(`${familyKey}: ${label} SHA-256 mismatch`);
}

function validateManifest(ajv, file, seenFamilies, seenFiles, seenHashes) {
  let manifest;
  try { manifest = JSON.parse(readFileSync(file, "utf8")); }
  catch (error) { failures.push(`${relative(root, file)}: invalid JSON (${error.message})`); return 0; }

  const validate = ajv.getSchema("https://affiliate-operations.example/schemas/office-v2/asset.schema.json");
  if (!validate(manifest)) {
    failures.push(`${relative(root, file)}: ${ajv.errorsText(validate.errors)}`);
    return 0;
  }
  const familyKey = `${manifest.familyId}@${manifest.familyVersion}`;
  if (seenFamilies.has(familyKey)) failures.push(`Duplicate asset family version: ${familyKey}`);
  seenFamilies.add(familyKey);
  if (manifest.source.commercialStatus !== "approved" || manifest.source.reviewerDecision !== "approved") {
    failures.push(`${familyKey}: provenance is not approved`);
  }
  verifyInput(familyKey, "source", manifest.source.sourceFile, manifest.source.sourceSha256, sourceRoot);
  verifyInput(familyKey, "recipe", manifest.source.recipeFile, manifest.source.recipeSha256, recipeRoot);
  const variantIds = new Set();
  for (const variant of manifest.variants) {
    if (variantIds.has(variant.id)) failures.push(`${familyKey}: duplicate variant ID ${variant.id}`);
    variantIds.add(variant.id);
    const absolute = stagePath(variant.file, runtimeRoot);
    if (!absolute) {
      failures.push(`${familyKey}/${variant.id}: file must remain under assets/office-v2/runtime`);
      continue;
    }
    const normalized = relative(assetsRoot, absolute).replaceAll("\\", "/");
    if (seenFiles.has(normalized)) failures.push(`${familyKey}/${variant.id}: runtime file reused by another variant (${normalized})`);
    seenFiles.add(normalized);
    if (!existsSync(absolute)) {
      failures.push(`${familyKey}/${variant.id}: missing runtime file ${normalized}`);
      continue;
    }
    const buffer = readFileSync(absolute);
    const sha256 = createHash("sha256").update(buffer).digest("hex");
    if (sha256 !== variant.sha256) failures.push(`${familyKey}/${variant.id}: SHA-256 mismatch`);
    if (seenHashes.has(sha256)) failures.push(`${familyKey}/${variant.id}: duplicate runtime pixels`);
    seenHashes.add(sha256);
    const dimensions = pngDimensions(buffer);
    if (!dimensions) failures.push(`${familyKey}/${variant.id}: file is not a readable PNG`);
    else if (dimensions.widthPx !== variant.widthPx || dimensions.heightPx !== variant.heightPx) {
      failures.push(`${familyKey}/${variant.id}: expected ${variant.widthPx}x${variant.heightPx}, found ${dimensions.widthPx}x${dimensions.heightPx}`);
    }
  }
  return manifest.variants.length;
}

export function runAssetCheck() {
  const manifests = collectJson(manifestRoot);
  if (manifests.length === 0) {
    console.log("Office V2 assets OK: no runtime manifests admitted; foundation state is valid.");
    return;
  }
  const ajv = createOfficeSchemaValidator();
  const seenFamilies = new Set();
  const seenFiles = new Set();
  const seenHashes = new Set();
  let variants = 0;
  for (const file of manifests) variants += validateManifest(ajv, file, seenFamilies, seenFiles, seenHashes);
  if (failures.length) throw new Error(failures.map((message) => `- ${message}`).join("\n"));
  console.log(`Office V2 assets OK: ${manifests.length} manifests and ${variants} runtime variants validated.`);
}

try { runAssetCheck(); } catch (error) { console.error(error.message); process.exitCode = 1; }
