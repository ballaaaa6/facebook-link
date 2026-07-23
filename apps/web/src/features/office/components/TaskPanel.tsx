import { StatusDot } from "../../../shared/components/StatusDot";
import type { Agent } from "../../../shared/types";

const tasks = [
  { title: "Collect daily metrics", meta: "Shopee Affiliate", state: "Running" },
  { title: "Compare top 20 products", meta: "Winner pipeline", state: "Queued" },
  { title: "Recommend next time slot", meta: "Facebook page pilot", state: "Review" },
];

export function TaskPanel({ agent }: { agent: Agent }) {
  return <aside className="task-panel"><div className="panel-heading"><div><span className="eyebrow">Selected agent</span><h2>{agent.name}</h2><p>{agent.role}</p></div><StatusDot status={agent.status} /></div><div className="current-task"><span>Current task</span><strong>{agent.task}</strong><div className="progress-track"><i style={{ width: `${agent.progress}%` }} /></div><small>{agent.progress}% complete</small></div><div className="panel-section-title"><span>Task queue</span><b>{tasks.length}</b></div><div className="task-list">{tasks.map((task) => <button type="button" className="task-card" key={task.title}><span><strong>{task.title}</strong><small>{task.meta}</small></span><em>{task.state}</em></button>)}</div><div className="activity-log"><div className="panel-section-title"><span>Live log</span><i /></div><p><time>17:42</time> Attribution report updated</p><p><time>17:39</time> 3 new winners detected</p><p><time>17:31</time> Shopee session refreshed</p></div></aside>;
}
