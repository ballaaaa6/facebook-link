import type { CommandDocument, JsonValue } from "@affiliate-ops/office-v2-contracts";
import { canonicalHashHex } from "@affiliate-ops/office-v2-contracts";
import {
  activeResourceLeaks,
  advanceIntegratedTick,
  createIntegratedSimulationState,
  integratedStateAsJson,
  type IntegratedIntentDefinition,
  type IntegratedSimulationState,
  type IntegratedWorld,
} from "./integrated-runtime.ts";
import {
  cleanupQueueTicket,
  createQueueState,
  enqueueQueueTicket,
  acquireQueueTicket,
  resolveDeadlocks,
  setWaitForEdges,
  type QueueDeadlockResolution,
  type QueueState,
} from "./queues.ts";
import {
  createReplaySnapshot,
  restoreReplay,
  runReplay,
  type ReplayInput,
  type ReplayRunResult,
} from "./replay.ts";
import { hashSimulationState } from "./state-hash.ts";

export const INTEGRATED_CROWD_VERSION = "office-integrated-crowd-v1" as const;
const WORLD_REVISION = 11;
const SHARED_TARGET = "shared-review";
const NARROW_DOOR_RESOURCE = "transit:narrow-door";
const compare = (left: string, right: string): number => {
  for (let index = 0; index < Math.min(left.length, right.length); index += 1) {
    const difference = left.charCodeAt(index) - right.charCodeAt(index);
    if (difference !== 0) return difference;
  }
  return left.length - right.length;
};
const sorted = <T>(values: readonly T[], key: (value: T) => string): readonly T[] => [...values].sort((left, right) => compare(key(left), key(right)));

export interface CrowdCheckpointDefinition {
  readonly id: string;
  readonly kind: "approaching-narrow-door" | "shared-queue" | "mid-interaction" | "target-removal" | "deadlock-recovery";
  readonly tick: number;
}

export interface CrowdScenarioDefinition {
  readonly id: string;
  readonly actorCount: 1 | 10 | 15;
  readonly syntheticCapacityActors: boolean;
  readonly sharedQueueReleaseTick: number;
  readonly deadlockTick: number;
  readonly deadlockMode: "yield" | "block";
  readonly maxTick: number;
  readonly checkpoints: readonly CrowdCheckpointDefinition[];
}
export interface CrowdTargetRemovalObservation {
  readonly actorId: string;
  readonly targetId: string;
  readonly removalTick: number;
  readonly phaseBeforeRemoval: string;
}

export interface IntegratedCrowdEvent {
  readonly sequence: number;
  readonly tick: number;
  readonly kind: "queue-acquired" | "target-removed" | "actor-terminal" | "deadlock-resolution";
  readonly actorId?: string;
  readonly targetId?: string;
  readonly phaseBeforeRemoval?: string;
  readonly reason?: string;
  readonly ticketId?: string;
  readonly victimActorId?: string;
  readonly outcome?: "yield" | "blocked";
  readonly yieldCell?: string;
}

export interface IntegratedCrowdState {
  readonly schemaVersion: typeof INTEGRATED_CROWD_VERSION;
  readonly scenarioId: string;
  readonly actorCount: number;
  readonly syntheticCapacityActors: boolean;
  readonly maxTick: number;
  readonly sharedQueueReleaseTick: number;
  readonly deadlockTick: number;
  readonly deadlockMode: "yield" | "block";
  readonly runtime: IntegratedSimulationState;
  readonly contentionQueue: QueueState;
  readonly queueProbe: QueueState;
  readonly fairnessOrder: readonly string[];
  readonly removedTargetIds: readonly string[];
  readonly targetRemovalObservations: readonly CrowdTargetRemovalObservation[];
  readonly terminalOutcomes: readonly { readonly actorId: string; readonly reason: string; readonly tick: number }[];
  readonly deadlockResolutions: readonly QueueDeadlockResolution[];
  readonly events: readonly IntegratedCrowdEvent[];
  readonly eventSequence: number;
}

export interface IntegratedCrowdAdvanceResult {
  readonly state: IntegratedCrowdState;
  readonly results: readonly JsonValue[];
  readonly events: readonly JsonValue[];
}

export interface CrowdScenarioRun {
  readonly definition: CrowdScenarioDefinition;
  readonly world: IntegratedWorld;
  readonly commands: readonly CommandDocument[];
  readonly inputs: readonly ReplayInput[];
  readonly initialState: IntegratedCrowdState;
  readonly uninterrupted: ReplayRunResult<JsonValue>;
}

function facility(facilityId: string) {
  return {
    facilityId,
    slotId: `${facilityId}-use`,
    capability: "review-content",
    capacity: 1,
    availability: "available" as const,
    targetGeneration: 1,
    revision: WORLD_REVISION,
    approachCells: ["4,4"],
    waitingCells: ["3,4", "2,4", "1,4"],
  };
}

function crowdWorld(): IntegratedWorld {
  return {
    revision: WORLD_REVISION,
    bounds: { minX: 0, maxX: 6, minY: 0, maxY: 6 },
    obstacles: ["4,3", "4,5"],
    targets: [
      { targetId: SHARED_TARGET, generation: 1, availability: "available", facility: facility(SHARED_TARGET) },
      { targetId: "remove-moving", generation: 1, availability: "available", facility: facility("remove-moving") },
    ],
  };
}

function actorId(index: number): string { return `actor-${String(index).padStart(2, "0")}`; }

function intentFor(definition: CrowdScenarioDefinition, index: number): IntegratedIntentDefinition {
  const id = actorId(index);
  const targetId = index === 1 && definition.actorCount > 1 ? "remove-moving" : SHARED_TARGET;
  const priorityClass = index % 4 === 0 && definition.actorCount > 1 ? "decorative" as const : "durable" as const;
  return {
    intentId: `${definition.id}:${id}:intent`,
    actorId: id,
    targetId,
    startCell: index === 1 && definition.actorCount > 1 ? "0,0" : "0,4",
    capability: "review-content",
    priorityClass,
    sourceKind: priorityClass === "durable" ? "durable-operational" : "decorative",
    preemptionPolicy: priorityClass === "durable" ? "never" : "decorative-only",
    durationTicks: definition.actorCount === 1 ? 3 : 2,
    expectedWorldRevision: WORLD_REVISION,
    expectedTargetGeneration: 1,
    resourceKeys: [NARROW_DOOR_RESOURCE],
    ...(index === 6 && definition.actorCount > 1 ? { expiresTick: 12 } : {}),
    ...(index === 4 || index === 5 ? { heldPropKey: "review-card" } : {}),
  };
}

function commandFor(intent: IntegratedIntentDefinition, kind: CommandDocument["kind"], scheduledTick: number, sequence: number, reason?: string): CommandDocument {
  const payload = { intentId: { kind: "intent" as const, value: intent.intentId }, ...(reason === undefined ? {} : { reason }) };
  const payloadDigest = canonicalHashHex({ domain: "office-v2:t3-command", domainVersion: "office-t3-command-v1", payload });
  return {
    schemaVersion: "office-simulation-command-v2",
    commandId: { kind: "command", value: `${intent.intentId}:${kind}:${scheduledTick}` },
    commandVersion: 1,
    ownerKind: "actor",
    actorId: { kind: "actor", value: intent.actorId },
    issuedTick: scheduledTick,
    scheduledTick,
    sourceRank: 0,
    sourceSequence: sequence,
    kind,
    correlation: {},
    payload,
    payloadDigest,
    expectedWorldRevision: WORLD_REVISION,
  } as CommandDocument;
}

function blocker(releaseTick: number) {
  return releaseTick === 0 ? undefined : [{
    releaseTick,
    ticket: {
      ticketId: "shared-facility-blocker",
      intentId: "shared-facility-blocker-intent",
      actorId: "shared-facility-blocker-actor",
      priorityClass: "durable" as const,
      issuedTick: 0,
      enqueueTick: 0,
      resourceKeys: [NARROW_DOOR_RESOURCE, `facility:${SHARED_TARGET}`, `socket:${SHARED_TARGET}-use`, "cell:4,4"],
      legalYieldCells: ["3,4"],
    },
  }];
}

function createDeadlockProbe(mode: "yield" | "block"): QueueState {
  let state = createQueueState({ noProgressThreshold: 5 });
  for (const ticket of [
    { ticketId: "probe-ticket-a", intentId: "probe-intent-a", actorId: "probe-actor-a", priorityClass: "durable" as const, issuedTick: 0, enqueueTick: 0, resourceKeys: ["probe:resource:a"], legalYieldCells: ["probe:yield-a"] },
    { ticketId: "probe-ticket-b", intentId: "probe-intent-b", actorId: "probe-actor-b", priorityClass: "decorative" as const, issuedTick: 0, enqueueTick: 0, resourceKeys: ["probe:resource:b"], legalYieldCells: mode === "yield" ? ["probe:yield-b"] : [] },
  ]) {
    state = enqueueQueueTicket(state, ticket).state;
    state = acquireQueueTicket(state, ticket.ticketId, 0).state;
  }
  return state;
}

function contentionResourceKeys(intent: IntegratedIntentDefinition): readonly string[] {
  return [NARROW_DOOR_RESOURCE, `facility:${SHARED_TARGET}`, `socket:${SHARED_TARGET}-use`, "cell:4,4", ...(intent.heldPropKey === undefined ? [] : [intent.heldPropKey.startsWith("held-prop:") ? intent.heldPropKey : `held-prop:${intent.heldPropKey}`])];
}

function createContentionQueue(definition: CrowdScenarioDefinition): QueueState {
  let state = createQueueState({ noProgressThreshold: 5 });
  if (definition.sharedQueueReleaseTick > 0) {
    state = enqueueQueueTicket(state, {
      ticketId: "contention-facility-blocker",
      intentId: "contention-facility-blocker-intent",
      actorId: "contention-facility-blocker-actor",
      priorityClass: "durable",
      issuedTick: 0,
      enqueueTick: 0,
      resourceKeys: [NARROW_DOOR_RESOURCE, `facility:${SHARED_TARGET}`, `socket:${SHARED_TARGET}-use`, "cell:4,4"],
      legalYieldCells: ["3,4"],
    }).state;
    state = acquireQueueTicket(state, "contention-facility-blocker", 0).state;
  }
  return state;
}
function appendEvent(state: IntegratedCrowdState, event: Omit<IntegratedCrowdEvent, "sequence">): IntegratedCrowdState {
  const next = { ...event, sequence: state.eventSequence + 1 };
  return { ...state, eventSequence: next.sequence, events: [...state.events, next] };
}
function queueProbeAtTick(state: IntegratedCrowdState, tick: number): IntegratedCrowdState {
  if (state.actorCount === 1 || tick !== state.deadlockTick || state.deadlockResolutions.length > 0) return state;
  const edged = setWaitForEdges(state.queueProbe, [
    { fromActorId: "probe-actor-a", toActorId: "probe-actor-b", kind: "resource", resourceKey: "probe:resource:b", createdTick: tick },
    { fromActorId: "probe-actor-b", toActorId: "probe-actor-a", kind: "resource", resourceKey: "probe:resource:a", createdTick: tick },
  ], tick);
  const resolved = resolveDeadlocks(edged, tick);
  let next: IntegratedCrowdState = { ...state, queueProbe: resolved.state, deadlockResolutions: [...state.deadlockResolutions, ...resolved.resolutions] };
  for (const resolution of resolved.resolutions) next = appendEvent(next, { tick, kind: "deadlock-resolution", victimActorId: resolution.victimActorId, outcome: resolution.outcome, ...(resolution.victimTicketId === undefined ? {} : { ticketId: resolution.victimTicketId }), ...(resolution.yieldCell === undefined ? {} : { yieldCell: resolution.yieldCell }) });
  return next;
}

function contentionQueueAtTick(state: IntegratedCrowdState, beforeRuntime: IntegratedSimulationState, commands: readonly CommandDocument[], tick: number): IntegratedCrowdState {
  let queue = state.contentionQueue;
  const timedOutActors: string[] = [];
  for (const command of commands) {
    if (command.kind !== "cancel-intent" || command.payload.reason !== "target-removed") continue;
    const intent = beforeRuntime.intents.find((value) => value.intentId === command.payload.intentId.value);
    if (intent === undefined) continue;
    const ticket = queue.tickets.find((value) => value.actorId === intent.actorId && ["waiting", "acquired"].includes(value.state));
    if (ticket !== undefined) queue = cleanupQueueTicket(queue, ticket.ticketId, tick, "target-removed").state;
  }
  const blocker = queue.tickets.find((ticket) => ticket.ticketId === "contention-facility-blocker" && ticket.state === "acquired");
  if (blocker !== undefined && tick >= state.sharedQueueReleaseTick) queue = cleanupQueueTicket(queue, blocker.ticketId, tick, "completed").state;
  for (const intent of state.runtime.intents) {
    const actor = state.runtime.actors.find((value) => value.actorId === intent.actorId);
    const activity = state.runtime.activities.find((value) => value.intentId === intent.intentId);
    if (intent.targetId !== SHARED_TARGET || actor === undefined || activity === undefined || activity.terminalReason !== undefined || actor.route.length === 0 || actor.routeIndex !== actor.route.length - 1) continue;
    if (queue.tickets.some((ticket) => ticket.actorId === actor.actorId)) continue;
    queue = enqueueQueueTicket(queue, { ticketId: `${intent.intentId}:contention-ticket`, intentId: intent.intentId, actorId: actor.actorId, priorityClass: intent.priorityClass, issuedTick: activity.tick, enqueueTick: tick, resourceKeys: contentionResourceKeys(intent), legalYieldCells: ["3,4", "2,4"] }).state;
  }
  for (const intent of state.runtime.intents) {
    if (intent.expiresTick === undefined || intent.expiresTick > tick) continue;
    const ticket = queue.tickets.find((value) => value.actorId === intent.actorId && ["waiting", "acquired"].includes(value.state));
    if (ticket !== undefined) {
      queue = cleanupQueueTicket(queue, ticket.ticketId, tick, "timeout").state;
      timedOutActors.push(intent.actorId);
    }
  }
  for (const ticket of queue.tickets.filter((value) => value.state === "waiting")) queue = acquireQueueTicket(queue, ticket.ticketId, tick).state;
  for (const ticket of queue.tickets.filter((value) => value.state === "acquired" && value.actorId.startsWith("actor-") && value.acquiredTick !== undefined && tick - value.acquiredTick >= 4)) queue = cleanupQueueTicket(queue, ticket.ticketId, tick, "completed").state;
  let next: IntegratedCrowdState = { ...state, contentionQueue: queue };
  for (const actor of timedOutActors) {
    const existing = next.terminalOutcomes.find((value) => value.actorId === actor);
    if (existing?.reason === "timeout") continue;
    next = { ...next, terminalOutcomes: [...next.terminalOutcomes.filter((value) => value.actorId !== actor), { actorId: actor, reason: "timeout", tick }] };
    next = appendEvent(next, { tick, kind: "actor-terminal", actorId: actor, reason: "timeout" });
  }
  return next;
}

function replayStep(value: JsonValue, input: ReplayInput | undefined, tick: number) {
  const state = value as unknown as IntegratedCrowdState;
  const payload = input?.payload;
  const commandValue = payload !== undefined && payload !== null && typeof payload === "object" && !Array.isArray(payload)
    ? (payload as unknown as { readonly command?: JsonValue }).command
    : undefined;
  const command = commandValue as unknown as CommandDocument | undefined;
  const advanced = advanceIntegratedCrowdTick(state, command === undefined ? [] : [command], tick);
  return { state: crowdStateAsJson(advanced.state), results: advanced.results, events: advanced.events, subsystem: "integrated-crowd-reducer-adapter" };
}

export function createIntegratedCrowdScenario(definition: CrowdScenarioDefinition): { readonly world: IntegratedWorld; readonly intents: readonly IntegratedIntentDefinition[]; readonly commands: readonly CommandDocument[]; readonly inputs: readonly ReplayInput[]; readonly initialState: IntegratedCrowdState } {
  const world = crowdWorld();
  const intents = Array.from({ length: definition.actorCount }, (_, offset) => intentFor(definition, offset + 1));
  const commands: CommandDocument[] = intents.map((intent, index) => commandFor(intent, "assign-intent", 1, index + 1));
  if (definition.actorCount > 1) {
    commands.push(commandFor(intents[0]!, "cancel-intent", 2, 100, "target-removed"));
    commands.push(commandFor(intents[1]!, "cancel-intent", 6, 101, "target-removed"));
    commands.push(commandFor(intents[2]!, "cancel-intent", 10, 102, "target-removed"));
  }
  commands.sort((left, right) => left.scheduledTick - right.scheduledTick || left.sourceSequence - right.sourceSequence);
  const blockers = blocker(definition.sharedQueueReleaseTick);
  const initialRuntime = createIntegratedSimulationState({ world, intents, ...(blockers === undefined ? {} : { queueBlockers: blockers }) });
  const initialState: IntegratedCrowdState = {
    schemaVersion: INTEGRATED_CROWD_VERSION,
    scenarioId: definition.id,
    actorCount: definition.actorCount,
    syntheticCapacityActors: definition.syntheticCapacityActors,
    maxTick: definition.maxTick,
    sharedQueueReleaseTick: definition.sharedQueueReleaseTick,
    deadlockTick: definition.deadlockTick,
    deadlockMode: definition.deadlockMode,
    runtime: initialRuntime,
    contentionQueue: createContentionQueue(definition),
    queueProbe: createDeadlockProbe(definition.deadlockMode),
    fairnessOrder: [],
    removedTargetIds: [],
    targetRemovalObservations: [],
    terminalOutcomes: [],
    deadlockResolutions: [],
    events: [],
    eventSequence: 0,
  };
  const inputs = commands.map((command) => ({ inputId: command.commandId.value, scheduledTick: command.scheduledTick, kind: command.kind, payload: { command: command as unknown as JsonValue }, payloadDigest: canonicalHashHex({ domain: "office-v2:t3-input", domainVersion: "office-t3-input-v1", payload: command as unknown as JsonValue }) }));
  return { world, intents, commands, inputs, initialState };
}

export function advanceIntegratedCrowdTick(state: IntegratedCrowdState, commands: readonly CommandDocument[] = [], targetTick = state.runtime.tick + 1): IntegratedCrowdAdvanceResult {
  const beforeRuntime = state.runtime;
  const beforeAcquired = new Set(state.contentionQueue.tickets.filter((ticket) => ticket.state === "acquired").map((ticket) => ticket.ticketId));
  let nextRuntimeResult = advanceIntegratedTick(beforeRuntime, commands, targetTick);
  let next: IntegratedCrowdState = { ...state, runtime: nextRuntimeResult.state };
  next = contentionQueueAtTick(next, beforeRuntime, commands, targetTick);
  for (const command of commands) {
    if (command.kind !== "cancel-intent" || command.payload.reason !== "target-removed") continue;
    const intent = beforeRuntime.intents.find((value) => value.intentId === command.payload.intentId.value);
    const activity = beforeRuntime.activities.find((value) => value.intentId === command.payload.intentId.value);
    if (intent === undefined) continue;
    const ticket = state.contentionQueue.tickets.find((value) => value.actorId === intent.actorId && ["waiting", "acquired"].includes(value.state));
    const actor = beforeRuntime.actors.find((value) => value.actorId === intent.actorId);
    const phaseBeforeRemoval = ticket?.state === "acquired" ? "using" : ticket?.state === "waiting" ? "waiting" : actor?.state === "moving" ? "en-route" : activity?.phase ?? "missing";
    next = { ...next, removedTargetIds: sorted([...new Set([...next.removedTargetIds, intent.targetId])], (value) => value) };
    next = { ...next, targetRemovalObservations: [...next.targetRemovalObservations, { actorId: intent.actorId, targetId: intent.targetId, removalTick: targetTick, phaseBeforeRemoval }] };
    next = appendEvent(next, { tick: targetTick, kind: "target-removed", actorId: intent.actorId, targetId: intent.targetId, phaseBeforeRemoval, reason: "target-removed" });
  }
  next = queueProbeAtTick(next, targetTick);
  const acquired = next.contentionQueue.tickets.filter((ticket) => ticket.state === "acquired" && ticket.acquiredTick === targetTick && ticket.actorId.startsWith("actor-") && !beforeAcquired.has(ticket.ticketId));
  for (const ticket of acquired) {
    if (ticket.resourceKeys.includes(NARROW_DOOR_RESOURCE)) {
      next = { ...next, fairnessOrder: next.fairnessOrder.includes(ticket.actorId) ? next.fairnessOrder : [...next.fairnessOrder, ticket.actorId] };
      next = appendEvent(next, { tick: targetTick, kind: "queue-acquired", actorId: ticket.actorId, ticketId: ticket.ticketId });
    }
  }
  const knownTerminal = new Set(next.terminalOutcomes.map((value) => value.actorId));
  for (const activity of next.runtime.activities) {
    if (activity.terminalReason === undefined || knownTerminal.has(activity.actorId)) continue;
    next = { ...next, terminalOutcomes: [...next.terminalOutcomes, { actorId: activity.actorId, reason: activity.terminalReason, tick: activity.tick }] };
    next = appendEvent(next, { tick: activity.tick, kind: "actor-terminal", actorId: activity.actorId, reason: activity.terminalReason });
  }
  if (targetTick === state.maxTick) {
    let probe = next.queueProbe;
    for (const ticket of probe.tickets.filter((value) => ["waiting", "acquired"].includes(value.state))) probe = cleanupQueueTicket(probe, ticket.ticketId, targetTick, "completed").state;
    let contention = next.contentionQueue;
    for (const ticket of contention.tickets.filter((value) => ["waiting", "acquired"].includes(value.state))) contention = cleanupQueueTicket(contention, ticket.ticketId, targetTick, "completed").state;
    next = { ...next, queueProbe: probe, contentionQueue: contention };
  }
  const customEvents = next.events.slice(state.events.length) as unknown as readonly JsonValue[];
  return { state: next, results: nextRuntimeResult.results, events: [...(nextRuntimeResult.events as unknown as readonly JsonValue[]), ...customEvents] };
}

export function crowdStateAsJson(state: IntegratedCrowdState): JsonValue { return state as unknown as JsonValue; }
export function crowdStateHash(state: IntegratedCrowdState): string { return hashSimulationState({ state: crowdStateAsJson(state) }).stateHash; }

export function activeCrowdLeaks(state: IntegratedCrowdState): readonly string[] {
  const leaks = [...activeResourceLeaks(state.runtime)];
  leaks.push(...state.contentionQueue.tickets.filter((ticket) => ["waiting", "acquired"].includes(ticket.state)).map((ticket) => `contention-queue:${ticket.ticketId}`));
  leaks.push(...state.contentionQueue.reservations.filter((reservation) => reservation.state === "held").map((reservation) => `contention-reservation:${reservation.reservationId}`));
  leaks.push(...state.queueProbe.tickets.filter((ticket) => ["waiting", "acquired"].includes(ticket.state)).map((ticket) => `probe-queue:${ticket.ticketId}`));
  leaks.push(...state.queueProbe.reservations.filter((reservation) => reservation.state === "held").map((reservation) => `probe-reservation:${reservation.reservationId}`));
  const removed = new Set(state.removedTargetIds);
  for (const activity of state.runtime.activities) if (activity.terminalReason === undefined && removed.has(state.runtime.intents.find((intent) => intent.intentId === activity.intentId)?.targetId ?? "")) leaks.push(`removed-target:${activity.intentId}`);
  return leaks.sort(compare);
}

export function runIntegratedCrowdScenario(definition: CrowdScenarioDefinition): CrowdScenarioRun {
  const setup = createIntegratedCrowdScenario(definition);
  const uninterrupted = runReplay({ initialState: crowdStateAsJson(setup.initialState), initialTick: 0, untilTick: definition.maxTick, inputs: setup.inputs, world: { id: "t3-integrated-crowd-world", version: 1 }, worldRevision: WORLD_REVISION, definitionVersion: "t3-crowd-v1", step: replayStep });
  return { definition, world: setup.world, commands: setup.commands, inputs: setup.inputs, initialState: setup.initialState, uninterrupted };
}

export function restoreCrowdCheckpoint(run: CrowdScenarioRun, checkpoint: CrowdCheckpointDefinition): ReplayRunResult<JsonValue> {
  const frame = run.uninterrupted.frames.find((value) => value.tick === checkpoint.tick);
  if (frame === undefined) throw new Error(`${run.definition.id}:${checkpoint.id} checkpoint tick ${checkpoint.tick} was not produced`);
  const state = frame.state as unknown as IntegratedCrowdState;
  const active = state.runtime.activities.find((activity) => activity.terminalReason === undefined);
  const snapshot = createReplaySnapshot({ state: frame.state, tick: frame.tick, stateHash: frame.stateHash, world: { id: "t3-integrated-crowd-world", version: 1 }, worldRevision: WORLD_REVISION, definitionVersion: "t3-crowd-v1", inProgress: {
    actionPhase: active?.phase ?? "completed-boundary",
    progressTicks: active?.progressTicks ?? 0,
    resourceKeys: active?.requestedResourceKeys.length ? active.requestedResourceKeys : ["checkpoint:completed"],
    reservationIds: active?.reservations.length ? active.reservations.map((value) => value.reservationId) : [`${run.definition.id}:${checkpoint.id}:checkpoint`],
    targetGeneration: active?.targetGeneration ?? 1,
    worldRevision: WORLD_REVISION,
    heldPropState: { owners: state.runtime.heldPropOwnership as unknown as JsonValue },
    correlation: { workflowRunId: `${run.definition.id}:workflow`, taskId: active?.actionId ?? `${checkpoint.id}:task`, eventId: `${run.definition.id}:${checkpoint.id}:event` },
  } });
  return restoreReplay(snapshot, { untilTick: run.definition.maxTick, inputs: run.inputs.filter((value) => value.scheduledTick > checkpoint.tick), world: { id: "t3-integrated-crowd-world", version: 1 }, worldRevision: WORLD_REVISION, definitionVersion: "t3-crowd-v1", step: replayStep });
}
