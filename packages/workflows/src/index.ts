import type { WorkflowStage } from "@affiliate-ops/contracts";

const transitions: Readonly<Record<WorkflowStage, readonly WorkflowStage[]>> = {
  discovered: ["scored", "failed"],
  scored: ["selected", "failed"],
  selected: ["link_ready", "failed"],
  link_ready: ["content_queued", "failed"],
  content_queued: ["content_ready", "failed"],
  content_ready: ["qa_approved", "content_queued", "failed"],
  qa_approved: ["scheduled", "failed"],
  scheduled: ["published", "failed"],
  published: ["measured", "failed"],
  measured: [],
  failed: ["discovered", "scored", "selected", "link_ready", "content_queued", "content_ready", "qa_approved", "scheduled"],
};

export function canTransition(from: WorkflowStage, to: WorkflowStage): boolean {
  return transitions[from].includes(to);
}

export function assertTransition(from: WorkflowStage, to: WorkflowStage): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid workflow transition: ${from} -> ${to}`);
  }
}

export function nextStages(from: WorkflowStage): readonly WorkflowStage[] {
  return transitions[from];
}
