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

const roomFixturePaths = [
  "fixtures/room-template-ground-floor.json",
  "fixtures/room-template-target-floor-envelope.json",
  "fixtures/room-template-valid.json",
  "fixtures/invalid/room-blocked-entrance.json",
  "fixtures/invalid/room-decoration-changes-navigation.json",
  "fixtures/invalid/room-illegal-adjacency.json",
  "fixtures/invalid/room-insufficient-capacity.json",
  "fixtures/invalid/room-narrow-circulation.json",
  "fixtures/invalid/room-over-capacity.json",
  "fixtures/invalid/room-overlapping-prop-slots.json",
  "fixtures/invalid/room-unreachable-required-facility.json",
  "fixtures/invalid/room-template-circulation.json",
  "fixtures/invalid/room-template-capacity.json",
  "fixtures/invalid/room-template-composition.json",
];

test("W1.4 room fixtures execute schema, pure semantic, and exact rejection evidence", () => {
  const report = evaluateOfficeKnowledge({ knowledgeRoot });

  assert.equal(report.ok, true, JSON.stringify(report.diagnostics, null, 2));
  assert.equal(report.coverage.evidencedFixtureIds.some((path) => path === roomFixturePaths[0]), true);
  for (const path of roomFixturePaths.slice(1)) {
    assert.equal(report.coverage.evidencedFixtureIds.includes(path), true);
  }
  assert.equal(report.evidence.exactDiagnostics, expectedFixtureCounts(knowledgeRoot).exactDiagnostics);
  assert.equal(report.coverage.executedCaseIds.includes("fixtures/room-template-ground-floor.json#ground-floor-contract"), true);
  assert.equal(report.coverage.executedCaseIds.includes("fixtures/invalid/room-template-circulation.json#blocked-entrance"), true);
  assert.equal(report.coverage.executedCaseIds.includes("fixtures/room-template-target-floor-envelope.json#room-template-contract"), true);
  assert.equal(report.coverage.executedCaseIds.includes("fixtures/room-template-valid.json#room-template-contract"), true);
  for (const path of roomFixturePaths.slice(3, 11)) {
    assert.equal(report.coverage.evidencedFixtureIds.includes(path), true, path);
  }
});

test("W1.4 expected room diagnostic drift fails the knowledge gate", () => {
  withKnowledgeCopy((copyRoot) => {
    const fixturePath = join(copyRoot, "fixtures", "invalid", "room-template-circulation.json");
    const fixture = readJson(fixturePath);
    fixture.cases[0].expectedFailure = "room.wrong-code";
    writeJson(fixturePath, fixture);

    const report = evaluateOfficeKnowledge({ knowledgeRoot: copyRoot });

    assert.equal(report.ok, false);
    assert.equal(hasDiagnostic(report, "knowledge.expected-diagnostic-mismatch"), true);
  });
});
