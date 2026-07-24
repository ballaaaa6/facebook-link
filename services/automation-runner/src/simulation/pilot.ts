import type { JobEnvelope, JobResult, SheetRow } from "@affiliate-ops/contracts";
import { createIdempotencyKey } from "@affiliate-ops/contracts";

export interface PilotSimulation {
  jobs: readonly JobEnvelope[];
  results: readonly JobResult[];
  sheetRows: readonly SheetRow[];
}

export function simulatePilotRun(now = new Date("2026-07-23T10:00:00.000Z")): PilotSimulation {
  const workspaceId = "pilot-workspace";
  const workflowId = `workflow-${now.toISOString().slice(0, 10)}`;
  const stages = ["discovered", "scored", "selected", "link_ready", "content_queued", "content_ready", "qa_approved", "scheduled"] as const;
  const jobs = stages.map((stage, index): JobEnvelope => ({
    id: `${workflowId}-job-${index + 1}`,
    workspaceId,
    version: 1,
    workflowId,
    stage,
    connectorId: `simulation.${stage}`,
    payload: { simulationOnly: true },
    idempotencyKey: createIdempotencyKey([workspaceId, workflowId, stage]),
    attempt: 1,
    createdAt: new Date(now.getTime() + index * 60_000).toISOString(),
    availableAt: new Date(now.getTime() + index * 60_000).toISOString(),
    traceId: `trace-${workflowId}`,
  }));
  const results = jobs.map((job): JobResult => ({
    jobId: job.id,
    workspaceId,
    version: 1,
    workflowId,
    connectorId: job.connectorId,
    status: "succeeded",
    result: { simulationOnly: true, stage: job.stage },
    completedAt: new Date(new Date(job.createdAt).getTime() + 20_000).toISOString(),
    traceId: job.traceId,
  }));
  const sheetRows: SheetRow[] = [
    {
      tab: "Today", recordType: "workflow", recordId: workflowId, recordVersion: 1,
      values: { Date: "2026-07-23", "Workflow ID": workflowId, Product: "Portable blender pilot", Stage: "scheduled", Owner: "Pulse", Status: "Simulation complete", "Next action": "Review pilot", "Updated at": results.at(-1)?.completedAt ?? now.toISOString() },
    },
    {
      tab: "Products", recordType: "product", recordId: "product-pilot-1", recordVersion: 1,
      values: { "Product ID": "product-pilot-1", Title: "Portable blender pilot", Shop: "Demo shop", Category: "Home", Price: 399, Sales: 1248, Rating: 4.8, "Winner score": 87, Status: "Winner", "Source URL": "https://example.invalid/product", "Discovered at": now.toISOString() },
    },
    {
      tab: "Run History", recordType: "run", recordId: workflowId, recordVersion: 1,
      values: { "Run ID": "run-pilot-1", "Workflow ID": workflowId, Stage: "scheduled", Agent: "simulation", "Started at": jobs[0]?.createdAt ?? now.toISOString(), "Finished at": results.at(-1)?.completedAt ?? now.toISOString(), Status: "Succeeded", Attempt: 1, "Trace ID": jobs[0]?.traceId ?? "", Error: "" },
    },
  ];
  return { jobs, results, sheetRows };
}
