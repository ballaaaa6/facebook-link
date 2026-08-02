import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { agentCatalog } from "@affiliate-ops/agent-catalog";
import { createIdempotencyKey, type ContentBranchCompletion, type JobEnvelope, type JobResult, type WorkflowEvent, type WorkflowStage } from "@affiliate-ops/contracts";
import { openLocalDatabase } from "@affiliate-ops/database";
import { assertContentBranchOwner, assertTransition, assertWorkflowEventOwnership, createContentJoinState, recordContentBranchCompletion } from "@affiliate-ops/workflows";
import { persistPilotSimulation } from "./persistence.ts";
import { simulatePilotRun, type PilotJob, type PilotJobResult } from "./pilot.ts";

const fixedNow = "2026-08-03T00:00:00.000Z";
const workspaceId = "phase3-operations-workspace";
const workflowId = "phase3-autopost-workflow";
const traceId = "phase3-autopost-trace";
const contentGroupId = "phase3-content-group";
const sourceRevision = "phase3-operations-revision-1";
const migrationsPath = resolve(import.meta.dirname, "../../../../packages/database/migrations");
const choreographyPath = resolve(import.meta.dirname, "../../../../packages/office-v2-operations/test/fixtures/p3-w3-3-choreography.json");
const roleIds = ["market-scout", "product-ranker", "growth-strategist", "performance-analyst", "gemini-copywriter", "flow-visual-producer", "link-attribution", "qa-editor", "publisher", "session-keeper"] as const;
type RoleId = (typeof roleIds)[number];
type RunnerJob = JobEnvelope<Record<string, unknown>>;
type RunnerResult = JobResult<Record<string, unknown>>;

export interface Phase3OperationsEvidence {
  readonly schemaVersion: "phase3-operations-runner-trace-v1";
  readonly scenarioCount: 10;
  readonly roles: readonly string[];
  readonly workflow: Readonly<Record<string, unknown>>;
  readonly jobs: readonly Readonly<Record<string, unknown>>[];
  readonly results: readonly Readonly<Record<string, unknown>>[];
  readonly operationsWindow: Readonly<Record<string, unknown>>;
  readonly persistence: Readonly<Record<string, unknown>>;
}

function loadJson<T>(path: string): T { return JSON.parse(readFileSync(path, "utf8")) as T; }
function digest(value: string): string { return value.padEnd(64, "0").slice(0, 64); }
function roleJob(roleId: RoleId, stage: WorkflowStage, attempt = 1, branch?: "copy" | "visual"): RunnerJob {
  const jobId = `${workflowId}-job-${roleId}-${branch ?? stage}-attempt-${attempt}`;
  const payload = { simulationOnly: true, roleId, ...(branch ? { contentGroupId, branch } : {}) };
  return { id: jobId, workspaceId, version: 1, workflowId, stage, connectorId: `simulation.${roleId}`, payload, idempotencyKey: createIdempotencyKey([workspaceId, workflowId, stage, branch ?? roleId]), attempt, createdAt: fixedNow, availableAt: fixedNow, traceId };
}

function completionFor(job: RunnerJob): ContentBranchCompletion {
  const branch = job.payload.branch as "copy" | "visual";
  return { id: `${job.id}-completion`, jobId: job.id, workspaceId, workflowId, contentGroupId, branch, attempt: job.attempt, artifactVersion: job.attempt, completedAt: fixedNow, traceId };
}

function resultFor(job: RunnerJob, status: "succeeded" | "failed" = "succeeded"): RunnerResult {
  const result: Record<string, unknown> = { simulationOnly: true, roleId: job.payload.roleId, stage: job.stage };
  if (job.payload.branch) result.contentCompletion = completionFor(job);
  return { jobId: job.id, workspaceId, version: 1, workflowId, connectorId: job.connectorId, status, ...(status === "failed" ? { error: { category: "transient", code: "browser.session-failed", message: "Deterministic Flow session failure", retryable: true } } : { result }), completedAt: fixedNow, traceId };
}

function workflowEvidence(): Readonly<Record<string, unknown>> {
  const selection: WorkflowEvent = { id: "event-selection", workspaceId, workflowId, stage: "selected", actorType: "agent", actorId: "growth-strategist", traceId, occurredAt: fixedNow, payload: { selectedProductId: "product-phase3", rankingEvidenceId: "evidence-phase3", strategyVersionId: "strategy-phase3" } };
  assertWorkflowEventOwnership(selection);
  assertContentBranchOwner("copy", "gemini-copywriter");
  assertContentBranchOwner("visual", "flow-visual-producer");
  const transitions: readonly [WorkflowStage, WorkflowStage][] = [["discovered", "scored"], ["scored", "selected"], ["selected", "link_ready"], ["link_ready", "content_queued"], ["content_ready", "qa_approved"], ["qa_approved", "scheduled"], ["scheduled", "published"], ["published", "measured"]];
  transitions.forEach(([from, to]) => assertTransition(from, to));
  let directJoinRejected = false;
  try { assertTransition("content_queued", "content_ready"); } catch (error) { directJoinRejected = String(error).includes("requires the content join reducer") || (typeof error === "object" && error !== null && "code" in error && error.code === "workflow.content-ready-requires-join"); }
  if (!directJoinRejected) throw new Error("Office trace allowed a direct content_ready transition.");
  return { kind: "workflow-ownership", selectionOwner: selection.actorId, contentJoinOwner: "workflow-coordinator", directJoinRejected, validTransitionCount: transitions.length };
}

function buildJobs(): { readonly jobs: readonly RunnerJob[]; readonly results: readonly RunnerResult[]; readonly finalJobs: readonly RunnerJob[] } {
  const jobs = [roleJob("market-scout", "discovered"), roleJob("product-ranker", "scored"), roleJob("growth-strategist", "selected"), roleJob("link-attribution", "link_ready"), roleJob("gemini-copywriter", "content_queued", 1, "copy"), roleJob("flow-visual-producer", "content_queued", 1, "visual"), roleJob("flow-visual-producer", "content_queued", 2, "visual"), roleJob("qa-editor", "qa_approved"), roleJob("publisher", "scheduled"), roleJob("session-keeper", "content_queued"), roleJob("performance-analyst", "measured")];
  const results = jobs.map((job) => resultFor(job, job.attempt === 1 && job.payload.roleId === "flow-visual-producer" ? "failed" : "succeeded"));
  return { jobs, results, finalJobs: jobs.filter((job) => !(job.payload.roleId === "flow-visual-producer" && job.attempt === 1)) };
}

function reduceJoin(copyJob: RunnerJob, visualJob: RunnerJob): string {
  let state = createContentJoinState({ workspaceId, workflowId, contentGroupId, traceId });
  const waiting = recordContentBranchCompletion(state, completionFor(copyJob));
  if (waiting.event) throw new Error("Content join emitted before the visual branch completed.");
  state = waiting.state;
  const ready = recordContentBranchCompletion(state, completionFor(visualJob));
  if (!ready.event || ready.event.actorId !== "workflow-coordinator") throw new Error("System-owned content join did not emit.");
  assertWorkflowEventOwnership(ready.event as unknown as WorkflowEvent);
  return ready.event.id;
}

function runPersistence(): Readonly<Record<string, unknown>> {
  const { database } = openLocalDatabase(":memory:", migrationsPath);
  try {
    const simulation = simulatePilotRun(new Date("2026-08-03T00:00:00.000Z"));
    const first = persistPilotSimulation(database, simulation, fixedNow);
    const second = persistPilotSimulation(database, simulation, fixedNow);
    const counts = Object.fromEntries(["jobs", "agent_runs", "audit_events", "job_outbox"].map((table) => [table, Number(database.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get()?.count)]));
    return { first, second, counts, systemJoinAuditCount: Number(database.prepare("SELECT COUNT(*) AS count FROM audit_events WHERE event_type = 'workflow.content_ready' AND actor_id = 'workflow-coordinator'").get()?.count) };
  } finally { database.close(); }
}

function operationEvent(id: string, sequence: number, stage: WorkflowStage, jobId: string, eventType: string): Readonly<Record<string, unknown>> {
  return { durableEventId: { kind: "event", value: id }, sequence, payloadDigest: digest(`phase3-${id}`), occurredAt: fixedNow, workflowRunId: { kind: "workflow-run", value: workflowId }, taskId: { kind: "task", value: "autopost-task" }, jobId, stage, eventType };
}

function operationsWindow(jobs: readonly RunnerJob[]): Readonly<Record<string, unknown>> {
  const job = (roleId: RoleId, stage: WorkflowStage, branch?: "copy" | "visual", attempt = 1) => jobs.find((candidate) => candidate.payload.roleId === roleId && candidate.stage === stage && candidate.payload.branch === branch && candidate.attempt === attempt);
  const events = [operationEvent("event-discovered", 1, "discovered", job("market-scout", "discovered")!.id, "stage-transition"), operationEvent("event-scored", 2, "scored", job("product-ranker", "scored")!.id, "stage-transition"), operationEvent("event-selected", 3, "selected", job("growth-strategist", "selected")!.id, "stage-transition"), operationEvent("event-link-ready", 4, "link_ready", job("link-attribution", "link_ready")!.id, "job-completed"), operationEvent("event-copy-completed", 5, "content_queued", job("gemini-copywriter", "content_queued", "copy")!.id, "branch-completed"), operationEvent("event-visual-failed", 6, "content_queued", job("flow-visual-producer", "content_queued", "visual", 1)!.id, "task-update"), operationEvent("event-visual-recovered", 7, "content_queued", job("flow-visual-producer", "content_queued", "visual", 1)!.id, "session-updated"), operationEvent("event-visual-retry-started", 8, "content_queued", job("flow-visual-producer", "content_queued", "visual", 2)!.id, "task-update"), operationEvent("event-visual-completed", 9, "content_queued", job("flow-visual-producer", "content_queued", "visual", 2)!.id, "branch-completed"), operationEvent("event-content-ready", 10, "content_ready", "workflow-coordinator", "join-emitted"), operationEvent("event-qa-review-rejected", 11, "content_ready", job("qa-editor", "qa_approved")!.id, "task-update"), operationEvent("event-qa-approved", 12, "qa_approved", job("qa-editor", "qa_approved")!.id, "job-completed"), operationEvent("event-scheduled", 13, "scheduled", job("publisher", "scheduled")!.id, "job-completed"), operationEvent("event-published", 14, "published", job("publisher", "scheduled")!.id, "job-completed"), operationEvent("event-measured", 15, "measured", job("performance-analyst", "measured")!.id, "job-completed")];
  return { schemaVersion: "office-operations-v2", snapshotId: { kind: "snapshot", value: "phase3-final-snapshot" }, observedAt: fixedNow, sourceRevision, streamId: "operations-stream", streamEpoch: 1, windowStartSequence: 1, throughSequence: events.length, eventDigest: digest("phase3-event-window"), freshness: "live", events };
}

export function runPhase3OperationsTrace(): Phase3OperationsEvidence {
  const catalogRoles = agentCatalog.map((agent) => agent.id);
  if (JSON.stringify(catalogRoles) !== JSON.stringify(roleIds)) throw new Error("Repository role catalog changed; trace requires explicit role review.");
  const jobs = buildJobs();
  const copy = jobs.jobs.find((job) => job.payload.branch === "copy");
  const visual = jobs.finalJobs.find((job) => job.payload.branch === "visual");
  if (!copy || !visual) throw new Error("Content branch fan-out is incomplete.");
  const joinEventId = reduceJoin(copy, visual);
  const fixtureTransitions = loadJson<{ transitions: Record<string, Record<string, unknown>> }>(choreographyPath).transitions;
  const retryTrace = ["failure", "recovery", "copyRetry", "visual"].map((name) => ({ name, source: fixtureTransitions[name] }));
  return { schemaVersion: "phase3-operations-runner-trace-v1", scenarioCount: 10, roles: [...roleIds], workflow: { ...workflowEvidence(), joinEventId, review: ["rejected", "approved"], blocked: "visual connector disabled before reconnect", terminalStage: "measured", retryTrace }, jobs: jobs.finalJobs.map((job) => ({ ...job, payload: job.payload })), results: jobs.results.map((result) => ({ ...result, result: result.result, error: result.error })), operationsWindow: operationsWindow(jobs.jobs), persistence: runPersistence() };
}

export function writePhase3OperationsEvidence(outputDirectory = resolve(import.meta.dirname, "../../../../artifacts/office-v2/phase3/operations")): Phase3OperationsEvidence {
  const report = runPhase3OperationsTrace();
  mkdirSync(outputDirectory, { recursive: true });
  writeFileSync(resolve(outputDirectory, "operations-runner-trace.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return report;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) writePhase3OperationsEvidence();
