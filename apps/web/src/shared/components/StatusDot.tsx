import type { OfficeAgentStatus } from "@affiliate-ops/contracts";
import type { AgentStatus } from "../types";

export function StatusDot({ status }: { status: AgentStatus | OfficeAgentStatus }) {
  return <span className={`status-dot status-${status}`} aria-label={status} />;
}
