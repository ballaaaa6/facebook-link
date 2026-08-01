import assert from "node:assert/strict";
import { unlinkSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  evaluateOfficeKnowledge,
  formatKnowledgeReport,
} from "./office-v2-knowledge-check.mjs";
import {
  expectedFixtureCounts,
  expectedInventory,
  hasDiagnostic,
  knowledgeRoot,
  readJson,
  withKnowledgeCopy,
  writeJson,
} from "./office-v2-knowledge-test-helpers.mjs";

test("real knowledge root passes with filesystem-derived inventory and complete case coverage", () => {
  const inventory = expectedInventory(knowledgeRoot);
  const fixtureCounts = expectedFixtureCounts(knowledgeRoot);
  const report = evaluateOfficeKnowledge({ knowledgeRoot });

  assert.equal(report.ok, true, JSON.stringify(report.diagnostics, null, 2));
  assert.deepEqual(report.inventory, inventory);
  assert.equal(report.coverage.declaredCases, fixtureCounts.declaredCases);
  assert.equal(report.coverage.executedCases, fixtureCounts.declaredCases);
  assert.deepEqual(report.coverage.executedCaseIds, report.coverage.declaredCaseIds);
  assert.equal(new Set(report.coverage.executedCaseIds).size, report.coverage.executedCases);
  assert.equal(report.coverage.evidencedFixtureFiles, inventory.fixtureFiles);
  assert.equal(new Set(report.coverage.evidencedFixtureIds).size, inventory.fixtureFiles);
  assert.equal(report.evidence.semantic, fixtureCounts.declaredCases);
  assert.equal(report.evidence.exactDiagnostics, fixtureCounts.exactDiagnostics);
  assert.ok(report.evidence.schemaShape > 0);
});

test("a failed evaluation cannot leak state into the next invocation", () => {
  withKnowledgeCopy((copyRoot) => {
    unlinkSync(join(copyRoot, "FOUNDATIONS.md"));

    const rejected = evaluateOfficeKnowledge({ knowledgeRoot: copyRoot });
    const accepted = evaluateOfficeKnowledge({ knowledgeRoot });

    assert.equal(rejected.ok, false);
    assert.ok(rejected.diagnostics.length > 0);
    assert.deepEqual(rejected.inventory, expectedInventory(copyRoot));
    assert.equal(accepted.ok, true, JSON.stringify(accepted.diagnostics, null, 2));
    assert.deepEqual(accepted.inventory, expectedInventory(knowledgeRoot));
  });
});

test("a failed evaluation cannot be formatted as an OK report", () => {
  withKnowledgeCopy((copyRoot) => {
    unlinkSync(join(copyRoot, "FOUNDATIONS.md"));
    const report = evaluateOfficeKnowledge({ knowledgeRoot: copyRoot });
    const formatted = formatKnowledgeReport(report);

    assert.equal(report.ok, false);
    assert.doesNotMatch(formatted, /Office V2 knowledge OK/);
    assert.match(formatted, /Office V2 knowledge FAILED/);
  });
});

for (const [fixtureName, wrongCode] of [
  ["asset-admission.json", "asset.wrong-code"],
  ["connectivity-missing-mask.json", "connectivity.wrong-code"],
  ["proof-workstation-unsupported-mask.json", "connectivity.wrong-code"],
  ["world-overlap.json", "world.wrong-code"],
  ["definition-bundle-reference-closure.json", "world.wrong-code"],
]) {
  test(`${fixtureName} rejects an incorrect expected diagnostic`, () => {
    withKnowledgeCopy((copyRoot) => {
      const fixturePath = join(copyRoot, "fixtures", "invalid", fixtureName);
      const fixture = readJson(fixturePath);
      fixture.expectedFailure = wrongCode;
      writeJson(fixturePath, fixture);

      const report = evaluateOfficeKnowledge({ knowledgeRoot: copyRoot });

      assert.equal(report.ok, false);
      assert.equal(hasDiagnostic(report, "knowledge.expected-diagnostic-mismatch"), true);
    });
  });
}

test("common V2 rejection fails when its expected diagnostic drifts", () => {
  withKnowledgeCopy((copyRoot) => {
    const fixturePath = join(copyRoot, "fixtures", "invalid", "common-v2-rejections.json");
    const fixture = readJson(fixturePath);
    fixture.cases[0].expectedFailure = "contract.wrong-code";
    writeJson(fixturePath, fixture);

    const report = evaluateOfficeKnowledge({ knowledgeRoot: copyRoot });

    assert.equal(report.ok, false);
    assert.equal(hasDiagnostic(report, "knowledge.expected-diagnostic-mismatch"), true);
  });
});

test("asset rejection fails when an unrelated schema error accompanies the expected reason", () => {
  withKnowledgeCopy((copyRoot) => {
    const fixturePath = join(copyRoot, "fixtures", "invalid", "asset-admission.json");
    const fixture = readJson(fixturePath);
    delete fixture.document.familyId;
    writeJson(fixturePath, fixture);

    const report = evaluateOfficeKnowledge({ knowledgeRoot: copyRoot });

    assert.equal(report.ok, false);
    assert.equal(hasDiagnostic(report, "knowledge.expected-diagnostic-mismatch"), true);
  });
});

test("connectivity rejection disappears when the missing supported mask is supplied", () => {
  withKnowledgeCopy((copyRoot) => {
    const fixturePath = join(copyRoot, "fixtures", "invalid", "connectivity-missing-mask.json");
    const fixture = readJson(fixturePath);
    fixture.document.variants.push({
      mask: 10,
      role: "horizontal-middle",
      variantId: "desk-horizontal-middle",
    });
    writeJson(fixturePath, fixture);

    const report = evaluateOfficeKnowledge({ knowledgeRoot: copyRoot });

    assert.equal(report.ok, false);
    assert.equal(hasDiagnostic(report, "knowledge.expected-diagnostic-mismatch"), true);
  });
});
