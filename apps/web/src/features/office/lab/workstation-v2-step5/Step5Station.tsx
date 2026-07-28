import type { CSSProperties, ReactNode } from "react";
import type { OfficeWorkstationStep5ManifestV2 } from "@affiliate-ops/contracts";
import {
  step5ChairAssets,
  step5DeskParts,
  step5EinsteinAssets,
  step5KeyboardAssets,
  step5MonitorAssets,
} from "./step5Assets";
import { step5FrameForTick, step5StationGeometry, type Step5Orientation } from "./step5Runtime";

function rectStyle(rect: { left: number; top: number; width: number; height: number }): CSSProperties {
  return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
}

function LayerImage({ className, layer, src, style }: {
  className: string;
  layer: string;
  src: string;
  style: CSSProperties;
}) {
  return <img alt="" className={className} data-layer={layer} draggable={false} src={src} style={style} />;
}

function Step5Actor({ manifest, orientation, tick }: {
  manifest: OfficeWorkstationStep5ManifestV2;
  orientation: Step5Orientation;
  tick: number;
}) {
  const config = manifest.orientations[orientation];
  const row = config.actorState === "working-front-seated" ? 14 : 13;
  const frame = step5FrameForTick(tick, manifest.animation.frames);
  return (
    <span
      aria-label={`Einstein ${config.actorState}`}
      className="step5-actor-sprite"
      data-actor-anchor="shared-seat-center"
      data-frame={frame}
      data-logical-volume="1x1x3"
      data-state={config.actorState}
      style={{
        backgroundImage: `image-set(url("${step5EinsteinAssets.sheet}") 1x, url("${step5EinsteinAssets.sheet2x}") 2x)`,
        backgroundPosition: `${(frame / 7) * 100}% ${(row / 14) * 100}%`,
      }}
    />
  );
}

export function Step5Station({ debug, manifest, orientation, tick, zoom }: {
  debug: boolean;
  manifest: OfficeWorkstationStep5ManifestV2;
  orientation: Step5Orientation;
  tick: number;
  zoom: 1 | 2;
}) {
  const geometry = step5StationGeometry(manifest, orientation);
  const config = manifest.orientations[orientation];
  const deskParts = step5DeskParts[config.deskSide === "public-side" ? "publicSide" : "seatSide"];
  const chairParts = step5ChairAssets[config.chairView];
  const layerNodes: Record<string, ReactNode> = {
    "desk-rear": <LayerImage className="step5-desk-layer" layer="desk-rear" src={deskParts.rear} style={rectStyle(geometry.desk)} />,
    "desk-surface": <LayerImage className="step5-desk-layer" layer="desk-surface" src={deskParts.surface} style={rectStyle(geometry.desk)} />,
    "desk-base": <LayerImage className="step5-desk-layer" layer="desk-base" src={deskParts.base} style={rectStyle(geometry.desk)} />,
    "desk-foreground": <LayerImage className="step5-desk-layer" layer="desk-foreground" src={deskParts.foreground} style={rectStyle(geometry.desk)} />,
    "chair-backrest": <LayerImage className="step5-contained-layer" layer="chair-backrest" src={chairParts.backrest} style={rectStyle(geometry.chair)} />,
    "chair-seat-base": <LayerImage className="step5-contained-layer" layer="chair-seat-base" src={chairParts.seatBase} style={rectStyle(geometry.chair)} />,
    keyboard: <LayerImage className="step5-contained-layer" layer="keyboard" src={step5KeyboardAssets.full} style={rectStyle(geometry.keyboard)} />,
    "monitor-front": <LayerImage className="step5-contained-layer" layer="monitor-front" src={step5MonitorAssets.front} style={rectStyle(geometry.monitor)} />,
    "monitor-back": <LayerImage className="step5-contained-layer" layer="monitor-back" src={step5MonitorAssets.back} style={rectStyle(geometry.monitor)} />,
    actor: (
      <span className="step5-actor-layer" data-layer="actor" style={rectStyle(geometry.actor)}>
        <Step5Actor manifest={manifest} orientation={orientation} tick={tick} />
      </span>
    ),
  };
  const stageWidth = manifest.station.canvas.width * manifest.station.canvas.tilePixels;
  const stageHeight = manifest.station.canvas.height * manifest.station.canvas.tilePixels;
  return (
    <article
      className="step5-station-card"
      data-desk-side={config.deskSide}
      data-orientation={orientation}
      data-zoom={zoom}
      style={{
        "--step5-stage-width": `${stageWidth}px`,
        "--step5-stage-height": `${stageHeight}px`,
        "--step5-display-width": `${stageWidth * zoom}px`,
        "--step5-display-height": `${stageHeight * zoom}px`,
        "--step5-zoom": zoom,
      } as CSSProperties}
    >
      <header>
        <div>
          <span>{orientation === "far" ? "FAR · PUBLIC SIDE" : "NEAR · SEAT SIDE"}</span>
          <strong>{config.actorState}</strong>
        </div>
        <small>person 1×1×3 · chair 1×1×2 · tick {tick}</small>
      </header>
      <div className="step5-stage-frame">
        <div
          aria-label={`${orientation} corrected single-seat workstation assembly`}
          className="step5-station-stage"
          data-actor-footprint="1x1"
          data-actor-logical-height="3"
          data-chair-footprint="1x1"
          data-chair-logical-height="2"
          data-desk-footprint="3x2"
          data-layer-order={config.assemblyOrderBackToFront.join(",")}
        >
          <div className="step5-grid" />
          {config.assemblyOrderBackToFront.map((layer, index) => (
            <span className="step5-layer-slot" data-layer-slot={layer} key={layer} style={{ zIndex: 10 + index }}>
              {layerNodes[layer]}
            </span>
          ))}
          {debug && (
            <div className="step5-debug-overlay" data-debug="geometry">
              <i className="step5-debug-rect is-desk" style={rectStyle(geometry.deskFootprint)}><b>desk footprint 3×2</b></i>
              <i className="step5-debug-volume is-actor" style={rectStyle(geometry.actorLogicalVolume)}><b>person 1×1×3</b></i>
              <i className="step5-debug-volume is-chair" style={rectStyle(geometry.chairLogicalVolume)}><b>chair 1×1×2</b></i>
              <i className="step5-debug-render is-actor" style={rectStyle(geometry.actor)}><b>visible overflow 96×104</b></i>
              <i className="step5-debug-rect is-chair" style={rectStyle(geometry.chairFootprint)}><b>shared floor 1×1</b></i>
              <i className="step5-debug-rect is-monitor" style={rectStyle(geometry.monitorReservation)}><b>monitor support 3×1</b></i>
              <i className="step5-debug-rect is-keyboard" style={rectStyle(geometry.keyboardReservation)}><b>keyboard support 3×1</b></i>
              <i className="step5-debug-pivot is-desk" style={{ left: geometry.deskPivot.x, top: geometry.deskPivot.y }} />
              <i className="step5-debug-pivot is-floor" style={{ left: geometry.chairPivot.x, top: geometry.chairPivot.y }}><b>floor</b></i>
              <i className="step5-debug-pivot is-seat" style={{ left: geometry.seatAnchor.x, top: geometry.seatAnchor.y }}><b>seat</b></i>
              <i className="step5-debug-pivot is-hip" style={{ left: geometry.hipAnchor.x, top: geometry.hipAnchor.y }}><b>hip</b></i>
            </div>
          )}
        </div>
      </div>
      <footer>{config.assemblyOrderBackToFront.join(" → ")}</footer>
    </article>
  );
}
