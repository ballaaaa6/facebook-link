import type {
  OfficeWorkstationStep5ManifestV4,
  WorkstationStep5R04Geometry,
  WorkstationStep5R04Orientation,
} from "@affiliate-ops/contracts";

export function r04FrameForTick(tick: number, frames: number) {
  if (!Number.isFinite(tick) || tick < 0 || frames < 1) return 0;
  return Math.floor(tick) % frames;
}

export function r04Geometry(
  manifest: OfficeWorkstationStep5ManifestV4,
  orientation: WorkstationStep5R04Orientation,
): WorkstationStep5R04Geometry {
  return manifest.geometry[orientation];
}

export function r04AnchorsStable(
  manifest: OfficeWorkstationStep5ManifestV4,
  orientation: WorkstationStep5R04Orientation,
) {
  const geometry = r04Geometry(manifest, orientation);
  return JSON.stringify(geometry.seatAnchor) === JSON.stringify(geometry.hipAnchor)
    && manifest.animation.maximumAnchorDriftPixels === 0;
}
