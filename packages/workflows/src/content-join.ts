import {
  contentBranches,
  workflowCoordinatorId,
  type ContentBranch,
  type ContentBranchCompletion,
  type ContentReadyBranchRef,
  type ContentReadyEvent,
  type Identifier,
  type WorkspaceScoped,
} from "@affiliate-ops/contracts";
import { WorkflowInvariantError } from "./diagnostics.ts";

export interface ContentJoinIdentity extends WorkspaceScoped {
  workflowId: Identifier;
  contentGroupId: Identifier;
  traceId: Identifier;
}

export interface ContentJoinState extends ContentJoinIdentity {
  completions: Readonly<Record<ContentBranch, ContentBranchCompletion | null>>;
  seenCompletions: readonly ContentBranchCompletion[];
  contentReadyEventId: Identifier | null;
}

export interface ContentJoinUpdate {
  state: ContentJoinState;
  event?: ContentReadyEvent;
}

export function createContentJoinState(identity: ContentJoinIdentity): ContentJoinState {
  assertIdentity(identity);
  return {
    ...identity,
    completions: { copy: null, visual: null },
    seenCompletions: [],
    contentReadyEventId: null,
  };
}

export function recordContentBranchCompletion(
  state: ContentJoinState,
  completion: ContentBranchCompletion,
): ContentJoinUpdate {
  assertCompletion(completion);

  const known = state.seenCompletions.find((candidate) => candidate.id === completion.id);
  if (known) {
    if (!sameCompletion(known, completion)) {
      throw new WorkflowInvariantError(
        "workflow.content-completion-id-conflict",
        `Content completion ${completion.id} was reused with a different payload`,
      );
    }
    if (state.completions[known.branch]?.id === known.id) return { state };
    throw new WorkflowInvariantError(
      "workflow.content-stale-attempt",
      `Content completion ${completion.id} was superseded by a newer ${known.branch} attempt`,
    );
  }

  assertMatchingScope(state, completion);
  if (state.contentReadyEventId !== null) {
    throw new WorkflowInvariantError(
      "workflow.content-group-closed",
      `Content group ${state.contentGroupId} is already ready`,
    );
  }

  const current = state.completions[completion.branch];
  if (current && completion.attempt < current.attempt) {
    throw new WorkflowInvariantError(
      "workflow.content-stale-attempt",
      `Content branch ${completion.branch} attempt ${completion.attempt} is older than ${current.attempt}`,
    );
  }
  if (current && completion.attempt === current.attempt) {
    throw new WorkflowInvariantError(
      "workflow.content-attempt-conflict",
      `Content branch ${completion.branch} attempt ${completion.attempt} has more than one completion`,
    );
  }

  const completions = { ...state.completions, [completion.branch]: completion };
  const seenCompletions = [...state.seenCompletions, completion].sort(compareCompletionIds);
  const pendingState: ContentJoinState = { ...state, completions, seenCompletions };
  if (!completions.copy || !completions.visual) return { state: pendingState };

  const event = createContentReadyEvent(pendingState, completions.copy, completions.visual);
  return {
    state: { ...pendingState, contentReadyEventId: event.id },
    event,
  };
}

function createContentReadyEvent(
  state: ContentJoinState,
  copy: ContentBranchCompletion,
  visual: ContentBranchCompletion,
): ContentReadyEvent {
  return {
    id: contentReadyEventId(state),
    workspaceId: state.workspaceId,
    workflowId: state.workflowId,
    stage: "content_ready",
    actorType: "system",
    actorId: workflowCoordinatorId,
    traceId: state.traceId,
    occurredAt: laterTimestamp(copy.completedAt, visual.completedAt),
    payload: {
      contentGroupId: state.contentGroupId,
      copy: branchRef(copy),
      visual: branchRef(visual),
    },
  };
}

function contentReadyEventId(identity: ContentJoinIdentity): Identifier {
  const parts = [identity.workspaceId, identity.workflowId, identity.contentGroupId].map(
    (part) => `${part.length}:${part}`,
  );
  return `workflow.content-ready:${parts.join("|")}`;
}

function branchRef(completion: ContentBranchCompletion): ContentReadyBranchRef {
  return {
    completionId: completion.id,
    jobId: completion.jobId,
    attempt: completion.attempt,
    artifactVersion: completion.artifactVersion,
  };
}

function assertIdentity(identity: ContentJoinIdentity): void {
  for (const [field, value] of Object.entries(identity)) {
    if (typeof value !== "string" || value.trim() === "") {
      throw new WorkflowInvariantError(
        "workflow.content-completion-invalid",
        `Content join ${field} must be a non-empty string`,
      );
    }
  }
}

function assertCompletion(completion: ContentBranchCompletion): void {
  const strings = [
    ["id", completion.id],
    ["jobId", completion.jobId],
    ["workspaceId", completion.workspaceId],
    ["workflowId", completion.workflowId],
    ["contentGroupId", completion.contentGroupId],
    ["completedAt", completion.completedAt],
    ["traceId", completion.traceId],
  ] as const;
  for (const [field, value] of strings) {
    if (typeof value !== "string" || value.trim() === "") {
      throw new WorkflowInvariantError(
        "workflow.content-completion-invalid",
        `Content completion ${field} must be a non-empty string`,
      );
    }
  }
  if (!contentBranches.includes(completion.branch)) {
    throw new WorkflowInvariantError(
      "workflow.content-completion-invalid",
      `Unsupported content branch: ${String(completion.branch)}`,
    );
  }
  if (!Number.isInteger(completion.attempt) || completion.attempt < 1) {
    throw new WorkflowInvariantError(
      "workflow.content-completion-invalid",
      "Content completion attempt must be a positive integer",
    );
  }
  if (!Number.isInteger(completion.artifactVersion) || completion.artifactVersion < 1) {
    throw new WorkflowInvariantError(
      "workflow.content-completion-invalid",
      "Content artifact version must be a positive integer",
    );
  }
  if (!Number.isFinite(Date.parse(completion.completedAt))) {
    throw new WorkflowInvariantError(
      "workflow.content-completion-invalid",
      "Content completion timestamp must be a valid ISO date-time",
    );
  }
}

function assertMatchingScope(state: ContentJoinState, completion: ContentBranchCompletion): void {
  if (completion.contentGroupId !== state.contentGroupId) {
    throw new WorkflowInvariantError(
      "workflow.content-group-mismatch",
      `Expected content group ${state.contentGroupId}, received ${completion.contentGroupId}`,
    );
  }
  if (
    completion.workspaceId !== state.workspaceId ||
    completion.workflowId !== state.workflowId ||
    completion.traceId !== state.traceId
  ) {
    throw new WorkflowInvariantError(
      "workflow.content-scope-mismatch",
      `Content completion ${completion.id} does not match the join scope`,
    );
  }
}

function sameCompletion(left: ContentBranchCompletion, right: ContentBranchCompletion): boolean {
  return (
    left.id === right.id &&
    left.jobId === right.jobId &&
    left.workspaceId === right.workspaceId &&
    left.workflowId === right.workflowId &&
    left.contentGroupId === right.contentGroupId &&
    left.branch === right.branch &&
    left.attempt === right.attempt &&
    left.artifactVersion === right.artifactVersion &&
    left.completedAt === right.completedAt &&
    left.traceId === right.traceId
  );
}

function compareCompletionIds(left: ContentBranchCompletion, right: ContentBranchCompletion): number {
  if (left.id < right.id) return -1;
  if (left.id > right.id) return 1;
  return 0;
}

function laterTimestamp(left: string, right: string): string {
  const leftTime = Date.parse(left);
  const rightTime = Date.parse(right);
  if (leftTime > rightTime) return left;
  if (rightTime > leftTime) return right;
  return left < right ? right : left;
}
