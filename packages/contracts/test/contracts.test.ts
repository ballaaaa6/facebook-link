import assert from "node:assert/strict";
import test from "node:test";
import { contentBranches, createIdempotencyKey, sheetTabs, workflowCoordinatorId } from "../src/index.ts";

test("idempotency keys normalize each component", () => {
  assert.equal(createIdempotencyKey([" workspace ", "job", " 2 "]), "workspace:job:2");
});

test("the sheet mirror keeps unique tab names", () => {
  assert.equal(new Set(sheetTabs).size, sheetTabs.length);
});

test("content workflow constants pin the two branches and system coordinator", () => {
  assert.deepEqual(contentBranches, ["copy", "visual"]);
  assert.equal(workflowCoordinatorId, "workflow-coordinator");
});
