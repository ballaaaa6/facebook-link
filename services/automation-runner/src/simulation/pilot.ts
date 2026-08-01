import type {
  ContentBranchCompletion,
  ContentBranchJobPayload,
  ContentReadyEvent,
  JobEnvelope,
  JobResult,
  SheetRow,
  WorkflowStage,
} from "@affiliate-ops/contracts";
import { createIdempotencyKey } from "@affiliate-ops/contracts";
import { createContentJoinState, recordContentBranchCompletion } from "@affiliate-ops/workflows";

interface PilotJobPayload extends Record<string, unknown>, Partial<ContentBranchJobPayload> {
  simulationOnly: true;
}

interface PilotResultPayload extends Record<string, unknown> {
  simulationOnly: true;
  stage: WorkflowStage;
  contentCompletion?: ContentBranchCompletion;
}

export type PilotJob = JobEnvelope<PilotJobPayload>;
export type PilotJobResult = JobResult<PilotResultPayload>;

export interface PilotSimulation {
  jobs: readonly PilotJob[];
  results: readonly PilotJobResult[];
  contentReadyEvent: ContentReadyEvent;
  sheetRows: readonly SheetRow[];
}

interface PilotJobSpecification {
  key: string;
  stage: WorkflowStage;
  connectorId: string;
  offsetMinutes: number;
  completionDelaySeconds?: number;
  content?: ContentBranchJobPayload;
}

function atOffset(now: Date, offsetMinutes: number): string {
  return new Date(now.getTime() + offsetMinutes * 60_000).toISOString();
}

function createPilotJob(
  specification: PilotJobSpecification,
  context: { workspaceId: string; workflowId: string; traceId: string; now: Date },
): PilotJob {
  const { workspaceId, workflowId, traceId, now } = context;
  const payload: PilotJobPayload = specification.content
    ? { simulationOnly: true, ...specification.content }
    : { simulationOnly: true };
  const idempotencyParts = specification.content
    ? [workspaceId, workflowId, specification.stage, specification.content.contentGroupId, specification.content.branch]
    : [workspaceId, workflowId, specification.stage];
  const createdAt = atOffset(now, specification.offsetMinutes);

  return {
    id: `${workflowId}-job-${specification.key}`,
    workspaceId,
    version: 1,
    workflowId,
    stage: specification.stage,
    connectorId: specification.connectorId,
    payload,
    idempotencyKey: createIdempotencyKey(idempotencyParts),
    attempt: 1,
    createdAt,
    availableAt: createdAt,
    traceId,
  };
}

function createContentCompletion(job: PilotJob, completedAt: string): ContentBranchCompletion {
  const { contentGroupId, branch } = job.payload;
  if (!contentGroupId || !branch) {
    throw new Error(`Content job ${job.id} is missing branch correlation.`);
  }

  return {
    id: `${job.id}-completion-attempt-${job.attempt}`,
    jobId: job.id,
    workspaceId: job.workspaceId,
    workflowId: job.workflowId,
    contentGroupId,
    branch,
    attempt: job.attempt,
    artifactVersion: 1,
    completedAt,
    traceId: job.traceId,
  };
}

function createPilotResult(job: PilotJob, completionDelaySeconds = 20): PilotJobResult {
  const completedAt = new Date(new Date(job.createdAt).getTime() + completionDelaySeconds * 1_000).toISOString();
  const contentCompletion = job.stage === "content_queued"
    ? createContentCompletion(job, completedAt)
    : undefined;
  const result: PilotResultPayload = contentCompletion
    ? { simulationOnly: true, stage: job.stage, contentCompletion }
    : { simulationOnly: true, stage: job.stage };

  return {
    jobId: job.id,
    workspaceId: job.workspaceId,
    version: 1,
    workflowId: job.workflowId,
    connectorId: job.connectorId,
    status: "succeeded",
    result,
    completedAt,
    traceId: job.traceId,
  };
}

function joinContentBranches(
  workspaceId: string,
  workflowId: string,
  contentGroupId: string,
  traceId: string,
  completions: readonly ContentBranchCompletion[],
): ContentReadyEvent {
  let state = createContentJoinState({ workspaceId, workflowId, contentGroupId, traceId });
  let contentReadyEvent: ContentReadyEvent | undefined;

  for (const completion of completions) {
    const recorded = recordContentBranchCompletion(state, completion);
    state = recorded.state;
    contentReadyEvent ??= recorded.event;
  }

  if (!contentReadyEvent) throw new Error(`Content group ${contentGroupId} did not become ready.`);
  return contentReadyEvent;
}

export function simulatePilotRun(now = new Date("2026-07-23T10:00:00.000Z")): PilotSimulation {
  const workspaceId = "pilot-workspace";
  const workflowId = `workflow-${now.toISOString().slice(0, 10)}`;
  const traceId = `trace-${workflowId}`;
  const contentGroupId = `${workflowId}-content-group-primary`;
  const specifications: readonly PilotJobSpecification[] = [
    { key: "discovered", stage: "discovered", connectorId: "simulation.discovered", offsetMinutes: 0 },
    { key: "scored", stage: "scored", connectorId: "simulation.scored", offsetMinutes: 1 },
    { key: "selected", stage: "selected", connectorId: "simulation.selected", offsetMinutes: 2 },
    { key: "link-ready", stage: "link_ready", connectorId: "simulation.link_ready", offsetMinutes: 3 },
    { key: "content-copy", stage: "content_queued", connectorId: "simulation.content.copy", offsetMinutes: 4, content: { contentGroupId, branch: "copy" } },
    { key: "content-visual", stage: "content_queued", connectorId: "simulation.content.visual", offsetMinutes: 4, completionDelaySeconds: 30, content: { contentGroupId, branch: "visual" } },
    { key: "qa-approved", stage: "qa_approved", connectorId: "simulation.qa_approved", offsetMinutes: 5 },
    { key: "scheduled", stage: "scheduled", connectorId: "simulation.scheduled", offsetMinutes: 6 },
  ];
  const jobs = specifications.map((specification) => createPilotJob(specification, { workspaceId, workflowId, traceId, now }));
  const results = jobs.map((job, index) => createPilotResult(job, specifications[index]?.completionDelaySeconds));
  const completions = results.flatMap((result) => result.result?.contentCompletion ? [result.result.contentCompletion] : []);
  const contentReadyEvent = joinContentBranches(workspaceId, workflowId, contentGroupId, traceId, completions);
  const scheduledResult = results.find((result) => result.result?.stage === "scheduled");
  if (!scheduledResult) throw new Error("Pilot simulation did not complete the scheduled stage.");

  const sheetRows: SheetRow[] = [
    {
      tab: "Today", recordType: "workflow", recordId: workflowId, recordVersion: 1,
      values: { Date: now.toISOString().slice(0, 10), "Workflow ID": workflowId, Product: "Portable blender pilot", Stage: "scheduled", Owner: "Pulse", Status: "Simulation complete", "Next action": "Review pilot", "Updated at": scheduledResult.completedAt },
    },
    {
      tab: "Products", recordType: "product", recordId: "product-pilot-1", recordVersion: 1,
      values: { "Product ID": "product-pilot-1", Title: "Portable blender pilot", Shop: "Demo shop", Category: "Home", Price: 399, Sales: 1248, Rating: 4.8, "Winner score": 87, Status: "Winner", "Source URL": "https://example.invalid/product", "Discovered at": now.toISOString() },
    },
    {
      tab: "Run History", recordType: "run", recordId: workflowId, recordVersion: 1,
      values: { "Run ID": "run-pilot-1", "Workflow ID": workflowId, Stage: "scheduled", Agent: "simulation", "Started at": jobs[0]?.createdAt ?? now.toISOString(), "Finished at": scheduledResult.completedAt, Status: "Succeeded", Attempt: 1, "Trace ID": traceId, Error: "" },
    },
  ];
  return { jobs, results, contentReadyEvent, sheetRows };
}
