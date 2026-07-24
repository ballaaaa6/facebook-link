import { useEffect, useRef, type CSSProperties } from "react";
import bobaSheet from "../../../../../../assets/game/characters/boba/runtime-spritesheet-v2.webp";
import bobaSheet2x from "../../../../../../assets/game/characters/boba/runtime-spritesheet-v2@2x.webp";
import type { OfficeCompanion } from "../officeTypes";
import { companionPresentationAt } from "../motion/companionMotion";
import { subscribeToOfficeFrame } from "../motion/frameScheduler";

const animation = {
  idle: { row: 0, frames: 6, fps: 4 },
  "walk-right": { row: 1, frames: 8, fps: 9 },
  "walk-left": { row: 2, frames: 8, fps: 9 },
} as const;
const companionSheetRows = 11;

export function CompanionEntity({
  companion,
  mapWidth,
  mapHeight,
  sceneStartedAt,
}: {
  companion: OfficeCompanion;
  mapWidth: number;
  mapHeight: number;
  sceneStartedAt: number;
}) {
  const trackRef = useRef<HTMLSpanElement>(null);

  useEffect(() => subscribeToOfficeFrame((timestamp) => {
    const track = trackRef.current;
    if (!track) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const elapsed = reducedMotion ? 0 : (timestamp - sceneStartedAt) / 1_000;
    const presentation = companionPresentationAt(elapsed, companion);
    const config = animation[presentation.state];
    const frame = reducedMotion ? 0 : Math.floor(elapsed * config.fps) % config.frames;
    track.style.left = `${(presentation.position.x / mapWidth) * 100}%`;
    track.style.top = `${(presentation.position.y / mapHeight) * 100}%`;
    track.style.zIndex = String(112 + Math.round(presentation.position.y * 20));
    track.style.backgroundPosition = `${(frame / 7) * 100}% ${(config.row / (companionSheetRows - 1)) * 100}%`;
  }), [companion, mapHeight, mapWidth, sceneStartedAt]);

  return (
    <span
      ref={trackRef}
      className="office-companion"
      aria-label="Boba, the office companion"
      style={{
        backgroundImage: `image-set(url("${bobaSheet}") 1x, url("${bobaSheet2x}") 2x)`,
        left: `${(companion.home.x / mapWidth) * 100}%`,
        top: `${(companion.home.y / mapHeight) * 100}%`,
      } as CSSProperties}
    />
  );
}
