import type { ResolvedOfficeObject } from "../layout/officeLayout";
import type { OfficeWorkstation } from "../officeTypes";

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
  const rowBase = 1_000 + Math.round(station.y * 100);
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

export function pairedObjectDepth(
  object: ResolvedOfficeObject,
  workstations: OfficeWorkstation[],
) {
  if (!object.parentId) return undefined;
  const station = workstations.find(({ id }) => id === object.parentId);
  if (!station) return undefined;
  const depths = pairedWorkstationDepths(station);
  const surfaceOrder = Math.round((object.depthY - station.y) * 3);
  return depths.equipmentBase + surfaceOrder;
}
