import assert from "node:assert/strict";
import test from "node:test";
import { executeT2Scenarios, writeT2Evidence } from "./t2-evidence.ts";

test("T2 integrated reducer scenarios prove one-actor lifecycle, queue, cleanup, and replay equivalence", () => {
  const results = executeT2Scenarios();
  assert.equal(results.length, 9);
  assert.equal(new Set(results.map((value) => value.scenarioId)).size, 9);
  assert.equal(results.every((value) => value.equality && value.replayResult.equal && value.cleanup.passed), true);
  writeT2Evidence(results);
});
