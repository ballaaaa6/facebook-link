import { useRef, type RefObject } from "react";
import type { OfficeAgentView, OfficeMode } from "@affiliate-ops/contracts";
import { StatusDot } from "../../../shared/components/StatusDot";
import { useAgentMotion } from "../motion/useAgentMotion";
import type { OfficeMapDefinition, OfficeWorkstation } from "../officeTypes";
import { AgentActivityBadge } from "./AgentActivityBadge";
import { AnimatedAgent } from "./AnimatedAgent";
import type { TooltipPreference } from "./tooltipPlacement";

export interface AgentPreviewRequest {
  agentId: string;
  preferredSide: TooltipPreference;
}

export function AgentEntity({
  agent,
  agents,
  frameRef,
  map,
  mode,
  sceneStartedAt,
  selected,
  previewed,
  station,
  onPreview,
  onPreviewEnd,
  onSelect,
}: {
  agent: OfficeAgentView;
  agents: readonly OfficeAgentView[];
  frameRef: RefObject<HTMLDivElement | null>;
  map: OfficeMapDefinition;
  mode: OfficeMode;
  sceneStartedAt: number;
  selected: boolean;
  previewed: boolean;
  station: OfficeWorkstation;
  onPreview: (request: AgentPreviewRequest) => void;
  onPreviewEnd: (agentId: string) => void;
  onSelect: (agentId: string) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const visual = useAgentMotion(trackRef, map, station, agent, agents, mode, sceneStartedAt);
  const initialX = `${(station.seat.x / map.width) * 100}%`;
  const initialY = `${(station.seat.y / map.height) * 100}%`;

  return (
    <div
      className="agent-track"
      ref={trackRef}
      style={{ "--agent-x": initialX, "--agent-y": initialY } as React.CSSProperties}
    >
      <button
        type="button"
        className={`agent-entity ${visual.seated ? "is-seated" : "is-standing"} ${visual.atDesk ? "is-at-desk" : ""} ${selected ? "is-selected" : ""}`}
        data-agent-id={agent.agentId}
        aria-label={`Select ${agent.role}${visual.activityLabel ? `, ${visual.activityLabel}` : ""}`}
        aria-describedby={previewed ? `agent-tooltip-${agent.agentId}` : undefined}
        onClick={() => onSelect(agent.agentId)}
        onFocus={() => onPreview({
          agentId: agent.agentId,
          preferredSide: station.previewSide ?? "auto",
        })}
        onBlur={() => onPreviewEnd(agent.agentId)}
        onPointerEnter={() => onPreview({
          agentId: agent.agentId,
          preferredSide: station.previewSide ?? "auto",
        })}
        onPointerLeave={() => onPreviewEnd(agent.agentId)}
        onPointerCancel={() => onPreviewEnd(agent.agentId)}
      >
        <AnimatedAgent
          agentId={agent.agentId}
          name={agent.displayName}
          sceneStartedAt={sceneStartedAt}
          state={visual.seated && agent.status !== "completed" ? "seated" : visual.state}
        />
        <span className="agent-callout-anchor" data-agent-anchor={agent.agentId} aria-hidden="true" />
      </button>
      {visual.activityLabel && !visual.seated
        ? (
          <AgentActivityBadge
            agentId={agent.agentId}
            frameRef={frameRef}
            label={visual.activityLabel}
            preference={station.previewSide ?? "auto"}
            suppressed={previewed}
          />
        )
        : null}
      <span className={`agent-nameplate ${visual.seated ? "is-seated" : ""} ${previewed ? "is-visible" : ""}`}>
        <StatusDot status={agent.status} />{agent.displayName}
      </span>
    </div>
  );
}
