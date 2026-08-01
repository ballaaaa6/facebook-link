import type { RoomTemplateDocument } from "@affiliate-ops/office-v2-contracts";
import type {
  BuildingTopologyDocument,
  FloorTopologyDocument,
} from "./building-topology-validation.ts";
import { validateRoomTemplate } from "./room-template-validation.ts";
import type {
  ScenePlanDocument,
  SceneReservedCore,
  WorldV2Document,
} from "./scene-plan-compiler.ts";
import {
  compareStrings,
  floorKey,
  sortCells,
} from "./scene-plan-compiler-support.ts";

export function compileWorld(
  plan: ScenePlanDocument,
  topology: BuildingTopologyDocument,
  room: RoomTemplateDocument,
  floor: FloorTopologyDocument,
  coreList: readonly SceneReservedCore[],
): WorldV2Document {
  const roomResult = validateRoomTemplate(room);
  const floorReference = floor.floor;
  const facilities = room.facilityGroups.flatMap((group) => group.facilities.map((facility) => ({
    id: facility.id,
    kind: "facility" as const,
    semantic: group.semantic,
    floor: floorReference,
    occupiedCells: sortCells(facility.placementSlot.occupiedCells),
    blocking: facility.placementSlot.navigationImpact === "blocking",
  })));
  const cores = coreList.map((core) => ({
    id: core.id,
    kind: core.kind,
    floor: core.floor,
    cells: sortCells(core.cells),
  }));
  const coreEntities = cores.map((core) => ({
    id: core.id,
    kind: "reserved-core" as const,
    semantic: core.kind,
    floor: core.floor,
    occupiedCells: core.cells,
    blocking: true,
  }));
  const actorSlots = room.actorSlots
    .slice()
    .sort((left, right) => compareStrings(left.id, right.id))
    .map((slot) => ({
      id: slot.id,
      assignment: slot.assignment,
      floor: floorReference,
      ...(slot.facilityId === undefined ? {} : { facilityId: slot.facilityId }),
      ...(slot.roleId === undefined ? {} : { roleId: slot.roleId }),
    }));
  const portals = topology.portals
    .filter((portal) => floorKey(portal.ownerFloor) === floorKey(floorReference))
    .sort((left, right) => compareStrings(`${left.id}@${left.version}`, `${right.id}@${right.version}`))
    .map((portal) => ({ id: portal.id, version: portal.version, kind: portal.kind }));
  return {
    schemaVersion: "office-world-v2-v1",
    building: plan.building,
    floor: floorReference,
    world: { id: floor.world.id, version: floor.world.version },
    bounds: floor.bounds,
    compositionProfile: plan.compositionProfile,
    rooms: [room.room],
    actorCapacity: {
      assigned: roomResult.counts.assignedActors,
      reserved: roomResult.counts.reservedActorSlots,
      maximum: roomResult.counts.totalActorSlots,
    },
    actorSlots,
    entities: [...facilities, ...coreEntities].sort((left, right) => compareStrings(left.id, right.id)),
    reservedCores: cores,
    portals,
  } as unknown as WorldV2Document;
}

export function hasSiteOccupancyLeak(value: unknown): boolean {
  return typeof value === "object" && value !== null && !Array.isArray(value) && (
    Object.hasOwn(value, "siteOccupancy")
    || Object.hasOwn(value, "siteEntities")
    || Object.hasOwn(value, "siteCells")
  );
}
