import type { WorkstationDeploymentV1 } from "./officeWorkstationDeployment.ts";

export interface StructureBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FloorRegion {
  id: string;
  kind: "floor-region";
  bounds: StructureBounds;
  material: string;
  navigationPolicy: "walkable" | "restricted";
  collisionOwner: true;
}

export interface WallSegment {
  id: string;
  kind: "wall-segment";
  bounds: StructureBounds;
  material: string;
  coordinateSpace: "wall-local";
  floorYSort: false;
}

export interface WindowOpening {
  id: string;
  kind: "window-opening";
  parentWallId: string;
  opening: StructureBounds & { coordinateSpace: "wall-local" };
  viewport: StructureBounds & { coordinateSpace: "viewport-local" };
  frameAssetId: string;
  contentSetId: string;
  floorCollision: false;
}

export interface DoorOpening {
  id: string;
  kind: "door-opening";
  parentWallId: string;
  portalId: string;
  opening: StructureBounds & { coordinateSpace: "wall-local" };
  frameAssetId: string;
  leafAssetId: string;
  state: "open" | "closed";
  floorYSort: false;
}

export type OfficeStructure = FloorRegion | WallSegment | WindowOpening | DoorOpening;

export interface OfficePortal {
  id: string;
  doorOpeningId: string;
  cells: readonly { x: number; y: number }[];
  statePolicy: { open: "passable"; closed: "blocked" };
}

export interface OfficeMapV2 {
  schemaVersion: 2;
  id: string;
  status: "geometry-accepted-staging" | "accepted-staging";
  activeOfficePromotion: false;
  commercialCharacterApproval: false;
  grid: { width: number; height: number; tilePixels: number };
  structures: readonly OfficeStructure[];
  portals: readonly OfficePortal[];
  routes: readonly (StructureBounds & { id: string })[];
  workstationDeployments: readonly WorkstationDeploymentV1[];
  acceptance: {
    requiredDurationSeconds: number;
    sharedSceneClock: true;
    backgroundBitmapAllowed: false;
  };
}

function inside(point: { x: number; y: number }, bounds: StructureBounds) {
  return point.x >= bounds.x && point.y >= bounds.y
    && point.x < bounds.x + bounds.width && point.y <= bounds.y + bounds.height;
}

type CollisionBounds = {
  x: number;
  y: number;
  width: number;
  height?: number;
  depth?: number;
};

function overlaps(left: CollisionBounds, right: CollisionBounds) {
  const leftHeight = left.height ?? left.depth ?? 0;
  const rightHeight = right.height ?? right.depth ?? 0;
  return left.x < right.x + right.width && left.x + left.width > right.x
    && left.y < right.y + rightHeight && left.y + leftHeight > right.y;
}

function add(issues: string[], condition: boolean, path: string, message: string) {
  if (!condition) issues.push(`${path}: ${message}`);
}

export function validateOfficeMapV2(map: OfficeMapV2) {
  const issues: string[] = [];
  add(issues, map.schemaVersion === 2, "schemaVersion", "must equal 2");
  add(issues, map.activeOfficePromotion === false, "activeOfficePromotion", "must remain disabled");
  add(issues, map.commercialCharacterApproval === false, "commercialCharacterApproval", "must remain disabled");
  const structureIds = new Set<string>();
  for (const [index, structure] of map.structures.entries()) {
    add(issues, Boolean(structure.id) && !structureIds.has(structure.id), `structures[${index}].id`, "must be non-empty and unique");
    structureIds.add(structure.id);
  }
  const walls = new Map(map.structures.filter((item): item is WallSegment => item.kind === "wall-segment").map((wall) => [wall.id, wall]));
  const doors = new Map(map.structures.filter((item): item is DoorOpening => item.kind === "door-opening").map((door) => [door.id, door]));
  const floorIds = new Set(map.structures.filter((item) => item.kind === "floor-region").map((item) => item.id));
  for (const structure of map.structures) {
    if (structure.kind === "window-opening") {
      add(issues, walls.has(structure.parentWallId), `${structure.id}.parentWallId`, "must reference a wall segment");
      add(issues, structure.viewport.coordinateSpace === "viewport-local", `${structure.id}.viewport.coordinateSpace`, "must equal viewport-local");
      add(issues, structure.floorCollision === false, `${structure.id}.floorCollision`, "windows cannot create floor collision");
    }
    if (structure.kind === "door-opening") {
      add(issues, walls.has(structure.parentWallId), `${structure.id}.parentWallId`, "must reference a wall segment");
      add(issues, structure.floorYSort === false, `${structure.id}.floorYSort`, "doors are structural foreground");
    }
    if (structure.kind === "wall-segment") {
      add(issues, structure.coordinateSpace === "wall-local" && structure.floorYSort === false, structure.id, "wall objects must remain wall-local and outside floor Y-sort");
    }
  }
  for (const portal of map.portals) {
    const door = doors.get(portal.doorOpeningId);
    add(issues, Boolean(door), `${portal.id}.doorOpeningId`, "must reference a door opening");
    add(issues, door?.portalId === portal.id, `${portal.id}.doorOpeningId`, "must be referenced by its door opening");
    add(issues, portal.statePolicy.open === "passable" && portal.statePolicy.closed === "blocked", `${portal.id}.statePolicy`, "closed doors must block and open doors must pass");
    if (!door) continue;
    const wall = walls.get(door.parentWallId);
    if (!wall) continue;
    const worldOpening = {
      x: wall.bounds.x + door.opening.x,
      y: wall.bounds.y + door.opening.y,
      width: door.opening.width,
      height: door.opening.height,
    };
    for (const [cellIndex, cell] of portal.cells.entries()) {
      add(issues, inside(cell, worldOpening), `${portal.id}.cells[${cellIndex}]`, "must lie within the declared door opening");
    }
  }
  for (const deployment of map.workstationDeployments) {
    add(issues, floorIds.has(deployment.floorRegionId), `${deployment.id}.floorRegionId`, "must reference a floor-region structural ID");
    add(issues, deployment.deskFamilyId === "desk.modular.v1", `${deployment.id}.deskFamilyId`, "cannot change the canonical desk footprint");
    add(issues, deployment.footprint.width === 5 && deployment.footprint.depth === 4, `${deployment.id}.footprint`, "must equal 5 x 4");
    add(issues, deployment.supportPlane.width === 5 && deployment.supportPlane.depth === 3, `${deployment.id}.supportPlane`, "must equal 5 x 3");
    add(issues, !overlaps(deployment.seat, deployment.footprint), `${deployment.id}.seat`, "must remain outside the desk footprint");
    for (const route of map.routes) {
      add(issues, !overlaps(route, deployment.footprint) && !overlaps(route, deployment.seat), `${deployment.id}.${route.id}`, "route cannot cross desk or seat collision");
    }
  }
  return issues;
}
