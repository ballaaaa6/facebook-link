import { useEffect, useRef } from "react";
import {
  characterImageSet,
  characterRegistry,
  characterStates,
  type CharacterState,
} from "../characterRegistry";
import { subscribeToOfficeFrame } from "../motion/frameScheduler";

export function AnimatedAgent({
  agentId,
  name,
  sceneStartedAt,
  state = "working",
}: {
  agentId: string;
  name: string;
  sceneStartedAt: number;
  state?: CharacterState;
}) {
  const character = characterRegistry[agentId];
  const config = characterStates[state] ?? characterStates.idle;
  const spriteRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const sprite = spriteRef.current;
    if (!sprite) return;
    const rowPosition = (config.row / 8) * 100;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let currentFrame = -1;
    const update = (timestamp: number) => {
      const elapsedFrame = Math.floor(((timestamp - sceneStartedAt) / 1_000) * config.fps);
      const frame = reduceMotion
        ? 0
        : config.loop
          ? elapsedFrame % config.frames
          : Math.min(config.frames - 1, elapsedFrame);
      if (frame === currentFrame) return;
      currentFrame = frame;
      sprite.style.backgroundPosition = `${(frame / 7) * 100}% ${rowPosition}%`;
    };
    update(performance.now());
    return reduceMotion ? undefined : subscribeToOfficeFrame(update);
  }, [config.fps, config.frames, config.loop, config.row, sceneStartedAt]);

  if (!character) return null;
  return (
    <span
      ref={spriteRef}
      className="agent-sprite"
      aria-label={`${name} ${state}`}
      data-character={character.sourceSlug}
      data-state={state}
      style={{
        backgroundImage: characterImageSet(character),
        backgroundPosition: `0% ${(config.row / 8) * 100}%`,
      } as React.CSSProperties}
    />
  );
}
