export interface PixelFrameSize {
  width: number;
  height: number;
}

export function pixelAlignedCharacterFrame(
  worldWidth: number,
  devicePixelRatio = 1,
): PixelFrameSize {
  const physicalScale = Math.max(1, devicePixelRatio);
  const targetWidth = Math.max(48, Math.min(96, worldWidth * 0.075));
  const width = (Math.round((targetWidth * physicalScale) / 2) * 2) / physicalScale;
  const height = Math.round(width * (52 / 48) * physicalScale) / physicalScale;
  return { width, height };
}
