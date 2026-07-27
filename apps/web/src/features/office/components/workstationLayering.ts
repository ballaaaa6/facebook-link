import type { ResolvedOfficeObject } from "../layout/officeLayout";
import type { OfficeWorkstation } from "../officeTypes";

export function pairedObjectDepth(
  object: ResolvedOfficeObject,
  workstations: OfficeWorkstation[],
) {
  if (!object.parentId) return undefined;
  const station = workstations.find(({ id }) => id === object.parentId);
  if (!station) return undefined;
  const deskDepth = 100 + Math.round(station.y * 20);
  if (station.facing === "up") return deskDepth - 4;
  return deskDepth + (object.slot?.includes("rear") || object.slot === "monitor" ? 0 : 1);
}
