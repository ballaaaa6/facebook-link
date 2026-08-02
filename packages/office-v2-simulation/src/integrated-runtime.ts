import type { CommandDocument, JsonValue } from "@affiliate-ops/office-v2-contracts";
import {
  advanceActivityRuntime,
  cancelActivity,
  createActivityRuntime,
  type ActivityFacilityInput,
  type ActivityIntentInput,
  type ActivityRuntimeState,
} from "./activity-runtime.ts";
import {
  advanceCommandPipeline,
  createCommandPipelineState,
  type CommandPipelineState,
} from "./command-pipeline.ts";
import {
  createLifecyclePort,
  type LifecycleSnapshot,
} from "./lifecycle.ts";
import {
  acquireQueueTicket,
  cleanupQueueTicket,
  createQueueState,
  enqueueQueueTicket,
  type QueueState,
  type QueueTicketInput,
} from "./queues.ts";
import { hashSimulationState } from "./state-hash.ts";
import { planCardinalRoute } from "./integrated-navigation.ts";

export const INTEGRATED_RUNTIME_VERSION = "office-integrated-runtime-v1" as const;
export type IntegratedActorState = "idle" | "planning" | "moving" | "interacting" | "blocked";

export interface IntegratedTarget {
  readonly targetId: string;
  readonly generation: number;
  readonly availability: ActivityFacilityInput["availability"];
  readonly facility: ActivityFacilityInput;
}

export interface IntegratedWorld {
  readonly revision: number;
  readonly bounds: { readonly minX: number; readonly maxX: number; readonly minY: number; readonly maxY: number };
  readonly obstacles: readonly string[];
  readonly targets: readonly IntegratedTarget[];
}

export interface IntegratedIntentDefinition extends Omit<ActivityIntentInput, "actorId" | "issueTick" | "notBeforeTick"> {
  readonly actorId: string;
  readonly startCell: string;
  readonly targetId: string;
}

export interface IntegratedQueueBlocker {
  readonly releaseTick: number;
  readonly ticket: QueueTicketInput;
}

export interface IntegratedRuntimeInput {
  readonly world: IntegratedWorld;
  readonly intents: readonly IntegratedIntentDefinition[];
  readonly queueBlockers?: readonly IntegratedQueueBlocker[];
}

export interface IntegratedActor {
  readonly actorId: string;
  readonly state: IntegratedActorState;
  readonly cell: string;
  readonly route: readonly string[];
  readonly routeIndex: number;
  readonly intentId?: string;
  readonly targetId?: string;
  readonly waitingCell?: string;
  readonly lastOutcome?: string;
}

export interface IntegratedEvent {
  readonly sequence: number;
  readonly tick: number;
  readonly kind: string;
  readonly actorId?: string;
  readonly intentId?: string;
  readonly sourceCommandId?: string;
  readonly state?: IntegratedActorState;
  readonly phase?: string;
  readonly reason?: string;
  readonly resourceKeys?: readonly string[];
}

export interface ResourceOwner {
  readonly resourceKey: string;
  readonly ownerId: string;
}

export interface IntegratedSimulationState {
  readonly schemaVersion: typeof INTEGRATED_RUNTIME_VERSION;
  readonly tick: number;
  readonly world: IntegratedWorld;
  readonly intents: readonly IntegratedIntentDefinition[];
  readonly pipeline: CommandPipelineState;
  readonly commandArchive: Readonly<Record<string, CommandDocument>>;
  readonly lifecycle: LifecycleSnapshot;
  readonly queue: QueueState;
  readonly autoReleaseTickets: readonly { readonly ticketId: string; readonly releaseTick: number; readonly released: boolean }[];
  readonly actors: readonly IntegratedActor[];
  readonly activities: readonly ActivityRuntimeState[];
  readonly resourceOwnership: readonly ResourceOwner[];
  readonly heldPropOwnership: readonly ResourceOwner[];
  readonly eventSequence: number;
  readonly events: readonly IntegratedEvent[];
  readonly results: readonly JsonValue[];
}

export interface IntegratedAdvanceResult {
  readonly state: IntegratedSimulationState;
  readonly results: readonly JsonValue[];
  readonly events: readonly IntegratedEvent[];
}

const compare = (left: string, right: string): number => {
  const length = Math.min(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const difference = left.charCodeAt(index) - right.charCodeAt(index);
    if (difference !== 0) return difference;
  }
  return left.length - right.length;
};

const sorted = <T>(values: readonly T[], key: (value: T) => string): readonly T[] => [...values].sort((left, right) => compare(key(left), key(right)));
const targetFor = (state: IntegratedSimulationState, targetId: string): IntegratedTarget | undefined => state.world.targets.find((target) => target.targetId === targetId);
const activityFor = (state: IntegratedSimulationState, intentId: string): ActivityRuntimeState | undefined => state.activities.find((activity) => activity.intentId === intentId);
const actorFor = (state: IntegratedSimulationState, actorId: string): IntegratedActor | undefined => state.actors.find((actor) => actor.actorId === actorId);
const activeTicket = (state: QueueState, intentId: string) => state.tickets.find((ticket) => ticket.intentId === intentId && ["waiting", "acquired"].includes(ticket.state));

function lifecycleAt(tick: number, previous: LifecycleSnapshot): LifecycleSnapshot {
  const port = createLifecyclePort();
  port.transition("show");
  port.pump(1);
  return { ...port.snapshot(), logicalTick: tick, transitions: previous.transitions.length > 0 ? previous.transitions : port.snapshot().transitions };
}

function appendEvent(state: IntegratedSimulationState, event: Omit<IntegratedEvent, "sequence">): { state: IntegratedSimulationState; event: IntegratedEvent } {
  const nextEvent = { ...event, sequence: state.eventSequence + 1 };
  return { state: { ...state, eventSequence: nextEvent.sequence, events: [...state.events, nextEvent] }, event: nextEvent };
}

function actorState(state: IntegratedSimulationState, actorId: string, nextState: IntegratedActorState, tick: number): { state: IntegratedSimulationState; event?: IntegratedEvent } {
  const actor = actorFor(state, actorId);
  if (actor === undefined || actor.state === nextState) return { state };
  const next = { ...state, actors: sorted(state.actors.map((value) => value.actorId === actorId ? { ...value, state: nextState } : value), (value) => value.actorId) };
  return appendEvent(next, { tick, kind: "actor-state-changed", actorId, state: nextState, ...(actor.intentId === undefined ? {} : { intentId: actor.intentId }) });
}

function resourceOwners(queue: QueueState): readonly ResourceOwner[] {
  return sorted(queue.reservations.filter((reservation) => reservation.state === "held").map((reservation) => ({ resourceKey: reservation.resourceKey, ownerId: reservation.actorId })), (value) => `${value.resourceKey}:${value.ownerId}`);
}

function cleanupReason(activity: ActivityRuntimeState): "completed" | "canceled" | "timeout" | "target-removed" | "failed" {
  if (activity.terminalReason === "completed") return "completed";
  if (activity.terminalReason === "timeout") return "timeout";
  if (activity.terminalReason === "target-removed") return "target-removed";
  if (activity.terminalReason === "canceled" || activity.terminalReason === "preempted") return "canceled";
  return "failed";
}

function emitActivityEvents(state: IntegratedSimulationState, before: ActivityRuntimeState, after: ActivityRuntimeState, tick: number): { state: IntegratedSimulationState; events: readonly IntegratedEvent[] } {
  let next = state;
  const emitted: IntegratedEvent[] = [];
  for (const activityEvent of after.events.slice(before.events.length)) {
    const result = appendEvent(next, {
      tick,
      kind: activityEvent.phase === "released" && activityEvent.reason === "completed" ? "interaction-completed" : "activity-phase",
      actorId: after.actorId,
      intentId: after.intentId,
      phase: activityEvent.phase,
      ...(activityEvent.reason === undefined ? {} : { reason: activityEvent.reason }),
      ...(activityEvent.releasedResourceKeys === undefined ? {} : { resourceKeys: activityEvent.releasedResourceKeys }),
    });
    next = result.state;
    emitted.push(result.event);
  }
  return { state: next, events: emitted };
}

function applyCommand(state: IntegratedSimulationState, command: CommandDocument, tick: number): IntegratedSimulationState {
  const intentId = command.payload.intentId.value;
  const definition = state.intents.find((intent) => intent.intentId === intentId);
  if (command.kind === "assign-intent" || command.kind === "request-interaction") {
    if (definition === undefined || activityFor(state, intentId) !== undefined) return state;
    const target = targetFor(state, definition.targetId);
    const actorId = definition.actorId;
    const activity = createActivityRuntime({ ...definition, issueTick: tick, notBeforeTick: tick, actorId }, target === undefined ? [] : [target.facility], { worldRevision: state.world.revision, currentTick: tick });
    const actor: IntegratedActor = { actorId, state: activity.phase === "failed" ? "blocked" : "planning", cell: definition.startCell, route: [], routeIndex: 0, intentId, targetId: definition.targetId, ...(activity.waitingCell === undefined ? {} : { waitingCell: activity.waitingCell }), ...(activity.terminalReason === undefined ? {} : { lastOutcome: activity.terminalReason }) };
    let next = { ...state, actors: sorted([...state.actors.filter((value) => value.actorId !== actorId), actor], (value) => value.actorId), activities: sorted([...state.activities, activity], (value) => value.intentId) };
    next = appendEvent(next, { tick, kind: "actor-state-changed", actorId, intentId, state: actor.state }).state;
    return emitActivityEvents(next, { ...activity, eventSequence: 0, events: [] }, activity, tick).state;
  }
  const activity = activityFor(state, intentId);
  if (activity === undefined) return state;
  if (command.kind === "cancel-intent") {
    const removed = command.payload.reason === "target-removed" ? advanceActivityRuntime(activity, tick, { signal: "target-removed" }).state : cancelActivity(activity, tick, "canceled").state;
    const next = { ...state, activities: state.activities.map((value) => value.intentId === intentId ? removed : value) };
    return emitActivityEvents(next, activity, removed, tick).state;
  }
  const ticket = activeTicket(state.queue, intentId);
  const queue = ticket === undefined ? state.queue : cleanupQueueTicket(state.queue, ticket.ticketId, tick, "canceled").state;
  const removed = cancelActivity(activity, tick, "canceled").state;
  const next = { ...state, queue, activities: state.activities.map((value) => value.intentId === intentId ? removed : value) };
  return emitActivityEvents(next, activity, removed, tick).state;
}

function driveActivity(state: IntegratedSimulationState, activity: ActivityRuntimeState, tick: number): IntegratedSimulationState {
  const definition = state.intents.find((intent) => intent.intentId === activity.intentId);
  const actor = definition === undefined ? undefined : actorFor(state, definition.actorId);
  if (definition === undefined || actor === undefined) return state;
  let next = state;
  let currentActivity = activity;
  if (currentActivity.phase === "released" || currentActivity.phase === "canceled" || currentActivity.phase === "failed") {
    const activityEvents = emitActivityEvents(next, activity, currentActivity, tick);
    next = activityEvents.state;
    const ticket = activeTicket(next.queue, currentActivity.intentId);
    if (ticket !== undefined) next = { ...next, queue: cleanupQueueTicket(next.queue, ticket.ticketId, tick, cleanupReason(currentActivity)).state };
    const finalState: IntegratedActorState = ["unreachable", "target-unavailable", "target-removed", "target-generation-mismatch", "world-revision-mismatch"].includes(currentActivity.terminalReason ?? "") ? "blocked" : "idle";
    next = { ...next, actors: next.actors.map((value) => value.actorId === actor.actorId ? { ...value, state: finalState, route: [], routeIndex: 0, ...(currentActivity.terminalReason === undefined ? {} : { lastOutcome: currentActivity.terminalReason }) } : value) };
    return next;
  }
  const target = targetFor(next, definition.targetId);
  if (target === undefined || target.availability !== "available") {
    currentActivity = cancelActivity(currentActivity, tick, "target-removed").state;
  } else {
    let route = actor.route;
    let routeIndex = actor.routeIndex;
    if (route.length === 0) {
      const planned = planCardinalRoute({ start: actor.cell, goals: target.facility.approachCells, bounds: next.world.bounds, obstacles: next.world.obstacles });
      if (planned === undefined) currentActivity = cancelActivity(currentActivity, tick, "unreachable").state;
      else {
        route = planned;
        routeIndex = 0;
        next = { ...next, actors: next.actors.map((value) => value.actorId === actor.actorId ? { ...value, route, routeIndex } : value) };
      }
    }
    if (currentActivity.phase !== "failed" && route.length > 0 && routeIndex < route.length - 1) {
      routeIndex += 1;
      next = { ...next, actors: next.actors.map((value) => value.actorId === actor.actorId ? { ...value, cell: route[routeIndex]!, routeIndex } : value) };
      next = actorState(next, actor.actorId, "moving", tick).state;
      currentActivity = advanceActivityRuntime(currentActivity, tick).state;
    } else if (currentActivity.phase !== "failed") {
      const existing = activeTicket(next.queue, currentActivity.intentId);
      let queue = next.queue;
      if (existing === undefined) queue = enqueueQueueTicket(queue, { ticketId: `${currentActivity.intentId}:ticket`, intentId: currentActivity.intentId, actorId: actor.actorId, priorityClass: currentActivity.priorityClass, issuedTick: currentActivity.tick, enqueueTick: tick, resourceKeys: currentActivity.requestedResourceKeys, legalYieldCells: target.facility.waitingCells }).state;
      const ticket = queue.tickets.find((value) => value.intentId === currentActivity.intentId && ["waiting", "acquired"].includes(value.state))!;
      const acquired = acquireQueueTicket(queue, ticket.ticketId, tick);
      queue = acquired.state;
      const advanced = advanceActivityRuntime(currentActivity, tick, { blockedResourceKeys: acquired.accepted ? [] : acquired.blockedResourceKeys ?? currentActivity.requestedResourceKeys });
      currentActivity = advanced.state;
      next = { ...next, queue };
    }
  }
  const activityEvents = emitActivityEvents(next, activity, currentActivity, tick);
  next = { ...activityEvents.state, activities: next.activities.map((value) => value.intentId === currentActivity.intentId ? currentActivity : value) };
  const currentActor = actorFor(next, actor.actorId);
  if (currentActivity.phase === "using" || currentActivity.phase === "acquired") {
    const changed = actorState(next, actor.actorId, "interacting", tick);
    next = changed.state;
  } else if (currentActivity.phase === "waiting") {
    next = actorState(next, actor.actorId, "blocked", tick).state;
    if (currentActor !== undefined) next = { ...next, actors: next.actors.map((value) => value.actorId === actor.actorId ? { ...value, ...(currentActivity.waitingCell === undefined ? {} : { waitingCell: currentActivity.waitingCell }) } : value) };
  } else if (currentActivity.phase === "en-route" && currentActor?.state !== "moving") {
    next = actorState(next, actor.actorId, "planning", tick).state;
  }
  if (currentActivity.phase === "released" || currentActivity.phase === "canceled" || currentActivity.phase === "failed") {
    const ticket = activeTicket(next.queue, currentActivity.intentId);
    if (ticket !== undefined) next = { ...next, queue: cleanupQueueTicket(next.queue, ticket.ticketId, tick, cleanupReason(currentActivity)).state };
  }
  return next;
}

function syncOwnership(state: IntegratedSimulationState): IntegratedSimulationState {
  const ownership = resourceOwners(state.queue);
  return { ...state, resourceOwnership: ownership, heldPropOwnership: ownership.filter((value) => value.resourceKey.startsWith("held-prop:")) };
}

export function createIntegratedSimulationState(input: IntegratedRuntimeInput): IntegratedSimulationState {
  let queue = createQueueState({ currentTick: 0, noProgressThreshold: 5 });
  for (const blocker of sorted(input.queueBlockers ?? [], (value) => value.ticket.ticketId)) {
    queue = enqueueQueueTicket(queue, blocker.ticket).state;
    const acquired = acquireQueueTicket(queue, blocker.ticket.ticketId, 0);
    if (!acquired.accepted) throw new Error(`Unable to acquire integration blocker ${blocker.ticket.ticketId}`);
    queue = acquired.state;
  }
  const lifecycle = createLifecyclePort();
  lifecycle.transition("show");
  const state: IntegratedSimulationState = {
    schemaVersion: INTEGRATED_RUNTIME_VERSION,
    tick: 0,
    world: { ...input.world, obstacles: [...input.world.obstacles].sort(compare), targets: sorted(input.world.targets, (value) => value.targetId) },
    intents: sorted(input.intents, (value) => value.intentId),
    pipeline: createCommandPipelineState(input.world.revision, 0),
    commandArchive: {},
    lifecycle: lifecycle.snapshot(),
    queue,
    autoReleaseTickets: (input.queueBlockers ?? []).map((value) => ({ ticketId: value.ticket.ticketId, releaseTick: value.releaseTick, released: false })),
    actors: [],
    activities: [],
    resourceOwnership: [],
    heldPropOwnership: [],
    eventSequence: 0,
    events: [],
    results: [],
  };
  return syncOwnership(state);
}

export function advanceIntegratedTick(state: IntegratedSimulationState, commands: readonly CommandDocument[] = [], targetTick = state.tick + 1): IntegratedAdvanceResult {
  if (!Number.isSafeInteger(targetTick) || targetTick < state.tick || targetTick > state.tick + 1) throw new RangeError("integrated ticks must advance one completed boundary at a time");
  const archive = { ...state.commandArchive };
  for (const command of commands) archive[command.commandId.value] = command;
  const pipelineAdvance = advanceCommandPipeline(state.pipeline, commands, targetTick);
  let next: IntegratedSimulationState = { ...state, tick: targetTick, pipeline: pipelineAdvance.state, commandArchive: archive, lifecycle: targetTick === state.tick ? state.lifecycle : lifecycleAt(targetTick, state.lifecycle), results: [...state.results, ...pipelineAdvance.results] };
  const emitted: IntegratedEvent[] = [];
  for (const event of pipelineAdvance.events) {
    const result = appendEvent(next, {
      tick: event.emittedTick,
      kind: event.kind,
      ...(event.sourceCommandId === undefined ? {} : { sourceCommandId: event.sourceCommandId.value }),
      ...(event.payload.intentId === undefined ? {} : { intentId: event.payload.intentId.value }),
    });
    next = result.state;
    emitted.push(result.event);
  }
  for (const commandId of pipelineAdvance.appliedCommandIds) next = applyCommand(next, archive[commandId]!, targetTick);
  if (targetTick > state.tick) {
    for (const entry of next.autoReleaseTickets) {
      if (!entry.released && entry.releaseTick === targetTick) {
        const released = cleanupQueueTicket(next.queue, entry.ticketId, targetTick, "completed");
        next = { ...next, queue: released.state, autoReleaseTickets: next.autoReleaseTickets.map((value) => value.ticketId === entry.ticketId ? { ...value, released: true } : value) };
      }
    }
    for (const activity of [...next.activities]) next = driveActivity(next, activity, targetTick);
  }
  next = syncOwnership(next);
  const newEvents = next.events.slice(state.events.length);
  emitted.push(...newEvents.filter((event) => !emitted.some((value) => value.sequence === event.sequence)));
  return { state: next, results: pipelineAdvance.results, events: emitted.sort((left, right) => left.sequence - right.sequence) };
}

export function integratedStateHash(state: IntegratedSimulationState): string {
  return hashSimulationState({ state: state as unknown as JsonValue }).stateHash;
}

export function integratedStateAsJson(state: IntegratedSimulationState): JsonValue {
  return state as unknown as JsonValue;
}

export function activeResourceLeaks(state: IntegratedSimulationState): readonly string[] {
  return [
    ...state.queue.tickets.filter((ticket) => ["waiting", "acquired", "yielding"].includes(ticket.state)).map((ticket) => `queue:${ticket.ticketId}`),
    ...state.queue.reservations.filter((reservation) => reservation.state === "held").map((reservation) => `reservation:${reservation.reservationId}`),
    ...state.activities.flatMap((activity) => activity.reservedResourceKeys.map((key) => `activity:${activity.intentId}:${key}`)),
    ...state.heldPropOwnership.map((value) => `held-prop:${value.resourceKey}`),
  ].sort(compare);
}
