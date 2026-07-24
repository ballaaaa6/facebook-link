import type { OfficeActivity, OfficeAgentStatus, WorkflowStage } from "@affiliate-ops/contracts";
import { createOfficeSnapshot, type AgentProjectionInput } from "./index.ts";

const definitions: ReadonlyArray<{
  agentId: string;
  name: string;
  status: OfficeAgentStatus;
  task: string;
  activity: OfficeActivity;
  progress?: number;
  stage?: WorkflowStage;
}> = [
  { agentId: "market-scout", name: "Scout", status: "running", task: "Scanning Shopee feed", activity: "research", progress: 72, stage: "discovered" },
  { agentId: "product-ranker", name: "Ranker", status: "review", task: "Ranking 41 candidates", activity: "ranking", progress: 58, stage: "scored" },
  { agentId: "growth-strategist", name: "Nova", status: "waiting_dependency", task: "Waiting for daily metrics", activity: "waiting", stage: "selected" },
  { agentId: "performance-analyst", name: "Tian", status: "running", task: "Analyzing link attribution", activity: "analytics", progress: 84, stage: "measured" },
  { agentId: "gemini-copywriter", name: "Mira", status: "running", task: "Drafting Thai captions", activity: "writing", progress: 44, stage: "content_queued" },
  { agentId: "flow-visual-producer", name: "Pixel", status: "queued", task: "Queued behind copy", activity: "visual", stage: "content_queued" },
  { agentId: "link-attribution", name: "Link", status: "review", task: "Assigning Sub IDs", activity: "linking", progress: 63, stage: "link_ready" },
  { agentId: "qa-editor", name: "Proof", status: "waiting_human", task: "2 posts ready for QA", activity: "review", stage: "content_ready" },
  { agentId: "publisher", name: "Pulse", status: "running", task: "Scheduling Facebook posts", activity: "publishing", progress: 76, stage: "scheduled" },
  { agentId: "session-keeper", name: "Guard", status: "running", task: "Shopee session healthy", activity: "session", progress: 96 },
];

export function createDemoOfficeSnapshot(now = new Date()) {
  const updatedAt = now.toISOString();
  const inputs: AgentProjectionInput[] = definitions.map((definition, index) => ({
    agentId: definition.agentId,
    displayName: definition.name,
    status: definition.status,
    statusReason: definition.status.replaceAll("_", " "),
    currentTask: definition.task,
    activity: definition.activity,
    ...(typeof definition.progress === "number" ? { progress: definition.progress } : {}),
    workflowId: `workflow-pilot-${Math.floor(index / 2) + 1}`,
    agentRunId: `agent-run-pilot-${index + 1}`,
    ...(definition.stage ? { workflowStage: definition.stage } : {}),
    attempt: definition.status === "review" ? 2 : 1,
    startedAt: new Date(now.getTime() - (index + 2) * 60_000).toISOString(),
    updatedAt,
    lastHeartbeatAt: updatedAt,
    requiresHuman: definition.status === "waiting_human",
    latestEvents: [
      {
        id: `event-${definition.agentId}-1`,
        label: definition.task,
        occurredAt: updatedAt,
        level: definition.status === "waiting_human" ? "warning" : "info",
      },
    ],
  }));
  return createOfficeSnapshot(inputs, now);
}
