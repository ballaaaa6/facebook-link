import type { Identifier, IsoDateTime, WorkspaceScoped } from "./identity";
import type { WorkflowStage } from "./workflow";

export type OfficeMode = "simulation" | "live";
export type OfficeConnectionState = "connected" | "reconnecting" | "stale" | "offline";
export type OfficeAgentStatus =
  | "idle"
  | "queued"
  | "running"
  | "waiting_dependency"
  | "waiting_human"
  | "review"
  | "retrying"
  | "blocked"
  | "failed"
  | "offline"
  | "stale"
  | "completed";

export type OfficeActivity =
  | "desk"
  | "research"
  | "ranking"
  | "strategy"
  | "analytics"
  | "writing"
  | "visual"
  | "linking"
  | "review"
  | "publishing"
  | "session"
  | "waiting";

export type OfficeProgress =
  | { kind: "determinate"; value: number }
  | { kind: "indeterminate" }
  | { kind: "completed" }
  | { kind: "not_applicable" };

export interface OfficeMetric {
  id: string;
  label: string;
  value: string;
  note: string;
}

export interface OfficeEventSummary {
  id: Identifier;
  label: string;
  occurredAt: IsoDateTime;
  level: "info" | "warning" | "error";
}

export interface OfficeAgentView {
  agentId: Identifier;
  displayName: string;
  role: string;
  status: OfficeAgentStatus;
  statusReason: string;
  currentTask: string;
  progress: OfficeProgress;
  activity: OfficeActivity;
  workflowId?: Identifier;
  agentRunId?: Identifier;
  workflowStage?: WorkflowStage;
  attempt: number;
  startedAt?: IsoDateTime;
  updatedAt: IsoDateTime;
  lastHeartbeatAt: IsoDateTime;
  requiresHuman: boolean;
  latestEvents: readonly OfficeEventSummary[];
}

export interface OfficeConnectorHealth {
  id: string;
  label: string;
  status: "ready" | "degraded" | "disabled" | "offline";
  note: string;
  checkedAt: IsoDateTime;
}

export interface OfficeSnapshot extends WorkspaceScoped {
  schemaVersion: 1;
  sequence: number;
  mode: OfficeMode;
  generatedAt: IsoDateTime;
  connection: OfficeConnectionState;
  agents: readonly OfficeAgentView[];
  metrics: readonly OfficeMetric[];
  pendingReviews: number;
  runnerHealth: "ready" | "degraded" | "offline";
  connectors: readonly OfficeConnectorHealth[];
}

export interface OfficeEvent extends WorkspaceScoped {
  schemaVersion: 1;
  sequence: number;
  eventId: Identifier;
  eventType: string;
  occurredAt: IsoDateTime;
  agentId?: Identifier;
  workflowId?: Identifier;
  agentRunId?: Identifier;
  payload: Record<string, unknown>;
}
