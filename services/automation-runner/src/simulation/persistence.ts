import type { DatabaseSync } from "node:sqlite";
import { isDeepStrictEqual } from "node:util";
import {
  contentBranches,
  workflowCoordinatorId,
  type ContentBranch,
  type ContentBranchCompletion,
  type WorkflowStage,
} from "@affiliate-ops/contracts";
import {
  createContentJoinState,
  getContentBranchOwnerId,
  recordContentBranchCompletion,
} from "@affiliate-ops/workflows";
import type { PilotJob, PilotJobResult, PilotSimulation } from "./pilot.ts";

const stageOwners: Partial<Record<WorkflowStage, string>> = {
  discovered: "market-scout",
  scored: "product-ranker",
  selected: "growth-strategist",
  link_ready: "link-attribution",
  qa_approved: "qa-editor",
  scheduled: "publisher",
  published: "publisher",
  measured: "performance-analyst",
};

interface ValidatedSimulation {
  firstJob: PilotJob;
  scheduledResult: PilotJobResult;
  resultsByJobId: ReadonlyMap<string, PilotJobResult>;
  completionsByBranch: ReadonlyMap<ContentBranch, ContentBranchCompletion>;
}

type StoredValue = string | number | null;

export interface PersistedSimulation {
  workflowId: string;
  jobs: number;
  agentRuns: number;
  auditEvents: number;
}

function assertExistingRow(
  database: DatabaseSync,
  table: string,
  idColumn: string,
  id: string,
  expected: Readonly<Record<string, StoredValue>>,
): void {
  const columns = Object.keys(expected);
  const row = database.prepare(`SELECT ${columns.join(", ")} FROM ${table} WHERE ${idColumn} = ?`).get(id);
  if (!row) throw new Error(`Idempotency conflict: ${table} row ${id} was not found.`);
  for (const column of columns) {
    if (row[column] !== expected[column]) {
      throw new Error(`Idempotency conflict for ${table} row ${id}: ${column} changed.`);
    }
  }
}

function isContentBranch(value: unknown): value is ContentBranch {
  return contentBranches.includes(value as ContentBranch);
}

function assertMatchingField(label: string, actual: string | number, expected: string | number): void {
  if (actual !== expected) {
    throw new Error(`Pilot ${label} mismatch: expected ${expected}, received ${actual}.`);
  }
}

function validateContentCompletion(job: PilotJob, result: PilotJobResult): ContentBranchCompletion {
  const { contentGroupId, branch } = job.payload;
  if (!contentGroupId || !isContentBranch(branch)) {
    throw new Error(`Content job ${job.id} is missing valid content metadata.`);
  }
  const completion = result.result?.contentCompletion;
  if (!completion) throw new Error(`Content result ${result.jobId} is missing completion metadata.`);

  assertMatchingField("completion jobId", completion.jobId, job.id);
  assertMatchingField("completion workspaceId", completion.workspaceId, job.workspaceId);
  assertMatchingField("completion workflowId", completion.workflowId, job.workflowId);
  assertMatchingField("completion contentGroupId", completion.contentGroupId, contentGroupId);
  assertMatchingField("completion branch", completion.branch, branch);
  assertMatchingField("completion attempt", completion.attempt, job.attempt);
  assertMatchingField("completion completedAt", completion.completedAt, result.completedAt);
  assertMatchingField("completion traceId", completion.traceId, job.traceId);
  if (!Number.isSafeInteger(completion.attempt) || completion.attempt < 1) {
    throw new Error(`Content completion ${completion.id} has an invalid attempt.`);
  }
  if (!Number.isSafeInteger(completion.artifactVersion) || completion.artifactVersion < 1) {
    throw new Error(`Content completion ${completion.id} has an invalid artifact version.`);
  }
  return completion;
}

function validateResult(job: PilotJob, result: PilotJobResult): ContentBranchCompletion | undefined {
  assertMatchingField("result workspaceId", result.workspaceId, job.workspaceId);
  assertMatchingField("result workflowId", result.workflowId, job.workflowId);
  assertMatchingField("result connectorId", result.connectorId, job.connectorId);
  assertMatchingField("result traceId", result.traceId, job.traceId);
  if (result.status !== "succeeded" || result.error) {
    throw new Error(`Pilot result ${result.jobId} is not an unambiguous success.`);
  }
  if (!result.result) throw new Error(`Pilot result ${result.jobId} has no result payload.`);
  if (result.result?.stage !== job.stage) {
    throw new Error(`Pilot result stage mismatch for ${job.id}.`);
  }

  if (job.stage === "content_queued") return validateContentCompletion(job, result);
  if (job.payload.contentGroupId !== undefined || job.payload.branch !== undefined || result.result?.contentCompletion) {
    throw new Error(`Non-content job ${job.id} carries content metadata.`);
  }
  return undefined;
}

function validateCoordinatorEvent(
  simulation: PilotSimulation,
  firstJob: PilotJob,
  completionsByBranch: ReadonlyMap<ContentBranch, ContentBranchCompletion>,
): void {
  const event = simulation.contentReadyEvent;
  assertMatchingField("coordinator workspaceId", event.workspaceId, firstJob.workspaceId);
  assertMatchingField("coordinator workflowId", event.workflowId, firstJob.workflowId);
  assertMatchingField("coordinator stage", event.stage, "content_ready");
  assertMatchingField("coordinator actorType", event.actorType, "system");
  assertMatchingField("coordinator actorId", event.actorId, workflowCoordinatorId);
  assertMatchingField("coordinator traceId", event.traceId, firstJob.traceId);

  const copy = completionsByBranch.get("copy");
  const visual = completionsByBranch.get("visual");
  if (!copy || !visual) throw new Error("Pilot content join requires copy and visual completions.");
  if (copy.id === visual.id) throw new Error(`Duplicate content completion ID ${copy.id}.`);

  let state = createContentJoinState({
    workspaceId: firstJob.workspaceId,
    workflowId: firstJob.workflowId,
    contentGroupId: copy.contentGroupId,
    traceId: firstJob.traceId,
  });
  let expectedEvent;
  for (const completion of [copy, visual]) {
    const recorded = recordContentBranchCompletion(state, completion);
    state = recorded.state;
    expectedEvent ??= recorded.event;
  }
  if (!expectedEvent || !isDeepStrictEqual(event, expectedEvent)) {
    throw new Error("Pilot coordinator event does not match the validated content completions.");
  }
}

function validateSimulation(simulation: PilotSimulation): ValidatedSimulation {
  const firstJob = simulation.jobs[0];
  if (!firstJob) throw new Error("Pilot simulation did not create a workflow.");

  const jobsById = new Map<string, PilotJob>();
  for (const job of simulation.jobs) {
    if (jobsById.has(job.id)) throw new Error(`Duplicate pilot job ${job.id}.`);
    if (job.stage === "content_ready") throw new Error("content_ready is a system coordinator event, not a pilot job.");
    assertMatchingField("job workspaceId", job.workspaceId, firstJob.workspaceId);
    assertMatchingField("job workflowId", job.workflowId, firstJob.workflowId);
    jobsById.set(job.id, job);
  }

  const resultsByJobId = new Map<string, PilotJobResult>();
  for (const result of simulation.results) {
    if (resultsByJobId.has(result.jobId)) throw new Error(`Duplicate pilot result for ${result.jobId}.`);
    if (!jobsById.has(result.jobId)) throw new Error(`Orphan pilot result for ${result.jobId}.`);
    resultsByJobId.set(result.jobId, result);
  }

  const completionsByBranch = new Map<ContentBranch, ContentBranchCompletion>();
  for (const job of simulation.jobs) {
    const result = resultsByJobId.get(job.id);
    if (!result) throw new Error(`Missing pilot result for ${job.id}.`);
    const completion = validateResult(job, result);
    if (!completion) continue;
    if (completionsByBranch.has(completion.branch)) {
      throw new Error(`Duplicate pilot content branch ${completion.branch}.`);
    }
    completionsByBranch.set(completion.branch, completion);
  }
  validateCoordinatorEvent(simulation, firstJob, completionsByBranch);

  const scheduledJobs = simulation.jobs.filter((job) => job.stage === "scheduled");
  if (scheduledJobs.length !== 1) throw new Error("Pilot simulation requires exactly one scheduled job.");
  const scheduledJob = scheduledJobs[0];
  if (!scheduledJob) throw new Error("Pilot simulation did not create a scheduled job.");
  const scheduledResult = resultsByJobId.get(scheduledJob.id);
  if (!scheduledResult) throw new Error(`Missing pilot result for ${scheduledJob.id}.`);
  return { firstJob, scheduledResult, resultsByJobId, completionsByBranch };
}

function agentForJob(job: PilotJob): string {
  if (job.stage === "content_queued") {
    if (isContentBranch(job.payload.branch)) return getContentBranchOwnerId(job.payload.branch);
    throw new Error(`Content job ${job.id} has no recognized branch owner.`);
  }
  const agentId = stageOwners[job.stage];
  if (!agentId) throw new Error(`Pilot job ${job.id} uses a system-only or unsupported stage.`);
  return agentId;
}

function agentAuditPayload(job: PilotJob, result: PilotJobResult): string {
  const completion = result.result?.contentCompletion;
  return JSON.stringify({
    jobId: job.id,
    stage: job.stage,
    status: result.status,
    connectorId: job.connectorId,
    ...(completion ? {
      completionId: completion.id,
      contentGroupId: completion.contentGroupId,
      branch: completion.branch,
      attempt: completion.attempt,
      artifactVersion: completion.artifactVersion,
    } : {}),
  });
}

export function persistPilotSimulation(
  database: DatabaseSync,
  simulation: PilotSimulation,
  persistedAt = new Date().toISOString(),
): PersistedSimulation {
  const { firstJob, scheduledResult, resultsByJobId } = validateSimulation(simulation);

  database.exec("BEGIN IMMEDIATE;");
  try {
    database.prepare(`INSERT OR IGNORE INTO workspaces (id, slug, display_name, status, created_at, updated_at) VALUES (?, ?, ?, 'active', ?, ?)`)
      .run(firstJob.workspaceId, firstJob.workspaceId, "Pilot Workspace", persistedAt, persistedAt);
    const workflowValues = {
      workspace_id: firstJob.workspaceId,
      stage: "scheduled",
      status: "succeeded",
      strategy_version: "simulation-v1",
      started_at: firstJob.createdAt,
      updated_at: scheduledResult.completedAt,
      completed_at: scheduledResult.completedAt,
    } as const;
    const workflowInsert = database.prepare(`INSERT OR IGNORE INTO workflow_runs (id, workspace_id, stage, status, strategy_version, started_at, updated_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(firstJob.workflowId, ...Object.values(workflowValues));
    if (Number(workflowInsert.changes) === 0) {
      assertExistingRow(database, "workflow_runs", "id", firstJob.workflowId, workflowValues);
    }

    const insertJob = database.prepare(`INSERT OR IGNORE INTO jobs (id, workspace_id, workflow_id, stage, connector_id, payload_version, payload_json, idempotency_key, status, attempt, available_at, trace_id, created_at, updated_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const insertRun = database.prepare(`INSERT OR IGNORE INTO agent_runs (id, workspace_id, workflow_id, agent_id, status, attempt, input_json, output_json, started_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const insertAudit = database.prepare(`INSERT OR IGNORE INTO audit_events (id, workspace_id, event_type, actor_type, actor_id, entity_type, entity_id, payload_json, occurred_at, trace_id) VALUES (?, ?, ?, ?, ?, 'workflow', ?, ?, ?, ?)`);
    const insertOutbox = database.prepare(`INSERT OR IGNORE INTO job_outbox (id, workspace_id, job_id, event_type, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?)`);

    for (const job of simulation.jobs) {
      const result = resultsByJobId.get(job.id);
      if (!result) throw new Error(`Missing pilot result for ${job.id}.`);
      const agentId = agentForJob(job);
      const payload = agentAuditPayload(job, result);
      const jobPayload = JSON.stringify(job.payload);
      const jobValues = {
        workspace_id: job.workspaceId,
        workflow_id: job.workflowId,
        stage: job.stage,
        connector_id: job.connectorId,
        payload_version: job.version,
        payload_json: jobPayload,
        idempotency_key: job.idempotencyKey,
        status: result.status,
        attempt: job.attempt,
        available_at: job.availableAt,
        trace_id: job.traceId,
        created_at: job.createdAt,
        updated_at: result.completedAt,
        completed_at: result.completedAt,
      } as const;
      const jobInsert = insertJob.run(job.id, ...Object.values(jobValues));
      if (Number(jobInsert.changes) === 0) assertExistingRow(database, "jobs", "id", job.id, jobValues);

      const runId = `agent-run-${job.id}`;
      const runValues = {
        workspace_id: job.workspaceId,
        workflow_id: job.workflowId,
        agent_id: agentId,
        status: result.status,
        attempt: job.attempt,
        input_json: jobPayload,
        output_json: JSON.stringify(result.result),
        started_at: job.createdAt,
        completed_at: result.completedAt,
      } as const;
      const runInsert = insertRun.run(runId, ...Object.values(runValues));
      if (Number(runInsert.changes) === 0) assertExistingRow(database, "agent_runs", "id", runId, runValues);

      const auditId = `audit-${job.id}`;
      const auditValues = {
        workspace_id: job.workspaceId,
        event_type: "agent.completed",
        actor_type: "agent",
        actor_id: agentId,
        entity_type: "workflow",
        entity_id: job.workflowId,
        payload_json: payload,
        occurred_at: result.completedAt,
        trace_id: job.traceId,
      } as const;
      const auditInsert = insertAudit.run(auditId, job.workspaceId, "agent.completed", "agent", agentId, job.workflowId, payload, result.completedAt, job.traceId);
      if (Number(auditInsert.changes) === 0) assertExistingRow(database, "audit_events", "id", auditId, auditValues);

      const outboxId = `outbox-${job.id}`;
      const outboxValues = {
        workspace_id: job.workspaceId,
        job_id: job.id,
        event_type: "workflow.agent.updated",
        payload_json: payload,
        created_at: result.completedAt,
      } as const;
      const outboxInsert = insertOutbox.run(outboxId, ...Object.values(outboxValues));
      if (Number(outboxInsert.changes) === 0) assertExistingRow(database, "job_outbox", "id", outboxId, outboxValues);
    }

    const event = simulation.contentReadyEvent;
    const coordinatorAuditId = `audit-${event.id}`;
    const coordinatorAuditValues = {
      workspace_id: event.workspaceId,
      event_type: "workflow.content_ready",
      actor_type: event.actorType,
      actor_id: event.actorId,
      entity_type: "workflow",
      entity_id: event.workflowId,
      payload_json: JSON.stringify(event.payload),
      occurred_at: event.occurredAt,
      trace_id: event.traceId,
    } as const;
    const coordinatorAuditInsert = insertAudit.run(
      coordinatorAuditId,
      event.workspaceId,
      "workflow.content_ready",
      event.actorType,
      event.actorId,
      event.workflowId,
      coordinatorAuditValues.payload_json,
      event.occurredAt,
      event.traceId,
    );
    if (Number(coordinatorAuditInsert.changes) === 0) {
      assertExistingRow(database, "audit_events", "id", coordinatorAuditId, coordinatorAuditValues);
    }
    database.exec("COMMIT;");
  } catch (error) {
    database.exec("ROLLBACK;");
    throw error;
  }
  return {
    workflowId: firstJob.workflowId,
    jobs: simulation.jobs.length,
    agentRuns: simulation.jobs.length,
    auditEvents: simulation.jobs.length + 1,
  };
}
