import { useEffect, useState, type CSSProperties } from "react";
import type { OfficeWorkstationBundleV1 } from "@affiliate-ops/contracts";
import {
  chairAssets,
  deskPartAssets,
  keyboardMouse,
  monitorAssets,
  screenFrames,
} from "./workstationAssets";
import {
  screenFrameAt,
  stationSortPivotY,
  workstationLayerDepths,
  type WorkstationLabStation,
} from "./workstationBundleRuntime";

interface GeometryWorkstationCompositeProps {
  bundle: OfficeWorkstationBundleV1;
  debug: boolean;
  grid: { width: number; height: number };
  pose: "seated" | "standing";
  showActor: boolean;
  station: WorkstationLabStation;
}

function percent(value: number, total: number) {
  return `${(value / total) * 100}%`;
}

function NeutralCalibrationActor({ pose }: { pose: "seated" | "standing" }) {
  return (
    <div className={`workstation-neutral-actor is-${pose}`} data-calibration-actor="neutral">
      <i className="workstation-neutral-head" />
      <i className="workstation-neutral-body" />
      <i className="workstation-neutral-legs" />
    </div>
  );
}

export function GeometryWorkstationComposite({
  bundle,
  debug,
  grid,
  pose,
  showActor,
  station,
}: GeometryWorkstationCompositeProps) {
  const [elapsedMs, setElapsedMs] = useState(0);
  useEffect(() => {
    const started = performance.now();
    const timer = window.setInterval(() => setElapsedMs(performance.now() - started), 100);
    return () => window.clearInterval(timer);
  }, []);

  const orientation = station.orientation;
  const parts = deskPartAssets[orientation];
  const depths = workstationLayerDepths(stationSortPivotY(station));
  const frameIndex = screenFrameAt(
    elapsedMs,
    bundle.screenLoop.frameDurationMs,
    screenFrames.length,
  );
  const isFront = orientation === "front";
  const wrapperStyle: CSSProperties = {
    left: percent(station.footprint.x, grid.width),
    top: percent(station.footprint.y + station.footprint.depth - 5, grid.height),
    width: percent(5, grid.width),
    height: percent(5, grid.height),
    zIndex: Math.floor(stationSortPivotY(station) * 100),
  };

  return (
    <section
      aria-label={`${station.role} workstation facing ${station.facing}`}
      className="geometry-workstation"
      data-facing={station.facing}
      data-orientation={orientation}
      data-station-id={station.id}
      style={wrapperStyle}
    >
      {debug && <div className="workstation-footprint-debug" data-debug="footprint" />}
      {debug && <div className="workstation-support-debug" data-debug="support-plane" />}
      <img alt="" className="workstation-desk-part" src={parts.rear} style={{ zIndex: depths["desk-rear"] }} />
      <img alt="" className="workstation-desk-part" src={parts.surface} style={{ zIndex: depths["desk-surface"] }} />
      <img alt="" className="workstation-desk-part" src={parts.base} style={{ zIndex: depths["desk-base"] }} />

      <div className="workstation-monitor" style={{ zIndex: depths["monitor-shell"] }}>
        <img alt="" className="workstation-monitor-shell" src={isFront ? monitorAssets.front : monitorAssets.back} />
        {isFront && (
          <span
            className="workstation-monitor-viewport"
            data-coordinate-space={bundle.screenLoop.coordinateSpace}
            data-parent-viewport={bundle.screenLoop.parentViewportId}
            style={{ zIndex: depths["monitor-viewport"] }}
          >
            <img alt="Animated system status" src={screenFrames[frameIndex]} />
          </span>
        )}
      </div>
      <img
        alt=""
        className="workstation-keyboard"
        src={keyboardMouse}
        style={{ zIndex: depths["surface-equipment"] }}
      />
      <img
        alt=""
        className="workstation-chair"
        src={isFront ? chairAssets.front : chairAssets.back}
        style={{ zIndex: depths.chair }}
      />
      {showActor && (
        <div className="workstation-actor-layer" style={{ zIndex: depths.actor }}>
          <NeutralCalibrationActor pose={pose} />
        </div>
      )}
      <img alt="" className="workstation-desk-part" src={parts.foreground} style={{ zIndex: depths["desk-foreground"] }} />
      {debug && <span className="workstation-sort-pivot" title={`sortPivot.y=${stationSortPivotY(station)}`} />}
    </section>
  );
}
