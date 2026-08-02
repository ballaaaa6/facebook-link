import type {
  OperationsAgentBinding,
  OperationsEventRecord,
  OperationsFeatureAvailability,
  OperationsRoleRoute,
  OperationsRosterDocument,
  OperationsRoutingDocument,
  OperationsSnapshotDocument,
} from "@affiliate-ops/office-v2-contracts";

export type AdapterDiagnosticCode =
  | "adapter.stale"
  | "adapter.reconnecting"
  | "adapter.unavailable"
  | "adapter.sequence-gap"
  | "adapter.stream-epoch-changed"
  | "adapter.cursor-too-old"
  | "adapter.stream-mismatch"
  | "adapter.event-digest-conflict"
  | "adapter.late-event"
  | "adapter.unknown-operational-state"
  | "adapter.reason-missing"
  | "adapter.reason-state-mismatch"
  | "adapter.agent-instance-duplicate"
  | "adapter.role-unknown"
  | "adapter.role-facility-incompatible"
  | "adapter.feature-disabled"
  | "adapter.feature-session-unavailable"
  | "adapter.feature-unavailable"
  | "adapter.role-disabled-active"
  | "adapter.roster-binding-missing"
  | "adapter.teambrain-not-agent"
  | "adapter.forbidden-proposal"
  | "adapter.interaction-unknown"
  | "adapter.snapshot-visual-binding"
  | "adapter.routing-role-duplicate";

export interface AdapterDiagnostic {
  readonly code: AdapterDiagnosticCode;
  readonly owner: "adapter";
  readonly version: 1;
  readonly message: string;
  readonly context: Readonly<Record<string, string | number | boolean | null>>;
}

export interface EventFingerprint {
  readonly durableEventId: string;
  readonly payloadDigest: string;
}

export interface OperationsCursor {
  readonly streamId: string;
  readonly streamEpoch: number;
  readonly throughSequence: number;
  readonly retentionWindowStart: number;
  readonly seenEvents: readonly EventFingerprint[];
}

export interface EventWindowResult {
  readonly status: "applied" | "duplicate" | "resync-required" | "conflict";
  readonly acceptedEvents: readonly OperationsEventRecord[];
  readonly duplicateEventIds: readonly string[];
  readonly nextCursor: OperationsCursor;
  readonly diagnostics: readonly AdapterDiagnostic[];
}

export interface RosterBindingResult {
  readonly bindings: readonly OperationsAgentBinding[];
  readonly diagnostics: readonly AdapterDiagnostic[];
}

export interface ProposalResult {
  readonly allowed: boolean;
  readonly diagnostics: readonly AdapterDiagnostic[];
}

const operationalStatuses = new Set([
  "working",
  "waiting",
  "review",
  "blocked",
  "failed",
  "unavailable",
  "idle",
]);

const reasonStatuses = new Set(["waiting", "review", "blocked", "failed"]);

function diagnostic(
  code: AdapterDiagnosticCode,
  message: string,
  context: Readonly<Record<string, string | number | boolean | null>> = {},
): AdapterDiagnostic {
  return { code, owner: "adapter", version: 1, message, context };
}

function valueOf(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "value" in value) return String(value.value);
  return String(value);
}

function pushUnique(diagnostics: AdapterDiagnostic[], value: AdapterDiagnostic): void {
  if (!diagnostics.some((entry) => entry.code === value.code && JSON.stringify(entry.context) === JSON.stringify(value.context))) {
    diagnostics.push(value);
  }
}

function windowDiagnostics(snapshot: OperationsSnapshotDocument): AdapterDiagnostic[] {
  const diagnostics: AdapterDiagnostic[] = [];
  const events = snapshot.events;
  if (events.length === 0) {
    if (snapshot.windowStartSequence !== snapshot.throughSequence + 1) {
      diagnostics.push(diagnostic("adapter.sequence-gap", "An empty event window must start immediately after its through sequence.", {
        windowStartSequence: snapshot.windowStartSequence,
        throughSequence: snapshot.throughSequence,
      }));
    }
    return diagnostics;
  }

  let expected = snapshot.windowStartSequence;
  for (const event of events) {
    if (event.sequence !== expected) {
      diagnostics.push(diagnostic("adapter.sequence-gap", "The durable event window is not contiguous and ordered.", {
        expectedSequence: expected,
        actualSequence: event.sequence,
      }));
      break;
    }
    expected += 1;
  }
  if (events.at(-1)?.sequence !== snapshot.throughSequence) {
    diagnostics.push(diagnostic("adapter.sequence-gap", "The event window through sequence does not match its final event.", {
      throughSequence: snapshot.throughSequence,
      finalSequence: events.at(-1)?.sequence ?? null,
    }));
  }
  return diagnostics;
}

export function inspectOperationsSnapshot(snapshot: OperationsSnapshotDocument): readonly AdapterDiagnostic[] {
  const diagnostics = windowDiagnostics(snapshot);
  if (snapshot.freshness === "stale") diagnostics.push(diagnostic("adapter.stale", "The operations snapshot is stale and must not be shown as idle."));
  if (snapshot.freshness === "reconnecting") diagnostics.push(diagnostic("adapter.reconnecting", "The operations stream is reconnecting."));
  if (snapshot.freshness === "unavailable") diagnostics.push(diagnostic("adapter.unavailable", "The operations stream is unavailable."));

  const agentIds = new Set<string>();
  for (const agent of snapshot.agents) {
    const agentId = valueOf(agent.agentInstanceId);
    if (agentIds.has(agentId)) {
      pushUnique(diagnostics, diagnostic("adapter.agent-instance-duplicate", "An operations snapshot contains the same agent instance more than once.", { subjectId: agentId }));
    }
    agentIds.add(agentId);

    const status = String(agent.status);
    if (!operationalStatuses.has(status)) {
      pushUnique(diagnostics, diagnostic("adapter.unknown-operational-state", "An unknown operational state is unavailable, never working or idle.", { subjectId: agentId, actual: status }));
    }
    if (reasonStatuses.has(status) && agent.reason === null) {
      pushUnique(diagnostics, diagnostic("adapter.reason-missing", "Waiting, review, blocked, and failed states require a structured reason.", { subjectId: agentId }));
    }
    if (!reasonStatuses.has(status) && agent.reason !== null) {
      pushUnique(diagnostics, diagnostic("adapter.reason-state-mismatch", "A structured reason is only valid for waiting, review, blocked, or failed states.", { subjectId: agentId, actual: status }));
    }
  }
  return diagnostics;
}

export function reconcileEventWindow(cursor: OperationsCursor, snapshot: OperationsSnapshotDocument): EventWindowResult {
  const diagnostics = windowDiagnostics(snapshot);
  if (cursor.streamId !== snapshot.streamId) {
    diagnostics.push(diagnostic("adapter.stream-mismatch", "The incoming event window belongs to another stream.", { expected: cursor.streamId, actual: snapshot.streamId }));
  }
  if (cursor.streamEpoch !== snapshot.streamEpoch) {
    diagnostics.push(diagnostic("adapter.stream-epoch-changed", "The stream epoch changed and current durable truth must be reconciled.", {
      expected: cursor.streamEpoch,
      actual: snapshot.streamEpoch,
    }));
  }
  if (cursor.throughSequence + 1 < snapshot.windowStartSequence || cursor.throughSequence + 1 < cursor.retentionWindowStart) {
    diagnostics.push(diagnostic("adapter.cursor-too-old", "The consumer cursor predates the retained event window.", {
      throughSequence: cursor.throughSequence,
      windowStartSequence: snapshot.windowStartSequence,
      retentionWindowStart: cursor.retentionWindowStart,
    }));
  }

  const seen = new Map(cursor.seenEvents.map((event) => [event.durableEventId, event.payloadDigest]));
  const acceptedEvents: OperationsEventRecord[] = [];
  const duplicateEventIds: string[] = [];
  let expectedSequence = cursor.throughSequence + 1;
  for (const event of snapshot.events) {
    const eventId = valueOf(event.durableEventId);
    const knownDigest = seen.get(eventId);
    if (knownDigest !== undefined) {
      if (knownDigest !== event.payloadDigest) {
        diagnostics.push(diagnostic("adapter.event-digest-conflict", "A durable event ID was reused with a different payload digest.", { subjectId: eventId }));
      } else {
        duplicateEventIds.push(eventId);
      }
      continue;
    }
    if (event.sequence < expectedSequence) {
      diagnostics.push(diagnostic("adapter.late-event", "A new durable event arrived behind the consumer high-water cursor.", {
        subjectId: eventId,
        actual: String(event.sequence),
      }));
      continue;
    }
    if (event.sequence > expectedSequence) {
      diagnostics.push(diagnostic("adapter.sequence-gap", "A durable event sequence gap requires resynchronization.", {
        expectedSequence,
        actualSequence: event.sequence,
      }));
      expectedSequence = event.sequence;
    }
    acceptedEvents.push(event);
    seen.set(eventId, event.payloadDigest);
    expectedSequence = event.sequence + 1;
  }

  const nextCursor: OperationsCursor = {
    ...cursor,
    streamId: snapshot.streamId,
    streamEpoch: snapshot.streamEpoch,
    throughSequence: Math.max(cursor.throughSequence, ...acceptedEvents.map((event) => event.sequence), cursor.throughSequence),
    seenEvents: [...seen.entries()].map(([durableEventId, payloadDigest]) => ({ durableEventId, payloadDigest })),
  };
  const hasConflict = diagnostics.some((entry) => entry.code === "adapter.event-digest-conflict");
  const requiresResync = diagnostics.some((entry) => ["adapter.sequence-gap", "adapter.stream-epoch-changed", "adapter.cursor-too-old", "adapter.stream-mismatch"].includes(entry.code));
  return {
    status: hasConflict ? "conflict" : requiresResync ? "resync-required" : acceptedEvents.length === 0 ? "duplicate" : "applied",
    acceptedEvents,
    duplicateEventIds,
    nextCursor,
    diagnostics,
  };
}

function featureById(features: readonly OperationsFeatureAvailability[], featureId: string): OperationsFeatureAvailability | undefined {
  return features.find((feature) => valueOf(feature.featureId) === featureId);
}

function routeByRole(routing: OperationsRoutingDocument, roleId: string): OperationsRoleRoute | undefined {
  return routing.routes.find((route) => valueOf(route.roleId) === roleId);
}

function featureDiagnostics(features: readonly OperationsFeatureAvailability[], featureIds: readonly string[], subjectId: string): AdapterDiagnostic[] {
  const diagnostics: AdapterDiagnostic[] = [];
  for (const featureId of featureIds) {
    const feature = featureById(features, featureId);
    if (!feature) {
      diagnostics.push(diagnostic("adapter.role-facility-incompatible", "A required routing feature is not declared by the operations snapshot.", { subjectId, actual: featureId }));
    } else if (!feature.available && (!feature.roleEnabled || !feature.connectorEnabled)) {
      diagnostics.push(diagnostic("adapter.feature-disabled", "A required feature is disabled by role or connector policy.", { subjectId, actual: featureId }));
    } else if (!feature.sessionAvailable) {
      diagnostics.push(diagnostic("adapter.feature-session-unavailable", "A required feature is enabled but its session is unavailable.", { subjectId, actual: featureId }));
    } else if (!feature.available) {
      diagnostics.push(diagnostic("adapter.feature-unavailable", "A required feature is unavailable.", { subjectId, actual: featureId }));
    }
  }
  return diagnostics;
}

export function bindRoster(snapshot: OperationsSnapshotDocument, routing: OperationsRoutingDocument, roster: OperationsRosterDocument): RosterBindingResult {
  const diagnostics = [...inspectOperationsSnapshot(snapshot)];
  const bindings: OperationsAgentBinding[] = [];
  const seenAgentIds = new Set<string>();
  const facilityCapabilities = new Map(routing.facilityCapabilities.map((entry) => [valueOf(entry.capability), entry]));

  for (const binding of roster.bindings) {
    const agentId = valueOf(binding.agentInstanceId);
    const roleId = valueOf(binding.roleId);
    if (seenAgentIds.has(agentId)) {
      pushUnique(diagnostics, diagnostic("adapter.agent-instance-duplicate", "An agent instance is bound more than once.", { subjectId: agentId }));
      continue;
    }
    seenAgentIds.add(agentId);
    if (roleId === "teambrain") {
      pushUnique(diagnostics, diagnostic("adapter.teambrain-not-agent", "TeamBrain is a command-console facility and cannot be an agent instance.", { subjectId: agentId }));
    }
    const route = routeByRole(routing, roleId);
    if (!route) {
      pushUnique(diagnostics, diagnostic("adapter.role-unknown", "A roster binding references an unknown operational role.", { subjectId: agentId, actual: roleId }));
      continue;
    }
    const capability = facilityCapabilities.get(valueOf(route.homeFacilityCapability));
    if (!capability || !capability.available || !capability.compatibleRoles.some((value) => valueOf(value) === roleId)) {
      pushUnique(diagnostics, diagnostic("adapter.role-facility-incompatible", "The role has no compatible available home facility capability.", { subjectId: agentId, actual: valueOf(route.homeFacilityCapability) }));
    }
    if (binding.enabled) diagnostics.push(...featureDiagnostics(snapshot.features, route.requiredFeatures.map(String), agentId));
    const agent = snapshot.agents.find((entry) => valueOf(entry.agentInstanceId) === agentId);
    if (agent && !binding.enabled && !["idle", "unavailable"].includes(valueOf(agent.status))) {
      pushUnique(diagnostics, diagnostic("adapter.role-disabled-active", "A disabled roster role cannot appear as an active operational actor.", { subjectId: agentId }));
    }
    bindings.push(binding);
  }

  for (const agent of snapshot.agents) {
    if (!seenAgentIds.has(valueOf(agent.agentInstanceId)) && !["idle", "unavailable"].includes(valueOf(agent.status))) {
      diagnostics.push(diagnostic("adapter.roster-binding-missing", "An active agent instance has no roster binding.", { subjectId: valueOf(agent.agentInstanceId) }));
    }
  }
  return { bindings, diagnostics };
}

export function canProposeInteraction(
  snapshot: OperationsSnapshotDocument,
  routing: OperationsRoutingDocument,
  roster: OperationsRosterDocument,
  agentInstanceId: string,
  interactionId: string,
): ProposalResult {
  const diagnostics: AdapterDiagnostic[] = [];
  const binding = roster.bindings.find((entry) => valueOf(entry.agentInstanceId) === agentInstanceId);
  if (!binding) return { allowed: false, diagnostics: [diagnostic("adapter.forbidden-proposal", "An interaction proposal requires a known roster binding.", { subjectId: agentInstanceId })] };
  const route = routeByRole(routing, valueOf(binding.roleId));
  if (!route) return { allowed: false, diagnostics: [diagnostic("adapter.role-unknown", "An interaction proposal references an unknown role.", { subjectId: agentInstanceId, actual: valueOf(binding.roleId) })] };
  if (!route.allowedInteractions.some((value) => valueOf(value) === interactionId)) {
    diagnostics.push(diagnostic("adapter.forbidden-proposal", "The role is not allowed to propose this interaction.", { subjectId: agentInstanceId, actual: interactionId }));
  }
  if (!binding.enabled) diagnostics.push(diagnostic("adapter.forbidden-proposal", "A disabled role cannot propose an interaction.", { subjectId: agentInstanceId }));
  diagnostics.push(...featureDiagnostics(snapshot.features, route.requiredFeatures.map(String), agentInstanceId));
  return { allowed: diagnostics.length === 0, diagnostics };
}
