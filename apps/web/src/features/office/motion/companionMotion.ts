import type { OfficeCompanion, OfficePoint } from "../officeTypes";

export interface CompanionPresentation {
  position: OfficePoint;
  state: "idle" | "walk-left" | "walk-right";
}

const distance = (from: OfficePoint, to: OfficePoint) =>
  Math.hypot(to.x - from.x, to.y - from.y);

export function companionPresentationAt(
  elapsedSeconds: number,
  companion: OfficeCompanion,
): CompanionPresentation {
  const points = [companion.home, ...companion.route, companion.home];
  const segments = points.slice(1).map((point, index) => ({
    from: points[index]!,
    to: point,
    length: distance(points[index]!, point),
  }));
  const travelDistance = segments.reduce((sum, segment) => sum + segment.length, 0);
  const travelSeconds = travelDistance / companion.speedTilesPerSecond;
  const cycleSeconds = companion.dwellSeconds * 2 + travelSeconds;
  const cycleElapsed = elapsedSeconds % cycleSeconds;
  if (cycleElapsed < companion.dwellSeconds || cycleElapsed >= companion.dwellSeconds + travelSeconds) {
    return { position: companion.home, state: "idle" };
  }

  let remaining = (cycleElapsed - companion.dwellSeconds) * companion.speedTilesPerSecond;
  for (const segment of segments) {
    if (remaining <= segment.length) {
      const progress = segment.length === 0 ? 1 : remaining / segment.length;
      return {
        position: {
          x: segment.from.x + (segment.to.x - segment.from.x) * progress,
          y: segment.from.y + (segment.to.y - segment.from.y) * progress,
        },
        state: segment.to.x < segment.from.x ? "walk-left" : "walk-right",
      };
    }
    remaining -= segment.length;
  }
  return { position: companion.home, state: "idle" };
}
