import assert from "node:assert/strict";
import test from "node:test";
import { evaluateOfficeKnowledge } from "./office-v2-knowledge-check-core.mjs";

test("Closure D asset contracts execute valid and rejected evidence", () => {
  const report = evaluateOfficeKnowledge();
  assert.equal(report.ok, true);
  assert.equal(report.inventory.schemaFiles, 47);
  assert.equal(report.inventory.fixtureFiles, 58);
  assert.equal(report.coverage.evidencedFixtureFiles, 58);
  assert.equal(report.coverage.executedCases, report.coverage.declaredCases);
  assert.equal(report.evidence.reducerReplay, 0);
  assert.equal(report.evidence.propertyModel, 0);
  assert.ok(report.evidence.exactDiagnostics >= 74);
  assert.ok(report.coverage.evidencedFixtureIds.includes("fixtures/asset-pipeline-contracts-v2.json"));
  assert.ok(report.coverage.evidencedFixtureIds.includes("fixtures/invalid/asset-pipeline-contracts-v2.json"));
});
