export type LogLevel = "debug" | "info" | "warn" | "error";

export type AuditEventType =
  | "workflow.created"
  | "workflow.transitioned"
  | "agent.started"
  | "agent.completed"
  | "agent.failed"
  | "session.degraded"
  | "session.recovered"
  | "strategy.activated"
  | "publication.scheduled"
  | "publication.published"
  | "publication.reconciled";

export interface StructuredLog {
  level: LogLevel;
  event: string;
  message: string;
  occurredAt: string;
  workflowId?: string;
  agentId?: string;
  accountId?: string;
  attempt?: number;
  durationMs?: number;
  errorCode?: string;
}

export function redactUrl(value: string): string {
  const url = new URL(value);
  return `${url.origin}${url.pathname}`;
}
