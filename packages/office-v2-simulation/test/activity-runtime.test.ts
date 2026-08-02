import assert from "node:assert/strict";
import test from "node:test";
import {
  advanceActivityRuntime,
  cancelActivity,
  createActivityRuntime,
  preemptActivity,
} from "../src/activity-runtime.ts";

const facility = (overrides: Partial<Parameters<typeof createActivityRuntime>[1][number]> = {}) => ({
  facilityId: "review-console",
  slotId: "review-console-use",
  capability: "review-content",
  capacity: 1,
  availability: "available" as const,
  targetGeneration: 3,
  revision: 7,
  approachCells: ["cell:floor-one-05-04"],
  waitingCells: ["cell:floor-one-04-04", "cell:floor-one-03-04"],
  ...overrides,
});

const intent = (overrides: Partial<Parameters<typeof createActivityRuntime>[0]> = {}) => ({
  intentId: "intent-review",
  actorId: "actor-review",
  capability: "review-content",
  priorityClass: "durable" as const,
  issueTick: 0,
  notBeforeTick: 0,
  durationTicks: 2,
  expectedWorldRevision: 12,
  expectedTargetGeneration: 3,
  resourceKeys: [],
  ...overrides,
});

function reachedUsing() {
  let state = createActivityRuntime(intent(), [facility()], { worldRevision: 12 });
  state = advanceActivityRuntime(state, 1).state;
  state = advanceActivityRuntime(state, 2).state;
  state = advanceActivityRuntime(state, 3).state;
  return state;
}

test("selects a capability-matching facility and reaches using deterministically", () => {
  const state = reachedUsing();
  assert.equal(state.phase, "using");
  assert.equal(state.facilityId, "review-console");
  assert.equal(state.slotId, "review-console-use");
  assert.deepEqual(state.requestedResourceKeys, [
    "cell:floor-one-05-04",
    "facility:review-console",
    "socket:review-console-use",
  ]);
});

test("waits without a partial resource claim, then acquires the complete set", () => {
  let state = createActivityRuntime(intent(), [facility()], { worldRevision: 12 });
  state = advanceActivityRuntime(state, 1, { blockedResourceKeys: ["facility:review-console"] }).state;
  state = advanceActivityRuntime(state, 2, { blockedResourceKeys: ["facility:review-console"] }).state;
  assert.equal(state.phase, "waiting");
  assert.deepEqual(state.reservedResourceKeys, ["cell:floor-one-03-04"]);
  assert.equal(state.reservedResourceKeys.includes("socket:review-console-use"), false);
  state = advanceActivityRuntime(state, 3, { blockedResourceKeys: [] }).state;
  assert.equal(state.phase, "acquired");
  assert.deepEqual(state.reservedResourceKeys, state.requestedResourceKeys);
  assert.equal(state.queueTicket?.state, "acquired");
});

test("completes use and releases every resource exactly once", () => {
  let state = reachedUsing();
  state = advanceActivityRuntime(state, 5).state;
  assert.equal(state.phase, "released");
  assert.equal(state.terminalReason, "completed");
  assert.equal(state.cleanupGeneration, 1);
  assert.deepEqual(state.reservedResourceKeys, []);
  assert.deepEqual(state.releasedResourceKeys, [
    "cell:floor-one-05-04",
    "facility:review-console",
    "socket:review-console-use",
  ]);
  const again = cancelActivity(state, 6);
  assert.deepEqual(again.state, state);
  assert.deepEqual(again.events, []);
});

test("cancellation, timeout, target removal, and unreachable paths use terminal cleanup", () => {
  const canceled = cancelActivity(reachedUsing(), 4);
  assert.equal(canceled.state.phase, "canceled");
  assert.equal(canceled.state.terminalReason, "canceled");
  let timeout = createActivityRuntime(intent({ expiresTick: 1 }), [facility()], { worldRevision: 12 });
  timeout = advanceActivityRuntime(timeout, 1).state;
  assert.equal(timeout.phase, "canceled");
  assert.equal(timeout.terminalReason, "timeout");
  const removed = advanceActivityRuntime(reachedUsing(), 4, { signal: "target-removed" });
  assert.equal(removed.state.phase, "failed");
  assert.equal(removed.state.terminalReason, "target-removed");
  const unreachable = createActivityRuntime(intent(), [facility({ approachCells: [] })], { worldRevision: 12 });
  assert.equal(unreachable.phase, "failed");
  assert.equal(unreachable.terminalReason, "unreachable");
});

test("revalidates world revision, target generation, availability, and capability", () => {
  const stale = createActivityRuntime(intent({ expectedWorldRevision: 11 }), [facility()], { worldRevision: 12 });
  assert.equal(stale.terminalReason, "world-revision-mismatch");
  const generation = createActivityRuntime(intent({ expectedTargetGeneration: 4 }), [facility()], { worldRevision: 12 });
  assert.equal(generation.terminalReason, "target-generation-mismatch");
  const removed = createActivityRuntime(intent(), [facility({ availability: "removed" })], { worldRevision: 12 });
  assert.equal(removed.terminalReason, "target-unavailable");
  const wrongCapability = createActivityRuntime(intent({ capability: "publish-content" }), [facility()], { worldRevision: 12 });
  assert.equal(wrongCapability.terminalReason, "target-unavailable");
});

test("durable work can preempt cancelable decorative work", () => {
  const decorative = createActivityRuntime(intent({
    intentId: "intent-decorative",
    priorityClass: "decorative",
    preemptionPolicy: "decorative-only",
  }), [facility()], { worldRevision: 12 });
  const result = preemptActivity(decorative, 1);
  assert.equal(result.state.phase, "canceled");
  assert.equal(result.state.terminalReason, "preempted");
  assert.equal(result.state.cleanupGeneration, 1);
});

test("logical progress is independent of display scheduling", () => {
  const left = advanceActivityRuntime(reachedUsing(), 5).state;
  let right = reachedUsing();
  for (let tick = 4; tick <= 5; tick += 1) right = advanceActivityRuntime(right, tick).state;
  assert.deepEqual(left, right);
});
