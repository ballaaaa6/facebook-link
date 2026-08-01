import assert from "node:assert/strict";
import test from "node:test";
import type { WorkflowEvent } from "@affiliate-ops/contracts";
import {
  assertContentBranchOwner,
  assertTransition,
  assertWorkflowEventOwnership,
  canTransition,
  getContentBranchOwnerId,
  nextStages,
  WorkflowInvariantError,
} from "../src/index.ts";

test("allows the happy-path transition", () => {
  assert.equal(canTransition("selected", "link_ready"), true);
});

test("blocks a skipped transition", () => {
  assert.equal(canTransition("discovered", "published"), false);
  assert.throws(() => assertTransition("discovered", "published"), /Invalid workflow transition/);
});

test("content_ready can only be emitted by the join reducer", () => {
  assert.equal(canTransition("content_queued", "content_ready"), false);
  assert.equal(nextStages("failed").includes("content_ready"), false);
  assert.throws(
    () => assertTransition("content_queued", "content_ready"),
    hasCode("workflow.content-ready-requires-join"),
  );
});

test("measured is a terminal state", () => {
  assert.deepEqual(nextStages("measured"), []);
});

test("winner selection belongs only to Growth Strategist", () => {
  assert.doesNotThrow(() => assertWorkflowEventOwnership(workflowEvent("selected", "growth-strategist")));
  assert.throws(
    () => assertWorkflowEventOwnership(workflowEvent("selected", "product-ranker")),
    hasCode("workflow.event-owner-mismatch"),
  );
});

test("ranking evidence and content branches have fixed owners", () => {
  assert.doesNotThrow(() => assertWorkflowEventOwnership(workflowEvent("scored", "product-ranker")));
  assert.throws(
    () => assertWorkflowEventOwnership(workflowEvent("scored", "growth-strategist")),
    hasCode("workflow.event-owner-mismatch"),
  );
  assert.equal(getContentBranchOwnerId("copy"), "gemini-copywriter");
  assert.equal(getContentBranchOwnerId("visual"), "flow-visual-producer");
  assert.doesNotThrow(() => assertContentBranchOwner("copy", "gemini-copywriter"));
  assert.throws(
    () => assertContentBranchOwner("visual", "gemini-copywriter"),
    hasCode("workflow.event-owner-mismatch"),
  );
});

test("content_ready audit ownership is the system coordinator", () => {
  const coordinatorEvent: WorkflowEvent = {
    ...workflowEvent("content_ready", "workflow-coordinator"),
    actorType: "system",
  };
  assert.doesNotThrow(() => assertWorkflowEventOwnership(coordinatorEvent));
  assert.throws(
    () => assertWorkflowEventOwnership(workflowEvent("content_ready", "flow-visual-producer")),
    hasCode("workflow.event-owner-mismatch"),
  );
});

function workflowEvent(stage: WorkflowEvent["stage"], actorId: string): WorkflowEvent {
  return {
    id: `event-${stage}`,
    workspaceId: "workspace-one",
    workflowId: "workflow-one",
    stage,
    actorType: "agent",
    actorId,
    traceId: "trace-one",
    occurredAt: "2026-08-01T00:00:00.000Z",
    payload: {},
  };
}

function hasCode(code: WorkflowInvariantError["code"]): (error: unknown) => boolean {
  return (error) => error instanceof WorkflowInvariantError && error.code === code;
}
