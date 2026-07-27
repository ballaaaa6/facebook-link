import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { validateOfficeGeometryV3 } from "../packages/contracts/src/officeGeometry.ts";

const root = resolve(import.meta.dirname, "..");
const validPath = resolve(root, "assets/game/manifests/fixtures/office-geometry-v3-valid.json");
const invalidPath = resolve(root, "assets/game/manifests/fixtures/office-geometry-v3-invalid.json");
const schemaPath = resolve(root, "assets/game/manifests/office-asset-geometry.schema.json");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

const schema = readJson(schemaPath);
const valid = readJson(validPath);
const invalid = readJson(invalidPath);
const failures = [];

if (schema.$id !== "office-asset-geometry.schema.json") {
  failures.push("Geometry schema must keep its stable $id");
}
if (valid.schemaVersion !== 3) failures.push("Valid fixture catalog must target schemaVersion 3");

const assets = new Map();
for (const geometry of valid.assets ?? []) {
  if (assets.has(geometry.id)) failures.push(`Duplicate valid fixture ID: ${geometry.id}`);
  assets.set(geometry.id, geometry);
  for (const issue of validateOfficeGeometryV3(geometry)) {
    failures.push(`${geometry.id}: ${issue}`);
  }
}

for (const testCase of invalid.cases ?? []) {
  const source = assets.get(testCase.sourceId);
  if (!source) {
    failures.push(`${testCase.name}: unknown source fixture ${testCase.sourceId}`);
    continue;
  }
  const candidate = structuredClone(source);
  Object.assign(candidate, testCase.set);
  const issues = validateOfficeGeometryV3(candidate);
  if (issues.length === 0) {
    failures.push(`${testCase.name}: invalid fixture unexpectedly passed`);
    continue;
  }
  if (!issues.some((issue) => issue.startsWith(`${testCase.expectedPath}:`))) {
    failures.push(`${testCase.name}: expected ${testCase.expectedPath}, received ${issues.join("; ")}`);
  }
}

if (assets.size !== 8) failures.push(`Expected one valid fixture per asset type, found ${assets.size}`);

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Office Geometry v3 OK: ${assets.size} valid fixtures, ${invalid.cases.length} rejected fixtures.`);
}
