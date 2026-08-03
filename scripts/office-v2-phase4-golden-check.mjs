import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import Ajv from "ajv";

const root = resolve(import.meta.dirname, "..");
const reportPath = resolve(root, "artifacts/office-v2/phase4/renderer-golden-evidence.json");
const schemaPath = resolve(root, "docs/office-v2/schemas/golden-manifest.schema.json");

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

const report = JSON.parse(readFileSync(reportPath, "utf8"));
const schema = JSON.parse(readFileSync(schemaPath, "utf8"));
assert.equal(report.schemaVersion, "office-golden-manifest-set-v1");
assert.equal(report.winner, "canvas-2d");
assert.equal(report.manifests.length, 3);
assert.equal(report.captures.length, 3);
const validate = new Ajv({ allErrors: true, strict: false }).compile(schema);
for (const manifest of report.manifests) {
  assert.equal(validate(manifest), true, JSON.stringify(validate.errors));
  assert.equal(manifest.rendererRevision, "canvas-2d-v1");
  assert.equal(manifest.updatePolicy, "normal-checks-never-rewrite");
  assert.equal(manifest.geometryIndependent, true);
}
for (const capture of report.captures) {
  const bytes = readFileSync(resolve(root, capture.path));
  assert.equal(sha256(bytes), capture.pngSha256, capture.path);
  assert.match(capture.payloadHash, /^[0-9a-f]{64}$/);
  assert.match(capture.sceneHash, /^[0-9a-f]{64}$/);
}
console.log(JSON.stringify({ reportPath, manifests: report.manifests.length, captures: report.captures.length, winner: report.winner }));
