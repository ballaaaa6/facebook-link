import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateBuildingTopologyFixture,
} from "./office-v2-building-topology-evidence.mjs";

test("W1.3 valid topology envelopes pass schema and pure semantic validation", () => {
  for (const fixturePath of [
    "fixtures/building-topology-one-floor.json",
    "fixtures/building-topology-two-floors.json",
  ]) {
    const evaluation = evaluateBuildingTopologyFixture({ fixturePath });
    assert.equal(evaluation.schemaValid, true, JSON.stringify(evaluation.schemaErrors, null, 2));
    assert.equal(evaluation.result.ok, true, JSON.stringify(evaluation.result.diagnostics, null, 2));
  }
});

for (const fixturePath of [
  "fixtures/invalid/building-topology-duplicate-floor.json",
  "fixtures/invalid/building-topology-missing-endpoint.json",
  "fixtures/invalid/building-topology-missing-landing.json",
  "fixtures/invalid/building-topology-direction-mismatch.json",
  "fixtures/invalid/building-topology-exterior-overlap.json",
  "fixtures/invalid/building-topology-elevation-floor.json",
  "fixtures/invalid/building-topology-incomplete-migration.json",
]) {
  test(`W1.3 rejects ${fixturePath} with its exact diagnostic`, () => {
    const evaluation = evaluateBuildingTopologyFixture({ fixturePath });
    assert.equal(evaluation.schemaValid, true, JSON.stringify(evaluation.schemaErrors, null, 2));
    assert.equal(evaluation.result.ok, false);
    assert.equal(evaluation.result.diagnostics.length, 1, JSON.stringify(evaluation.result.diagnostics, null, 2));
    assert.equal(evaluation.result.diagnostics[0]?.code, evaluation.expectedFailure);
  });
}
