import { officeCharacterFrameForTile } from "@affiliate-ops/contracts";

export interface PixelFrameSize {
  width: number;
  height: number;
}

export function fittedTileSize(
  frameWidth: number,
  frameHeight: number,
  mapWidth: number,
  mapHeight: number,
) {
  if (frameWidth <= 0 || frameHeight <= 0 || mapWidth <= 0 || mapHeight <= 0) return 6;
  return Math.max(6, Math.min(40, Math.floor(Math.min(frameWidth / mapWidth, frameHeight / mapHeight))));
}

export function pixelAlignedCharacterFrame(
  tileSize: number,
  devicePixelRatio = 1,
): PixelFrameSize {
  return officeCharacterFrameForTile(tileSize, devicePixelRatio);
}
