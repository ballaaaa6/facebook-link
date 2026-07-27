import type {
  DoorOpening,
  OfficeMapV2,
  StructureBounds,
  WallSegment,
  WindowOpening,
} from "@affiliate-ops/contracts";

export function structurePercentRect(bounds: StructureBounds, grid: OfficeMapV2["grid"]) {
  return {
    left: `${(bounds.x / grid.width) * 100}%`,
    top: `${(bounds.y / grid.height) * 100}%`,
    width: `${(bounds.width / grid.width) * 100}%`,
    height: `${(bounds.height / grid.height) * 100}%`,
  };
}

export function openingWorldBounds(
  opening: WindowOpening | DoorOpening,
  wall: WallSegment,
): StructureBounds {
  return {
    x: wall.bounds.x + opening.opening.x,
    y: wall.bounds.y + opening.opening.y,
    width: opening.opening.width,
    height: opening.opening.height,
  };
}

export function windowViewportWorldBounds(
  window: WindowOpening,
  wall: WallSegment,
): StructureBounds {
  const opening = openingWorldBounds(window, wall);
  return {
    x: opening.x + window.viewport.x,
    y: opening.y + window.viewport.y,
    width: window.viewport.width,
    height: window.viewport.height,
  };
}

export function portalStatus(doorState: "open" | "closed") {
  return doorState === "open" ? "passable" : "blocked";
}
