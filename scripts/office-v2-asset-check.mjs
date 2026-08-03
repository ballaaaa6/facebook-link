import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, relative, resolve } from "node:path";
import { createOfficeSchemaValidator } from "./office-v2-knowledge-check.mjs";
import { assetDiagnostic, formatAssetDiagnostic, validateAssetResources } from "./office-v2-asset-admission.mjs";

const root = resolve(import.meta.dirname, "..");
const assetsRoot = join(root, "assets");
const officeRoot = join(assetsRoot, "office-v2");
const manifestRoot = join(officeRoot, "manifests");
const runtimeRoot = join(officeRoot, "runtime");
const sourceRoot = join(officeRoot, "sources");
const recipeRoot = join(officeRoot, "recipes");

function collectFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).flatMap((name) => {
    const absolute = join(directory, name);
    try { return statSync(absolute).isDirectory() ? collectFiles(absolute) : [absolute]; }
    catch { return [absolute]; }
  });
}

function collectJson(directory) {
  return collectFiles(directory).filter((file) => file.endsWith(".json"));
}

function stageFiles(directory) {
  return collectFiles(directory).map((file) => relative(assetsRoot, file).replaceAll("\\", "/"));
}

function readResource(_path, _kind, absolute) {
  try { return absolute && existsSync(absolute) ? readFileSync(absolute) : undefined; }
  catch { return undefined; }
}

export function runAssetCheck() {
  const manifestFiles = collectJson(manifestRoot);
  if (manifestFiles.length === 0) {
    console.log("Office V2 assets OK: no runtime manifests admitted; foundation state is valid.");
    return { ok: true, manifests: 0, variants: 0 };
  }
  const entries = [];
  const parseDiagnostics = [];
  for (const file of manifestFiles) {
    const manifestPath = relative(root, file).replaceAll("\\", "/");
    try { entries.push({ manifest: JSON.parse(readFileSync(file, "utf8")), manifestPath }); }
    catch { parseDiagnostics.push(assetDiagnostic("asset.manifest-json-invalid", "Asset manifest JSON is invalid.", { manifestPath })); }
  }
  const result = validateAssetResources({
    manifests: entries,
    schemaValidator: createOfficeSchemaValidator(),
    assetsRoot,
    stageRoots: { source: sourceRoot, recipe: recipeRoot, runtime: runtimeRoot },
    readResource,
    stageFiles: { source: stageFiles(sourceRoot), recipe: stageFiles(recipeRoot), runtime: stageFiles(runtimeRoot) },
  });
  const diagnostics = [...parseDiagnostics, ...result.diagnostics];
  if (diagnostics.length) throw new Error(diagnostics.map(formatAssetDiagnostic).map((message) => `- ${message}`).join("\n"));
  console.log(`Office V2 assets OK: ${manifestFiles.length} manifests and ${result.variants} runtime variants validated.`);
  return { ok: true, manifests: manifestFiles.length, variants: result.variants };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try { runAssetCheck(); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
