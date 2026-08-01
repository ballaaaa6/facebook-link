import {
  workflowCoordinatorId,
  type ContentBranch,
  type WorkflowActor,
  type WorkflowEvent,
  type WorkflowStage,
} from "@affiliate-ops/contracts";
import { WorkflowInvariantError } from "./diagnostics.ts";

export * from "./content-join.ts";
export * from "./diagnostics.ts";

export const rankingEvidenceOwnerId = "product-ranker" as const;
export const winnerSelectionOwnerId = "growth-strategist" as const;
export const contentBranchOwnerIds: Readonly<Record<ContentBranch, string>> = {
  copy: "gemini-copywriter",
  visual: "flow-visual-producer",
};

const transitions: Readonly<Record<WorkflowStage, readonly WorkflowStage[]>> = {
  discovered: ["scored", "failed"],
  scored: ["selected", "failed"],
  selected: ["link_ready", "failed"],
  link_ready: ["content_queued", "failed"],
  content_queued: ["failed"],
  content_ready: ["qa_approved", "content_queued", "failed"],
  qa_approved: ["scheduled", "failed"],
  scheduled: ["published", "failed"],
  published: ["measured", "failed"],
  measured: [],
  failed: ["discovered", "scored", "selected", "link_ready", "content_queued", "qa_approved", "scheduled"],
};

export function canTransition(from: WorkflowStage, to: WorkflowStage): boolean {
  return transitions[from].includes(to);
}

export function assertTransition(from: WorkflowStage, to: WorkflowStage): void {
  if (!canTransition(from, to)) {
    if (to === "content_ready") {
      throw new WorkflowInvariantError(
        "workflow.content-ready-requires-join",
        `Workflow transition ${from} -> content_ready requires the content join reducer`,
      );
    }
    throw new WorkflowInvariantError(
      "workflow.invalid-transition",
      `Invalid workflow transition: ${from} -> ${to}`,
    );
  }
}

export function nextStages(from: WorkflowStage): readonly WorkflowStage[] {
  return transitions[from];
}

export function getContentBranchOwnerId(branch: ContentBranch): string {
  return contentBranchOwnerIds[branch];
}

export function assertContentBranchOwner(branch: ContentBranch, actorId: string): void {
  const expected = getContentBranchOwnerId(branch);
  if (actorId !== expected) {
    throw new WorkflowInvariantError(
      "workflow.event-owner-mismatch",
      `Content branch ${branch} is owned by ${expected}, not ${actorId}`,
    );
  }
}

export function assertWorkflowEventOwnership(event: WorkflowEvent): void {
  let expected: WorkflowActor | undefined;
  if (event.stage === "scored") expected = { actorType: "agent", actorId: rankingEvidenceOwnerId };
  if (event.stage === "selected") expected = { actorType: "agent", actorId: winnerSelectionOwnerId };
  if (event.stage === "content_ready") {
    expected = { actorType: "system", actorId: workflowCoordinatorId };
  }
  if (expected && (event.actorType !== expected.actorType || event.actorId !== expected.actorId)) {
    throw new WorkflowInvariantError(
      "workflow.event-owner-mismatch",
      `Workflow stage ${event.stage} has an invalid owner ${event.actorType}:${event.actorId}`,
    );
  }
}
