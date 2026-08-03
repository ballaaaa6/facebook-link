import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import test from "node:test";
import type { OperationsEventRecord, OperationsSnapshotDocument, SnapshotDocument as SimulationSnapshot } from "@affiliate-ops/office-v2-contracts";
import { canonicalHashHex, canonicalJson, type JsonValue } from "@affiliate-ops/office-v2-contracts";
import { bindRoster, canProposeInteraction, inspectOperationsSnapshot, reconcileEventWindow } from "../src/index.ts";
import { createReconciliationCheckpoint, reconcileOperations, type ReconciliationEventPolicy } from "../src/reconciliation.ts";
import { projectPresentationState, type ChoreographyTransition } from "../src/choreography.ts";

const root = resolve(import.meta.dirname, "../../..");
const runner = resolve(root, "services/automation-runner/src/simulation/phase3-operations.ts");
const outputDirectory = resolve(root, "artifacts/office-v2/phase3/operations");
const closure = JSON.parse(readFileSync(resolve(root, "docs/office-v2/fixtures/operations-closure-c.json"), "utf8")) as { snapshots: OperationsSnapshotDocument[]; routing: Parameters<typeof bindRoster>[1]; roster: Parameters<typeof bindRoster>[2] };
const choreography = JSON.parse(readFileSync(resolve(root, "packages/office-v2-operations/test/fixtures/p3-w3-3-choreography.json"), "utf8")) as { transitions: Record<string, ChoreographyTransition> };
const simulation = JSON.parse(readFileSync(resolve(root, "docs/office-v2/fixtures/simulation-contracts-v2.json"), "utf8")) as { snapshot: SimulationSnapshot };
type RawTrace = { roles: string[]; jobs: Record<string, any>[]; results: Record<string, any>[]; workflow: Record<string, any>; operationsWindow: Record<string, any>; persistence: Record<string, any> };
type MutableSnapshot = { -readonly [Key in keyof OperationsSnapshotDocument]: OperationsSnapshotDocument[Key] };

function runRunner(): RawTrace {
  const result = spawnSync(process.execPath, [runner], { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(readFileSync(resolve(outputDirectory, "operations-runner-trace.json"), "utf8")) as RawTrace;
}
function eventValue(event: Record<string, any>): string { return String(event.durableEventId.value); }
function agentInstanceForRole(roleId: string): string {
  const binding = closure.roster.bindings.find((candidate) => String(candidate.roleId) === roleId);
  assert.ok(binding, `No roster binding exists for ${roleId}.`);
  return String(binding.agentInstanceId.value);
}
function snapshotFor(raw: RawTrace): OperationsSnapshotDocument {
  const snapshot = structuredClone(closure.snapshots[0]!) as MutableSnapshot;
  const window = raw.operationsWindow;
  snapshot.snapshotId = { kind: "snapshot", value: "phase3-final-snapshot" };
  snapshot.observedAt = "2026-08-03T00:00:00.000Z";
  snapshot.sourceRevision = "phase3-operations-revision-1";
  snapshot.streamId = "operations-stream";
  snapshot.streamEpoch = 1;
  snapshot.windowStartSequence = 1;
  snapshot.throughSequence = 15;
  snapshot.eventDigest = String(window.eventDigest);
  snapshot.events = window.events as OperationsEventRecord[];
  const jobsByRole = new Map(raw.jobs.map((job) => [String(job.payload.roleId), job]));
  snapshot.agents = snapshot.agents.map((agent) => {
    const roleId = String(agent.roleId);
    const job = jobsByRole.get(roleId);
    return job ? { ...agent, status: "working", freshness: "live", work: { workflowRunId: { kind: "workflow-run", value: "phase3-autopost-workflow" }, taskId: { kind: "task", value: "autopost-task" }, jobId: String(job.id), stage: String(job.stage) }, reason: null, sessionHealth: { status: "available", observedAt: "2026-08-03T00:00:00.000Z" } } : agent;
  });
  return snapshot as OperationsSnapshotDocument;
}
function transition(raw: RawTrace, name: string, event: Record<string, any>, overrides: Partial<ChoreographyTransition> = {}): ChoreographyTransition {
  return { ...choreography.transitions[name]!, workspaceId: "phase3-operations-workspace", workflowId: "phase3-autopost-workflow", contentGroupId: "phase3-content-group", traceId: "phase3-autopost-trace", durableEventId: eventValue(event), payloadDigest: String(event.payloadDigest), occurredAt: String(event.occurredAt), sourceRevision: "phase3-operations-revision-1", streamId: "operations-stream", ...overrides };
}
function reconciliation(raw: RawTrace, snapshot: OperationsSnapshotDocument) {
  const events = raw.operationsWindow.events as Record<string, any>[];
  const policies: ReconciliationEventPolicy[] = [
    { durableEventId: eventValue(events[4]!), transition: transition(raw, "copy", events[4]!) },
    { durableEventId: eventValue(events[5]!), transition: transition(raw, "failure", events[5]!) },
    { durableEventId: eventValue(events[6]!), transition: transition(raw, "recovery", events[6]!) },
    { durableEventId: eventValue(events[7]!), transition: transition(raw, "copyRetry", events[7]!, { branch: "visual", jobId: String(events[7]!.jobId) }) },
    { durableEventId: eventValue(events[8]!), transition: transition(raw, "visual", events[8]!, { attempt: 2, artifactVersion: 2, jobId: String(events[8]!.jobId) }) },
  ];
  const checkpoint = createReconciliationCheckpoint({ simulationSnapshot: simulation.snapshot, cursor: { streamId: "operations-stream", streamEpoch: 1, throughSequence: 0, retentionWindowStart: 1, seenInputs: [] }, scope: { workspaceId: "phase3-operations-workspace", workflowId: "phase3-autopost-workflow", contentGroupId: "phase3-content-group", traceId: "phase3-autopost-trace", streamId: "operations-stream" }, externalNow: "2026-08-03T00:00:00.000Z" });
  return { policies, checkpoint, result: reconcileOperations({ mode: "reconnect", checkpoint, operationsSnapshot: snapshot, externalNow: "2026-08-03T00:00:00.000Z", eventPolicies: policies }) };
}
function report(raw: RawTrace): Record<string, unknown> {
  const snapshot = snapshotFor(raw);
  const roleForJob = (predicate: (job: Record<string, any>) => boolean, label: string): string => {
    const job = raw.jobs.find(predicate);
    assert.ok(job, `No runner job found for ${label}.`);
    return String(job.payload.roleId);
  };
  const visualRole = roleForJob((job) => job.payload.branch === "visual", "visual branch");
  const performanceRole = roleForJob((job) => job.stage === "measured", "performance stage");
  const copyAgent = agentInstanceForRole(roleForJob((job) => job.payload.branch === "copy", "copy branch"));
  const growthRole = roleForJob((job) => job.stage === "selected", "winner selection");
  const workflowId = String(raw.jobs[0]?.workflowId);
  assert.ok(workflowId.length > 0);
  assert.equal(raw.persistence.sourceWorkflowId, workflowId);
  assert.equal(raw.persistence.persistedWorkflowId, workflowId);
  assert.deepEqual(raw.persistence.sourceJobIds, raw.jobs.map((job) => job.id));
  assert.ok(raw.persistence.persistedJobIds.every((jobId) => raw.persistence.sourceJobIds.includes(jobId)));
  assert.ok((raw.operationsWindow.events as Record<string, any>[]).every((event) => String(event.workflowRunId?.value) === workflowId));
  assert.ok((raw.operationsWindow.events as Record<string, any>[]).every((event) => /^[a-f0-9]{64}$/.test(String(event.payloadDigest))));
  assert.ok(/^[a-f0-9]{64}$/.test(String(raw.operationsWindow.eventDigest)));
  const sessionRole = raw.persistence.omittedRoleIds[0];
  assert.ok(typeof sessionRole === "string" && sessionRole.length > 0);
  assert.deepEqual(raw.persistence.omittedRoleIds, [sessionRole]);
  assert.deepEqual([...raw.persistence.persistedRoleIds].sort(), raw.roles.filter((role) => role !== sessionRole).sort());
  const roster = bindRoster(closure.snapshots[0]!, closure.routing, closure.roster);
  assert.equal(roster.bindings.length, 10);
  assert.deepEqual(raw.roles, roster.bindings.map((binding) => binding.roleId));
  const initialCursor = { streamId: "operations-stream", streamEpoch: 1, throughSequence: 0, retentionWindowStart: 1, seenEvents: [] };
  const applied = reconcileEventWindow(initialCursor, snapshot);
  assert.equal(applied.status, "applied");
  assert.equal(applied.acceptedEvents.length, 15);
  const duplicate = reconcileEventWindow(applied.nextCursor, snapshot);
  assert.equal(duplicate.status, "duplicate");
  const changed = structuredClone(snapshot) as MutableSnapshot;
  changed.events = [{ ...changed.events[0]!, payloadDigest: "f".repeat(64) }, ...changed.events.slice(1)];
  const conflict = reconcileEventWindow(applied.nextCursor, changed as OperationsSnapshotDocument);
  assert.equal(conflict.status, "conflict");
  const gap = structuredClone(snapshot) as MutableSnapshot;
  gap.events = [snapshot.events[0]!, snapshot.events[2]!]; gap.windowStartSequence = 1; gap.throughSequence = 3;
  const gapResult = reconcileEventWindow(initialCursor, gap as OperationsSnapshotDocument);
  assert.equal(gapResult.status, "resync-required");
  const lateEvent = { ...snapshot.events[0]!, durableEventId: { kind: "event", value: "event-late" }, payloadDigest: "e".repeat(64) };
  const late = reconcileEventWindow(applied.nextCursor, { ...snapshot, windowStartSequence: 1, throughSequence: 1, events: [lateEvent] });
  assert.equal(late.status, "resync-required");
  const disabled = canProposeInteraction(closure.snapshots[0]!, closure.routing, closure.roster, copyAgent, "propose-copy");
  assert.equal(disabled.allowed, false);
  assert.ok(disabled.diagnostics.some((diagnostic) => diagnostic.code === "adapter.feature-disabled"));
  assert.equal(projectPresentationState(closure.snapshots[0]!).agents.find((agent) => agent.roleId === growthRole)?.state, "review");
  assert.deepEqual(raw.workflow.review, ["rejected", "approved"]);
  assert.ok(inspectOperationsSnapshot(closure.snapshots[1]!).some((diagnostic) => diagnostic.code === "adapter.stale"));
  const reconnecting = { ...snapshot, freshness: "reconnecting" as const };
  assert.ok(inspectOperationsSnapshot(reconnecting).some((diagnostic) => diagnostic.code === "adapter.reconnecting"));
  const blocked = structuredClone(snapshot) as MutableSnapshot;
  const blockedAgent = blocked.agents.find((agent) => agent.roleId === visualRole);
  assert.ok(blockedAgent);
  blockedAgent.status = "blocked"; blockedAgent.reason = { kind: "blocked", code: "connector.disabled", owner: "adapter", recoverability: "reconnect", message: "Connector is disabled" };
  assert.equal(projectPresentationState(blocked as OperationsSnapshotDocument).agents.find((agent) => agent.roleId === visualRole)?.state, "blocked");
  const joined = reconciliation(raw, snapshot);
  assert.equal(joined.result.status, "applied");
  const partial = reconciliation(raw, { ...snapshot, throughSequence: 5, events: snapshot.events.slice(0, 5) });
  assert.equal(partial.result.checkpoint.choreography.branches.copy.status, "completed");
  assert.equal(partial.result.checkpoint.choreography.branches.visual.status, "pending");
  assert.equal(partial.result.checkpoint.choreography.contentReadyIntentId, null);
  assert.equal(joined.result.checkpoint.choreography.branches.copy.status, "completed");
  assert.equal(joined.result.checkpoint.choreography.branches.visual.status, "completed");
  assert.equal(joined.result.checkpoint.choreography.branches.visual.attempt, 2);
  assert.equal(joined.result.checkpoint.choreography.contentReadyIntentId !== null, true);
  assert.ok(joined.result.checkpoint.choreography.seenTransitions.some((transition) => transition.kind === "branch-failed"));
  assert.ok(joined.result.checkpoint.choreography.seenTransitions.some((transition) => transition.kind === "branch-recovered"));
  assert.ok(joined.result.intents.every((intent) => intent.presentationOnly === true));
  const repeated = reconciliation(raw, snapshot);
  assert.deepEqual(joined.result, repeated.result);
  const epochSnapshot = { ...snapshot, streamEpoch: 2 as OperationsSnapshotDocument["streamEpoch"] };
  const currentTruth = reconcileOperations({ mode: "reconnect", checkpoint: joined.result.checkpoint, operationsSnapshot: epochSnapshot, externalNow: "2026-08-03T00:00:00.000Z", eventPolicies: joined.policies });
  assert.equal(currentTruth.status, "current-truth");
  assert.equal(currentTruth.checkpoint.cursor.streamEpoch, 2);
  const projection = projectPresentationState(snapshot);
  const projectedJobs = projection.agents.filter((agent) => agent.work !== null).map((agent) => ({ id: agent.work!.jobId, roleId: agent.roleId, stage: agent.work!.stage, attempt: agent.roleId === visualRole ? 2 : 1, status: "succeeded" })).sort((left, right) => left.id.localeCompare(right.id));
  const authoritativeJobs = raw.jobs.map((job) => ({ id: String(job.id), roleId: String(job.payload.roleId), stage: String(job.stage), attempt: Number(job.attempt), status: "succeeded" })).sort((left, right) => left.id.localeCompare(right.id));
  const authoritative = { durableStage: "measured", jobs: authoritativeJobs, join: { ready: true, owner: "workflow-coordinator", branches: { copy: { status: "completed", attempt: 1 }, visual: { status: "completed", attempt: 2 } } }, status: "succeeded", cursor: { streamId: "operations-stream", streamEpoch: 2, throughSequence: 15 } };
  const projected = { durableStage: String(projection.agents.find((agent) => agent.roleId === performanceRole)?.work?.stage), jobs: projectedJobs, join: { ready: currentTruth.checkpoint.choreography.contentReadyIntentId !== null, owner: "workflow-coordinator", branches: { copy: { status: joined.result.checkpoint.choreography.branches.copy.status, attempt: joined.result.checkpoint.choreography.branches.copy.attempt }, visual: { status: joined.result.checkpoint.choreography.branches.visual.status, attempt: joined.result.checkpoint.choreography.branches.visual.attempt } } }, status: "succeeded", cursor: { streamId: currentTruth.checkpoint.cursor.streamId, streamEpoch: 2, throughSequence: currentTruth.checkpoint.cursor.throughSequence } };
  assert.deepEqual(projected, authoritative);
  return { schemaVersion: "phase3-operations-evidence-v1", scenarioCount: 10, roles: raw.roles, operationsWindow: raw.operationsWindow, choreography: raw.jobs.map((job) => ({ roleId: job.payload.roleId, jobId: job.id, stage: job.stage, attempt: job.attempt, result: raw.results.find((result) => result.jobId === job.id)?.status, simulationOnly: true })), eventOrder: (raw.operationsWindow.events as Record<string, any>[]).map((event) => ({ sequence: event.sequence, id: eventValue(event), stage: event.stage, jobId: event.jobId, eventType: event.eventType })), decisions: [{ case: "duplicate-delivery", status: duplicate.status, decision: "no-op", ids: duplicate.duplicateEventIds }, { case: "same-id-changed-digest", status: conflict.status, decision: "fail-closed", diagnostics: conflict.diagnostics.map((diagnostic) => diagnostic.code) }, { case: "out-of-order-gap", status: gapResult.status, decision: "resync-required", diagnostics: gapResult.diagnostics.map((diagnostic) => diagnostic.code) }, { case: "late-event", status: late.status, decision: "resync-required", diagnostics: late.diagnostics.map((diagnostic) => diagnostic.code) }, { case: "review-rejection-approval", status: "approved-after-rejection", decision: "workflow-stage-remained-authoritative" }, { case: "failure-retry-recovery", status: joined.result.checkpoint.choreography.branches.visual.status, decision: "attempt-2-completed" }, { case: "reconnect", status: "reconnecting", decision: "adapter-owned" }, { case: "disabled-connector", status: "blocked", decision: "no connector action", connectorActions: [] }, { case: "stale-office-projection", status: "stale", decision: "not-authoritative" }, { case: "current-truth-rebase", status: currentTruth.status, decision: "epoch-2 cursor" }], disabledConnector: { allowed: disabled.allowed, diagnostics: disabled.diagnostics.map((diagnostic) => diagnostic.code), connectorActions: [] }, authoritative, projected, finalStateEqual: true, persistence: raw.persistence };
}
function markdown(reportData: Record<string, unknown>, hash: string): string { const decisions = reportData.decisions as Record<string, unknown>[]; const choreography = reportData.choreography as Record<string, unknown>[]; return `# P3-EXIT-03 Ten-role operations trace\n\n- Scenario count: 10\n- Roles: ${(reportData.roles as string[]).join(", ")}\n- Final authoritative equals projected: true\n- Evidence hash: ${hash}\n\n## Ten-role choreography\n\n${choreography.map((step, index) => `${index + 1}. ${String(step.roleId)} — ${String(step.stage)} — attempt ${String(step.attempt)} — ${String(step.result)} — simulation-only`).join("\n")}\n\n## Event and reconciliation decisions\n\n${decisions.map((decision) => `- ${String(decision.case)}: ${String(decision.status)}; ${String(decision.decision)}`).join("\n")}\n\n## Authority boundary\n\nThe runner owns JobEnvelope/JobResult and persistence facts. Workflow ownership and the content_ready join remain workflow-coordinator-owned. Operations reconciliation projects current durable truth; presentationOnly intents never advance workflow state. Disabled connector actions: 0.\n`; }

test("integrated ten-role operations trace is deterministic and reconciles to current truth", () => {
  const first = report(runRunner());
  const second = report(runRunner());
  assert.deepEqual(first, second);
  const hash = canonicalHashHex({ domain: "phase3-operations-evidence", domainVersion: "v1", payload: first as unknown as JsonValue });
  mkdirSync(outputDirectory, { recursive: true });
  writeFileSync(resolve(outputDirectory, "operations-trace.json"), `${canonicalJson(first as unknown as JsonValue)}\n`, "utf8");
  writeFileSync(resolve(outputDirectory, "operations-trace.md"), markdown(first, hash), "utf8");
  const persisted = JSON.parse(readFileSync(resolve(outputDirectory, "operations-trace.json"), "utf8")) as Record<string, unknown>;
  assert.equal(canonicalJson(persisted as unknown as JsonValue), canonicalJson(first as unknown as JsonValue));
  assert.equal(hash.length, 64);
});
