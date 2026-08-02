import type {
  OperationsAdapterDiagnostic,
  OperationsAgentRecord,
  OperationsFeatureAvailability,
  OperationsSnapshotDocument,
  OperationsStructuredReason,
  OperationsWorkIdentity,
} from "@affiliate-ops/office-v2-contracts";
import type { ContentBranch } from "@affiliate-ops/contracts";
export const choreographySchemaVersion = "office-operations-choreography-v1" as const;
export const requiredContentBranches = ["copy", "visual"] as const;
export type ChoreographyBranch = (typeof requiredContentBranches)[number];
export type SemanticPresentationState = "working" | "waiting" | "review" | "blocked" | "unavailable" | "idle";
export type ChoreographyTransitionKind = "branch-started" | "branch-completed" | "branch-failed" | "branch-recovered" | "handoff";
export type BranchStatus = "pending" | "completed" | "failed";
type WorkflowDiagnosticCode = "workflow.content-completion-invalid" | "workflow.content-completion-id-conflict" | "workflow.content-group-mismatch" | "workflow.content-scope-mismatch" | "workflow.content-attempt-conflict" | "workflow.content-stale-attempt" | "workflow.content-group-closed";
export type ChoreographyDiagnosticCode = WorkflowDiagnosticCode | string;
export interface ChoreographyDiagnostic {
  readonly code: ChoreographyDiagnosticCode; readonly owner: "adapter" | "workflow"; readonly version: 1;
  readonly message: string; readonly context: Readonly<Record<string, string | number | boolean | null>>;
}
export interface PresentationFeatureView {
  readonly featureId: string; readonly declared: boolean; readonly available: boolean; readonly roleEnabled: boolean;
  readonly connectorEnabled: boolean; readonly sessionAvailable: boolean; readonly diagnosticOwner: string | null;
  readonly recoverability: OperationsFeatureAvailability["recoverability"] | null;
}
export interface PresentationAgentView {
  readonly agentInstanceId: string; readonly roleId: string; readonly displayName: string; readonly state: SemanticPresentationState;
  readonly sourceStatus: OperationsAgentRecord["status"] | string; readonly freshness: OperationsAgentRecord["freshness"];
  readonly work: OperationsWorkIdentity | null; readonly reason: OperationsStructuredReason | null;
  readonly sessionHealth: OperationsAgentRecord["sessionHealth"]; readonly featureAvailability: readonly PresentationFeatureView[];
  readonly recoverability: OperationsAgentRecord["recoverability"]; readonly diagnosticOwner: string; readonly sourceRevision: string;
}
export interface SemanticPresentationProjection {
  readonly schemaVersion: typeof choreographySchemaVersion; readonly snapshotId: string; readonly sourceRevision: string;
  readonly streamId: string; readonly streamEpoch: number; readonly throughSequence: number;
  readonly freshness: OperationsSnapshotDocument["freshness"]; readonly agents: readonly PresentationAgentView[];
  readonly features: readonly PresentationFeatureView[]; readonly diagnostics: readonly OperationsAdapterDiagnostic[];
}
export interface ChoreographyScope {
  readonly workspaceId: string; readonly workflowId: string; readonly contentGroupId: string; readonly traceId: string; readonly streamId: string;
}
export interface ChoreographyReason {
  readonly code: string; readonly kind: "waiting" | "review" | "blocked" | "failure"; readonly message: string; readonly owner: string;
  readonly recoverability: "not-required" | "retry" | "reconnect" | "resync" | "human-review" | "permanent";
}
export interface ChoreographyTransition extends ChoreographyScope {
  readonly schemaVersion: typeof choreographySchemaVersion; readonly kind: ChoreographyTransitionKind; readonly branch: ChoreographyBranch;
  readonly attempt: number; readonly artifactVersion: number; readonly jobId: string; readonly occurredAt: string;
  readonly durableEventId: string; readonly payloadDigest: string; readonly sourceRevision: string;
  readonly reason?: ChoreographyReason; readonly recoveredFromEventId?: string;
}
export interface BranchCompletionRef {
  readonly durableEventId: string; readonly jobId: string; readonly attempt: number; readonly artifactVersion: number;
}
export interface BranchChoreographyState {
  readonly branch: ChoreographyBranch; readonly status: BranchStatus; readonly attempt: number | null; readonly artifactVersion: number | null;
  readonly jobId: string | null; readonly completion: BranchCompletionRef | null; readonly failure: ChoreographyReason | null;
  readonly recoveredFromEventId: string | null; readonly lastDurableEventId: string | null;
}
export interface ChoreographyState extends ChoreographyScope {
  readonly schemaVersion: typeof choreographySchemaVersion; readonly branches: Readonly<Record<ChoreographyBranch, BranchChoreographyState>>;
  readonly seenTransitions: readonly ChoreographyTransition[]; readonly contentReadyIntentId: string | null;
}
export type ChoreographyIntent = BranchIntent | ContentReadyIntent;
export interface BranchIntent extends ChoreographyScope {
  readonly schemaVersion: typeof choreographySchemaVersion; readonly id: string;
  readonly kind: "branch-started" | "branch-completed" | "branch-failed" | "branch-recovered" | "handoff";
  readonly branch: ChoreographyBranch; readonly attempt: number; readonly artifactVersion: number; readonly jobId: string;
  readonly occurredAt: string; readonly durableEventId: string; readonly sourceRevision: string;
  readonly reason: ChoreographyReason | null; readonly presentationOnly: true;
}
export interface ContentReadyIntent extends ChoreographyScope {
  readonly schemaVersion: typeof choreographySchemaVersion; readonly id: string; readonly kind: "content-ready"; readonly occurredAt: string;
  readonly branches: Readonly<Record<ChoreographyBranch, BranchCompletionRef>>; readonly presentationOnly: true;
  readonly workflowOwner: "workflow-coordinator";
}
export interface ChoreographyReduction {
  readonly state: ChoreographyState; readonly status: "applied" | "duplicate" | "ignored" | "conflict" | "rejected";
  readonly intents: readonly ChoreographyIntent[]; readonly diagnostics: readonly ChoreographyDiagnostic[];
}
export function projectPresentationState(snapshot: OperationsSnapshotDocument): SemanticPresentationProjection {
  const features = [...snapshot.features]
    .sort((left, right) => compareStrings(valueOf(left.featureId), valueOf(right.featureId)))
    .map((feature) => featureView(feature));
  const agents = [...snapshot.agents]
    .sort((left, right) => compareStrings(valueOf(left.agentInstanceId), valueOf(right.agentInstanceId)))
    .map((agent) => projectAgent(agent, snapshot, features));
  return {
    schemaVersion: choreographySchemaVersion,
    snapshotId: valueOf(snapshot.snapshotId),
    sourceRevision: valueOf(snapshot.sourceRevision),
    streamId: valueOf(snapshot.streamId),
    streamEpoch: snapshot.streamEpoch,
    throughSequence: snapshot.throughSequence,
    freshness: snapshot.freshness,
    agents,
    features,
    diagnostics: [...snapshot.diagnostics]
      .sort(compareDiagnostics)
      .map((diagnostic) => ({ ...diagnostic, context: { ...diagnostic.context } })),
  };
}
export const projectSemanticPresentationState = projectPresentationState;
export function createChoreographyState(scope: ChoreographyScope): ChoreographyState {
  const diagnostics = validateScope(scope);
  if (diagnostics.length > 0) throw new Error(diagnostics[0]?.message ?? "Invalid choreography scope");
  return {
    ...scope,
    schemaVersion: choreographySchemaVersion,
    branches: {
      copy: emptyBranch("copy"),
      visual: emptyBranch("visual"),
    },
    seenTransitions: [],
    contentReadyIntentId: null,
  };
}
export function applyChoreographyTransition(
  state: ChoreographyState,
  transition: ChoreographyTransition,
): ChoreographyReduction {
  const invalid = validateTransition(transition);
  if (invalid.length > 0) return unchanged(state, "rejected", invalid);
  const known = state.seenTransitions.find((candidate) => candidate.durableEventId === transition.durableEventId);
  if (known) {
    if (sameTransition(known, transition)) return unchanged(state, "duplicate", []);
    return unchanged(state, "conflict", [adapterDiagnostic(
      "adapter.event-digest-conflict",
      "A durable choreography event ID was reused with a different payload.",
      { subjectId: transition.durableEventId },
    )]);
  }
  const scopeDiagnostics = matchingScope(state, transition);
  if (scopeDiagnostics.length > 0) return unchanged(state, "rejected", scopeDiagnostics);
  if (state.contentReadyIntentId !== null) {
    return unchanged(state, "ignored", [workflowDiagnostic(
      "workflow.content-group-closed",
      `Content group ${state.contentGroupId} already emitted its content-ready intent.`,
      { subjectId: state.contentGroupId },
    )]);
  }
  const current = state.branches[transition.branch];
  const attemptDiagnostics = validateAttempt(state, current, transition);
  if (attemptDiagnostics.length > 0) return unchanged(state, "ignored", attemptDiagnostics);

  const acceptedState = withSeenTransition(state, transition);
  const branch = nextBranch(current, transition);
  const nextState: ChoreographyState = {
    ...acceptedState,
    branches: { ...acceptedState.branches, [transition.branch]: branch },
  };
  const intents: ChoreographyIntent[] = [branchIntent(transition)];
  if (isJoinReady(nextState)) {
    const contentReady = contentReadyIntent(nextState);
    intents.push(contentReady);
    return {
      state: { ...nextState, contentReadyIntentId: contentReady.id },
      status: "applied",
      intents,
      diagnostics: [],
    };
  }
  return { state: nextState, status: "applied", intents, diagnostics: [] };
}
export const reduceChoreography = applyChoreographyTransition;
export function applyChoreographyTransitions(
  state: ChoreographyState,
  transitions: readonly ChoreographyTransition[],
): ChoreographyReduction {
  let current = state;
  const intents: ChoreographyIntent[] = [];
  const diagnostics: ChoreographyDiagnostic[] = [];
  let status: ChoreographyReduction["status"] = "duplicate";
  for (const transition of transitions) {
    const result = applyChoreographyTransition(current, transition);
    current = result.state;
    status = result.status;
    intents.push(...result.intents);
    diagnostics.push(...result.diagnostics);
  }
  return { state: current, status, intents, diagnostics };
}
function projectAgent(
  agent: OperationsAgentRecord,
  snapshot: OperationsSnapshotDocument,
  features: readonly PresentationFeatureView[],
): PresentationAgentView {
  const agentId = valueOf(agent.agentInstanceId);
  const featureAvailability = agent.featureIds
    .map(String)
    .sort(compareStrings)
    .map((featureId) => features.find((feature) => feature.featureId === featureId) ?? missingFeature(featureId));
  return {
    agentInstanceId: agentId,
    roleId: valueOf(agent.roleId),
    displayName: agent.displayName,
    state: semanticState(agent, snapshot, featureAvailability),
    sourceStatus: agent.status,
    freshness: agent.freshness,
    work: agent.work ? { ...agent.work, workflowRunId: { ...agent.work.workflowRunId }, taskId: { ...agent.work.taskId } } : null,
    reason: agent.reason ? { ...agent.reason } : null,
    sessionHealth: { ...agent.sessionHealth },
    featureAvailability,
    recoverability: agent.recoverability,
    diagnosticOwner: String(agent.diagnosticOwner),
    sourceRevision: valueOf(snapshot.sourceRevision),
  };
}
function semanticState(
  agent: OperationsAgentRecord,
  snapshot: OperationsSnapshotDocument,
  featureAvailability: readonly PresentationFeatureView[],
): SemanticPresentationState {
  const sourceStatus = String(agent.status);
  if (sourceStatus === "failed") return agent.reason?.kind === "failure" ? "blocked" : "unavailable";
  if (sourceStatus === "blocked") return "blocked";
  if (sourceStatus === "waiting") return "waiting";
  if (sourceStatus === "review") return "review";
  if (sourceStatus !== "working" && sourceStatus !== "idle" && sourceStatus !== "unavailable") return "unavailable";
  const freshness = agent.freshness !== "live" ? agent.freshness : snapshot.freshness;
  const unavailable = sourceStatus === "unavailable" || freshness !== "live" || agent.sessionHealth.status !== "available" || featureAvailability.some((feature) => !feature.available || !feature.roleEnabled || !feature.connectorEnabled || !feature.sessionAvailable);
  return unavailable ? "unavailable" : sourceStatus;
}
function featureView(feature: OperationsFeatureAvailability): PresentationFeatureView {
  return {
    featureId: valueOf(feature.featureId),
    declared: true,
    available: feature.available,
    roleEnabled: feature.roleEnabled,
    connectorEnabled: feature.connectorEnabled,
    sessionAvailable: feature.sessionAvailable,
    diagnosticOwner: valueOf(feature.diagnosticOwner),
    recoverability: feature.recoverability,
  };
}
function missingFeature(featureId: string): PresentationFeatureView {
  return {
    featureId,
    declared: false,
    available: false,
    roleEnabled: false,
    connectorEnabled: false,
    sessionAvailable: false,
    diagnosticOwner: null,
    recoverability: null,
  };
}
function emptyBranch(branch: ChoreographyBranch): BranchChoreographyState {
  return { branch, status: "pending", attempt: null, artifactVersion: null, jobId: null, completion: null, failure: null, recoveredFromEventId: null, lastDurableEventId: null };
}
function nextBranch(current: BranchChoreographyState, transition: ChoreographyTransition): BranchChoreographyState {
  const base = {
    ...current,
    attempt: transition.attempt,
    artifactVersion: transition.artifactVersion,
    jobId: transition.jobId,
    lastDurableEventId: transition.durableEventId,
  };
  if (transition.kind === "branch-started" || transition.kind === "handoff") {
    return transition.kind === "branch-started"
      ? { ...base, status: "pending", completion: null, failure: null, recoveredFromEventId: null }
      : base;
  }
  if (transition.kind === "branch-completed") {
    return {
      ...base,
      status: "completed",
      completion: { durableEventId: transition.durableEventId, jobId: transition.jobId, attempt: transition.attempt, artifactVersion: transition.artifactVersion },
      failure: null,
      recoveredFromEventId: null,
    };
  }
  if (transition.kind === "branch-failed") return { ...base, status: "failed", completion: null, failure: { ...transition.reason! }, recoveredFromEventId: null };
  return { ...base, status: "pending", completion: null, failure: null, recoveredFromEventId: transition.recoveredFromEventId ?? transition.durableEventId };
}
function branchIntent(transition: ChoreographyTransition): BranchIntent {
  return {
    workspaceId: transition.workspaceId,
    workflowId: transition.workflowId,
    contentGroupId: transition.contentGroupId,
    traceId: transition.traceId,
    streamId: transition.streamId,
    schemaVersion: choreographySchemaVersion,
    id: `choreography.${transition.kind}:${transition.durableEventId}`,
    kind: transition.kind,
    branch: transition.branch,
    attempt: transition.attempt,
    artifactVersion: transition.artifactVersion,
    jobId: transition.jobId,
    occurredAt: transition.occurredAt,
    durableEventId: transition.durableEventId,
    sourceRevision: transition.sourceRevision,
    reason: transition.reason ? { ...transition.reason } : null,
    presentationOnly: true,
  };
}
function contentReadyIntent(state: ChoreographyState): ContentReadyIntent {
  const copy = state.branches.copy.completion!;
  const visual = state.branches.visual.completion!;
  return {
    workspaceId: state.workspaceId,
    workflowId: state.workflowId,
    contentGroupId: state.contentGroupId,
    traceId: state.traceId,
    streamId: state.streamId,
    schemaVersion: choreographySchemaVersion,
    id: stableGroupId(state),
    kind: "content-ready",
    occurredAt: laterTimestamp(state.seenTransitions.find((item) => item.durableEventId === copy.durableEventId)?.occurredAt ?? "", state.seenTransitions.find((item) => item.durableEventId === visual.durableEventId)?.occurredAt ?? ""),
    branches: { copy: { ...copy }, visual: { ...visual } },
    presentationOnly: true,
    workflowOwner: "workflow-coordinator",
  };
}
function stableGroupId(state: ChoreographyState): string {
  return `choreography.content-ready:${[state.workspaceId, state.workflowId, state.contentGroupId].map((part) => `${part.length}:${part}`).join("|")}`;
}
function isJoinReady(state: ChoreographyState): boolean {
  return state.contentReadyIntentId === null && state.branches.copy.status === "completed" && state.branches.visual.status === "completed" && state.branches.copy.completion !== null && state.branches.visual.completion !== null;
}
function withSeenTransition(state: ChoreographyState, transition: ChoreographyTransition): ChoreographyState {
  const copy: ChoreographyTransition = transition.reason
    ? { ...transition, reason: { ...transition.reason } }
    : { ...transition };
  return {
    ...state,
    seenTransitions: [...state.seenTransitions, copy].sort((left, right) => compareStrings(left.durableEventId, right.durableEventId)),
  };
}
function validateScope(scope: ChoreographyScope): ChoreographyDiagnostic[] {
  return Object.entries(scope).filter(([, value]) => typeof value !== "string" || value.trim() === "").map(([field]) => workflowDiagnostic("workflow.content-completion-invalid", `Choreography scope ${field} must be a non-empty string.`, { subjectId: field }));
}
function validateTransition(transition: ChoreographyTransition): ChoreographyDiagnostic[] {
  const diagnostics = validateScope({
    workspaceId: transition.workspaceId,
    workflowId: transition.workflowId,
    contentGroupId: transition.contentGroupId,
    traceId: transition.traceId,
    streamId: transition.streamId,
  });
  for (const [field, value] of [["jobId", transition.jobId], ["occurredAt", transition.occurredAt], ["durableEventId", transition.durableEventId], ["payloadDigest", transition.payloadDigest], ["sourceRevision", transition.sourceRevision]] as const) {
    if (typeof value !== "string" || value.trim() === "") diagnostics.push(workflowDiagnostic("workflow.content-completion-invalid", `Choreography transition ${field} must be a non-empty string.`, { subjectId: field }));
  }
  if (transition.schemaVersion !== choreographySchemaVersion || !["branch-started", "branch-completed", "branch-failed", "branch-recovered", "handoff"].includes(transition.kind) || !requiredContentBranches.includes(transition.branch as ContentBranch) || !Number.isInteger(transition.attempt) || transition.attempt < 1 || !Number.isInteger(transition.artifactVersion) || transition.artifactVersion < 1 || !Number.isFinite(Date.parse(transition.occurredAt))) diagnostics.push(workflowDiagnostic("workflow.content-completion-invalid", "Choreography transition contains an invalid kind, branch, version, attempt, or timestamp.", { subjectId: transition.durableEventId ?? null }));
  if (transition.kind === "branch-failed" && (!transition.reason || transition.reason.kind !== "failure")) diagnostics.push(workflowDiagnostic("workflow.content-completion-invalid", "A failed branch transition requires a structured failure reason.", { subjectId: transition.durableEventId ?? null }));
  if (transition.kind === "branch-recovered" && transition.recoveredFromEventId !== undefined && transition.recoveredFromEventId.trim() === "") diagnostics.push(workflowDiagnostic("workflow.content-completion-invalid", "A recovery transition cannot have an empty source event ID.", { subjectId: transition.durableEventId ?? null }));
  return diagnostics;
}
function matchingScope(state: ChoreographyState, transition: ChoreographyTransition): ChoreographyDiagnostic[] {
  if (transition.contentGroupId !== state.contentGroupId) return [workflowDiagnostic("workflow.content-group-mismatch", `Expected content group ${state.contentGroupId}, received ${transition.contentGroupId}.`, { expected: state.contentGroupId, actual: transition.contentGroupId })];
  if (transition.workspaceId !== state.workspaceId || transition.workflowId !== state.workflowId || transition.traceId !== state.traceId || transition.streamId !== state.streamId) return [workflowDiagnostic("workflow.content-scope-mismatch", "Choreography transition does not match the join scope.", { subjectId: transition.durableEventId })];
  return [];
}
function validateAttempt(state: ChoreographyState, current: BranchChoreographyState, transition: ChoreographyTransition): ChoreographyDiagnostic[] {
  if (current.attempt === null || transition.attempt > current.attempt) return [];
  if (transition.attempt < current.attempt) return [workflowDiagnostic("workflow.content-stale-attempt", `Branch ${transition.branch} attempt ${transition.attempt} is older than ${current.attempt}.`, { expected: current.attempt, actual: transition.attempt })];
  if (transition.kind === "branch-recovered" && current.status === "failed") return [];
  if (transition.kind === "branch-completed" && current.status === "pending") return [];
  if (transition.kind === "handoff") return [];
  return [workflowDiagnostic("workflow.content-attempt-conflict", `Branch ${transition.branch} attempt ${transition.attempt} conflicts with its current result.`, { subjectId: transition.branch, actual: transition.kind })];
}
function unchanged(state: ChoreographyState, status: ChoreographyReduction["status"], diagnostics: readonly ChoreographyDiagnostic[]): ChoreographyReduction {
  return { state, status, intents: [], diagnostics };
}
function sameTransition(left: ChoreographyTransition, right: ChoreographyTransition): boolean {
  if (
    left.schemaVersion !== right.schemaVersion ||
    left.kind !== right.kind ||
    left.branch !== right.branch ||
    left.attempt !== right.attempt ||
    left.artifactVersion !== right.artifactVersion ||
    left.jobId !== right.jobId ||
    left.occurredAt !== right.occurredAt ||
    left.durableEventId !== right.durableEventId ||
    left.payloadDigest !== right.payloadDigest ||
    left.sourceRevision !== right.sourceRevision ||
    left.workspaceId !== right.workspaceId ||
    left.workflowId !== right.workflowId ||
    left.contentGroupId !== right.contentGroupId ||
    left.traceId !== right.traceId ||
    left.streamId !== right.streamId ||
    left.recoveredFromEventId !== right.recoveredFromEventId
  ) return false;
  if (left.reason === undefined || right.reason === undefined) return left.reason === right.reason;
  return left.reason.code === right.reason.code && left.reason.kind === right.reason.kind && left.reason.message === right.reason.message && left.reason.owner === right.reason.owner && left.reason.recoverability === right.reason.recoverability;
}
function adapterDiagnostic(code: string, message: string, context: Readonly<Record<string, string | number | boolean | null>>): ChoreographyDiagnostic {
  return { code, owner: "adapter", version: 1, message, context };
}
function workflowDiagnostic(code: WorkflowDiagnosticCode, message: string, context: Readonly<Record<string, string | number | boolean | null>>): ChoreographyDiagnostic {
  return { code, owner: "workflow", version: 1, message, context };
}
function compareDiagnostics(left: OperationsAdapterDiagnostic, right: OperationsAdapterDiagnostic): number {
  const code = compareStrings(left.code, right.code);
  if (code !== 0) return code;
  return compareStrings(JSON.stringify(left.context), JSON.stringify(right.context));
}
function compareStrings(left: string, right: string): number {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}
function valueOf(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "value" in value) return String(value.value);
  return String(value);
}
function laterTimestamp(left: string, right: string): string {
  const leftTime = Date.parse(left);
  const rightTime = Date.parse(right);
  if (leftTime > rightTime) return left;
  if (rightTime > leftTime) return right;
  return left < right ? right : left;
}
