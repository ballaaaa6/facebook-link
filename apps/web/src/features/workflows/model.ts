import type { WorkflowStage } from "@affiliate-ops/contracts";

export interface WorkflowListItem {
  id: string;
  productTitle: string;
  stage: WorkflowStage;
  updatedAt: string;
}
