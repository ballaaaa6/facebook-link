import type { OfficeAgentView } from "@affiliate-ops/contracts";
import { StatusDot } from "../../../shared/components/StatusDot";

function progressContent(agent: OfficeAgentView) {
  if (agent.progress.kind === "determinate") {
    return <>
      <div className="progress-track"><i style={{ width: `${agent.progress.value}%` }} /></div>
      <small>{agent.progress.value}% complete</small>
    </>;
  }
  if (agent.progress.kind === "completed") return <small>Completed</small>;
  return <><div className="progress-track is-indeterminate"><i /></div><small>Progress is event-driven</small></>;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value));
}

export function TaskPanel({ agent }: { agent: OfficeAgentView }) {
  return (
    <aside className="task-panel">
      <div className="panel-heading">
        <div><span className="eyebrow">Selected agent</span><h2>{agent.displayName}</h2><p>{agent.role}</p></div>
        <StatusDot status={agent.status} />
      </div>
      <div className="agent-status-summary">
        <span className={`agent-status-label status-tone-${agent.status}`}>
          {agent.status.replaceAll("_", " ")}
        </span>
        <small>Updated {formatTime(agent.updatedAt)} · attempt {agent.attempt}</small>
      </div>
      <div className="current-task">
        <span>Current task</span>
        <strong>{agent.currentTask}</strong>
        {progressContent(agent)}
      </div>
      <dl className="run-facts">
        <div><dt>Workflow</dt><dd>{agent.workflowId ?? "Not assigned"}</dd></div>
        <div><dt>Stage</dt><dd>{agent.workflowStage?.replaceAll("_", " ") ?? "Standby"}</dd></div>
        <div><dt>Run</dt><dd>{agent.agentRunId ?? "—"}</dd></div>
      </dl>
      {agent.requiresHuman ? (
        <div className="review-callout">
          <span>Human review</span>
          <strong>This agent has a supervised decision point.</strong>
          <button type="button" disabled>Review action · simulation</button>
        </div>
      ) : null}
      <div className="activity-log">
        <div className="panel-section-title"><span>Latest events</span><i /></div>
        {agent.latestEvents.length > 0 ? agent.latestEvents.map((event) => (
          <p className={`event-${event.level}`} key={event.id}>
            <time>{formatTime(event.occurredAt)}</time>{event.label}
          </p>
        )) : <p className="empty-log">No events recorded yet.</p>}
      </div>
    </aside>
  );
}
