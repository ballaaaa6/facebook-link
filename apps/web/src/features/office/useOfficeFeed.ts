import { useEffect, useRef, useState } from "react";
import type { OfficeSnapshot } from "@affiliate-ops/contracts";
import { createDemoOfficeSnapshot } from "@affiliate-ops/office-read-model";
import { fetchOfficeSnapshot } from "../../shared/services/office";

export type OfficeFeedState = "loading" | "ready" | "fallback" | "reconnecting";

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

    const refresh = async () => {
      try {
        const result = await fetchOfficeSnapshot(controller.signal);
        if (!active || result.snapshot.sequence < sequence.current) return;
        sequence.current = result.snapshot.sequence;
        setFeed({ snapshot: result.snapshot, state: result.source === "api" ? "ready" : "fallback" });
      } catch (error) {
        const isAbort = controller.signal.aborted
          || (typeof error === "object" && error !== null && "name" in error && error.name === "AbortError");
        if (!isAbort) throw error;
      }
    };

    void refresh();
    const timer = window.setInterval(() => {
      setFeed((current) => current.state === "fallback" ? current : { ...current, state: "reconnecting" });
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
