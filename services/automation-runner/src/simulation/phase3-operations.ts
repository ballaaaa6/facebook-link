import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { agentCatalog } from "@affiliate-ops/agent-catalog";
import { createIdempotencyKey, type ContentBranchCompletion, type ContentReadyEvent, type JobEnvelope, type JobResult, type WorkflowEvent, type WorkflowStage } from "@affiliate-ops/contracts";
import { openLocalDatabase } from "@affiliate-ops/database";
import { assertContentBranchOwner, assertTransition, assertWorkflowEventOwnership, createContentJoinState, getContentBranchOwnerId, recordContentBranchCompletion, winnerSelectionOwnerId } from "@affiliate-ops/workflows";
import { persistPilotSimulation } from "./persistence.ts";
import type { PilotJob, PilotJobResult, PilotSimulation } from "./pilot.ts";

const fixedNow = "2026-08-03T00:00:00.000Z";
const workspaceId = "phase3-operations-workspace";
const workflowId = "phase3-autopost-workflow";
const traceId = "phase3-autopost-trace";
const contentGroupId = "phase3-content-group";
const sourceRevision = "phase3-operations-revision-1";
const migrationsPath = resolve(import.meta.dirname, "../../../../packages/database/migrations");
const agentsConfigPath = resolve(import.meta.dirname, "../../../../config/agents.json");
const roleIds = readAuthoritativeRoleIds();
type RoleId = string;
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
function readAuthoritativeRoleIds(): readonly string[] {
  const config = loadJson<{ agents?: readonly { id: string }[] }>(agentsConfigPath);
  const configured = config.agents?.map((agent) => agent.id) ?? [];
  const catalog = agentCatalog.map((agent) => agent.id);
  if (configured.length !== 10 || new Set(configured).size !== configured.length || JSON.stringify(configured) !== JSON.stringify(catalog)) {
    throw new Error("config/agents.json and the agent catalog must define the same ten unique roles.");
  }
  return [...catalog];
}
function roleForOutput(output: string): RoleId {
  const agent = agentCatalog.find((candidate) => candidate.produces.includes(output));
  if (!agent || !roleIds.includes(agent.id)) throw new Error(`No authoritative catalog role produces ${output}.`);
  return agent.id;
}
function digest(value: string): string { return createHash("sha256").update(value, "utf8").digest("hex"); }
function roleJob(roleId: RoleId, stage: WorkflowStage, attempt = 1, branch?: "copy" | "visual"): RunnerJob {
  if (!roleIds.includes(roleId)) throw new Error(`Unknown authoritative role ${roleId}.`);
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
  const selection: WorkflowEvent = { id: "event-selection", workspaceId, workflowId, stage: "selected", actorType: "agent", actorId: winnerSelectionOwnerId, traceId, occurredAt: fixedNow, payload: { selectedProductId: "product-phase3", rankingEvidenceId: "evidence-phase3", strategyVersionId: "strategy-phase3" } };
  assertWorkflowEventOwnership(selection);
  assertContentBranchOwner("copy", getContentBranchOwnerId("copy"));
  assertContentBranchOwner("visual", getContentBranchOwnerId("visual"));
  const transitions: readonly [WorkflowStage, WorkflowStage][] = [["discovered", "scored"], ["scored", "selected"], ["selected", "link_ready"], ["link_ready", "content_queued"], ["content_ready", "qa_approved"], ["qa_approved", "scheduled"], ["scheduled", "published"], ["published", "measured"]];
  transitions.forEach(([from, to]) => assertTransition(from, to));
  let directJoinRejected = false;
  try { assertTransition("content_queued", "content_ready"); } catch (error) { directJoinRejected = String(error).includes("requires the content join reducer") || (typeof error === "object" && error !== null && "code" in error && error.code === "workflow.content-ready-requires-join"); }
  if (!directJoinRejected) throw new Error("Office trace allowed a direct content_ready transition.");
  return { kind: "workflow-ownership", selectionOwner: selection.actorId, contentJoinOwner: "workflow-coordinator", directJoinRejected, validTransitionCount: transitions.length };
}

function buildJobs(): { readonly jobs: readonly RunnerJob[]; readonly results: readonly RunnerResult[]; readonly finalJobs: readonly RunnerJob[] } {
  const discoveredRole = roleForOutput("product-candidates");
  const scoredRole = roleForOutput("ranked-product-evidence");
  const selectedRole = roleForOutput("winner-decision");
  const linkRole = roleForOutput("affiliate-link");
  const copyRole = getContentBranchOwnerId("copy");
  const visualRole = getContentBranchOwnerId("visual");
  const qaRole = roleForOutput("approved-content");
  const publisherRole = roleForOutput("publication");
  const sessionRole = roleForOutput("session-state");
  const performanceRole = roleForOutput("performance-report");
  const jobs = [roleJob(discoveredRole, "discovered"), roleJob(scoredRole, "scored"), roleJob(selectedRole, "selected"), roleJob(linkRole, "link_ready"), roleJob(copyRole, "content_queued", 1, "copy"), roleJob(visualRole, "content_queued", 1, "visual"), roleJob(visualRole, "content_queued", 2, "visual"), roleJob(qaRole, "qa_approved"), roleJob(publisherRole, "scheduled"), roleJob(sessionRole, "content_queued"), roleJob(performanceRole, "measured")];
  const results = jobs.map((job) => resultFor(job, job.attempt === 1 && job.payload.roleId === visualRole ? "failed" : "succeeded"));
  return { jobs, results, finalJobs: jobs.filter((job) => !(job.payload.roleId === visualRole && job.attempt === 1)) };
}

function joinEventFor(copyJob: RunnerJob, visualJob: RunnerJob): ContentReadyEvent {
  let state = createContentJoinState({ workspaceId, workflowId, contentGroupId, traceId });
  const waiting = recordContentBranchCompletion(state, completionFor(copyJob));
  if (waiting.event) throw new Error("Content join emitted before the visual branch completed.");
  state = waiting.state;
  const ready = recordContentBranchCompletion(state, completionFor(visualJob));
  if (!ready.event || ready.event.actorId !== "workflow-coordinator") throw new Error("System-owned content join did not emit.");
  assertWorkflowEventOwnership(ready.event as unknown as WorkflowEvent);
  return ready.event as ContentReadyEvent;
}

function reduceJoin(copyJob: RunnerJob, visualJob: RunnerJob): string { return joinEventFor(copyJob, visualJob).id; }

function persistenceInput(bundle: ReturnType<typeof buildJobs>): { readonly simulation: PilotSimulation; readonly sourceJobIds: readonly string[]; readonly persistedRoleIds: readonly string[]; readonly omittedRoleIds: readonly string[] } {
  const sessionRole = roleForOutput("session-state");
  const persistableJobs = bundle.finalJobs.filter((job) => job.payload.roleId !== sessionRole);
  const resultsByJobId = new Map(bundle.results.filter((result) => result.status === "succeeded").map((result) => [result.jobId, result]));
  const persistedResults = persistableJobs.map((job) => {
    const result = resultsByJobId.get(job.id);
    if (!result) throw new Error(`Missing successful result for persisted job ${job.id}.`);
    return result as unknown as PilotJobResult;
  });
  const copyJob = persistableJobs.find((job) => job.payload.branch === "copy");
  const visualJob = persistableJobs.find((job) => job.payload.branch === "visual");
  if (!copyJob || !visualJob) throw new Error("Persistence input is missing the final copy or visual branch.");
  return {
    simulation: { jobs: persistableJobs as unknown as readonly PilotJob[], results: persistedResults, contentReadyEvent: joinEventFor(copyJob, visualJob), sheetRows: [] },
    sourceJobIds: bundle.finalJobs.map((job) => job.id),
    persistedRoleIds: persistableJobs.map((job) => String(job.payload.roleId)),
    omittedRoleIds: bundle.finalJobs.filter((job) => job.payload.roleId === sessionRole).map((job) => String(job.payload.roleId)),
  };
}

function runPersistence(bundle: ReturnType<typeof buildJobs>): Readonly<Record<string, unknown>> {
  const { database } = openLocalDatabase(":memory:", migrationsPath);
  try {
    const input = persistenceInput(bundle);
    const first = persistPilotSimulation(database, input.simulation, fixedNow);
    const second = persistPilotSimulation(database, input.simulation, fixedNow);
    const counts = Object.fromEntries(["jobs", "agent_runs", "audit_events", "job_outbox"].map((table) => [table, Number(database.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get()?.count)]));
    return { first, second, counts, sourceWorkflowId: bundle.finalJobs[0]?.workflowId, sourceJobIds: input.sourceJobIds, persistedWorkflowId: first.workflowId, persistedJobIds: input.simulation.jobs.map((job) => job.id), persistedRoleIds: input.persistedRoleIds, omittedRoleIds: input.omittedRoleIds, systemJoinAuditCount: Number(database.prepare("SELECT COUNT(*) AS count FROM audit_events WHERE event_type = 'workflow.content_ready' AND actor_id = 'workflow-coordinator'").get()?.count) };
  } finally { database.close(); }
}

function operationEvent(id: string, sequence: number, stage: WorkflowStage, jobId: string, eventType: string): Readonly<Record<string, unknown>> {
  return { durableEventId: { kind: "event", value: id }, sequence, payloadDigest: digest(`phase3-${id}`), occurredAt: fixedNow, workflowRunId: { kind: "workflow-run", value: workflowId }, taskId: { kind: "task", value: "autopost-task" }, jobId, stage, eventType };
}

function operationsWindow(jobs: readonly RunnerJob[]): Readonly<Record<string, unknown>> {
  const discoveredRole = roleForOutput("product-candidates");
  const scoredRole = roleForOutput("ranked-product-evidence");
  const selectedRole = roleForOutput("winner-decision");
  const linkRole = roleForOutput("affiliate-link");
  const copyRole = getContentBranchOwnerId("copy");
  const visualRole = getContentBranchOwnerId("visual");
  const qaRole = roleForOutput("approved-content");
  const publisherRole = roleForOutput("publication");
  const performanceRole = roleForOutput("performance-report");
  const job = (roleId: RoleId, stage: WorkflowStage, branch?: "copy" | "visual", attempt = 1) => jobs.find((candidate) => candidate.payload.roleId === roleId && candidate.stage === stage && candidate.payload.branch === branch && candidate.attempt === attempt);
  const events = [operationEvent("event-discovered", 1, "discovered", job(discoveredRole, "discovered")!.id, "stage-transition"), operationEvent("event-scored", 2, "scored", job(scoredRole, "scored")!.id, "stage-transition"), operationEvent("event-selected", 3, "selected", job(selectedRole, "selected")!.id, "stage-transition"), operationEvent("event-link-ready", 4, "link_ready", job(linkRole, "link_ready")!.id, "job-completed"), operationEvent("event-copy-completed", 5, "content_queued", job(copyRole, "content_queued", "copy")!.id, "branch-completed"), operationEvent("event-visual-failed", 6, "content_queued", job(visualRole, "content_queued", "visual", 1)!.id, "task-update"), operationEvent("event-visual-recovered", 7, "content_queued", job(visualRole, "content_queued", "visual", 1)!.id, "session-updated"), operationEvent("event-visual-retry-started", 8, "content_queued", job(visualRole, "content_queued", "visual", 2)!.id, "task-update"), operationEvent("event-visual-completed", 9, "content_queued", job(visualRole, "content_queued", "visual", 2)!.id, "branch-completed"), operationEvent("event-content-ready", 10, "content_ready", "workflow-coordinator", "join-emitted"), operationEvent("event-qa-review-rejected", 11, "content_ready", job(qaRole, "qa_approved")!.id, "task-update"), operationEvent("event-qa-approved", 12, "qa_approved", job(qaRole, "qa_approved")!.id, "job-completed"), operationEvent("event-scheduled", 13, "scheduled", job(publisherRole, "scheduled")!.id, "job-completed"), operationEvent("event-published", 14, "published", job(publisherRole, "scheduled")!.id, "job-completed"), operationEvent("event-measured", 15, "measured", job(performanceRole, "measured")!.id, "job-completed")];
  return { schemaVersion: "office-operations-v2", snapshotId: { kind: "snapshot", value: "phase3-final-snapshot" }, observedAt: fixedNow, sourceRevision, streamId: "operations-stream", streamEpoch: 1, windowStartSequence: 1, throughSequence: events.length, eventDigest: digest("phase3-event-window"), freshness: "live", events };
}

function retryTrace(window: Readonly<Record<string, unknown>>): readonly Readonly<Record<string, unknown>>[] {
  const events = window.events as readonly Readonly<Record<string, unknown>>[];
  return [6, 7, 8, 9].map((sequence) => {
    const event = events[sequence - 1];
    if (!event) throw new Error(`Missing retry event at sequence ${sequence}.`);
    const durableEventId = event.durableEventId as { value?: string };
    return { name: sequence === 6 ? "failure" : sequence === 7 ? "recovery" : sequence === 8 ? "retry-started" : "retry-completed", sequence, durableEventId: durableEventId.value ?? null, payloadDigest: event.payloadDigest, jobId: event.jobId, stage: event.stage, eventType: event.eventType };
  });
}

export function runPhase3OperationsTrace(): Phase3OperationsEvidence {
  const jobs = buildJobs();
  const copy = jobs.jobs.find((job) => job.payload.branch === "copy");
  const visual = jobs.finalJobs.find((job) => job.payload.branch === "visual");
  if (!copy || !visual) throw new Error("Content branch fan-out is incomplete.");
  const joinEventId = reduceJoin(copy, visual);
  const window = operationsWindow(jobs.jobs);
  return { schemaVersion: "phase3-operations-runner-trace-v1", scenarioCount: 10, roles: [...roleIds], workflow: { ...workflowEvidence(), joinEventId, review: ["rejected", "approved"], blocked: "visual connector disabled before reconnect", terminalStage: "measured", retryTrace: retryTrace(window) }, jobs: jobs.finalJobs.map((job) => ({ ...job, payload: job.payload })), results: jobs.results.map((result) => ({ ...result, result: result.result, error: result.error })), operationsWindow: window, persistence: runPersistence(jobs) };
}

export function writePhase3OperationsEvidence(outputDirectory = resolve(import.meta.dirname, "../../../../artifacts/office-v2/phase3/operations")): Phase3OperationsEvidence {
  const report = runPhase3OperationsTrace();
  mkdirSync(outputDirectory, { recursive: true });
  writeFileSync(resolve(outputDirectory, "operations-runner-trace.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return report;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) writePhase3OperationsEvidence();
