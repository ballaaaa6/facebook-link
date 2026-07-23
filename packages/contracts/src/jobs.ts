import type { Identifier, IsoDateTime, Versioned, WorkspaceScoped } from "./identity";
import type { WorkflowStage } from "./workflow";

export type JobStatus = "queued" | "leased" | "running" | "retry_wait" | "succeeded" | "failed" | "dead_letter";
export type ErrorCategory = "transient" | "authentication" | "validation" | "policy" | "permanent" | "unknown";

export interface JobEnvelope<TPayload = Record<string, unknown>> extends WorkspaceScoped, Versioned {
  id: Identifier;
  workflowId: Identifier;
  stage: WorkflowStage;
  connectorId: string;
  payload: TPayload;
  idempotencyKey: string;
  attempt: number;
  createdAt: IsoDateTime;
  availableAt: IsoDateTime;
  leaseUntil?: IsoDateTime;
  traceId: Identifier;
}

export interface JobError {
  category: ErrorCategory;
  code: string;
  message: string;
  retryable: boolean;
}

export interface JobResult<TResult = Record<string, unknown>> extends WorkspaceScoped, Versioned {
  jobId: Identifier;
  workflowId: Identifier;
  connectorId: string;
  status: "succeeded" | "failed";
  result?: TResult;
  error?: JobError;
  completedAt: IsoDateTime;
  traceId: Identifier;
}

export function createIdempotencyKey(parts: readonly string[]): string {
  return parts.map((part) => part.trim()).join(":");
}
