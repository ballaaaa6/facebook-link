import { useRef } from "react";
import type { OfficeAgentView, OfficeMode } from "@affiliate-ops/contracts";
import { StatusDot } from "../../../shared/components/StatusDot";
import { useAgentMotion } from "../motion/useAgentMotion";
import type { OfficeMapDefinition, OfficeWorkstation } from "../officeTypes";
import { AnimatedAgent } from "./AnimatedAgent";

export interface AgentPreviewAnchor {
  agentId: string;
  left: number;
  top: number;
  opensLeft: boolean;
}

export function AgentEntity({
  agent,
  index,
  map,
  mode,
  selected,
  previewed,
  station,
  onPreview,
  onSelect,
}: {
  agent: OfficeAgentView;
  index: number;
  map: OfficeMapDefinition;
  mode: OfficeMode;
  selected: boolean;
  previewed: boolean;
  station: OfficeWorkstation;
  onPreview: (anchor: AgentPreviewAnchor) => void;
  onSelect: (agentId: string) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const visual = useAgentMotion(trackRef, map, station, agent, mode, index);
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
        aria-label={`Select ${agent.role}`}
        aria-describedby={previewed ? `agent-tooltip-${agent.agentId}` : undefined}
        onClick={() => onSelect(agent.agentId)}
        onFocus={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          onPreview({ agentId: agent.agentId, left: rect.right, top: rect.top + rect.height / 2, opensLeft: false });
        }}
        onPointerEnter={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          onPreview({
            agentId: agent.agentId,
            left: rect.right,
            top: rect.top + rect.height / 2,
            opensLeft: rect.right > window.innerWidth - 230,
          });
        }}
      >
        <AnimatedAgent agentId={agent.agentId} name={agent.displayName} state={visual.state} />
      </button>
      {visual.activityLabel ? <span className="agent-activity-badge">{visual.activityLabel}</span> : null}
      <span className={`agent-nameplate ${visual.seated ? "is-seated" : ""} ${previewed || selected ? "is-visible" : ""}`}>
        <StatusDot status={agent.status} />{agent.displayName}
      </span>
    </div>
  );
}
