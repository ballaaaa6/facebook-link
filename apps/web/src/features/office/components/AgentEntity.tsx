import { useRef } from "react";
import type { OfficeAgentView, OfficeMode } from "@affiliate-ops/contracts";
import { StatusDot } from "../../../shared/components/StatusDot";
import { useAgentMotion } from "../motion/useAgentMotion";
import type { OfficeMapDefinition, OfficeWorkstation } from "../officeTypes";
import { AnimatedAgent } from "./AnimatedAgent";
import type { TooltipPreference } from "./tooltipPlacement";

export interface AgentPreviewRequest {
  agentId: string;
  preferredSide: TooltipPreference;
}

export function AgentEntity({
  agent,
  agents,
  map,
  mode,
  sceneStartedAt,
  selected,
  previewed,
  station,
  onPreview,
  onSelect,
}: {
  agent: OfficeAgentView;
  agents: readonly OfficeAgentView[];
  map: OfficeMapDefinition;
  mode: OfficeMode;
  sceneStartedAt: number;
  selected: boolean;
  previewed: boolean;
  station: OfficeWorkstation;
  onPreview: (request: AgentPreviewRequest) => void;
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
        className={`agent-entity ${visual.seated ? "is-seated" : "is-standing"} ${selected ? "is-selected" : ""}`}
        data-agent-id={agent.agentId}
        aria-label={`Select ${agent.role}${visual.activityLabel ? `, ${visual.activityLabel}` : ""}`}
        aria-describedby={previewed ? `agent-tooltip-${agent.agentId}` : undefined}
        onClick={() => onSelect(agent.agentId)}
        onFocus={() => onPreview({
          agentId: agent.agentId,
          preferredSide: station.previewSide ?? "auto",
        })}
        onPointerEnter={() => onPreview({
          agentId: agent.agentId,
          preferredSide: station.previewSide ?? "auto",
        })}
      >
        <AnimatedAgent
          agentId={agent.agentId}
          name={agent.displayName}
          sceneStartedAt={sceneStartedAt}
          state={visual.state}
        />
      </button>
      {visual.activityLabel && !visual.seated
        ? <span className="agent-activity-badge">{visual.activityLabel}</span>
        : null}
      <span className={`agent-nameplate ${visual.seated ? "is-seated" : ""} ${previewed || selected ? "is-visible" : ""}`}>
        <StatusDot status={agent.status} />{agent.displayName}
      </span>
    </div>
  );
}
