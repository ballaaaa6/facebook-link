import assert from "node:assert/strict";
import test from "node:test";
import { officeV2SchemaDescriptors } from "./office-v2-contract-descriptors.mjs";
import { evaluateOfficeKnowledge } from "./office-v2-knowledge-check-core.mjs";

test("Closure D asset contracts execute valid and rejected evidence", () => {
  const report = evaluateOfficeKnowledge();
  assert.equal(report.ok, true);
  const closureDSchemas = [
    "asset-catalog",
    "asset-family-v2",
    "asset-migration",
    "asset-review",
    "atlas",
    "character-definition",
    "export-recipe",
    "render-part",
    "scene-bundle",
    "semantic-variant",
    "source-set",
    "sprite-frame",
    "style-profile",
  ];
  for (const schemaName of closureDSchemas) {
    assert.ok(officeV2SchemaDescriptors.some(({ schemaRelativePath }) => (
      schemaRelativePath === `docs/office-v2/schemas/${schemaName}.schema.json`
    )), `Closure D schema is registered: ${schemaName}`);
  }
  assert.equal(report.coverage.executedCases, report.coverage.declaredCases);
  assert.equal(report.evidence.reducerReplay, 0);
  assert.equal(report.evidence.propertyModel, 0);
  assert.ok(report.evidence.exactDiagnostics >= 74);
  assert.ok(report.coverage.evidencedFixtureIds.includes("fixtures/asset-pipeline-contracts-v2.json"));
  assert.ok(report.coverage.evidencedFixtureIds.includes("fixtures/invalid/asset-pipeline-contracts-v2.json"));
});
