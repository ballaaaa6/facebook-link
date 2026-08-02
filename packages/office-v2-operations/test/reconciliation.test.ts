import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import type {
  OperationsEventRecord,
  OperationsSnapshotDocument,
  SnapshotDocument as SimulationSnapshotV2Document,
} from "@affiliate-ops/office-v2-contracts";
import {
  applyChoreographyTransition,
  createChoreographyState,
  type ChoreographyIntent,
  type ChoreographyTransition,
} from "../src/choreography.ts";
import {
  createReconciliationCheckpoint,
  deserializeReconciliationCheckpoint,
  externalInputCursorToOperationsCursor,
  operationsCursorToExternalInputCursor,
  reconcileOperations,
  serializeReconciliationCheckpoint,
  type ExternalInputCursor,
  type PendingReconciliationIntent,
  type ReconciliationCheckpoint,
  type ReconciliationEventPolicy,
  type ReconciliationQueueItem,
} from "../src/reconciliation.ts";

type MutableOperationsSnapshot = { -readonly [Key in keyof OperationsSnapshotDocument]: OperationsSnapshotDocument[Key] };
type MutableSimulationSnapshot = { -readonly [Key in keyof SimulationSnapshotV2Document]: SimulationSnapshotV2Document[Key] };
type Fixture = {
  readonly scope: { readonly workspaceId: string; readonly workflowId: string; readonly contentGroupId: string; readonly traceId: string; readonly streamId: string };
  readonly snapshot: OperationsSnapshotDocument;
  readonly transitions: Record<string, ChoreographyTransition>;
};
type ReconciliationFixture = {
  readonly externalClock: { readonly beforeCopy: string; readonly afterWindow: string; readonly afterExpiry: string };
  readonly validity: { readonly expiredAt: string; readonly futureFrom: string };
  readonly queue: Record<string, ReconciliationQueueItem>;
};

const choreographyFixture = JSON.parse(readFileSync(resolve(import.meta.dirname, "fixtures/p3-w3-3-choreography.json"), "utf8")) as Fixture;
const reconciliationFixture = JSON.parse(readFileSync(resolve(import.meta.dirname, "fixtures/p3-w3-4-reconciliation.json"), "utf8")) as ReconciliationFixture;
const simulationFixture = JSON.parse(readFileSync(resolve(import.meta.dirname, "../../../docs/office-v2/fixtures/simulation-contracts-v2.json"), "utf8")) as { readonly snapshot: SimulationSnapshotV2Document };

function event(id: string, sequence: number, digest: string, occurredAt: string, eventType: OperationsEventRecord["eventType"] = "branch-completed"): OperationsEventRecord {
  return {
    durableEventId: { kind: "event", value: id },
    sequence,
    payloadDigest: digest,
    occurredAt,
    workflowRunId: { kind: "workflow-run", value: "run-one" },
    taskId: { kind: "task", value: "task-one" },
    jobId: `${id}-job`,
    stage: "content_queued",
    eventType,
  } as OperationsEventRecord;
}
function operationsSnapshot(events: readonly OperationsEventRecord[]): OperationsSnapshotDocument {
  const snapshot = structuredClone(choreographyFixture.snapshot) as unknown as MutableOperationsSnapshot;
  snapshot.windowStartSequence = events.length === 0 ? 1 : events[0]!.sequence;
  snapshot.throughSequence = events.length === 0 ? 0 : events.at(-1)!.sequence;
  snapshot.events = [...events];
  return snapshot as OperationsSnapshotDocument;
}
function simulationSnapshot(withInputId?: string): SimulationSnapshotV2Document {
  const snapshot = structuredClone(simulationFixture.snapshot) as unknown as MutableSimulationSnapshot;
  if (withInputId !== undefined) snapshot.externalInputs = [...snapshot.externalInputs, { inputId: { kind: "external-input", value: withInputId }, scheduledTick: snapshot.tick, kind: "operations-event", payloadDigest: "digest-visual-1" } as SimulationSnapshotV2Document["externalInputs"][number]];
  return snapshot as SimulationSnapshotV2Document;
}
function cursor(overrides: Partial<ExternalInputCursor> = {}): ExternalInputCursor {
  return { streamId: "operations-stream", streamEpoch: 1, throughSequence: 0, retentionWindowStart: 1, seenInputs: [], ...overrides };
}
function checkpoint(overrides: { readonly cursor?: Partial<ExternalInputCursor>; readonly snapshotInputId?: string; readonly externalNow?: string; readonly pendingOperations?: readonly ReconciliationQueueItem[]; readonly pendingIntents?: readonly PendingReconciliationIntent[] } = {}): ReconciliationCheckpoint {
  return createReconciliationCheckpoint({
    simulationSnapshot: simulationSnapshot(overrides.snapshotInputId),
    cursor: cursor(overrides.cursor),
    scope: choreographyFixture.scope,
    externalNow: overrides.externalNow ?? reconciliationFixture.externalClock.beforeCopy,
    pendingOperations: overrides.pendingOperations,
    pendingIntents: overrides.pendingIntents,
  });
}
function transition(name: string, digest: string): ChoreographyTransition {
  return { ...choreographyFixture.transitions[name]!, payloadDigest: digest };
}
function policies(...entries: ReconciliationEventPolicy[]): readonly ReconciliationEventPolicy[] { return entries; }
function windowWithBranches(includeExpired = false): { readonly snapshot: OperationsSnapshotDocument; readonly policies: readonly ReconciliationEventPolicy[] } {
  const visual = event("event-visual-1", 1, "digest-visual-1", "2026-08-02T00:00:01.000Z");
  const copy = event("event-copy-1", 2, "digest-copy-1", "2026-08-02T00:00:02.000Z");
  const expired = event("event-expired", 3, "digest-expired", "2026-08-02T00:00:03.000Z", "task-update");
  return {
    snapshot: operationsSnapshot(includeExpired ? [visual, copy, expired] : [visual, copy]),
    policies: policies(
      { durableEventId: "event-visual-1", transition: transition("visual", "digest-visual-1") },
      { durableEventId: "event-copy-1", transition: transition("copy", "digest-copy-1") },
      ...(includeExpired ? [{ durableEventId: "event-expired", expiresAt: reconciliationFixture.validity.expiredAt }] : []),
    ),
  };
}
function reconcile(current: ReconciliationCheckpoint, snapshot: OperationsSnapshotDocument, eventPolicies: readonly ReconciliationEventPolicy[] = [], externalNow = reconciliationFixture.externalClock.afterWindow, durableOperations?: readonly ReconciliationQueueItem[]) {
  return reconcileOperations({ mode: "reconnect", checkpoint: current, operationsSnapshot: snapshot, externalNow, eventPolicies, durableOperations });
}
function intentFrom(name: string, digest: string, overrides: Partial<ChoreographyTransition> = {}): ChoreographyIntent {
  const result = applyChoreographyTransition(createChoreographyState(choreographyFixture.scope), { ...transition(name, digest), ...overrides });
  assert.ok(result.intents[0]);
  return result.intents[0]!;
}

test("maps an intact operations window to next-tick external inputs and joins choreography once", () => {
  const window = windowWithBranches(true);
  const result = reconcile(checkpoint(), window.snapshot, window.policies);
  assert.equal(result.status, "applied");
  assert.deepEqual(result.acceptedInputs.map((input) => input.inputId.value), ["event-visual-1", "event-copy-1"]);
  assert.equal(result.acceptedInputs.every((input) => input.scheduledTick === 7), true);
  assert.deepEqual(result.expiredInputIds, ["event-expired"]);
  assert.equal(result.checkpoint.cursor.throughSequence, 3);
  assert.equal(result.checkpoint.clocks.simulationTick, 6);
  assert.equal(result.intents.filter((intent) => intent.kind === "content-ready").length, 1);
  assert.equal(result.checkpoint.choreography.contentReadyIntentId !== null, true);
});

test("expired external events and offline operations expire without execution", () => {
  const window = windowWithBranches(true);
  const result = reconcile(checkpoint(), window.snapshot, window.policies, reconciliationFixture.externalClock.afterExpiry, [reconciliationFixture.queue.expired]);
  assert.equal(result.acceptedInputs.length, 2);
  assert.equal(result.expiredInputIds.includes("event-expired"), true);
  assert.equal(result.pendingOperations.find((item) => item.operationId === "operation-expired")?.status, "expired");
  assert.ok(result.diagnostics.some((entry) => entry.code === "adapter.external-input-expired"));
  assert.ok(result.diagnostics.some((entry) => entry.code === "adapter.operation-expired"));
});

test("future operations stay pending and resume never catches up simulation time", () => {
  const visual = event("event-visual-1", 1, "digest-visual-1", "2026-08-02T00:00:01.000Z");
  const copy = event("event-copy-future", 2, "digest-copy-future", "2026-08-02T00:00:02.000Z");
  const result = reconcile(checkpoint(), operationsSnapshot([visual, copy]), policies(
    { durableEventId: "event-visual-1", transition: transition("visual", "digest-visual-1") },
    { durableEventId: "event-copy-future", validFrom: reconciliationFixture.validity.futureFrom, transition: { ...transition("copy", "digest-copy-future"), durableEventId: "event-copy-future" } },
  ), reconciliationFixture.externalClock.beforeCopy);
  assert.equal(result.status, "future");
  assert.deepEqual(result.acceptedInputs.map((input) => input.inputId.value), ["event-visual-1"]);
  assert.equal(result.checkpoint.cursor.throughSequence, 1);
  assert.equal(result.checkpoint.clocks.simulationTick, 6);
  assert.ok(result.diagnostics.some((entry) => entry.code === "adapter.external-input-future"));
  const resumed = reconcile(result.checkpoint, operationsSnapshot([visual, copy]), policies(
    { durableEventId: "event-visual-1", transition: transition("visual", "digest-visual-1") },
    { durableEventId: "event-copy-future", validFrom: reconciliationFixture.validity.futureFrom, transition: { ...transition("copy", "digest-copy-future"), durableEventId: "event-copy-future" } },
  ), reconciliationFixture.externalClock.afterExpiry);
  assert.deepEqual(resumed.acceptedInputs.map((input) => input.inputId.value), ["event-copy-future"]);
  assert.equal(resumed.checkpoint.cursor.throughSequence, 2);
});

test("duplicate reconnect delivery is idempotent and changed payloads fail closed", () => {
  const window = windowWithBranches(false);
  const first = reconcile(checkpoint(), window.snapshot, window.policies);
  const duplicate = reconcile(first.checkpoint, window.snapshot, window.policies);
  assert.equal(duplicate.status, "duplicate");
  assert.equal(duplicate.acceptedInputs.length, 0);
  assert.equal(duplicate.intents.length, 0);
  const changed = event("event-visual-1", 1, "digest-visual-changed", "2026-08-02T00:00:01.000Z");
  const conflict = reconcile(checkpoint({ cursor: { seenInputs: [{ inputId: "event-visual-1", payloadDigest: "digest-visual-1" }] } }), operationsSnapshot([changed]));
  assert.equal(conflict.status, "conflict");
  assert.equal(conflict.checkpoint.cursor.throughSequence, 0);
  assert.equal(conflict.diagnostics[0]?.code, "adapter.event-digest-conflict");
});

test("restored Snapshot V2 external inputs prevent resurrection when the cursor is older", () => {
  const result = reconcile(checkpoint({ snapshotInputId: "event-visual-1" }), operationsSnapshot([event("event-visual-1", 1, "digest-visual-1", "2026-08-02T00:00:01.000Z")]), policies({ durableEventId: "event-visual-1", transition: transition("visual", "digest-visual-1") }));
  assert.equal(result.status, "duplicate");
  assert.equal(result.acceptedInputs.length, 0);
  assert.deepEqual(result.duplicateInputIds, ["event-visual-1"]);
  assert.equal(result.checkpoint.cursor.throughSequence, 1);
});

test("cursor ahead, epoch reset, and retained-window expiry are explicit", () => {
  const ahead = reconcile(checkpoint({ cursor: { throughSequence: 2 } }), operationsSnapshot([event("event-one", 1, "digest-one", "2026-08-02T00:00:01.000Z")]));
  assert.equal(ahead.status, "rejected");
  assert.equal(ahead.diagnostics[0]?.code, "adapter.cursor-ahead-of-snapshot");
  const epochSnapshot = operationsSnapshot([event("event-one", 1, "digest-one", "2026-08-02T00:00:01.000Z")]);
  (epochSnapshot as unknown as MutableOperationsSnapshot).streamEpoch = 2;
  const epoch = reconcile(checkpoint(), epochSnapshot);
  assert.equal(epoch.status, "current-truth");
  assert.equal(epoch.checkpoint.cursor.streamEpoch, 2);
  assert.deepEqual(epoch.checkpoint.cursor.seenInputs.map((entry) => entry.inputId), ["event-one"]);
  assert.equal(epoch.intents.length, 0);
  const oldSnapshot = operationsSnapshot([event("event-ten", 10, "digest-ten", "2026-08-02T00:00:01.000Z")]);
  (oldSnapshot as unknown as MutableOperationsSnapshot).windowStartSequence = 10;
  const old = reconcile(checkpoint(), oldSnapshot);
  assert.equal(old.status, "current-truth");
  assert.ok(old.diagnostics.some((entry) => entry.code === "adapter.cursor-too-old"));
});

test("stale intents are removed after reload while valid intents remain pending", () => {
  const stale: PendingReconciliationIntent = { intent: intentFrom("copy", "digest-copy-1"), expiresAt: reconciliationFixture.validity.expiredAt };
  const valid: PendingReconciliationIntent = { intent: intentFrom("visual", "digest-visual-1"), expiresAt: "2026-08-02T00:01:00.000Z" };
  const result = reconcile(checkpoint({ pendingIntents: [stale, valid] }), operationsSnapshot([]), [], reconciliationFixture.externalClock.afterExpiry);
  assert.deepEqual(result.pendingIntents.map((entry) => entry.intent.id), [valid.intent.id]);
  assert.ok(result.diagnostics.some((entry) => entry.code === "adapter.intent-stale"));
  assert.deepEqual(result.coalescedIntentIds, []);
});

test("pending queues are preserved, ordered, and terminal work cannot be resurrected", () => {
  const pending = reconciliationFixture.queue.pending;
  const result = reconcile(checkpoint({ pendingOperations: [pending] }), operationsSnapshot([]), [], reconciliationFixture.externalClock.afterWindow, [reconciliationFixture.queue.completed]);
  assert.deepEqual(result.pendingOperations.map((item) => item.operationId), ["operation-completed", "operation-pending"]);
  const completed = reconcile(checkpoint({ pendingOperations: [reconciliationFixture.queue.completed] }), operationsSnapshot([]), [], reconciliationFixture.externalClock.afterWindow, [{ ...reconciliationFixture.queue.completed, status: "pending" }]);
  assert.equal(completed.pendingOperations.find((item) => item.operationId === "operation-completed")?.status, "completed");
  assert.ok(completed.diagnostics.some((entry) => entry.code === "adapter.queue-item-resurrection"));
});

test("branch and handoff intents coalesce deterministically across a reconnect", () => {
  const started = intentFrom("copy", "digest-copy-started", { kind: "branch-started", durableEventId: "event-copy-started" });
  const handoff = intentFrom("copy", "digest-copy-handoff", { kind: "handoff", durableEventId: "event-copy-handoff" });
  const completed = intentFrom("copy", "digest-copy-completed", { durableEventId: "event-copy-completed" });
  const result = reconcile(checkpoint({ pendingIntents: [
    { intent: started, expiresAt: null },
    { intent: handoff, expiresAt: null },
    { intent: completed, expiresAt: null },
  ] }), operationsSnapshot([]));
  assert.deepEqual(result.pendingIntents.map((entry) => entry.intent.id), [completed.id]);
  assert.deepEqual(result.coalescedIntentIds, [started.id, handoff.id]);
});

test("repeated restore and reconcile produce the same serialized checkpoint and no new intents", () => {
  const window = windowWithBranches(false);
  const first = reconcile(checkpoint(), window.snapshot, window.policies);
  const restored = deserializeReconciliationCheckpoint(serializeReconciliationCheckpoint(first.checkpoint));
  const second = reconcile(restored, window.snapshot, window.policies, reconciliationFixture.externalClock.afterWindow);
  const repeated = reconcile(restored, window.snapshot, window.policies, reconciliationFixture.externalClock.afterWindow);
  assert.equal(second.checkpoint.clocks.simulationTick, 6);
  assert.equal(second.acceptedInputs.length, 0);
  assert.equal(second.intents.length, 0);
  assert.deepEqual(second, repeated);
  assert.equal(serializeReconciliationCheckpoint(restored), serializeReconciliationCheckpoint(first.checkpoint));
});

test("cursor conversion preserves the existing adapter contract", () => {
  const source = { streamId: "operations-stream", streamEpoch: 1, throughSequence: 4, retentionWindowStart: 2, seenEvents: [{ durableEventId: "event-b", payloadDigest: "digest-b" }, { durableEventId: "event-a", payloadDigest: "digest-a" }] };
  const generic = operationsCursorToExternalInputCursor(source);
  assert.deepEqual(generic.seenInputs.map((entry) => entry.inputId), ["event-a", "event-b"]);
  assert.deepEqual(externalInputCursorToOperationsCursor(generic), { ...source, seenEvents: source.seenEvents.slice().sort((left, right) => left.durableEventId.localeCompare(right.durableEventId)) });
});

test("contradictory windows and backward external clocks return exact diagnostics without mutation", () => {
  const invalidWindow = reconcile(checkpoint(), operationsSnapshot([event("event-invalid", 1, "digest-invalid", "2026-08-02T00:00:01.000Z")]), [{ durableEventId: "event-invalid", validFrom: "2026-08-02T00:00:10.000Z", expiresAt: "2026-08-02T00:00:09.000Z" }]);
  assert.equal(invalidWindow.status, "rejected");
  assert.ok(invalidWindow.diagnostics.some((entry) => entry.code === "adapter.reconciliation-invalid"));
  const before = checkpoint({ externalNow: reconciliationFixture.externalClock.afterWindow });
  const skewed = reconcile(before, operationsSnapshot([]), [], reconciliationFixture.externalClock.beforeCopy);
  assert.equal(skewed.status, "rejected");
  assert.equal(skewed.checkpoint, before);
  assert.equal(skewed.diagnostics[0]?.code, "adapter.clock-skew");
});
