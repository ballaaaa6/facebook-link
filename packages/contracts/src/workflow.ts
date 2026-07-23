import type { Identifier, IsoDateTime, WorkspaceScoped } from "./identity";

export type AgentRunStatus = "queued" | "running" | "waiting" | "review" | "succeeded" | "failed";

export type WorkflowStage =
  | "discovered"
  | "scored"
  | "selected"
  | "link_ready"
  | "content_queued"
  | "content_ready"
  | "qa_approved"
  | "scheduled"
  | "published"
  | "measured"
  | "failed";

export interface WorkflowEvent<TPayload = Record<string, unknown>> extends WorkspaceScoped {
  id: Identifier;
  workflowId: Identifier;
  stage: WorkflowStage;
  agentId: Identifier;
  occurredAt: IsoDateTime;
  payload: TPayload;
}

export interface HealthReport {
  service: string;
  status: "ok" | "degraded" | "down";
  version: string;
  checkedAt: IsoDateTime;
}
