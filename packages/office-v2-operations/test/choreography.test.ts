import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import type { OperationsSnapshotDocument } from "@affiliate-ops/office-v2-contracts";
import {
  applyChoreographyTransition,
  createChoreographyState,
  projectPresentationState,
  type ChoreographyScope,
  type ChoreographyTransition,
} from "../src/choreography.ts";

type Fixture = {
  scope: ChoreographyScope;
  snapshot: OperationsSnapshotDocument;
  transitions: Record<string, ChoreographyTransition>;
};

const fixture = JSON.parse(
  readFileSync(resolve(import.meta.dirname, "fixtures/p3-w3-3-choreography.json"), "utf8"),
) as unknown as Fixture;

test("projects every Snapshot V2 semantic and availability state without visual facts", () => {
  const projection = projectPresentationState(fixture.snapshot);
  const byId = new Map(projection.agents.map((agent) => [agent.agentInstanceId, agent]));
  assert.equal(projection.schemaVersion, "office-operations-choreography-v1");
  assert.equal(projection.sourceRevision, "operations-revision-1");
  assert.equal(byId.get("agent-live")?.state, "working");
  assert.equal(byId.get("agent-live")?.roleId, "live-role");
  assert.equal(byId.get("agent-live")?.work?.stage, "content_queued");
  assert.equal(byId.get("agent-live")?.featureAvailability[0]?.featureId, "live-feature");
  assert.equal(byId.get("agent-waiting")?.state, "waiting");
  assert.equal(byId.get("agent-review")?.state, "review");
  assert.equal(byId.get("agent-blocked")?.state, "blocked");
  assert.equal(byId.get("agent-failed")?.state, "blocked");
  assert.equal(byId.get("agent-failed")?.reason?.code, "connector.failed");
  assert.equal(byId.get("agent-stale")?.state, "unavailable");
  assert.equal(byId.get("agent-reconnecting")?.state, "unavailable");
  assert.equal(byId.get("agent-unavailable")?.state, "unavailable");
  assert.equal(byId.get("agent-idle")?.state, "idle");
  assert.equal(byId.get("agent-disabled")?.state, "unavailable");
  assert.equal(byId.get("agent-disabled")?.featureAvailability[0]?.available, false);
  assert.equal("sprite" in projection, false);
  assert.equal("facility" in projection, false);
});

test("copy-first and visual-first completion emit the same one-time join", () => {
  const copyFirst = apply(fixture.transitions.copy, fixture.transitions.visual);
  const visualFirst = apply(fixture.transitions.visual, fixture.transitions.copy);
  assert.deepEqual(copyFirst.state, visualFirst.state);
  const copyReady = copyFirst.intents.find((intent) => intent.kind === "content-ready");
  const visualReady = visualFirst.intents.find((intent) => intent.kind === "content-ready");
  assert.equal(copyFirst.intents.filter((intent) => intent.kind === "content-ready").length, 1);
  assert.deepEqual(copyReady, visualReady);
  assert.equal(copyReady?.id, "choreography.content-ready:13:workspace-one|12:workflow-one|17:content-group-one");
  assert.equal(copyReady?.workflowOwner, "workflow-coordinator");
});

test("duplicate durable delivery is a no-op and changed payload conflicts", () => {
  const first = apply(fixture.transitions.copy);
  const duplicate = applyFrom(first.state, fixture.transitions.copy);
  assert.equal(duplicate.status, "duplicate");
  assert.deepEqual(duplicate.state, first.state);
  const changed = applyFrom(first.state, { ...fixture.transitions.copy, payloadDigest: "digest-copy-changed" });
  assert.equal(changed.status, "conflict");
  assert.equal(changed.diagnostics[0]?.code, "adapter.event-digest-conflict");
  assert.deepEqual(changed.state, first.state);
});

test("stale and same-attempt transitions fail closed while a higher retry replaces pending work", () => {
  const started = apply(fixture.transitions.copyRetry);
  const stale = applyFrom(started.state, { ...fixture.transitions.copy, kind: "branch-completed" });
  assert.equal(stale.status, "ignored");
  assert.equal(stale.diagnostics[0]?.code, "workflow.content-stale-attempt");

  const conflict = applyFrom(started.state, { ...fixture.transitions.copyRetry, durableEventId: "event-copy-2-start-conflict", payloadDigest: "digest-copy-2-start-conflict" });
  assert.equal(conflict.status, "ignored");
  assert.equal(conflict.diagnostics[0]?.code, "workflow.content-attempt-conflict");

  const completed = applyFrom(started.state, {
    ...fixture.transitions.copyRetry,
    kind: "branch-completed",
    durableEventId: "event-copy-2-completed",
    payloadDigest: "digest-copy-2-completed",
  });
  assert.equal(completed.state.branches.copy.attempt, 2);
  assert.equal(completed.state.branches.copy.status, "completed");
  assert.equal(completed.state.branches.copy.artifactVersion, 2);
});

test("group and scope mismatch use workflow-owned diagnostics", () => {
  const state = createChoreographyState(fixture.scope);
  const wrongGroup = applyFrom(state, { ...fixture.transitions.copy, contentGroupId: "other-group" });
  assert.equal(wrongGroup.diagnostics[0]?.code, "workflow.content-group-mismatch");
  const wrongScope = applyFrom(state, { ...fixture.transitions.copy, workflowId: "other-workflow" });
  assert.equal(wrongScope.diagnostics[0]?.code, "workflow.content-scope-mismatch");
});

test("failure blocks the branch, recovery is explicit, and completion can then join", () => {
  const copy = apply(fixture.transitions.copy);
  const failed = applyFrom(copy.state, fixture.transitions.failure);
  assert.equal(failed.state.branches.visual.status, "failed");
  assert.equal(failed.state.branches.visual.failure?.code, "browser.session-failed");
  assert.equal(failed.intents[0]?.kind, "branch-failed");
  assert.equal(failed.intents[0]?.reason?.recoverability, "reconnect");
  const recovered = applyFrom(failed.state, fixture.transitions.recovery);
  assert.equal(recovered.state.branches.visual.status, "pending");
  assert.equal(recovered.intents[0]?.kind, "branch-recovered");
  const completed = applyFrom(recovered.state, {
    ...fixture.transitions.visual,
    durableEventId: "event-visual-after-recovery",
    payloadDigest: "digest-visual-after-recovery",
  });
  assert.equal(completed.intents.filter((intent) => intent.kind === "content-ready").length, 1);
});

test("late, reconnect, closed-group, and handoff deliveries cannot repeat work", () => {
  const retry = apply(fixture.transitions.copyRetry);
  const late = applyFrom(retry.state, { ...fixture.transitions.copy, durableEventId: "event-copy-late", payloadDigest: "digest-copy-late" });
  assert.equal(late.diagnostics[0]?.code, "workflow.content-stale-attempt");

  const handoff = applyFrom(retry.state, {
    ...fixture.transitions.copyRetry,
    kind: "handoff",
    durableEventId: "event-copy-handoff",
    payloadDigest: "digest-copy-handoff",
  });
  assert.equal(handoff.status, "applied");
  assert.equal(handoff.intents[0]?.kind, "handoff");

  const joined = apply(fixture.transitions.copy, fixture.transitions.visual);
  const duplicateAfterReconnect = applyFrom(joined.state, fixture.transitions.visual);
  assert.equal(duplicateAfterReconnect.status, "duplicate");
  const lateAfterJoin = applyFrom(joined.state, { ...fixture.transitions.copyRetry, durableEventId: "event-copy-after-join", payloadDigest: "digest-copy-after-join" });
  assert.equal(lateAfterJoin.status, "ignored");
  assert.equal(lateAfterJoin.diagnostics[0]?.code, "workflow.content-group-closed");
});

test("projection and reduction are deterministic under declared unordered input and do not mutate inputs", () => {
  const snapshotBefore = structuredClone(fixture.snapshot);
  const reversedSnapshot = structuredClone(fixture.snapshot);
  reversedSnapshot.agents.reverse();
  reversedSnapshot.features.reverse();
  assert.deepEqual(projectPresentationState(fixture.snapshot), projectPresentationState(reversedSnapshot));
  assert.deepEqual(fixture.snapshot, snapshotBefore);

  const transitionsBefore = structuredClone(fixture.transitions);
  const first = apply(fixture.transitions.copy, fixture.transitions.visual);
  const second = apply(fixture.transitions.visual, fixture.transitions.copy);
  assert.deepEqual(first.state, second.state);
  assert.deepEqual(fixture.transitions, transitionsBefore);
});

function apply(...transitions: ChoreographyTransition[]) {
  return applyFrom(createChoreographyState(fixture.scope), ...transitions);
}

function applyFrom(state: ReturnType<typeof createChoreographyState>, ...transitions: ChoreographyTransition[]) {
  let current = state;
  let result = applyChoreographyTransition(current, transitions[0]!);
  current = result.state;
  for (const transition of transitions.slice(1)) {
    result = applyChoreographyTransition(current, transition);
    current = result.state;
  }
  return result;
}
