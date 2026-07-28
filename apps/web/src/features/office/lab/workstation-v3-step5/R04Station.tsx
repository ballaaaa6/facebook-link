import type { CSSProperties, ReactNode } from "react";
import type {
  OfficeWorkstationStep5ManifestV4,
  WorkstationStep5R04Orientation,
  WorkstationStep5R04Rect,
} from "@affiliate-ops/contracts";
import { r04Actor, r04ChairParts, r04DeskParts, r04Equipment } from "./r04Assets";
import { r04FrameForTick, r04Geometry } from "./r04Runtime";

function rect(rectangle: WorkstationStep5R04Rect): CSSProperties {
  return { left: rectangle.left, top: rectangle.top, width: rectangle.width, height: rectangle.height };
}

function LayerImage({ layer, src, style }: { layer: string; src: string; style: CSSProperties }) {
  return <img alt="" className="r04-layer-image" data-layer={layer} draggable={false} src={src} style={style} />;
}

function Actor({ manifest, orientation, tick }: {
  manifest: OfficeWorkstationStep5ManifestV4;
  orientation: WorkstationStep5R04Orientation;
  tick: number;
}) {
  const frame = r04FrameForTick(tick, manifest.animation.frames);
  const row = manifest.animation.rows[orientation];
  return (
    <span
      aria-label={`Einstein R04 ${orientation} seated frame ${frame}`}
      className="r04-actor-sprite"
      data-frame={frame}
      data-row={row}
      style={{
        backgroundImage: `image-set(url("${r04Actor.sheet}") 1x, url("${r04Actor.sheet2x}") 2x)`,
        backgroundPosition: `${(frame / 7) * 100}% ${(row / 14) * 100}%`,
      }}
    />
  );
}

export function R04StationStage({ context = false, debug, manifest, orientation, tick }: {
  context?: boolean;
  debug: boolean;
  manifest: OfficeWorkstationStep5ManifestV4;
  orientation: WorkstationStep5R04Orientation;
  tick: number;
}) {
  const geometry = r04Geometry(manifest, orientation);
  const desk = r04DeskParts[orientation === "far" ? "public" : "seat"];
  const chair = r04ChairParts[orientation === "far" ? "front" : "back"];
  const layerNodes: Record<string, ReactNode> = {
    "desk-rear": <LayerImage layer="desk-rear" src={desk.rear} style={rect(geometry.desk)} />,
    "desk-surface": <LayerImage layer="desk-surface" src={desk.surface} style={rect(geometry.desk)} />,
    "desk-base": <LayerImage layer="desk-base" src={desk.base} style={rect(geometry.desk)} />,
    "desk-foreground": <LayerImage layer="desk-foreground" src={desk.foreground} style={rect(geometry.desk)} />,
    "chair-rear": <LayerImage layer="chair-rear" src={chair.rear} style={rect(geometry.chair)} />,
    "chair-seat": <LayerImage layer="chair-seat" src={chair.seat} style={rect(geometry.chair)} />,
    "chair-foreground": <LayerImage layer="chair-foreground" src={chair.foreground} style={rect(geometry.chair)} />,
    keyboard: <LayerImage layer="keyboard" src={r04Equipment.keyboard} style={rect(geometry.keyboard)} />,
    "monitor-front": <LayerImage layer="monitor-front" src={r04Equipment.monitorFront} style={rect(geometry.monitor)} />,
    "monitor-back": <LayerImage layer="monitor-back" src={r04Equipment.monitorBack} style={rect(geometry.monitor)} />,
    actor: <span className="r04-actor-layer" data-layer="actor" style={rect(geometry.actor)}><Actor manifest={manifest} orientation={orientation} tick={tick} /></span>,
  };
  return (
    <div
      aria-label={`${orientation} R04 single-seat workstation`}
      className={`r04-station-stage${context ? " is-context" : ""}`}
      data-anchor-drift={manifest.animation.maximumAnchorDriftPixels}
      data-layer-order={manifest.layerOrder[orientation].join(",")}
      data-orientation={orientation}
    >
      <div className="r04-grid" />
      {manifest.layerOrder[orientation].map((layer, index) => (
        <span className="r04-layer-slot" data-layer-slot={layer} key={layer} style={{ zIndex: 10 + index }}>
          {layerNodes[layer]}
        </span>
      ))}
      {debug && (
        <div className="r04-debug">
          <i className="r04-debug-rect is-support" style={rect(geometry.support)}>desk support 96×64</i>
          <i className="r04-debug-rect is-monitor" style={rect(geometry.monitorReservation)}>monitor 3×1</i>
          <i className="r04-debug-rect is-keyboard" style={rect(geometry.keyboardReservation)}>keyboard 1×1</i>
          <i className="r04-contact" style={{ left: geometry.seatAnchor.x, top: geometry.seatAnchor.y }}>seat=hip z1</i>
        </div>
      )}
    </div>
  );
}

export function R04StationCard(props: {
  debug: boolean;
  manifest: OfficeWorkstationStep5ManifestV4;
  orientation: WorkstationStep5R04Orientation;
  tick: number;
}) {
  return (
    <article className="r04-station-card" data-orientation={props.orientation}>
      <header>
        <strong>{props.orientation === "far" ? "FAR / FRONT / PUBLIC SIDE" : "NEAR / BACK / SEAT SIDE"}</strong>
        <span>frame {r04FrameForTick(props.tick, props.manifest.animation.frames)} / drift 0 px</span>
      </header>
      <R04StationStage {...props} />
      <footer>{props.manifest.layerOrder[props.orientation].join(" → ")}</footer>
    </article>
  );
}
