import { useMemo, useState } from "react";
import { MetricStrip } from "../../shared/components/MetricStrip";
import { TeamChatPanel } from "../../shared/components/TeamChatPanel";
import { agents } from "../../shared/data/agents";
import { OfficeCanvas } from "./components/OfficeCanvas";
import { TaskPanel } from "./components/TaskPanel";

export function OfficePage() {
  const [selectedId, setSelectedId] = useState("performance-analyst");
  const selectedAgent = useMemo(() => agents.find((agent) => agent.id === selectedId) ?? agents[3]!, [selectedId]);
  return (
    <>
      <MetricStrip />
      <div className="workspace-grid">
        <section className="office-card"><div className="card-header"><div><span className="eyebrow">Live floor</span><h2>Agent office</h2></div><div className="floor-legend"><span><i className="legend-working" />Working</span><span><i className="legend-review" />Review</span><span><i className="legend-waiting" />Waiting</span></div></div><OfficeCanvas selectedId={selectedId} onSelect={setSelectedId} /></section>
        <TaskPanel agent={selectedAgent} />
      </div>
      <TeamChatPanel />
    </>
  );
}
