import assert from "node:assert/strict";
import test from "node:test";
import { evaluateDefinitionBundleFixture } from "./office-v2-world-reference-evidence.mjs";

test("the public world package closes the canonical definition bundle", () => {
  const result = evaluateDefinitionBundleFixture();
  assert.equal(result.ok, true, JSON.stringify(result.diagnostics, null, 2));
  assert.equal(result.nodes.length, 14);
  assert.equal(result.edges.length, 11);
});
