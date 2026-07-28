import type {
  OfficeCharacterSeatSocketsManifest,
  OfficeWorkstationStep5R05R02Manifest,
  WorkstationSeatCapableCharacter,
} from "@affiliate-ops/contracts";
import manifestJson from "../../../../../../../assets/game/manifests/office-workstation-step5-r05-r02.json";
import socketsJson from "../../../../../../../assets/game/manifests/office-character-seat-sockets-v1.json";
import pairMapJson from "../../../../../../../assets/game/maps/office-workstation-pair-r05-r02.json";
import rejectedTenMapJson from "../../../../../../../assets/game/maps/office-ten-r05.json";

export type R05Orientation = "far" | "near";

export interface R05Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface R05Point {
  x: number;
  y: number;
}

export interface R05ResolvedGeometry {
  desk: R05Rect;
  support: R05Rect;
  actor: R05Rect;
  chair: R05Rect;
  seatSocket: R05Point;
  actorSeatSocketLocal: R05Point;
  floorSocket: R05Point;
  monitor: R05Rect;
  monitorSocket: R05Point;
  monitorReservation: R05Rect;
  keyboard: R05Rect;
  keyboardReservation: R05Rect;
}

export interface R05PairMap {
  id: "office-workstation-pair-r05-r02";
  status: "owner-review-p0-p3";
  developmentOnly: true;
  activeOfficePromotion: false;
  deskPair: {
    originDeltaTiles: readonly [0, 2, 0];
    originDeltaPixels: readonly [0, 64];
    topGapPixels: 0;
    rearBaseVisibleBehindNearTopPixels: 0;
  };
  occupants: Record<R05Orientation, { agentId: string; slug: string }>;
}

export interface R05MapStation {
  id: string;
  agentId: string;
  characterSlug: string;
  orientation: R05Orientation;
  desk: { x: number; y: number; width: 3; depth: 2 };
}

export interface R05RejectedTenSeatMap {
  status: "owner-review";
  workstations: R05MapStation[];
  renderProjection: {
    stagePixels: [number, number];
    worldOffsetX: number;
    deskTopPixels: Record<R05Orientation, number>;
  };
}

export const r05Manifest = manifestJson as unknown as OfficeWorkstationStep5R05R02Manifest;
export const r05SeatSockets = socketsJson as unknown as OfficeCharacterSeatSocketsManifest;
export const r05PairMap = pairMapJson as unknown as R05PairMap;
export const r05TenSeatMap = rejectedTenMapJson as unknown as R05RejectedTenSeatMap;

const seatedSocketEntries = Object.fromEntries(
  r05SeatSockets.entries
    .filter((entry): entry is WorkstationSeatCapableCharacter => entry.seatCapability === "working-seated")
    .map((entry) => [entry.slug, entry]),
);

export function r05FrameForTick(tick: number) {
  if (!Number.isFinite(tick) || tick < 0) return 0;
  return Math.floor(tick) % r05Manifest.station.animation.frames;
}

export function r05ActorSeatSocket(slug: string, orientation: R05Orientation, frame: number): R05Point {
  const entry = seatedSocketEntries[slug] ?? seatedSocketEntries.einstein;
  const actorOrientation = orientation === "far" ? "front" : "back";
  const socket = entry.orientations[actorOrientation].frames[frame]?.seatContactLocal
    ?? entry.orientations[actorOrientation].frames[0].seatContactLocal;
  return { x: socket[0], y: socket[1] };
}

export function r05Geometry(orientation: R05Orientation, slug: string, frame: number): R05ResolvedGeometry {
  const deskLeft = 208;
  const deskTop = 180;
  const chairTop = orientation === "far" ? 100 : 196;
  const seatSocket = { x: 256, y: chairTop + 80 };
  const actorSeatSocketLocal = r05ActorSeatSocket(slug, orientation, frame);
  const actorLeft = seatSocket.x - actorSeatSocketLocal.x;
  const actorTop = seatSocket.y - actorSeatSocketLocal.y;
  const monitorTop = orientation === "far" ? 188 : 156;
  const keyboardTop = orientation === "far" ? 184 : 216;
  return {
    desk: { left: deskLeft, top: deskTop, width: 96, height: 128 },
    support: { left: deskLeft, top: deskTop, width: 96, height: 64 },
    actor: { left: actorLeft, top: actorTop, width: 96, height: 104 },
    chair: { left: deskLeft, top: chairTop, width: 96, height: 112 },
    seatSocket,
    actorSeatSocketLocal,
    floorSocket: { x: 256, y: chairTop + 112 },
    monitor: { left: 230, top: monitorTop, width: 52, height: 40 },
    monitorSocket: { x: 256, y: monitorTop + 40 },
    monitorReservation: {
      left: 208,
      top: orientation === "far" ? 212 : 180,
      width: 96,
      height: 32,
    },
    keyboard: { left: 232, top: keyboardTop, width: 48, height: 24 },
    keyboardReservation: {
      left: 240,
      top: orientation === "far" ? 180 : 212,
      width: 32,
      height: 32,
    },
  };
}

export function r05LayerOrder(orientation: R05Orientation) {
  return r05Manifest.station.layerOrder[orientation];
}

export function r05DeskRenderPoint(station: R05MapStation) {
  const projection = r05TenSeatMap.renderProjection;
  return {
    left: projection.worldOffsetX + station.desk.x * 32,
    top: projection.deskTopPixels[station.orientation],
  };
}
