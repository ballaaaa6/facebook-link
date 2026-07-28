import type { OfficeWorkstationStep5ManifestV1 } from "@affiliate-ops/contracts";

export type Step5Orientation = "far" | "near";

interface PixelRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface PixelPoint {
  x: number;
  y: number;
}

export interface Step5StationGeometry {
  actor: PixelRect;
  chair: PixelRect;
  chairFootprint: PixelRect;
  chairPivot: PixelPoint;
  desk: PixelRect;
  deskFootprint: PixelRect;
  deskPivot: PixelPoint;
  keyboard: PixelRect;
  keyboardReservation: PixelRect;
  monitor: PixelRect;
  monitorReservation: PixelRect;
}

function pixelRect(bounds: { x: number; y: number; width: number; depth: number }, tile: number): PixelRect {
  return { left: bounds.x * tile, top: bounds.y * tile, width: bounds.width * tile, height: bounds.depth * tile };
}

export function step5FrameForTick(tick: number, frames: number) {
  if (!Number.isFinite(tick) || tick < 0 || frames <= 0) return 0;
  return Math.floor(tick) % frames;
}

export function step5StationGeometry(
  manifest: OfficeWorkstationStep5ManifestV1,
  orientation: Step5Orientation,
): Step5StationGeometry {
  const { desk, equipment } = manifest.station;
  const config = manifest.orientations[orientation];
  const tile = manifest.station.canvas.tilePixels;
  const deskPivot = {
    x: (desk.origin.x + desk.basePivot.x) * tile,
    y: (desk.origin.y + desk.basePivot.y) * tile,
  };
  const deskRect = {
    left: deskPivot.x - desk.sourcePivotPixels.x,
    top: deskPivot.y - desk.sourcePivotPixels.y,
    width: desk.renderPixels.width,
    height: desk.renderPixels.height,
  };
  const absolute = (relative: { x: number; y: number; width: number; depth: number }) => ({
    x: desk.origin.x + relative.x,
    y: desk.origin.y + relative.y,
    width: relative.width,
    depth: relative.depth,
  });
  const chairFootprintBounds = absolute(config.chairFootprintRelative);
  const monitorBounds = absolute(config.monitorReservationRelative);
  const keyboardBounds = absolute(config.keyboardReservationRelative);
  const chairPivot = {
    x: (chairFootprintBounds.x + chairFootprintBounds.width / 2) * tile,
    y: (chairFootprintBounds.y + chairFootprintBounds.depth) * tile,
  };
  const surfaceTop = deskRect.top + desk.surfaceRows.start;
  const surfaceHeight = desk.surfaceRows.endExclusive - desk.surfaceRows.start;
  const surfaceRowHeight = surfaceHeight / desk.footprint.depth;
  const equipmentCenterX = (desk.origin.x + 1.5) * tile;
  const monitorPixels = equipment.monitor.renderPixels as { width: number; height: number };
  const keyboardPixels = equipment.keyboard.renderPixels as { width: number; height: number };
  const chairPixels = equipment.chair.renderPixels as { width: number; height: number };
  const actorPixels = equipment.actor.renderPixels as { width: number; height: number };
  const monitorBottom = surfaceTop + (config.monitorReservationRelative.y + 1) * surfaceRowHeight;
  const keyboardCenterY = surfaceTop + (config.keyboardReservationRelative.y + 0.5) * surfaceRowHeight;
  return {
    actor: {
      left: chairPivot.x - actorPixels.width / 2,
      top: chairPivot.y - actorPixels.height,
      ...actorPixels,
    },
    chair: {
      left: chairPivot.x - chairPixels.width / 2,
      top: chairPivot.y - chairPixels.height,
      ...chairPixels,
    },
    chairFootprint: pixelRect(chairFootprintBounds, tile),
    chairPivot,
    desk: deskRect,
    deskFootprint: pixelRect({ ...desk.origin, ...desk.footprint }, tile),
    deskPivot,
    keyboard: {
      left: equipmentCenterX - keyboardPixels.width / 2,
      top: keyboardCenterY - keyboardPixels.height / 2,
      ...keyboardPixels,
    },
    keyboardReservation: pixelRect(keyboardBounds, tile),
    monitor: {
      left: equipmentCenterX - monitorPixels.width / 2,
      top: monitorBottom - monitorPixels.height,
      ...monitorPixels,
    },
    monitorReservation: pixelRect(monitorBounds, tile),
  };
}

export function step5AnchorsStable(
  manifest: OfficeWorkstationStep5ManifestV1,
  orientation: Step5Orientation,
  ticks: readonly number[],
) {
  const expected = JSON.stringify(step5StationGeometry(manifest, orientation));
  return ticks.every(() => JSON.stringify(step5StationGeometry(manifest, orientation)) === expected);
}
