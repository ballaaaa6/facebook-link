import { agentCatalog } from "@affiliate-ops/agent-catalog";
import type { HealthReport, WorkflowStage } from "@affiliate-ops/contracts";
import { nextStages } from "@affiliate-ops/workflows";
export * from "./sheet-sync/index.ts";
export * from "./simulation/persistence.ts";
export * from "./simulation/pilot.ts";

export interface RunnerPlan {
  workflowId: string;
  currentStage: WorkflowStage;
  allowedNextStages: readonly WorkflowStage[];
  agents: readonly string[];
}

export function createRunnerPlan(workflowId: string, currentStage: WorkflowStage): RunnerPlan {
  return {
    workflowId,
    currentStage,
    allowedNextStages: nextStages(currentStage),
    agents: agentCatalog.map((agent) => agent.id),
  };
}

export function runnerHealth(): HealthReport {
  return {
    service: "automation-runner",
    status: "degraded",
    version: "0.1.0",
    checkedAt: new Date().toISOString(),
  };
}

export const runnerReadiness = {
  executable: false,
  reason: "Connectors and durable job transport are not configured.",
  requiredConnectors: ["shopee-discovery", "shopee-affiliate", "gemini-browser", "flow-browser", "meta-api", "metrics"],
} as const;
