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

export const contentBranches = ["copy", "visual"] as const;
export type ContentBranch = (typeof contentBranches)[number];

export const workflowCoordinatorId = "workflow-coordinator" as const;

export type WorkflowActor =
  | { actorType: "agent"; actorId: Identifier }
  | { actorType: "system"; actorId: typeof workflowCoordinatorId };

export interface WorkflowEventFields<TPayload = Record<string, unknown>> extends WorkspaceScoped {
  id: Identifier;
  workflowId: Identifier;
  stage: WorkflowStage;
  traceId: Identifier;
  occurredAt: IsoDateTime;
  payload: TPayload;
}

export type WorkflowEvent<TPayload = Record<string, unknown>> = WorkflowEventFields<TPayload> & WorkflowActor;

export interface WinnerSelectionPayload {
  selectedProductId: Identifier;
  rankingEvidenceId: Identifier;
  strategyVersionId: Identifier;
}

export type WinnerSelectionEvent = WorkflowEvent<WinnerSelectionPayload> & {
  stage: "selected";
  actorType: "agent";
  actorId: "growth-strategist";
};

export interface ContentBranchJobPayload {
  contentGroupId: Identifier;
  branch: ContentBranch;
}

export interface ContentBranchCompletion extends WorkspaceScoped {
  id: Identifier;
  jobId: Identifier;
  workflowId: Identifier;
  contentGroupId: Identifier;
  branch: ContentBranch;
  attempt: number;
  artifactVersion: number;
  completedAt: IsoDateTime;
  traceId: Identifier;
}

export interface ContentReadyBranchRef {
  completionId: Identifier;
  jobId: Identifier;
  attempt: number;
  artifactVersion: number;
}

export interface ContentReadyPayload {
  contentGroupId: Identifier;
  copy: ContentReadyBranchRef;
  visual: ContentReadyBranchRef;
}

export type ContentReadyEvent = WorkflowEvent<ContentReadyPayload> & {
  stage: "content_ready";
  actorType: "system";
  actorId: typeof workflowCoordinatorId;
};

export interface HealthReport {
  service: string;
  status: "ok" | "degraded" | "down";
  version: string;
  checkedAt: IsoDateTime;
}
