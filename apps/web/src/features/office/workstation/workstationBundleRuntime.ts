import {
  workstationCompositeOrder,
  type OfficeWorkstationBundleV1,
} from "@affiliate-ops/contracts";

export type WorkstationOrientation = "front" | "back" | "left" | "right";
export type WorkstationPose = "seated" | "standing";
export type WorkstationRole = "standard" | "creative" | "noc";

export interface WorkstationLabStation {
  id: string;
  role: WorkstationRole;
  orientation: WorkstationOrientation;
  facing: "up" | "down" | "left" | "right";
  footprint: { x: number; y: number; width: number; depth: number };
  seat: { x: number; y: number; width: number; depth: number };
  pose: WorkstationPose;
}

export interface WorkstationLabMap {
  version: 1;
  id: string;
  status: "accepted-staging";
  activeOfficePromotion: false;
  bundleId: string;
  grid: { width: number; height: number; tilePixels: number };
  stations: WorkstationLabStation[];
  acceptance: {
    requiredDurationSeconds: number;
    requiredViews: string[];
    activeOfficeMustRemainUnchanged: true;
    commercialCharacterApproval: false;
  };
}

export function screenFrameAt(elapsedMs: number, frameDurationMs: number, frameCount: number) {
  if (elapsedMs < 0 || frameDurationMs <= 0 || frameCount <= 0) return 0;
  return Math.floor(elapsedMs / frameDurationMs) % frameCount;
}

export function workstationLayerDepths(sortPivotY: number) {
  const stationBase = Math.round(sortPivotY * 100);
  return Object.fromEntries(workstationCompositeOrder.map((role, index) => [
    role,
    stationBase + index,
  ])) as Record<(typeof workstationCompositeOrder)[number], number>;
}

export function stationSortPivotY(station: WorkstationLabStation) {
  return station.footprint.y + station.footprint.depth;
}

export function validateWorkstationLabMap(
  map: WorkstationLabMap,
  bundle: OfficeWorkstationBundleV1,
) {
  const issues: string[] = [];
  if (map.status !== "accepted-staging" || map.activeOfficePromotion !== false) {
    issues.push("lab must remain accepted-staging with Active Office promotion disabled");
  }
  if (map.bundleId !== bundle.id) issues.push("lab bundleId must reference Workstation Bundle v1");
  if (map.stations.length !== 2) issues.push("vertical slice must contain exactly two workstations");
  for (const station of map.stations) {
    if (station.footprint.width !== 5 || station.footprint.depth !== 4) {
      issues.push(`${station.id}: footprint must equal 5 x 4`);
    }
    if (station.seat.width !== 1 || station.seat.depth !== 1) {
      issues.push(`${station.id}: seat footprint must equal 1 x 1`);
    }
    if (!(station.orientation in bundle.deskFamily.orientations)) {
      issues.push(`${station.id}: orientation is not present in the desk family`);
    }
    const insideRoom = station.footprint.x >= 0 && station.footprint.y >= 0
      && station.footprint.x + station.footprint.width <= map.grid.width
      && station.footprint.y + station.footprint.depth <= map.grid.height;
    if (!insideRoom) issues.push(`${station.id}: footprint is outside the lab room`);
  }
  const sorted = [...map.stations].sort((left, right) => left.footprint.y - right.footprint.y);
  if (sorted.length === 2 && sorted[0]!.footprint.y + sorted[0]!.footprint.depth !== sorted[1]!.footprint.y) {
    issues.push("paired workstation footprints must touch without a gap or overlap");
  }
  if (!map.acceptance.activeOfficeMustRemainUnchanged) issues.push("Active Office isolation is required");
  if (map.acceptance.commercialCharacterApproval) issues.push("calibration actor cannot imply commercial character approval");
  return issues;
}
