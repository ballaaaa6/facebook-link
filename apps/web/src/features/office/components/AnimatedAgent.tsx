import { useEffect, useState } from "react";
import characterSheet from "../../../../../../assets/game/characters/tian-zekun-2/spritesheet.webp";

export function AnimatedAgent({ state = "working" }: { state?: "working" | "idle" }) {
  const config = state === "working" ? { row: 7, frames: 6, fps: 7 } : { row: 0, frames: 6, fps: 4 };
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setFrame((value) => (value + 1) % config.frames), 1000 / config.fps);
    return () => window.clearInterval(timer);
  }, [config.fps, config.frames]);
  return <span className="agent-sprite" aria-label={`Tian ${state}`} style={{ backgroundImage: `url(${characterSheet})`, backgroundPosition: `${-frame * 96}px ${-config.row * 104}px` }} />;
}
