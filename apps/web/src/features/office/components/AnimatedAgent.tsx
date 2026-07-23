import { useEffect, useState } from "react";
import { characterRegistry, characterStates, type CharacterState } from "../characterRegistry";

export function AnimatedAgent({ agentId, name, state = "working" }: { agentId: string; name: string; state?: CharacterState }) {
  const character = characterRegistry[agentId];
  const config = characterStates[state];
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    setFrame(0);
    const timer = window.setInterval(() => setFrame((value) => (value + 1) % config.frames), 1000 / config.fps);
    return () => window.clearInterval(timer);
  }, [config.fps, config.frames]);

  if (!character) return null;
  return (
    <span
      className="agent-sprite"
      aria-label={`${name} ${state}`}
      data-character={character.sourceSlug}
      data-state={state}
      style={{
        backgroundImage: `url(${character.sheet})`,
        backgroundPosition: `${(frame / 7) * 100}% ${(config.row / 8) * 100}%`,
        "--character-scale": character.scale,
      } as React.CSSProperties}
    />
  );
}
