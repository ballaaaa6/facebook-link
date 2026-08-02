import assert from "node:assert/strict";
import { join } from "node:path";
import test from "node:test";
import { evaluateOfficeKnowledge } from "./office-v2-knowledge-check.mjs";
import { hasDiagnostic, knowledgeRoot, readJson, withKnowledgeCopy, writeJson } from "./office-v2-knowledge-test-helpers.mjs";

test("Closure E contracts pass without renderer, winner, reducer, or property/model claims", () => {
  const report = evaluateOfficeKnowledge({ knowledgeRoot });

  assert.equal(report.ok, true, JSON.stringify(report.diagnostics, null, 2));
  assert.equal(report.evidence.reducerReplay, 0);
  assert.equal(report.evidence.propertyModel, 0);
  assert.equal(report.coverage.evidencedFixtureIds.includes("fixtures/lab/renderer-benchmark-bundle-v1.json"), true);
  assert.equal(report.coverage.evidencedFixtureIds.includes("fixtures/invalid/renderer-qa-rejections.json"), true);
});

test("Closure E rejected fixtures retain exact presentation ownership", () => {
  const report = evaluateOfficeKnowledge({ knowledgeRoot });
  const diagnostics = readJson(join(knowledgeRoot, "fixtures", "invalid", "renderer-qa-rejections.json")).cases.map((entry) => entry.expectedFailure);
  const observed = report.evidence.exactDiagnostics;

  assert.equal(diagnostics.every((code) => code.startsWith("presentation.")), true);
  assert.equal(observed >= diagnostics.length, true);
});

test("Closure E fails when a rejection diagnostic drifts", () => {
  withKnowledgeCopy((copyRoot) => {
    const fixturePath = join(copyRoot, "fixtures", "invalid", "renderer-qa-rejections.json");
    const fixture = readJson(fixturePath);
    fixture.cases[0].expectedFailure = "presentation.wrong-code";
    writeJson(fixturePath, fixture);

    const report = evaluateOfficeKnowledge({ knowledgeRoot: copyRoot });

    assert.equal(report.ok, false);
    assert.equal(hasDiagnostic(report, "knowledge.expected-diagnostic-mismatch"), true);
  });
});

test("Closure E synthetic bundle fails closed outside fixture/lab", () => {
  withKnowledgeCopy((copyRoot) => {
    const fixturePath = join(copyRoot, "fixtures", "lab", "renderer-benchmark-bundle-v1.json");
    const fixture = readJson(fixturePath);
    fixture.document.root = "assets/office-v2/runtime";
    fixture.document.testOnly = false;
    fixture.document.admission = "runtime";
    writeJson(fixturePath, fixture);

    const report = evaluateOfficeKnowledge({ knowledgeRoot: copyRoot });

    assert.equal(report.ok, false);
    assert.equal(hasDiagnostic(report, "knowledge.schema-expectation-mismatch"), true);
    assert.equal(hasDiagnostic(report, "knowledge.fixture-mismatch"), true);
  });
});
