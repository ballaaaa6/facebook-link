import { useRef, type RefObject } from "react";
import { createPortal } from "react-dom";
import type { OfficeAgentView } from "@affiliate-ops/contracts";
import { StatusDot } from "../../../shared/components/StatusDot";
import type { AgentPreviewRequest } from "./AgentEntity";
import { useAgentCalloutPlacement } from "./useAgentCalloutPlacement";

function progressLabel(agent: OfficeAgentView) {
  if (agent.progress.kind === "determinate") return `${agent.progress.value}%`;
  if (agent.progress.kind === "completed") return "Complete";
  return "In progress";
}

export function AgentTooltip({
  agent,
  frameRef,
  request,
}: {
  agent: OfficeAgentView;
  frameRef: RefObject<HTMLDivElement | null>;
  request: AgentPreviewRequest;
}) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  useAgentCalloutPlacement({
    calloutRef: tooltipRef,
    frameRef,
    agentId: request.agentId,
    preference: request.preferredSide,
  });

  return createPortal(
    <div
      ref={tooltipRef}
      id={`agent-tooltip-${agent.agentId}`}
      className="agent-hover-card"
      role="tooltip"
      style={{ left: -10_000, top: -10_000, visibility: "hidden" }}
    >
      <strong>{agent.displayName}</strong>
      <small>{agent.role}</small>
      <em>{agent.currentTask}</em>
      <i><StatusDot status={agent.status} />{agent.status.replaceAll("_", " ")} · {progressLabel(agent)}</i>
      <b>Click to select this agent</b>
    </div>,
    document.body,
  );
}
