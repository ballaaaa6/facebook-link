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
  const physicalScale = Math.max(1, devicePixelRatio);
  const targetWidth = Math.max(36, Math.min(96, tileSize * 3));
  const width = (Math.round((targetWidth * physicalScale) / 2) * 2) / physicalScale;
  const height = Math.round(width * (52 / 48) * physicalScale) / physicalScale;
  return { width, height };
}
