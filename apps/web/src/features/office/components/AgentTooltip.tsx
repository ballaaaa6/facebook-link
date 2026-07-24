import type { OfficeAgentView } from "@affiliate-ops/contracts";
import { StatusDot } from "../../../shared/components/StatusDot";
import type { AgentPreviewAnchor } from "./AgentEntity";

function progressLabel(agent: OfficeAgentView) {
  if (agent.progress.kind === "determinate") return `${agent.progress.value}%`;
  if (agent.progress.kind === "completed") return "Complete";
  return "In progress";
}

export function AgentTooltip({
  agent,
  anchor,
}: {
  agent: OfficeAgentView;
  anchor: AgentPreviewAnchor;
}) {
  return (
    <div
      id={`agent-tooltip-${agent.agentId}`}
      className={`agent-hover-card ${anchor.opensLeft ? "opens-left" : ""}`}
      role="tooltip"
      style={{ left: anchor.left, top: anchor.top }}
    >
      <strong>{agent.displayName}</strong>
      <small>{agent.role}</small>
      <em>{agent.currentTask}</em>
      <i><StatusDot status={agent.status} />{agent.status.replaceAll("_", " ")} · {progressLabel(agent)}</i>
      <b>Click to keep details open</b>
    </div>
  );
}
