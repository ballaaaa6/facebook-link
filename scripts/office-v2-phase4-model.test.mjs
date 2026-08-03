import assert from "node:assert/strict";
import test from "node:test";
import { runPropertySuite, PROPERTY_MODEL_PROFILE } from "./office-v2-phase4-model.mjs";

test("Phase 4 independent depth, picking, and lifecycle models pass the CI profile", () => {
  const evidence = runPropertySuite(PROPERTY_MODEL_PROFILE.ciRuns);
  assert.equal(evidence.passed, true);
  assert.equal(evidence.runs, 100);
  assert.deepEqual(evidence.results.map((result) => result.name), ["depth-and-semantic-picking-model", "renderer-lifecycle-model"]);
});
