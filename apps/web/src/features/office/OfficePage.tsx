import { useMemo, useState } from "react";
import { MetricStrip } from "../../shared/components/MetricStrip";
import { TeamChatPanel } from "../../shared/components/TeamChatPanel";
import { OfficeCanvas } from "./components/OfficeCanvas";
import { TaskPanel } from "./components/TaskPanel";
import { useOfficeFeed } from "./useOfficeFeed";

const feedLabels = {
  loading: "Connecting",
  ready: "Live feed",
  fallback: "Simulation",
  reconnecting: "Reconnecting",
  stale: "Stale feed",
  offline: "Offline",
} as const;

export function OfficePage() {
  const { snapshot, state } = useOfficeFeed();
  const [selectedId, setSelectedId] = useState("performance-analyst");
  const selectedAgent = useMemo(
    () => snapshot.agents.find((agent) => agent.agentId === selectedId) ?? snapshot.agents[0],
    [selectedId, snapshot.agents],
  );

  return (
    <>
      <MetricStrip metrics={snapshot.metrics} />
      <div className="office-feed-bar" role="status">
        <span className={`feed-indicator feed-${state}`} />
        <strong>{feedLabels[state]}</strong>
        <small>Sequence {snapshot.sequence} · {snapshot.pendingReviews} reviews pending</small>
      </div>
      <div className="workspace-grid">
        <section className="office-card">
          <div className="card-header">
            <div><span className="eyebrow">Live floor</span><h2>Agent office</h2></div>
            <div className="floor-legend">
              <span><i className="legend-working" />Running</span>
              <span><i className="legend-review" />Review</span>
              <span><i className="legend-waiting" />Waiting</span>
            </div>
          </div>
          <OfficeCanvas
            agents={snapshot.agents}
            mode={snapshot.mode}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </section>
        {selectedAgent ? <TaskPanel agent={selectedAgent} /> : null}
      </div>
      <TeamChatPanel />
    </>
  );
}
