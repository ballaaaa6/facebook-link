export type TooltipPreference = "auto" | "left" | "right";
export type TooltipSide = Exclude<TooltipPreference, "auto">;

export interface PlacementRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
}

export interface TooltipPlacement {
  left: number;
  top: number;
  side: TooltipSide;
  arrowTop: number;
}

interface PlacementCandidate extends TooltipPlacement {
  overflow: number;
  score: number;
}

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.max(minimum, Math.min(maximum, value));

function overlapArea(a: PlacementRect, b: PlacementRect) {
  const width = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const height = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  return width * height;
}

function candidateForSide({
  side,
  anchor,
  tooltip,
  bounds,
  obstacles,
  gap,
  margin,
}: {
  side: TooltipSide;
  anchor: PlacementRect;
  tooltip: { width: number; height: number };
  bounds: PlacementRect;
  obstacles: readonly PlacementRect[];
  gap: number;
  margin: number;
}): PlacementCandidate {
  const rawLeft = side === "right"
    ? anchor.right + gap
    : anchor.left - tooltip.width - gap;
  const minimumLeft = bounds.left + margin;
  const maximumLeft = Math.max(minimumLeft, bounds.right - margin - tooltip.width);
  const left = clamp(rawLeft, minimumLeft, maximumLeft);
  const centeredTop = anchor.top + anchor.height / 2 - tooltip.height / 2;
  const minimumTop = bounds.top + margin;
  const maximumTop = Math.max(minimumTop, bounds.bottom - margin - tooltip.height);
  const centeredTopInBounds = clamp(centeredTop, minimumTop, maximumTop);
  const attachedMinimumTop = Math.max(minimumTop, anchor.top - gap - tooltip.height);
  const attachedMaximumTop = Math.min(maximumTop, anchor.bottom + gap);
  const hasAttachedRange = attachedMinimumTop <= attachedMaximumTop;
  const localMinimumTop = hasAttachedRange ? attachedMinimumTop : centeredTopInBounds;
  const localMaximumTop = hasAttachedRange ? attachedMaximumTop : centeredTopInBounds;
  const topOptions = new Set([
    centeredTop,
    anchor.top,
    anchor.bottom - tooltip.height,
    anchor.top - tooltip.height - gap,
    anchor.bottom + gap,
    minimumTop,
    maximumTop,
  ]);
  for (const obstacle of obstacles) {
    topOptions.add(obstacle.top - tooltip.height - gap);
    topOptions.add(obstacle.bottom + gap);
  }

  const overflow = Math.max(0, minimumLeft - rawLeft)
    + Math.max(0, rawLeft + tooltip.width - (bounds.right - margin));
  let bestTop = centeredTopInBounds;
  let bestScore = Number.POSITIVE_INFINITY;
  for (const option of topOptions) {
    const top = clamp(option, localMinimumTop, localMaximumTop);
    const rect = {
      left,
      right: left + tooltip.width,
      top,
      bottom: top + tooltip.height,
      width: tooltip.width,
      height: tooltip.height,
    };
    const obstacleOverlap = obstacles.reduce((total, obstacle) => total + overlapArea(rect, obstacle), 0);
    const anchorOverlap = overlapArea(rect, anchor);
    const displacement = Math.abs(top - centeredTop);
    const score = overflow * 10_000 + anchorOverlap * 50 + obstacleOverlap * 4 + displacement;
    if (score < bestScore) {
      bestScore = score;
      bestTop = top;
    }
  }
  const anchorCenter = anchor.top + anchor.height / 2;
  return {
    left,
    top: bestTop,
    side,
    arrowTop: clamp(anchorCenter - bestTop, 12, Math.max(12, tooltip.height - 12)),
    overflow,
    score: bestScore,
  };
}

export function placeAgentTooltip({
  anchor,
  tooltip,
  bounds,
  obstacles = [],
  preference = "auto",
  gap = 10,
  margin = 8,
}: {
  anchor: PlacementRect;
  tooltip: { width: number; height: number };
  bounds: PlacementRect;
  obstacles?: readonly PlacementRect[];
  preference?: TooltipPreference;
  gap?: number;
  margin?: number;
}): TooltipPlacement {
  const left = candidateForSide({
    side: "left",
    anchor,
    tooltip,
    bounds,
    obstacles,
    gap,
    margin,
  });
  const right = candidateForSide({
    side: "right",
    anchor,
    tooltip,
    bounds,
    obstacles,
    gap,
    margin,
  });
  if (preference !== "auto") {
    const preferred = preference === "left" ? left : right;
    if (preferred.overflow === 0) return preferred;
  }
  return left.score <= right.score ? left : right;
}
