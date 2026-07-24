import { useEffect, useRef, useState } from "react";
import type { OfficeSnapshot } from "@affiliate-ops/contracts";
import { createDemoOfficeSnapshot } from "@affiliate-ops/office-read-model";
import { fetchOfficeSnapshot } from "../../shared/services/office";

export type OfficeFeedState = "loading" | "ready" | "fallback" | "reconnecting" | "stale" | "offline";

export interface OfficeFeed {
  snapshot: OfficeSnapshot;
  state: OfficeFeedState;
}

const pollIntervalMs = 5_000;

export function useOfficeFeed(): OfficeFeed {
  const [feed, setFeed] = useState<OfficeFeed>({
    snapshot: createDemoOfficeSnapshot(),
    state: "loading",
  });
  const sequence = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    let consecutiveFailures = 0;

    const refresh = async () => {
      try {
        const result = await fetchOfficeSnapshot(controller.signal);
        if (!active || result.snapshot.sequence < sequence.current) return;
        if (result.source === "fallback") {
          if (sequence.current === 0) {
            setFeed({ snapshot: result.snapshot, state: "fallback" });
            return;
          }
          consecutiveFailures += 1;
          const state = consecutiveFailures >= 6
            ? "offline"
            : consecutiveFailures >= 2 ? "stale" : "reconnecting";
          setFeed((current) => ({ ...current, state }));
          return;
        }
        consecutiveFailures = 0;
        sequence.current = result.snapshot.sequence;
        const connectionState = result.snapshot.connection === "connected"
          ? "ready"
          : result.snapshot.connection;
        setFeed({ snapshot: result.snapshot, state: connectionState });
      } catch (error) {
        const isAbort = controller.signal.aborted
          || (typeof error === "object" && error !== null && "name" in error && error.name === "AbortError");
        if (!isAbort && active) {
          consecutiveFailures += 1;
          setFeed((current) => ({
            ...current,
            state: consecutiveFailures >= 6
              ? "offline"
              : consecutiveFailures >= 2 ? "stale" : "reconnecting",
          }));
        }
      }
    };

    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, pollIntervalMs);

    return () => {
      active = false;
      controller.abort();
      window.clearInterval(timer);
    };
  }, []);

  return feed;
}
