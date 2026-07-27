import type { OfficeMapDefinition } from "../officeTypes";
import type { OfficeAssetDefinition, OfficeAssetSlot } from "./officeAssetRegistry";

export function OfficeDebugOverlay({
  map,
  percentX,
  percentY,
  assetRegistry,
  slotSets,
}: {
  map: OfficeMapDefinition;
  percentX: (value: number) => string;
  percentY: (value: number) => string;
  assetRegistry: Record<string, OfficeAssetDefinition>;
  slotSets: Record<string, Record<string, OfficeAssetSlot>>;
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
      {map.workstations.map((station) => {
        const desk = assetRegistry[station.desk];
        const slots = desk?.slotSet ? slotSets[desk.slotSet] : undefined;
        if (!slots) return null;
        const surfaceWidth = (desk.footprint?.width ?? desk.renderBox.width) * 0.9;
        const surfaceDepth = (desk.footprint?.depth ?? desk.renderBox.height) * 0.75;
        return (
          <span key={`${station.id}-desk-surface`}>
            <span
              className="office-debug-rect office-debug-desk-surface"
              data-label="desk surface"
              style={{
                left: percentX(station.x - surfaceWidth / 2),
                top: percentY(station.y - surfaceDepth / 2),
                width: percentX(surfaceWidth),
                height: percentY(surfaceDepth),
              }}
            />
            {Object.entries(slots)
              .filter(([slotId]) => slotId.startsWith("prop-"))
              .map(([slotId, slot]) => (
                <span
                  className="office-debug-prop-anchor"
                  data-prop-slot={slotId}
                  key={`${station.id}-${slotId}`}
                  style={{
                    left: percentX(station.x + slot.x),
                    top: percentY(station.y + slot.y),
                  }}
                />
              ))}
          </span>
        );
      })}
    </div>
  );
}
