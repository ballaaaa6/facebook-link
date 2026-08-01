import assert from "node:assert/strict";
import { join } from "node:path";
import test from "node:test";
import {
  evaluateOfficeKnowledge,
  formatKnowledgeReport,
  runKnowledgeCheck,
} from "./office-v2-knowledge-check.mjs";
import { findPath } from "./office-v2-knowledge-probes.mjs";
import {
  expectedFixtureCounts,
  hasDiagnostic,
  knowledgeRoot,
  readJson,
  withKnowledgeCopy,
  writeJson,
} from "./office-v2-knowledge-test-helpers.mjs";

test("a second path case is executed instead of being skipped", () => {
  withKnowledgeCopy((copyRoot) => {
    const fixturePath = join(copyRoot, "fixtures", "navigation-reservations-v2.json");
    const fixture = readJson(fixturePath);
    fixture.cases.push({
      name: "second-path-must-run",
      kind: "path",
      start: { x: 1, y: 2 },
      goal: { x: 3, y: 2 },
      expectedPath: [{ x: 1, y: 2 }],
      expectedStepCount: 0,
      expectedCost: 0,
    });
    writeJson(fixturePath, fixture);

    const report = evaluateOfficeKnowledge({ knowledgeRoot: copyRoot });

    assert.equal(report.ok, false);
    assert.equal(report.coverage.executedCases, expectedFixtureCounts(copyRoot).declaredCases);
    assert.equal(report.coverage.executedCaseIds.some((id) => id.endsWith("#second-path-must-run")), true);
    assert.equal(hasDiagnostic(report, "knowledge.fixture-mismatch"), true);
  });
});

test("the navigation oracle rejects an undeclared heuristic implementation", () => {
  withKnowledgeCopy((copyRoot) => {
    const fixturePath = join(copyRoot, "fixtures", "navigation-reservations-v2.json");
    const fixture = readJson(fixturePath);
    fixture.costModel.heuristic = "euclidean";
    writeJson(fixturePath, fixture);

    const report = evaluateOfficeKnowledge({ knowledgeRoot: copyRoot });

    assert.equal(report.ok, false);
    assert.equal(hasDiagnostic(report, "knowledge.fixture-probe-error"), true);
  });
});

test("the accepted A-star cost model charges 600 for the six-step detour", () => {
  const fixture = readJson(join(knowledgeRoot, "fixtures", "navigation-reservations-v2.json"));
  const pathCase = fixture.cases.find((entry) => entry.name === "stable-detour");
  assert.ok(pathCase, "stable-detour fixture is required");

  const result = findPath(fixture, pathCase);

  assert.deepEqual(result.path, pathCase.expectedPath);
  assert.equal(result.stepCount, 6);
  assert.equal(result.stepCount, pathCase.expectedStepCount);
  assert.equal(result.stepCost, 100);
  assert.equal(result.heuristicUnit, 100);
  assert.equal(result.totalCost, 600);
  assert.equal(result.totalCost, pathCase.expectedCost);
});

test("reports zero reducer, replay, property, and model evidence explicitly", () => {
  const report = evaluateOfficeKnowledge({ knowledgeRoot });
  assert.equal(report.ok, true, JSON.stringify(report.diagnostics, null, 2));
  assert.equal(report.evidence.reducerReplay, 0);
  assert.equal(report.evidence.propertyModel, 0);

  const formatted = formatKnowledgeReport(report);
  assert.match(formatted, /Office V2 knowledge OK/);
  assert.match(formatted, /reducer\/replay[^0-9]*0/i);
  assert.match(formatted, /property\/model[^0-9]*0/i);

  const messages = [];
  const result = runKnowledgeCheck({ knowledgeRoot, logger: (message) => messages.push(message) });
  assert.equal(result.ok, true);
  assert.deepEqual(messages, [formatted]);
});
