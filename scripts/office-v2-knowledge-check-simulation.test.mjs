import assert from "node:assert/strict";
import { join } from "node:path";
import test from "node:test";
import { evaluateOfficeKnowledge } from "./office-v2-knowledge-check.mjs";
import {
  expectedFixtureCounts,
  hasDiagnostic,
  knowledgeRoot,
  readJson,
  withKnowledgeCopy,
  writeJson,
} from "./office-v2-knowledge-test-helpers.mjs";

test("simulation contract cases execute with semantic evidence but no reducer claim", () => {
  const report = evaluateOfficeKnowledge({ knowledgeRoot });
  assert.equal(report.ok, true, JSON.stringify(report.diagnostics, null, 2));
  assert.equal(report.coverage.executedCases, expectedFixtureCounts(knowledgeRoot).declaredCases);
  assert.equal(report.evidence.semanticRules >= 6, true);
  assert.equal(report.evidence.reducerReplay, 0);
});

test("simulation command conflict rejects an incorrect expected diagnostic", () => {
  withKnowledgeCopy((copyRoot) => {
    const fixturePath = join(copyRoot, "fixtures", "invalid", "simulation-command-id-conflict.json");
    const fixture = readJson(fixturePath);
    fixture.expectedFailure = "simulation.wrong-code";
    writeJson(fixturePath, fixture);

    const report = evaluateOfficeKnowledge({ knowledgeRoot: copyRoot });

    assert.equal(report.ok, false);
    assert.equal(hasDiagnostic(report, "knowledge.expected-diagnostic-mismatch"), true);
  });
});

test("simulation contract cases fail closed when a new case has no probe", () => {
  withKnowledgeCopy((copyRoot) => {
    const fixturePath = join(copyRoot, "fixtures", "simulation-contracts-v2.json");
    const fixture = readJson(fixturePath);
    fixture.cases.push({ name: "unhandled-simulation-case", kind: "future-reducer" });
    writeJson(fixturePath, fixture);

    const report = evaluateOfficeKnowledge({ knowledgeRoot: copyRoot });

    assert.equal(report.ok, false);
    assert.equal(hasDiagnostic(report, "knowledge.unhandled-fixture-case"), true);
  });
});
