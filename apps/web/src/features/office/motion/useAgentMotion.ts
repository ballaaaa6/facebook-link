import { useEffect, useRef, useState, type RefObject } from "react";
import type { OfficeAgentView, OfficeMode } from "@affiliate-ops/contracts";
import type { CharacterState } from "../characterRegistry";
import type { OfficeMapDefinition, OfficeWorkstation } from "../officeTypes";
import { subscribeToOfficeFrame } from "./frameScheduler";
import { presentationAt } from "./officeMotion";

export interface AgentVisualState {
  state: CharacterState;
  seated: boolean;
  activityLabel?: string;
}

export function useAgentMotion(
  trackRef: RefObject<HTMLDivElement | null>,
  map: OfficeMapDefinition,
  station: OfficeWorkstation,
  agent: OfficeAgentView,
  mode: OfficeMode,
  index: number,
): AgentVisualState {
  const [visual, setVisual] = useState<AgentVisualState>({ state: "idle", seated: true });
  const signature = useRef("");

  useEffect(() => {
    const startedAt = performance.now();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const update = (timestamp: number) => {
      const presentation = presentationAt(
        (timestamp - startedAt) / 1_000,
        index,
        agent,
        reduceMotion ? "live" : mode,
        map,
        station,
      );
      const track = trackRef.current;
      if (track) {
        track.style.setProperty("--agent-x", `${(presentation.position.x / map.width) * 100}%`);
        track.style.setProperty("--agent-y", `${(presentation.position.y / map.height) * 100}%`);
        track.style.zIndex = String(presentation.seated
          ? 99 + Math.round(station.y * 20)
          : 110 + Math.round(presentation.position.y * 20));
      }
      const nextSignature = `${presentation.state}:${presentation.seated}:${presentation.activityLabel ?? ""}`;
      if (signature.current !== nextSignature) {
        signature.current = nextSignature;
        setVisual({
          state: presentation.state,
          seated: presentation.seated,
          ...(presentation.activityLabel ? { activityLabel: presentation.activityLabel } : {}),
        });
      }
    };
    return subscribeToOfficeFrame(update);
  }, [agent.activity, agent.agentId, agent.status, index, map, mode, station, trackRef]);

  return visual;
}
