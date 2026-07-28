import type { CSSProperties, ReactNode } from "react";
import type { OfficeWorkstationStep5ManifestV1 } from "@affiliate-ops/contracts";
import {
  step5ChairAssets,
  step5DeskParts,
  step5EinsteinAssets,
  step5KeyboardAsset,
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
  manifest: OfficeWorkstationStep5ManifestV1;
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
      data-actor-anchor="chair-center"
      data-frame={frame}
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
  manifest: OfficeWorkstationStep5ManifestV1;
  orientation: Step5Orientation;
  tick: number;
  zoom: 1 | 2;
}) {
  const geometry = step5StationGeometry(manifest, orientation);
  const config = manifest.orientations[orientation];
  const parts = step5DeskParts[config.deskView];
  const layerNodes: Record<string, ReactNode> = {
    "desk-rear": <LayerImage className="step5-desk-layer" layer="desk-rear" src={parts.rear} style={rectStyle(geometry.desk)} />,
    "desk-surface": <LayerImage className="step5-desk-layer" layer="desk-surface" src={parts.surface} style={rectStyle(geometry.desk)} />,
    "desk-base": <LayerImage className="step5-desk-layer" layer="desk-base" src={parts.base} style={rectStyle(geometry.desk)} />,
    "desk-foreground": <LayerImage className="step5-desk-layer" layer="desk-foreground" src={parts.foreground} style={rectStyle(geometry.desk)} />,
    "chair-base": <LayerImage className="step5-contained-layer" layer="chair-base" src={step5ChairAssets[config.deskView]} style={rectStyle(geometry.chair)} />,
    "chair-foreground": <LayerImage className="step5-contained-layer" layer="chair-foreground" src={step5ChairAssets.foreground} style={rectStyle(geometry.chair)} />,
    keyboard: <LayerImage className="step5-contained-layer" layer="keyboard" src={step5KeyboardAsset} style={rectStyle(geometry.keyboard)} />,
    "monitor-front": <LayerImage className="step5-contained-layer" layer="monitor-front" src={step5MonitorAssets.front} style={rectStyle(geometry.monitor)} />,
    "monitor-back": <LayerImage className="step5-contained-layer" layer="monitor-back" src={step5MonitorAssets.back} style={rectStyle(geometry.monitor)} />,
    actor: (
      <span className="step5-actor-layer" data-layer="actor" style={rectStyle(geometry.actor)}>
        <Step5Actor manifest={manifest} orientation={orientation} tick={tick} />
      </span>
    ),
  };
  return (
    <article className="step5-station-card" data-orientation={orientation} data-zoom={zoom}>
      <header>
        <div><span>{orientation === "far" ? "FAR / FRONT" : "NEAR / BACK"}</span><strong>{config.actorState}</strong></div>
        <small>chair outside desk · tick {tick}</small>
      </header>
      <div className="step5-stage-frame" style={{ "--step5-zoom": zoom } as CSSProperties}>
        <div
          aria-label={`${orientation} single-seat workstation assembly`}
          className="step5-station-stage"
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
              <i className="step5-debug-rect is-desk" style={rectStyle(geometry.deskFootprint)}><b>desk 3×2</b></i>
              <i className="step5-debug-rect is-chair" style={rectStyle(geometry.chairFootprint)}><b>chair 1×1</b></i>
              <i className="step5-debug-rect is-monitor" style={rectStyle(geometry.monitorReservation)}><b>monitor 3×1</b></i>
              <i className="step5-debug-rect is-keyboard" style={rectStyle(geometry.keyboardReservation)}><b>keyboard 3×1</b></i>
              <i className="step5-debug-pivot is-desk" style={{ left: geometry.deskPivot.x, top: geometry.deskPivot.y }} />
              <i className="step5-debug-pivot is-chair" style={{ left: geometry.chairPivot.x, top: geometry.chairPivot.y }} />
            </div>
          )}
        </div>
      </div>
      <footer>{config.assemblyOrderBackToFront.join(" → ")}</footer>
    </article>
  );
}
