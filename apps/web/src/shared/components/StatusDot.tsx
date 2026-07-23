import type { AgentStatus } from "../types";

export function StatusDot({ status }: { status: AgentStatus }) {
  return <span className={`status-dot status-${status}`} aria-label={status} />;
}
