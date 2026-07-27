import type { ResolvedOfficeObject } from "../layout/officeLayout";
import type { OfficePoint, OfficeWorkstation } from "../officeTypes";

export interface PairedWorkstationDepths {
  actor: number;
  chair: number;
  chairForeground: number;
  deskBase: number;
  deskForeground: number;
  equipmentBase: number;
}

export function pairedWorkstationDepths(
  station: OfficeWorkstation,
): PairedWorkstationDepths {
  const rowBase = 1_000 + Math.round(
    (station.collision.y + station.collision.height) * 100,
  );
  const nearViewerRow = station.facing === "up";
  return {
    chair: rowBase + 5,
    deskBase: rowBase + 10,
    equipmentBase: rowBase + (nearViewerRow ? 18 : 34),
    actor: rowBase + (nearViewerRow ? 34 : 16),
    chairForeground: rowBase + (nearViewerRow ? 28 : 20),
    deskForeground: rowBase + 30,
  };
}

export function workstationDeskRenderPoint(station: OfficeWorkstation): OfficePoint {
  return {
    x: station.collision.x + station.collision.width / 2,
    y: station.collision.y + station.collision.height,
  };
}

export function workstationSeatRenderPoint(station: OfficeWorkstation): OfficePoint {
  if (!station.seatCollision) return station.seat;
  return {
    x: station.seatCollision.x
      + station.seatCollision.width / 2
      + (station.seatRenderOffset?.x ?? 0),
    y: station.seatCollision.y
      + station.seatCollision.height
      + (station.seatRenderOffset?.y ?? 0),
  };
}

export function pairedObjectDepth(
  object: ResolvedOfficeObject,
  workstations: OfficeWorkstation[],
) {
  if (!object.parentId) return undefined;
  const station = workstations.find(({ id }) => id === object.parentId);
  if (!station) return undefined;
  const depths = pairedWorkstationDepths(station);
  const surfaceOrder = Math.round((object.y - station.y) * 3);
  return depths.equipmentBase + surfaceOrder;
}
