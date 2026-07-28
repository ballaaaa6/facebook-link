import type { CSSProperties, ReactNode } from "react";
import { characterImageSet, type CharacterDefinition } from "../../characterRegistry";
import { modernOfficeLabCharacters } from "../modernOfficeLabCharacters";
import { r05ChairParts, r05DeskParts, r05Equipment } from "./r05Assets";
import {
  r05FrameForTick,
  r05Geometry,
  r05Manifest,
  type R05Orientation,
} from "./r05Runtime";

const fallbackCharacter = modernOfficeLabCharacters["product-ranker"];

function rect(value: { left: number; top: number; width: number; height: number }): CSSProperties {
  return { left: value.left, top: value.top, width: value.width, height: value.height };
}

function LayerImage({ layer, src, style }: { layer: string; src: string; style: CSSProperties }) {
  return <img alt="" className="r05-layer-image" data-layer={layer} draggable={false} src={src} style={style} />;
}

function Actor({ character, orientation, tick }: {
  character: CharacterDefinition;
  orientation: R05Orientation;
  tick: number;
}) {
  const frame = r05FrameForTick(tick);
  const row = orientation === "far" ? 14 : 13;
  return (
    <span
      aria-label={`${character.sourceSlug} ${orientation} seated frame ${frame}`}
      className="r05-actor-sprite"
      data-frame={frame}
      data-row={row}
      style={{
        backgroundImage: characterImageSet(character),
        backgroundPosition: `${(frame / 7) * 100}% ${(row / 14) * 100}%`,
      }}
    />
  );
}

export function R05StationStage({
  agentId = "product-ranker",
  context = false,
  debug,
  orientation,
  tick,
}: {
  agentId?: string;
  context?: boolean;
  debug: boolean;
  orientation: R05Orientation;
  tick: number;
}) {
  const geometry = r05Geometry(orientation);
  const desk = r05DeskParts[orientation === "far" ? "public" : "seat"];
  const chair = r05ChairParts[orientation === "far" ? "front" : "back"];
  const character = modernOfficeLabCharacters[agentId] ?? fallbackCharacter;
  const nodes: Record<string, ReactNode> = {
    "chair-rear": <LayerImage layer="chair-rear" src={chair.rear} style={rect(geometry.chair)} />,
    actor: <span className="r05-actor-layer" data-layer="actor" style={rect(geometry.actor)}><Actor character={character} orientation={orientation} tick={tick} /></span>,
    "chair-foreground": <LayerImage layer="chair-foreground" src={chair.foreground} style={rect(geometry.chair)} />,
    "desk-rear": <LayerImage layer="desk-rear" src={desk.rear} style={rect(geometry.desk)} />,
    "desk-surface": <LayerImage layer="desk-surface" src={desk.surface} style={rect(geometry.desk)} />,
    "desk-base": <LayerImage layer="desk-base" src={desk.base} style={rect(geometry.desk)} />,
    "desk-foreground": <LayerImage layer="desk-foreground" src={desk.foreground} style={rect(geometry.desk)} />,
    keyboard: <LayerImage layer="keyboard" src={r05Equipment.keyboard} style={rect(geometry.keyboard)} />,
    "monitor-front": <LayerImage layer="monitor-front" src={r05Equipment.monitorFront} style={rect(geometry.monitor)} />,
    "monitor-back": <LayerImage layer="monitor-back" src={r05Equipment.monitorBack} style={rect(geometry.monitor)} />,
  };
  return (
    <div
      aria-label={`${orientation} R05 final workstation`}
      className={`r05-station-stage${context ? " is-context" : ""}`}
      data-anchor-drift="0"
      data-agent-id={agentId}
      data-orientation={orientation}
    >
      {!context && <div className="r05-grid" />}
      {r05Manifest.station.layerOrder[orientation].map((layer, index) => (
        <span className="r05-layer-slot" data-layer-slot={layer} key={layer} style={{ zIndex: 10 + index }}>
          {nodes[layer]}
        </span>
      ))}
      {debug && (
        <div className="r05-debug">
          <i className="r05-debug-rect is-support" style={rect(geometry.support)}>desk 3×2</i>
          <i className="r05-debug-rect is-monitor" style={rect(geometry.monitorReservation)}>monitor 3×1</i>
          <i className="r05-debug-rect is-keyboard" style={rect(geometry.keyboardReservation)}>keyboard 1×1</i>
          <i className="r05-debug-point is-seat" style={{ left: geometry.seatSocket.x, top: geometry.seatSocket.y }}>seat</i>
          <i className="r05-debug-point is-floor" style={{ left: geometry.floorSocket.x, top: geometry.floorSocket.y }}>floor</i>
          <i className="r05-debug-point is-monitor-point" style={{ left: geometry.monitorSocket.x, top: geometry.monitorSocket.y }}>base</i>
        </div>
      )}
    </div>
  );
}

export function R05StationCard({ debug, orientation, tick }: {
  debug: boolean;
  orientation: R05Orientation;
  tick: number;
}) {
  return (
    <article className="r05-station-card" data-orientation={orientation}>
      <header>
        <strong>{orientation.toUpperCase()}</strong>
        <span>real chair · frame {r05FrameForTick(tick)} · drift 0 px</span>
      </header>
      <R05StationStage debug={debug} orientation={orientation} tick={tick} />
      <footer>{r05Manifest.station.layerOrder[orientation].join(" → ")}</footer>
    </article>
  );
}
