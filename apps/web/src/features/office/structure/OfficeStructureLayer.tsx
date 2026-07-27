import type {
  DoorOpening,
  FloorRegion,
  OfficeMapV2,
  WallSegment,
  WindowOpening,
} from "@affiliate-ops/contracts";
import type { OfficeSeason, OfficeTimeOfDay } from "../components/officeSceneTime";
import { structuralDoorLeaf, structuralWindowView } from "./structuralSceneAssets";
import {
  openingWorldBounds,
  portalStatus,
  structurePercentRect,
  windowViewportWorldBounds,
} from "./structuralSceneRuntime";

interface OfficeStructureLayerProps {
  debug: boolean;
  doorState: "open" | "closed";
  map: OfficeMapV2;
  season: OfficeSeason;
  timeOfDay: OfficeTimeOfDay;
}

export function OfficeStructureLayer({
  debug,
  doorState,
  map,
  season,
  timeOfDay,
}: OfficeStructureLayerProps) {
  const floors = map.structures.filter((item): item is FloorRegion => item.kind === "floor-region");
  const walls = map.structures.filter((item): item is WallSegment => item.kind === "wall-segment");
  const windows = map.structures.filter((item): item is WindowOpening => item.kind === "window-opening");
  const doors = map.structures.filter((item): item is DoorOpening => item.kind === "door-opening");
  const wallById = new Map(walls.map((wall) => [wall.id, wall]));

  return (
    <>
      {windows.map((window) => {
        const wall = wallById.get(window.parentWallId);
        if (!wall) return null;
        return (
          <img
            alt={`${season} ${timeOfDay} window view`}
            className="office-ten-window-content"
            data-coordinate-space={window.viewport.coordinateSpace}
            key={`content-${window.id}`}
            src={structuralWindowView(season, timeOfDay)}
            style={structurePercentRect(windowViewportWorldBounds(window, wall), map.grid)}
          />
        );
      })}
      {floors.map((floor) => (
        <div
          className="office-ten-floor"
          data-material={floor.material}
          data-structure-id={floor.id}
          key={floor.id}
          style={structurePercentRect(floor.bounds, map.grid)}
        />
      ))}
      {walls.map((wall) => (
        <div
          className="office-ten-wall"
          data-coordinate-space={wall.coordinateSpace}
          data-floor-y-sort={String(wall.floorYSort)}
          data-structure-id={wall.id}
          key={wall.id}
          style={structurePercentRect(wall.bounds, map.grid)}
        />
      ))}
      {windows.map((window) => {
        const wall = wallById.get(window.parentWallId);
        if (!wall) return null;
        return (
          <div
            className="office-ten-window-frame"
            data-parent-wall={wall.id}
            key={`frame-${window.id}`}
            style={structurePercentRect(openingWorldBounds(window, wall), map.grid)}
          />
        );
      })}
      {doors.map((door) => {
        const wall = wallById.get(door.parentWallId);
        if (!wall) return null;
        return (
          <div
            className="office-ten-door"
            data-door-state={doorState}
            data-floor-y-sort={String(door.floorYSort)}
            data-parent-wall={wall.id}
            data-portal-status={portalStatus(doorState)}
            key={door.id}
            style={structurePercentRect(openingWorldBounds(door, wall), map.grid)}
          >
            <span className="office-ten-door-opening" />
            {doorState === "closed" && <img alt="" className="office-ten-door-leaf" src={structuralDoorLeaf} />}
            <span className="office-ten-door-frame" />
            <span className="office-ten-door-threshold" />
          </div>
        );
      })}
      {debug && map.routes.map((route) => (
        <span
          className="office-ten-route-debug"
          data-route-id={route.id}
          key={route.id}
          style={structurePercentRect(route, map.grid)}
        />
      ))}
      {debug && map.portals.flatMap((portal) => portal.cells.map((cell, index) => (
        <span
          className="office-ten-portal-debug"
          data-portal-state={portalStatus(doorState)}
          key={`${portal.id}-${index}`}
          style={structurePercentRect({ ...cell, width: 1, height: 1 }, map.grid)}
          title={`${portal.id}: ${portalStatus(doorState)}`}
        />
      )))}
    </>
  );
}
