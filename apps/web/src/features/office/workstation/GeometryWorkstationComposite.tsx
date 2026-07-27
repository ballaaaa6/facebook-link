import type { CSSProperties, ReactNode } from "react";
import type {
  OfficeWorkstationBundleV1,
  OfficeWorkstationPreset,
} from "@affiliate-ops/contracts";
import {
  chairAssets,
  deskPartAssets,
  keyboardMouse,
  monitorAssets,
  roleEquipmentAssets,
  screenFrames,
} from "./workstationAssets";
import {
  screenFrameAt,
  stationSortPivotY,
  workstationLayerDepths,
  type WorkstationLabStation,
} from "./workstationBundleRuntime";

interface GeometryWorkstationCompositeProps {
  actor?: ReactNode;
  bundle: OfficeWorkstationBundleV1;
  debug: boolean;
  elapsedMs: number;
  equipmentDebug?: boolean;
  grid: { width: number; height: number };
  label?: string;
  pose: "seated" | "standing";
  preset?: OfficeWorkstationPreset;
  showActor: boolean;
  station: WorkstationLabStation;
}

function percent(value: number, total: number) {
  return `${(value / total) * 100}%`;
}

function equipmentAsset(kind: "tablet" | "phone" | "lamp") {
  return roleEquipmentAssets[kind];
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
  actor,
  bundle,
  debug,
  elapsedMs,
  equipmentDebug = false,
  grid,
  label,
  pose,
  preset,
  showActor,
  station,
}: GeometryWorkstationCompositeProps) {
  const orientation = station.orientation;
  const parts = deskPartAssets[orientation];
  const depths = workstationLayerDepths(stationSortPivotY(station));
  const frameIndex = screenFrameAt(
    elapsedMs,
    bundle.screenLoop.frameDurationMs,
    screenFrames.length,
  );
  const isFront = orientation === "front";
  const monitorEquipment = preset?.equipment.filter(({ kind }) => kind === "monitor-shell") ?? [];
  const monitors = monitorEquipment.length > 0
    ? monitorEquipment
    : [{ id: "monitor-main", slot: { x: 2.5, y: 0.75 } }];
  const roleEquipment = preset?.equipment.filter(({ kind }) => (
    kind === "tablet" || kind === "phone" || kind === "lamp"
  )) ?? [];
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
      {label && <span className="workstation-agent-label">{label}</span>}
      {debug && <div className="workstation-footprint-debug" data-debug="footprint" />}
      {debug && <div className="workstation-support-debug" data-debug="support-plane" />}
      <img alt="" className="workstation-desk-part" src={parts.rear} style={{ zIndex: depths["desk-rear"] }} />
      <img alt="" className="workstation-desk-part" src={parts.surface} style={{ zIndex: depths["desk-surface"] }} />
      <img alt="" className="workstation-desk-part" src={parts.base} style={{ zIndex: depths["desk-base"] }} />

      {monitors.map((monitor, index) => (
        <div
          className="workstation-monitor"
          data-monitor-index={index}
          key={monitor.id}
          style={{
            left: `${(monitor.slot.x / 5) * 100 - 18}%`,
            zIndex: depths["monitor-shell"],
          }}
        >
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
      ))}
      <img
        alt=""
        className="workstation-keyboard"
        src={keyboardMouse}
        style={{ zIndex: depths["surface-equipment"] }}
      />
      {roleEquipment.map((equipment) => (
        <img
          alt=""
          className={`workstation-role-equipment is-${equipment.kind}`}
          data-equipment-id={equipment.id}
          key={equipment.id}
          src={equipmentAsset(equipment.kind as "tablet" | "phone" | "lamp")}
          style={{
            left: `${(equipment.slot.x / 5) * 100}%`,
            top: `${20 + (equipment.slot.y / 3) * 40}%`,
            zIndex: depths["surface-equipment"],
          }}
        />
      ))}
      {equipmentDebug && preset?.equipment.map((equipment) => (
        <span
          className="workstation-slot-debug"
          data-slot-id={equipment.slot.id}
          key={`slot-${equipment.id}`}
          style={{
            left: `${(equipment.slot.x / 5) * 100}%`,
            top: `${20 + (equipment.slot.y / 3) * 60}%`,
          }}
          title={`${equipment.kind}: ${equipment.slot.id}`}
        />
      ))}
      <img
        alt=""
        className="workstation-chair"
        src={isFront ? chairAssets.front : chairAssets.back}
        style={{ zIndex: depths.chair }}
      />
      {showActor && (
        <div className={`workstation-actor-layer is-${pose}`} style={{ zIndex: depths.actor }}>
          {actor ?? <NeutralCalibrationActor pose={pose} />}
        </div>
      )}
      <img alt="" className="workstation-desk-part" src={parts.foreground} style={{ zIndex: depths["desk-foreground"] }} />
      {debug && <span className="workstation-sort-pivot" title={`sortPivot.y=${stationSortPivotY(station)}`} />}
    </section>
  );
}
