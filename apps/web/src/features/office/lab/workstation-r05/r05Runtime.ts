import type {
  OfficeWorkstationStep5R05FinalManifest,
  WorkstationStep5R05Geometry,
} from "@affiliate-ops/contracts";
import manifestJson from "../../../../../../../assets/game/manifests/office-workstation-step5-r05-final.json";
import mapJson from "../../../../../../../assets/game/maps/office-ten-r05.json";

export type R05Orientation = "far" | "near";

export interface R05MapStation {
  id: string;
  agentId: string;
  characterSlug: string;
  orientation: R05Orientation;
  desk: { x: number; y: number; width: 3; depth: 2 };
}

export interface R05TenSeatMap {
  id: string;
  status: "owner-review";
  workstations: R05MapStation[];
  renderProjection: {
    stagePixels: [number, number];
    worldOffsetX: number;
    deskTopPixels: Record<R05Orientation, number>;
  };
}

export const r05Manifest = manifestJson as unknown as OfficeWorkstationStep5R05FinalManifest;
export const r05TenSeatMap = mapJson as unknown as R05TenSeatMap;

export function r05FrameForTick(tick: number) {
  if (!Number.isFinite(tick) || tick < 0) return 0;
  return Math.floor(tick) % r05Manifest.station.animation.frames;
}

export function r05Geometry(orientation: R05Orientation): WorkstationStep5R05Geometry {
  return r05Manifest.station.geometry[orientation];
}

export function r05DeskRenderPoint(station: R05MapStation) {
  const projection = r05TenSeatMap.renderProjection;
  return {
    left: projection.worldOffsetX + station.desk.x * 32,
    top: projection.deskTopPixels[station.orientation],
  };
}
