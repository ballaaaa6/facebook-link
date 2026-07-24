import { agentCatalog } from "@affiliate-ops/agent-catalog";
import type {
  OfficeActivity,
  OfficeAgentStatus,
  OfficeAgentView,
  OfficeEventSummary,
  OfficeProgress,
  OfficeSnapshot,
  WorkflowStage,
} from "@affiliate-ops/contracts";

export interface AgentProjectionInput {
  agentId: string;
  displayName?: string;
  status: OfficeAgentStatus;
  statusReason: string;
  currentTask: string;
  activity: OfficeActivity;
  progress?: number;
  workflowId?: string;
  agentRunId?: string;
  workflowStage?: WorkflowStage;
  attempt?: number;
  startedAt?: string;
  updatedAt: string;
  lastHeartbeatAt?: string;
  requiresHuman?: boolean;
  latestEvents?: readonly OfficeEventSummary[];
}

function progressFor(input: AgentProjectionInput): OfficeProgress {
  if (input.status === "completed") return { kind: "completed" };
  if (typeof input.progress !== "number") return { kind: "indeterminate" };
  return { kind: "determinate", value: Math.max(0, Math.min(100, input.progress)) };
}

export function projectAgent(input: AgentProjectionInput): OfficeAgentView {
  const definition = agentCatalog.find((agent) => agent.id === input.agentId);
  if (!definition) throw new Error(`Unknown office agent: ${input.agentId}`);
  return {
    agentId: input.agentId,
    displayName: input.displayName ?? definition.displayName,
    role: definition.displayName,
    status: input.status,
    statusReason: input.statusReason,
    currentTask: input.currentTask,
    progress: progressFor(input),
    activity: input.activity,
    ...(input.workflowId ? { workflowId: input.workflowId } : {}),
    ...(input.agentRunId ? { agentRunId: input.agentRunId } : {}),
    ...(input.workflowStage ? { workflowStage: input.workflowStage } : {}),
    attempt: input.attempt ?? 1,
    ...(input.startedAt ? { startedAt: input.startedAt } : {}),
    updatedAt: input.updatedAt,
    lastHeartbeatAt: input.lastHeartbeatAt ?? input.updatedAt,
    requiresHuman: input.requiresHuman ?? definition.requiresHumanReview,
    latestEvents: input.latestEvents ?? [],
  };
}

export function createOfficeSnapshot(
  agents: readonly AgentProjectionInput[],
  now = new Date(),
): OfficeSnapshot {
  const generatedAt = now.toISOString();
  return {
    schemaVersion: 1,
    sequence: Math.floor(now.getTime() / 1_000),
    workspaceId: "pilot-workspace",
    mode: "simulation",
    generatedAt,
    connection: "connected",
    agents: agents.map(projectAgent),
    metrics: [
      { id: "products", label: "Products scanned", value: "1,248", note: "+18% today" },
      { id: "winners", label: "Winners found", value: "12", note: "3 high confidence" },
      { id: "posts", label: "Posts scheduled", value: "9", note: "Across 3 time slots" },
      { id: "session", label: "Session health", value: "99.8%", note: "All profiles active" },
    ],
    pendingReviews: agents.filter((agent) => agent.status === "waiting_human" || agent.status === "review").length,
    runnerHealth: "degraded",
    connectors: [
      { id: "shopee", label: "Shopee session", status: "ready", note: "Simulation only", checkedAt: generatedAt },
      { id: "gemini", label: "Gemini browser", status: "disabled", note: "Feature flag disabled", checkedAt: generatedAt },
      { id: "flow", label: "Google Flow", status: "disabled", note: "Feature flag disabled", checkedAt: generatedAt },
      { id: "meta", label: "Meta Graph API", status: "disabled", note: "Not connected", checkedAt: generatedAt },
    ],
  };
}

export { createDemoOfficeSnapshot } from "./pilot.ts";
