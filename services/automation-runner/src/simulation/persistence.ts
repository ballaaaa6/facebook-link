import type { DatabaseSync } from "node:sqlite";
import type { WorkflowStage } from "@affiliate-ops/contracts";
import type { PilotSimulation } from "./pilot.ts";

const stageOwners: Record<WorkflowStage, string> = {
  discovered: "market-scout",
  scored: "product-ranker",
  selected: "growth-strategist",
  link_ready: "link-attribution",
  content_queued: "gemini-copywriter",
  content_ready: "flow-visual-producer",
  qa_approved: "qa-editor",
  scheduled: "publisher",
  published: "publisher",
  measured: "performance-analyst",
  failed: "session-keeper",
};

export interface PersistedSimulation {
  workflowId: string;
  jobs: number;
  agentRuns: number;
  auditEvents: number;
}

export function persistPilotSimulation(
  database: DatabaseSync,
  simulation: PilotSimulation,
  persistedAt = new Date().toISOString(),
): PersistedSimulation {
  const firstJob = simulation.jobs[0];
  const lastResult = simulation.results.at(-1);
  if (!firstJob || !lastResult) throw new Error("Pilot simulation did not create a complete workflow.");

  database.exec("BEGIN IMMEDIATE;");
  try {
    database.prepare(`INSERT OR IGNORE INTO workspaces (id, slug, display_name, status, created_at, updated_at) VALUES (?, ?, ?, 'active', ?, ?)`)
      .run(firstJob.workspaceId, firstJob.workspaceId, "Pilot Workspace", persistedAt, persistedAt);
    database.prepare(`INSERT OR REPLACE INTO workflow_runs (id, workspace_id, stage, status, strategy_version, started_at, updated_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(firstJob.workflowId, firstJob.workspaceId, firstJob.stage === "failed" ? "failed" : "scheduled", "succeeded", "simulation-v1", firstJob.createdAt, lastResult.completedAt, lastResult.completedAt);

    const insertJob = database.prepare(`INSERT OR IGNORE INTO jobs (id, workspace_id, workflow_id, stage, connector_id, payload_version, payload_json, idempotency_key, status, attempt, available_at, trace_id, created_at, updated_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const insertRun = database.prepare(`INSERT OR IGNORE INTO agent_runs (id, workspace_id, workflow_id, agent_id, status, attempt, input_json, output_json, started_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const insertAudit = database.prepare(`INSERT OR IGNORE INTO audit_events (id, workspace_id, event_type, actor_type, actor_id, entity_type, entity_id, payload_json, occurred_at, trace_id) VALUES (?, ?, ?, 'agent', ?, 'workflow', ?, ?, ?, ?)`);
    const insertOutbox = database.prepare(`INSERT OR IGNORE INTO job_outbox (id, workspace_id, job_id, event_type, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?)`);

    for (const [index, job] of simulation.jobs.entries()) {
      const result = simulation.results[index];
      if (!result) throw new Error(`Missing simulation result for ${job.id}`);
      const agentId = stageOwners[job.stage];
      insertJob.run(job.id, job.workspaceId, job.workflowId, job.stage, job.connectorId, job.version, JSON.stringify(job.payload), job.idempotencyKey, result.status, job.attempt, job.availableAt, job.traceId, job.createdAt, result.completedAt, result.completedAt);
      insertRun.run(`agent-run-${job.id}`, job.workspaceId, job.workflowId, agentId, result.status, job.attempt, JSON.stringify(job.payload), JSON.stringify(result.result ?? {}), job.createdAt, result.completedAt);
      const payload = JSON.stringify({ stage: job.stage, status: result.status, connectorId: job.connectorId });
      insertAudit.run(`audit-${job.id}`, job.workspaceId, "agent.completed", agentId, job.workflowId, payload, result.completedAt, job.traceId);
      insertOutbox.run(`outbox-${job.id}`, job.workspaceId, job.id, "office.agent.updated", payload, result.completedAt);
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
    auditEvents: simulation.jobs.length,
  };
}
