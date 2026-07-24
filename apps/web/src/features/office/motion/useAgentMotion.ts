import { useEffect, useRef, useState, type RefObject } from "react";
import type { OfficeAgentView, OfficeMode } from "@affiliate-ops/contracts";
import type { CharacterState } from "../characterRegistry";
import type { OfficeMapDefinition, OfficeWorkstation } from "../officeTypes";
import { subscribeToOfficeFrame } from "./frameScheduler";
import { presentationsAt } from "./officeMotion";
import { pixelAlignedCharacterFrame } from "./pixelGeometry";

export interface AgentVisualState {
  state: CharacterState;
  seated: boolean;
  atDesk: boolean;
  activityLabel?: string;
}

export function useAgentMotion(
  trackRef: RefObject<HTMLDivElement | null>,
  map: OfficeMapDefinition,
  station: OfficeWorkstation,
  agent: OfficeAgentView,
  agents: readonly OfficeAgentView[],
  mode: OfficeMode,
  sceneStartedAt: number,
): AgentVisualState {
  const [visual, setVisual] = useState<AgentVisualState>({ state: "idle", seated: true, atDesk: true });
  const signature = useRef("");

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const update = (timestamp: number) => {
      const presentation = presentationsAt(
        (timestamp - sceneStartedAt) / 1_000,
        agents,
        reduceMotion ? "live" : mode,
        map,
      ).get(agent.agentId);
      if (!presentation) return;
      const track = trackRef.current;
      if (track) {
        const deviceScale = window.devicePixelRatio || 1;
        const snap = (value: number) => Math.round(value * deviceScale) / deviceScale;
        const x = snap((presentation.position.x / map.width) * track.clientWidth);
        const y = snap((presentation.position.y / map.height) * track.clientHeight);
        const frame = pixelAlignedCharacterFrame(track.clientWidth / map.width, deviceScale);
        track.style.setProperty("--agent-x", `${x}px`);
        track.style.setProperty("--agent-y", `${y}px`);
        track.style.setProperty("--agent-width", `${frame.width}px`);
        track.style.setProperty("--agent-height", `${frame.height}px`);
        const atDesk = Math.abs(presentation.position.x - station.seat.x) < 0.05
          && Math.abs(presentation.position.y - station.seat.y) < 0.05;
        track.style.zIndex = String(atDesk
          ? 100 + Math.round(station.y * 20)
          : 110 + Math.round(presentation.position.y * 20));
      }
      const atDesk = Math.abs(presentation.position.x - station.seat.x) < 0.05
        && Math.abs(presentation.position.y - station.seat.y) < 0.05;
      const nextSignature = `${presentation.state}:${presentation.seated}:${atDesk}:${presentation.activityLabel ?? ""}`;
      if (signature.current !== nextSignature) {
        signature.current = nextSignature;
        setVisual({
          state: presentation.state,
          seated: presentation.seated,
          atDesk,
          ...(presentation.activityLabel ? { activityLabel: presentation.activityLabel } : {}),
        });
      }
    };
    return subscribeToOfficeFrame(update);
  }, [agent.agentId, agents, map, mode, sceneStartedAt, station, trackRef]);

  return visual;
}
