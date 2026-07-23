import assert from "node:assert/strict";
import test from "node:test";
import { assertTransition, canTransition, nextStages } from "../src/index.ts";

test("allows the happy-path transition", () => {
  assert.equal(canTransition("selected", "link_ready"), true);
});

test("blocks a skipped transition", () => {
  assert.equal(canTransition("discovered", "published"), false);
  assert.throws(() => assertTransition("discovered", "published"), /Invalid workflow transition/);
});

test("measured is a terminal state", () => {
  assert.deepEqual(nextStages("measured"), []);
});
