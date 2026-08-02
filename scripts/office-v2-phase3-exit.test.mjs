import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";
import { validateEvidenceDocuments } from "./office-v2-phase3-exit.mjs";

const root = resolve(import.meta.dirname, "..");
const read = (path) => JSON.parse(readFileSync(join(root, path), "utf8"));
const documents = {
  t2: { manifest: read("artifacts/office-v2/phase3/t2/executed-scenarios.json"), evidence: read("artifacts/office-v2/phase3/t2/t2-evidence.json"), markdown: readFileSync(join(root, "artifacts/office-v2/phase3/t2/t2-evidence.md"), "utf8") },
  t3: { manifest: read("artifacts/office-v2/phase3/t3/executed-scenarios.json"), evidence: read("artifacts/office-v2/phase3/t3/t3-evidence.json"), markdown: readFileSync(join(root, "artifacts/office-v2/phase3/t3/t3-evidence.md"), "utf8") },
  operations: { runner: read("artifacts/office-v2/phase3/operations/operations-runner-trace.json"), trace: read("artifacts/office-v2/phase3/operations/operations-trace.json"), markdown: readFileSync(join(root, "artifacts/office-v2/phase3/operations/operations-trace.md"), "utf8") },
};
const roles = ["market-scout", "product-ranker", "growth-strategist", "performance-analyst", "gemini-copywriter", "flow-visual-producer", "link-attribution", "qa-editor", "publisher", "session-keeper"];

test("Phase 3 evidence validator accepts the checked-in integrated evidence", () => {
  const result = validateEvidenceDocuments(documents, roles);
  assert.equal(result.valid, true, result.diagnostics.join("\n"));
});

test("Phase 3 evidence validator rejects synthetic capacity presented as live", () => {
  const invalid = structuredClone(documents);
  invalid.t3.evidence.scenarios[2].syntheticCapacityActors = false;
  const result = validateEvidenceDocuments(invalid, roles);
  assert.ok(result.t3.some((diagnostic) => diagnostic.includes("actor/capacity")));
});

test("Phase 3 evidence validator rejects replay inequality and placeholder hashes", () => {
  const invalid = structuredClone(documents);
  invalid.t2.evidence.scenarios[0].replayResult.equal = false;
  invalid.t2.evidence.scenarios[0].uninterruptedFinalHash = "0".repeat(64);
  const result = validateEvidenceDocuments(invalid, roles);
  assert.ok(result.t2.some((diagnostic) => diagnostic.includes("replay equality")));
  assert.ok(result.t2.some((diagnostic) => diagnostic.includes("non-placeholder SHA-256")));
});

test("Phase 3 evidence validator rejects an incomplete operations catalog", () => {
  const invalid = structuredClone(documents);
  invalid.operations.trace.roles = invalid.operations.trace.roles.slice(0, -1);
  const result = validateEvidenceDocuments(invalid, roles);
  assert.ok(result.operations.some((diagnostic) => diagnostic.includes("authoritative catalog")));
});
