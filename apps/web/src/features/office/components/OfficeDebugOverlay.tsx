import type { OfficeMapDefinition } from "../officeTypes";

export function OfficeDebugOverlay({
  map,
  percentX,
  percentY,
}: {
  map: OfficeMapDefinition;
  percentX: (value: number) => string;
  percentY: (value: number) => string;
}) {
  return (
    <div className="office-debug-overlay" aria-hidden="true">
      {map.surfaces.map((surface) => (
        <span
          className={`office-debug-rect office-debug-surface office-debug-surface-${surface.support}`}
          data-debug-surface={surface.id}
          data-label={`${surface.support}: ${surface.id}`}
          key={`surface-${surface.id}`}
          style={{
            left: percentX(surface.x),
            top: percentY(surface.y),
            width: percentX(surface.width),
            height: percentY(surface.height),
          }}
        />
      ))}
      {map.routes.map((route) => (
        <span
          className="office-debug-rect office-debug-route"
          data-debug-route={route.id}
          data-label={route.id}
          key={`route-${route.id}`}
          style={{
            left: percentX(route.x),
            top: percentY(route.y),
            width: percentX(route.width),
            height: percentY(route.height),
          }}
        />
      ))}
      {map.workstations.map((station) => (
        <div key={`workstation-${station.id}`}>
          <span
            className="office-debug-rect office-debug-workstation"
            data-debug-workstation={station.id}
            data-label={station.id}
            style={{
              left: percentX(station.collision.x),
              top: percentY(station.collision.y),
              width: percentX(station.collision.width),
              height: percentY(station.collision.height),
            }}
          />
          <i
            className="office-debug-anchor"
            data-debug-seat={station.id}
            style={{
              left: percentX(station.seat.x),
              top: percentY(station.seat.y),
            }}
          />
        </div>
      ))}
    </div>
  );
}
