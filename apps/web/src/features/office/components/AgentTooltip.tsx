import { useLayoutEffect, useRef, type RefObject } from "react";
import { createPortal } from "react-dom";
import type { OfficeAgentView } from "@affiliate-ops/contracts";
import { StatusDot } from "../../../shared/components/StatusDot";
import { subscribeToOfficeFrame } from "../motion/frameScheduler";
import type { AgentPreviewRequest } from "./AgentEntity";
import { placeAgentTooltip, type PlacementRect } from "./tooltipPlacement";

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

  useLayoutEffect(() => {
    const tooltip = tooltipRef.current;
    const frame = frameRef.current;
    if (!tooltip || !frame) return;
    const update = () => {
      const actor = frame.querySelector<HTMLElement>(`[data-agent-id="${request.agentId}"]`);
      if (!actor) {
        tooltip.style.visibility = "hidden";
        return;
      }
      const frameRect = frame.getBoundingClientRect();
      const actorRect = actor.getBoundingClientRect();
      const bounds = {
        left: Math.max(0, frameRect.left),
        right: Math.min(window.innerWidth, frameRect.right),
        top: Math.max(0, frameRect.top),
        bottom: Math.min(window.innerHeight, frameRect.bottom),
        width: Math.min(window.innerWidth, frameRect.right) - Math.max(0, frameRect.left),
        height: Math.min(window.innerHeight, frameRect.bottom) - Math.max(0, frameRect.top),
      };
      const outside = actorRect.right < bounds.left
        || actorRect.left > bounds.right
        || actorRect.bottom < bounds.top
        || actorRect.top > bounds.bottom;
      if (outside || bounds.width <= 0 || bounds.height <= 0) {
        tooltip.style.visibility = "hidden";
        return;
      }
      const tooltipRect = tooltip.getBoundingClientRect();
      const obstacles = [...frame.querySelectorAll<HTMLElement>("[data-agent-id]")]
        .filter((element) => element !== actor)
        .map((element) => element.getBoundingClientRect() as PlacementRect);
      const placement = placeAgentTooltip({
        anchor: actorRect as PlacementRect,
        tooltip: { width: tooltipRect.width, height: tooltipRect.height },
        bounds,
        obstacles,
        preference: request.preferredSide,
      });
      tooltip.style.left = `${placement.left}px`;
      tooltip.style.top = `${placement.top}px`;
      tooltip.style.setProperty("--tooltip-arrow-top", `${placement.arrowTop}px`);
      tooltip.dataset.side = placement.side;
      tooltip.style.visibility = "visible";
    };
    update();
    return subscribeToOfficeFrame(update);
  }, [agent.agentId, frameRef, request.agentId, request.preferredSide]);

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
      <b>Click to keep details open</b>
    </div>,
    document.body,
  );
}
