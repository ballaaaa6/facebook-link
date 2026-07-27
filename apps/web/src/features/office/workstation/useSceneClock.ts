import { useEffect, useState } from "react";

export function useSceneClock(tickMs = 100) {
  const [elapsedMs, setElapsedMs] = useState(0);
  useEffect(() => {
    const startedAt = performance.now();
    const timer = window.setInterval(() => {
      setElapsedMs(performance.now() - startedAt);
    }, tickMs);
    return () => window.clearInterval(timer);
  }, [tickMs]);
  return elapsedMs;
}
