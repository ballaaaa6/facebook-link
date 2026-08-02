import {
  bindRoster,
  canProposeInteraction,
  inspectOperationsSnapshot,
  reconcileEventWindow,
} from "../packages/office-v2-operations/src/index.ts";
import { compareExpectedDiagnostic, mismatch } from "./office-v2-knowledge-evidence.mjs";

export const operationsClosureFixturePath = "fixtures/operations-closure-c.json";

function typedId(kind, value) {
  return { kind, value };
}

function digest(seed) {
  return seed.repeat(64).slice(0, 64);
}

function event(sequence, eventId = `event-${sequence}`, payloadDigest = digest("a")) {
  return {
    durableEventId: typedId("event", eventId),
    sequence,
    payloadDigest,
    occurredAt: "2026-08-02T00:00:00.000Z",
    workflowRunId: typedId("workflow-run", "autopost-run"),
    taskId: typedId("task", "autopost-task"),
    jobId: "autopost-job",
    stage: "content_queued",
    eventType: "task-update",
  };
}

function baseSnapshot(overrides = {}) {
  return {
    schemaVersion: "office-operations-v2",
    snapshotId: typedId("snapshot", "snapshot-probe"),
    observedAt: "2026-08-02T00:00:00.000Z",
    sourceRevision: "operations-revision-1",
    streamId: "operations-stream",
    streamEpoch: 1,
    windowStartSequence: 10,
    throughSequence: 10,
    eventDigest: digest("b"),
    freshness: "live",
    events: [event(10)],
    agents: [
      {
        agentInstanceId: typedId("actor", "agent-one"),
        roleId: "market-scout",
        displayName: "Agent One",
        status: "idle",
        freshness: "live",
        work: null,
        reason: null,
        sessionHealth: { status: "available", observedAt: "2026-08-02T00:00:00.000Z" },
        featureIds: ["shopee-feed"],
        lastTransition: null,
        diagnosticOwner: "adapter",
        recoverability: "not-required",
      },
      {
        agentInstanceId: typedId("actor", "agent-two"),
        roleId: "growth-strategist",
        displayName: "Agent Two",
        status: "idle",
        freshness: "live",
        work: null,
        reason: null,
        sessionHealth: { status: "available", observedAt: "2026-08-02T00:00:00.000Z" },
        featureIds: ["strategy-review"],
        lastTransition: null,
        diagnosticOwner: "adapter",
        recoverability: "not-required",
      },
    ],
    features: [
      {
        featureId: "shopee-feed",
        roleEnabled: true,
        connectorEnabled: true,
        sessionAvailable: true,
        available: true,
        diagnosticOwner: "adapter",
        recoverability: "not-required",
      },
      {
        featureId: "strategy-review",
        roleEnabled: true,
        connectorEnabled: true,
        sessionAvailable: true,
        available: true,
        diagnosticOwner: "adapter",
        recoverability: "not-required",
      },
    ],
    diagnostics: [],
    ...overrides,
  };
}

function baseRouting() {
  return {
    schemaVersion: "office-activity-routing-v1",
    routingRevision: 1,
    routes: [
      { roleId: "market-scout", homeFacilityCapability: "market-desk", allowedInteractions: ["inspect-task"], requiredFeatures: ["shopee-feed"], workflowStages: ["discovered"], diagnosticOwner: "adapter" },
      { roleId: "growth-strategist", homeFacilityCapability: "strategy-desk", allowedInteractions: ["inspect-task", "propose-review"], requiredFeatures: ["strategy-review"], workflowStages: ["selected"], diagnosticOwner: "adapter" },
    ],
    facilityCapabilities: [
      { capability: "market-desk", available: true, compatibleRoles: ["market-scout"] },
      { capability: "strategy-desk", available: true, compatibleRoles: ["growth-strategist"] },
    ],
    consoleFacilities: [],
  };
}

function baseRoster() {
  return {
    schemaVersion: "office-roster-binding-v1",
    rosterRevision: 1,
    bindings: [
      { bindingKind: "agent-instance", agentInstanceId: typedId("actor", "agent-one"), roleId: "market-scout", displayName: "Agent One", enabled: true, characterDefinition: null, sourceRevision: "roster-revision-1" },
      { bindingKind: "agent-instance", agentInstanceId: typedId("actor", "agent-two"), roleId: "growth-strategist", displayName: "Agent Two", enabled: true, characterDefinition: null, sourceRevision: "roster-revision-1" },
    ],
  };
}

function firstDiagnostic(diagnostics, code) {
  return diagnostics.find((entry) => entry.code === code) ?? null;
}

function evaluateRejectionCase(fixture, entry) {
  if (entry.kind === "unknown-status") {
    const snapshot = baseSnapshot({ agents: [{ ...baseSnapshot().agents[0], status: entry.status }] });
    return firstDiagnostic(inspectOperationsSnapshot(snapshot), entry.expectedFailure);
  }
  if (entry.kind === "freshness") {
    return firstDiagnostic(inspectOperationsSnapshot(baseSnapshot({ freshness: entry.freshness })), entry.expectedFailure);
  }
  if (entry.kind === "sequence-gap") {
    const snapshot = baseSnapshot({
      windowStartSequence: entry.windowStartSequence,
      throughSequence: entry.throughSequence,
      events: entry.eventSequences.map((sequence) => event(sequence)),
    });
    return firstDiagnostic(inspectOperationsSnapshot(snapshot), entry.expectedFailure);
  }
  if (entry.kind === "epoch-change" || entry.kind === "digest-conflict" || entry.kind === "cursor-too-old" || entry.kind === "late-event") {
    const cursor = {
      streamId: "operations-stream",
      streamEpoch: entry.cursorEpoch ?? 1,
      throughSequence: entry.cursorThroughSequence ?? (entry.kind === "late-event" ? 10 : 9),
      retentionWindowStart: entry.retentionWindowStart ?? 10,
      seenEvents: entry.kind === "digest-conflict"
        ? [{ durableEventId: "event-10", payloadDigest: digest("a") }]
        : [],
    };
    const snapshot = baseSnapshot({
      streamEpoch: entry.snapshotEpoch ?? 1,
      windowStartSequence: entry.windowStartSequence ?? (entry.kind === "late-event" ? 9 : 10),
      throughSequence: entry.throughSequence ?? (entry.kind === "late-event" ? 9 : 10),
      events: [event(
        entry.kind === "late-event" ? 9 : 10,
        "event-10",
        entry.kind === "digest-conflict" ? digest("b") : digest("a"),
      )],
    });
    return firstDiagnostic(reconcileEventWindow(cursor, snapshot).diagnostics, entry.expectedFailure);
  }
  if (entry.kind === "roster-mutation") {
    const snapshot = structuredClone(fixture.snapshots?.[0] ?? baseSnapshot());
    const routing = structuredClone(fixture.routing ?? baseRouting());
    const roster = structuredClone(fixture.roster ?? baseRoster());
    if (entry.mutation === "unknown-role") roster.bindings[0].roleId = "unknown-role";
    if (entry.mutation === "duplicate-agent") roster.bindings.push(structuredClone(roster.bindings[0]));
    if (entry.mutation === "incompatible-facility") routing.routes[0].homeFacilityCapability = "missing-desk";
    if (entry.mutation === "session-unavailable") {
      const feature = snapshot.features.find((candidate) => candidate.featureId === "strategy-review");
      feature.sessionAvailable = false;
      feature.available = false;
    }
    if (entry.mutation === "disable-active-role") {
      roster.bindings[0].enabled = false;
      snapshot.agents[0].status = "working";
    }
    return firstDiagnostic(bindRoster(snapshot, routing, roster).diagnostics, entry.expectedFailure);
  }
  if (entry.kind === "proposal") {
    const result = canProposeInteraction(
      fixture.snapshots?.[0] ?? baseSnapshot(),
      fixture.routing ?? baseRouting(),
      fixture.roster ?? baseRoster(),
      "agent-market-scout",
      "propose-publish",
    );
    return firstDiagnostic(result.diagnostics, entry.expectedFailure);
  }
  return null;
}

export function evaluateOperationsContractCase(context, fixture, entry, fixturePath) {
  context.evidence.semanticRules += 1;
  if (entry.expectedFailure && !entry.snapshotId) {
    compareExpectedDiagnostic(context, fixturePath, entry.expectedFailure, evaluateRejectionCase(fixture, entry));
    return;
  }
  if (entry.kind === "snapshot-window") {
    const snapshot = fixture.snapshots.find((candidate) => candidate.snapshotId.value === entry.snapshotId);
    const diagnostics = inspectOperationsSnapshot(snapshot);
    mismatch(context, fixturePath, entry, "snapshot freshness", snapshot.freshness, entry.expectedStatus);
    mismatch(context, fixturePath, entry, "contiguous event count", snapshot.events.length, entry.expectedEventCount);
    mismatch(context, fixturePath, entry, "snapshot diagnostics", diagnostics.length, 0);
    return;
  }
  if (entry.kind === "freshness") {
    const snapshot = fixture.snapshots.find((candidate) => candidate.snapshotId.value === entry.snapshotId);
    const expectedCode = entry.expectedFailure ?? entry.expectedDiagnostic;
    compareExpectedDiagnostic(context, fixturePath, expectedCode, firstDiagnostic(inspectOperationsSnapshot(snapshot), expectedCode));
    return;
  }
  if (entry.kind === "roster-binding") {
    const result = bindRoster(fixture.snapshots[0], fixture.routing, fixture.roster);
    mismatch(context, fixturePath, entry, "roster binding count", result.bindings.length, entry.expectedBindingCount);
    mismatch(context, fixturePath, entry, "enabled binding count", result.bindings.filter((binding) => binding.enabled).length, entry.expectedEnabledCount);
    mismatch(context, fixturePath, entry, "valid roster diagnostics", result.diagnostics.length, 0);
    return;
  }
  if (entry.kind === "routing-chain") {
    const route = fixture.routing.routes.find((candidate) => candidate.roleId === entry.roleId);
    const capability = fixture.routing.facilityCapabilities.find((candidate) => candidate.capability === route?.homeFacilityCapability);
    mismatch(context, fixturePath, entry, "role home facility capability", route?.homeFacilityCapability, entry.expectedFacility);
    mismatch(context, fixturePath, entry, "required feature", route?.requiredFeatures[0], entry.expectedFeature);
    mismatch(context, fixturePath, entry, "allowed interaction", route?.allowedInteractions.includes(entry.expectedInteraction), true);
    mismatch(context, fixturePath, entry, "compatible facility", capability?.compatibleRoles.includes(entry.roleId), true);
    return;
  }
  if (entry.kind === "feature-availability") {
    const feature = fixture.snapshots[0].features.find((candidate) => candidate.featureId === entry.featureId);
    mismatch(context, fixturePath, entry, "feature available", feature?.available, entry.expectedAvailable);
    mismatch(context, fixturePath, entry, "connector enabled", feature?.connectorEnabled, entry.expectedConnectorEnabled);
    mismatch(context, fixturePath, entry, "session available", feature?.sessionAvailable, entry.expectedSessionAvailable);
    return;
  }
  if (entry.kind === "reconnect" || entry.kind === "reconnect-duplicate") {
    const cursor = entry.kind === "reconnect" ? fixture.reconnect.cursorBefore : fixture.reconnect.cursorAfter;
    const result = reconcileEventWindow(cursor, fixture.snapshots[0]);
    mismatch(context, fixturePath, entry, "reconnect status", result.status, entry.expectedStatus);
    if (entry.expectedAccepted !== undefined) mismatch(context, fixturePath, entry, "reconnect accepted events", result.acceptedEvents.length, entry.expectedAccepted);
    if (entry.expectedDuplicateCount !== undefined) mismatch(context, fixturePath, entry, "reconnect duplicate events", result.duplicateEventIds.length, entry.expectedDuplicateCount);
    return;
  }
  if (entry.kind === "fan-out-join") {
    const order = fixture.fanOut.orders.find((candidate) => candidate.name === entry.orderName);
    const required = new Set(fixture.fanOut.requiredBranches);
    const complete = new Set(order?.completedBranches ?? []);
    mismatch(context, fixturePath, entry, "fan-out branch set", [...complete].toSorted(), [...required].toSorted());
    mismatch(context, fixturePath, entry, "single-branch stage", fixture.fanOut.singleBranchStage, "content_queued");
    mismatch(context, fixturePath, entry, "join owner", fixture.fanOut.join.actorId, "workflow-coordinator");
    mismatch(context, fixturePath, entry, "join actor type", fixture.fanOut.join.actorType, "system");
    mismatch(context, fixturePath, entry, "join event identity", order?.expectedJoinEventId, fixture.fanOut.join.eventId);
    return;
  }
  context.add("knowledge.unhandled-fixture-case", `${fixturePath}: unknown operations case kind`, { fixture: fixturePath, caseName: entry.name, kind: entry.kind });
}

export function evaluateOperationsNegativeDiagnostic(fixture) {
  if (fixture.kind === "snapshot-visual-binding") {
    const document = fixture.document ?? {};
    if (Object.hasOwn(document, "characterDefinition") || Object.hasOwn(document, "homeFacility") || Object.hasOwn(document, "allowedInteractions") || Object.hasOwn(document, "sprite")) {
      return { code: "adapter.snapshot-visual-binding", owner: "adapter", version: 1, message: "Operations Snapshot V2 cannot own character, facility, sprite, or visual interaction data.", context: { pointer: "/characterDefinition" } };
    }
  }
  if (fixture.kind === "duplicate-role") {
    const roles = (fixture.document?.routes ?? []).map((route) => route.roleId);
    const duplicate = roles.find((role, index) => roles.indexOf(role) !== index);
    if (duplicate) return { code: "adapter.routing-role-duplicate", owner: "adapter", version: 1, message: "Activity routing declares one role more than once.", context: { subjectId: duplicate } };
  }
  if (fixture.kind === "duplicate-agent-instance") {
    const ids = (fixture.document?.bindings ?? []).map((binding) => binding.agentInstanceId?.value ?? binding.agentInstanceId);
    const duplicate = ids.find((id, index) => ids.indexOf(id) !== index);
    if (duplicate) return { code: "adapter.agent-instance-duplicate", owner: "adapter", version: 1, message: "An agent instance is bound more than once.", context: { subjectId: duplicate } };
  }
  return null;
}
