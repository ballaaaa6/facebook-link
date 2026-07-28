import { officeCharacterFrameForTile, type OfficeWorkstationStep5ManifestV2 } from "@affiliate-ops/contracts";

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
  actorFootprint: PixelRect;
  actorLogicalVolume: PixelRect;
  chair: PixelRect;
  chairFootprint: PixelRect;
  chairLogicalVolume: PixelRect;
  chairPivot: PixelPoint;
  desk: PixelRect;
  deskFootprint: PixelRect;
  deskPivot: PixelPoint;
  hipAnchor: PixelPoint;
  keyboard: PixelRect;
  keyboardReservation: PixelRect;
  monitor: PixelRect;
  monitorReservation: PixelRect;
  seatAnchor: PixelPoint;
}

function pixelRect(bounds: { x: number; y: number; width: number; depth: number }, tile: number): PixelRect {
  return { left: bounds.x * tile, top: bounds.y * tile, width: bounds.width * tile, height: bounds.depth * tile };
}

export function step5FrameForTick(tick: number, frames: number) {
  if (!Number.isFinite(tick) || tick < 0 || frames <= 0) return 0;
  return Math.floor(tick) % frames;
}

export function step5StationGeometry(
  manifest: OfficeWorkstationStep5ManifestV2,
  orientation: Step5Orientation,
): Step5StationGeometry {
  const { character, desk, equipment } = manifest.station;
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
  const chairBounds = absolute(config.chairFootprintRelative);
  const monitorBounds = absolute(config.monitorReservationRelative);
  const keyboardBounds = absolute(config.keyboardReservationRelative);
  const chairPivot = {
    x: (chairBounds.x + chairBounds.width / 2) * tile,
    y: (chairBounds.y + chairBounds.depth) * tile,
  };
  const actorPixels = officeCharacterFrameForTile(tile, 1);
  const chairPixels = equipment.chair.renderPixels[config.chairView];
  const actor = {
    left: chairPivot.x - actorPixels.width / 2,
    top: chairPivot.y - actorPixels.height,
    ...actorPixels,
  };
  const seatAnchor = {
    x: chairPivot.x,
    y: chairPivot.y - equipment.chair.seatAnchor.screenOffsetFromFloorPixels,
  };
  const hipAnchor = {
    x: actor.left + character.hipAnchorPixels.x,
    y: actor.top + character.hipAnchorPixels.y,
  };
  const surfaceTop = deskRect.top + desk.surfaceRows.start;
  const surfaceHeight = desk.surfaceRows.endExclusive - desk.surfaceRows.start;
  const surfaceRowHeight = surfaceHeight / desk.footprint.depth;
  const equipmentCenterX = (desk.origin.x + 1.5) * tile;
  const monitorBottom = surfaceTop + (config.monitorReservationRelative.y + 1) * surfaceRowHeight;
  const keyboardCenterY = surfaceTop + (config.keyboardReservationRelative.y + 0.5) * surfaceRowHeight;
  return {
    actor,
    actorFootprint: pixelRect(chairBounds, tile),
    actorLogicalVolume: {
      left: chairBounds.x * tile,
      top: chairPivot.y - character.logicalVolume.height * tile,
      width: tile,
      height: character.logicalVolume.height * tile,
    },
    chair: {
      left: chairPivot.x - chairPixels.width / 2,
      top: chairPivot.y - chairPixels.height,
      ...chairPixels,
    },
    chairFootprint: pixelRect(chairBounds, tile),
    chairLogicalVolume: {
      left: chairBounds.x * tile,
      top: chairPivot.y - equipment.chair.logicalVolume.height * tile,
      width: tile,
      height: equipment.chair.logicalVolume.height * tile,
    },
    chairPivot,
    desk: deskRect,
    deskFootprint: pixelRect({ ...desk.origin, ...desk.footprint }, tile),
    deskPivot,
    hipAnchor,
    keyboard: {
      left: equipmentCenterX - equipment.keyboard.renderPixels.width / 2,
      top: keyboardCenterY - equipment.keyboard.renderPixels.height / 2,
      ...equipment.keyboard.renderPixels,
    },
    keyboardReservation: pixelRect(keyboardBounds, tile),
    monitor: {
      left: equipmentCenterX - equipment.monitor.renderPixels.width / 2,
      top: monitorBottom - equipment.monitor.renderPixels.height,
      ...equipment.monitor.renderPixels,
    },
    monitorReservation: pixelRect(monitorBounds, tile),
    seatAnchor,
  };
}

export function step5AnchorsStable(
  manifest: OfficeWorkstationStep5ManifestV2,
  orientation: Step5Orientation,
  ticks: readonly number[],
) {
  const expected = JSON.stringify(step5StationGeometry(manifest, orientation));
  return ticks.every(() => JSON.stringify(step5StationGeometry(manifest, orientation)) === expected);
}
