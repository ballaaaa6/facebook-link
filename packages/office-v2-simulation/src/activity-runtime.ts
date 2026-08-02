export const ACTIVITY_RUNTIME_VERSION = "office-activity-runtime-v1" as const;

export type ActivityPhase =
  | "requested"
  | "en-route"
  | "waiting"
  | "acquired"
  | "using"
  | "released"
  | "canceled"
  | "failed";

export type ActivityTerminalReason =
  | "completed"
  | "canceled"
  | "timeout"
  | "target-removed"
  | "target-unavailable"
  | "target-generation-mismatch"
  | "world-revision-mismatch"
  | "unreachable"
  | "preempted"
  | "invalid-resource-set";

export interface ActivityIntentInput {
  readonly intentId: string;
  readonly actorId: string;
  readonly capability: string;
  readonly priorityClass: "durable" | "decorative";
  readonly sourceKind?: "durable-operational" | "decorative";
  readonly preemptionPolicy?: "never" | "decorative-only" | "resume-after-yield";
  readonly issueTick: number;
  readonly notBeforeTick: number;
  readonly expiresTick?: number;
  readonly durationTicks: number;
  readonly expectedWorldRevision?: number;
  readonly expectedTargetGeneration?: number;
  readonly resourceKeys: readonly string[];
  readonly heldPropKey?: string;
}

export interface ActivityFacilityInput {
  readonly facilityId: string;
  readonly facilityVersion?: number;
  readonly slotId: string;
  readonly slotVersion?: number;
  readonly capability: string;
  readonly capacity: number;
  readonly availability: "available" | "disabled" | "removed" | "occupied";
  readonly targetGeneration: number;
  readonly revision: number;
  readonly approachCells: readonly string[];
  readonly waitingCells: readonly string[];
}

export interface ActivityRuntimeOptions {
  readonly currentTick?: number;
  readonly worldRevision: number;
}

export interface ActivityAdvanceOptions {
  readonly blockedResourceKeys?: readonly string[];
  readonly signal?: "cancel" | "target-removed" | "route-invalidated" | "actor-removed";
}

export interface ActivityEvent {
  readonly eventId: string;
  readonly tick: number;
  readonly sequence: number;
  readonly phase: ActivityPhase;
  readonly reason?: ActivityTerminalReason;
  readonly releasedResourceKeys?: readonly string[];
}

export interface ActivityQueueTicket {
  readonly ticketId: string;
  readonly state: "waiting" | "acquired" | "canceled";
  readonly enqueueTick: number;
  readonly resourceKeys: readonly string[];
}

export interface ActivityReservation {
  readonly reservationId: string;
  readonly resourceKey: string;
  readonly state: "held" | "released";
  readonly acquiredTick: number;
  readonly releasedTick?: number;
}

export interface ActivityRuntimeState {
  readonly schemaVersion: typeof ACTIVITY_RUNTIME_VERSION;
  readonly tick: number;
  readonly actorId: string;
  readonly intentId: string;
  readonly actionId: string;
  readonly priorityClass: "durable" | "decorative";
  readonly capability: string;
  readonly facilityId?: string;
  readonly slotId?: string;
  readonly targetGeneration?: number;
  readonly worldRevision: number;
  readonly phase: ActivityPhase;
  readonly notBeforeTick: number;
  readonly expiresTick?: number;
  readonly progressTicks: number;
  readonly durationTicks: number;
  readonly requestedResourceKeys: readonly string[];
  readonly reservedResourceKeys: readonly string[];
  readonly waitingCell?: string;
  readonly queueTicket?: ActivityQueueTicket;
  readonly reservations: readonly ActivityReservation[];
  readonly cleanupGeneration: number;
  readonly terminalReason?: ActivityTerminalReason;
  readonly releasedResourceKeys: readonly string[];
  readonly eventSequence: number;
  readonly events: readonly ActivityEvent[];
}

export interface ActivityAdvanceResult {
  readonly state: ActivityRuntimeState;
  readonly events: readonly ActivityEvent[];
}

function compare(left: string, right: string): number {
  const length = Math.min(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const difference = left.charCodeAt(index) - right.charCodeAt(index);
    if (difference !== 0) return difference;
  }
  return left.length - right.length;
}

function assertNonNegativeInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0) throw new RangeError(`${name} must be a non-negative safe integer`);
}

function stableUnique(values: readonly string[]): string[] {
  if (values.some((value) => typeof value !== "string" || value.length === 0)) {
    throw new TypeError("simulation.activity-resource-invalid: resource keys must be non-empty strings");
  }
  const sorted = [...values].sort(compare);
  const unique: string[] = [];
  for (const value of sorted) {
    if (unique.at(-1) === value) throw new TypeError("simulation.activity-resource-duplicate: resource keys must be unique");
    unique.push(value);
  }
  return unique;
}

function facilityKey(facility: ActivityFacilityInput): string {
  return `${facility.facilityId}@${facility.facilityVersion ?? 1}:${facility.slotId}@${facility.slotVersion ?? 1}`;
}

function selectFacility(intent: ActivityIntentInput, facilities: readonly ActivityFacilityInput[]): ActivityFacilityInput | undefined {
  return facilities
    .filter((facility) => (
      facility.capability === intent.capability
      && facility.availability === "available"
      && facility.capacity > 0
    ))
    .slice()
    .sort((left, right) => compare(facilityKey(left), facilityKey(right)))[0];
}

function event(
  state: ActivityRuntimeState,
  phase: ActivityPhase,
  tick: number,
  reason?: ActivityTerminalReason,
  releasedResourceKeys?: readonly string[],
): ActivityEvent {
  return {
    eventId: `${state.intentId}:${state.eventSequence + 1}`,
    tick,
    sequence: state.eventSequence + 1,
    phase,
    ...(reason === undefined ? {} : { reason }),
    ...(releasedResourceKeys === undefined ? {} : { releasedResourceKeys }),
  };
}

function withEvent(
  state: ActivityRuntimeState,
  phase: ActivityPhase,
  tick: number,
  reason?: ActivityTerminalReason,
  releasedResourceKeys?: readonly string[],
): ActivityRuntimeState {
  const nextEvent = event(state, phase, tick, reason, releasedResourceKeys);
  return { ...state, phase, tick, eventSequence: nextEvent.sequence, events: [...state.events, nextEvent] };
}

function terminal(phase: ActivityPhase): boolean {
  return phase === "released" || phase === "canceled" || phase === "failed";
}

function cleanup(
  state: ActivityRuntimeState,
  tick: number,
  phase: "released" | "canceled" | "failed",
  reason: ActivityTerminalReason,
): ActivityRuntimeState {
  if (terminal(state.phase)) return state;
  const released = stableUnique([...state.reservedResourceKeys, ...(state.waitingCell === undefined ? [] : [state.waitingCell])]);
  const reservations = state.reservations.map((reservation) => ({ ...reservation, state: "released" as const, releasedTick: tick }));
  const queueTicket = state.queueTicket === undefined ? undefined : { ...state.queueTicket, state: "canceled" as const };
  const next = {
    ...state,
    tick,
    phase,
    progressTicks: state.progressTicks,
    reservedResourceKeys: [],
    reservations,
    cleanupGeneration: state.cleanupGeneration + 1,
    terminalReason: reason,
    releasedResourceKeys: stableUnique([...state.releasedResourceKeys, ...released]),
    ...(queueTicket === undefined ? {} : { queueTicket }),
  };
  return withEvent(next, phase, tick, reason, next.releasedResourceKeys);
}

function acquire(state: ActivityRuntimeState, tick: number): ActivityRuntimeState {
  const reservations = state.requestedResourceKeys.map((resourceKey, index) => ({
    reservationId: `${state.intentId}:reservation:${index + 1}`,
    resourceKey,
    state: "held" as const,
    acquiredTick: tick,
  }));
  const queueTicket = state.queueTicket === undefined ? undefined : { ...state.queueTicket, state: "acquired" as const };
  const { waitingCell: _waitingCell, ...withoutWaitingCell } = state;
  return withEvent({
    ...withoutWaitingCell,
    tick,
    reservedResourceKeys: state.requestedResourceKeys,
    reservations,
    ...(queueTicket === undefined ? {} : { queueTicket }),
  }, "acquired", tick);
}

function blockedBy(state: ActivityRuntimeState, blockedResourceKeys: readonly string[]): boolean {
  const blocked = new Set(blockedResourceKeys);
  return state.requestedResourceKeys.some((resourceKey) => blocked.has(resourceKey));
}

function wait(state: ActivityRuntimeState, tick: number): ActivityRuntimeState {
  const waitingCell = state.waitingCell;
  if (waitingCell === undefined) return cleanup(state, tick, "failed", "target-unavailable");
  const queueTicket = state.queueTicket ?? {
    ticketId: `${state.intentId}:ticket`,
    state: "waiting" as const,
    enqueueTick: tick,
    resourceKeys: state.requestedResourceKeys,
  };
  return withEvent({ ...state, tick, queueTicket, reservedResourceKeys: [waitingCell] }, "waiting", tick);
}

function applyTick(state: ActivityRuntimeState, tick: number, options: ActivityAdvanceOptions): ActivityRuntimeState {
  if (terminal(state.phase)) return state;
  if (options.signal !== undefined) {
    const reason: ActivityTerminalReason = options.signal === "cancel"
      ? "canceled"
      : options.signal === "target-removed"
        ? "target-removed"
        : options.signal === "actor-removed"
          ? "canceled"
          : "unreachable";
    return cleanup(state, tick, reason === "canceled" ? "canceled" : "failed", reason);
  }
  if (state.expiresTick !== undefined && state.expiresTick <= tick) return cleanup(state, tick, "canceled", "timeout");

  if (state.phase === "requested") {
    return tick >= state.notBeforeTick ? withEvent({ ...state, tick }, "en-route", tick) : { ...state, tick };
  }
  if (state.phase === "en-route") {
    return blockedBy(state, options.blockedResourceKeys ?? []) ? wait(state, tick) : acquire(state, tick);
  }
  if (state.phase === "waiting") {
    return blockedBy(state, options.blockedResourceKeys ?? []) ? { ...state, tick } : acquire(state, tick);
  }
  if (state.phase === "acquired") return withEvent({ ...state, tick, progressTicks: 0 }, "using", tick);
  if (state.phase === "using") {
    const progressTicks = state.progressTicks + 1;
    if (progressTicks >= state.durationTicks) return cleanup({ ...state, progressTicks }, tick, "released", "completed");
    return { ...state, tick, progressTicks };
  }
  return { ...state, tick };
}

export function createActivityRuntime(
  intent: ActivityIntentInput,
  facilities: readonly ActivityFacilityInput[],
  options: ActivityRuntimeOptions,
): ActivityRuntimeState {
  assertNonNegativeInteger(options.worldRevision, "worldRevision");
  assertNonNegativeInteger(intent.issueTick, "issueTick");
  assertNonNegativeInteger(intent.notBeforeTick, "notBeforeTick");
  assertNonNegativeInteger(intent.durationTicks, "durationTicks");
  if (intent.durationTicks === 0) throw new RangeError("durationTicks must be positive");
  if (intent.expiresTick !== undefined) assertNonNegativeInteger(intent.expiresTick, "expiresTick");
  const currentTick = options.currentTick ?? intent.issueTick;
  assertNonNegativeInteger(currentTick, "currentTick");
  const requestedResourceKeys = stableUnique(intent.resourceKeys);
  const selected = selectFacility(intent, facilities);
  const waitingCell = selected?.waitingCells.slice().sort(compare)[0];
  const base: ActivityRuntimeState = {
    schemaVersion: ACTIVITY_RUNTIME_VERSION,
    tick: currentTick,
    actorId: intent.actorId,
    intentId: intent.intentId,
    actionId: `${intent.intentId}:action`,
    priorityClass: intent.priorityClass,
    capability: intent.capability,
    worldRevision: options.worldRevision,
    phase: "requested",
    notBeforeTick: intent.notBeforeTick,
    progressTicks: 0,
    durationTicks: intent.durationTicks,
    requestedResourceKeys,
    reservedResourceKeys: [],
    reservations: [],
    cleanupGeneration: 0,
    releasedResourceKeys: [],
    eventSequence: 0,
    events: [],
    ...(selected === undefined ? {} : {
      facilityId: selected.facilityId,
      slotId: selected.slotId,
      targetGeneration: selected.targetGeneration,
    }),
    ...(waitingCell === undefined ? {} : { waitingCell }),
    ...(intent.expiresTick === undefined ? {} : { expiresTick: intent.expiresTick }),
  };

  if (intent.expectedWorldRevision !== undefined && intent.expectedWorldRevision !== options.worldRevision) {
    return cleanup(base, currentTick, "failed", "world-revision-mismatch");
  }
  if (selected === undefined) return cleanup(base, currentTick, "failed", "target-unavailable");
  if (selected.approachCells.length === 0) return cleanup(base, currentTick, "failed", "unreachable");
  if (selected.availability !== "available") return cleanup(base, currentTick, "failed", "target-unavailable");
  if (intent.expectedTargetGeneration !== undefined && selected.targetGeneration !== intent.expectedTargetGeneration) {
    return cleanup(base, currentTick, "failed", "target-generation-mismatch");
  }
  const approachCell = selected.approachCells.slice().sort(compare)[0];
  if (approachCell === undefined) return cleanup(base, currentTick, "failed", "unreachable");
  const approachResourceKey = approachCell.startsWith("cell:") ? approachCell : `cell:${approachCell}`;
  const heldPropResourceKey = intent.heldPropKey === undefined
    ? []
    : [intent.heldPropKey.startsWith("held-prop:") ? intent.heldPropKey : `held-prop:${intent.heldPropKey}`];
  const fullResources = stableUnique([
    ...requestedResourceKeys,
    `facility:${selected.facilityId}`,
    `socket:${selected.slotId}`,
    approachResourceKey,
    ...heldPropResourceKey,
  ]);
  return { ...base, requestedResourceKeys: fullResources };
}

export function advanceActivityRuntime(
  state: ActivityRuntimeState,
  targetTick: number,
  options: ActivityAdvanceOptions = {},
): ActivityAdvanceResult {
  assertNonNegativeInteger(targetTick, "targetTick");
  if (targetTick < state.tick) throw new RangeError("targetTick must not move backwards");
  const initialEventCount = state.events.length;
  let next = state;
  for (let tick = state.tick + 1; tick <= targetTick; tick += 1) next = applyTick(next, tick, options);
  return { state: next, events: next.events.slice(initialEventCount) };
}

export function cancelActivity(
  state: ActivityRuntimeState,
  tick = state.tick,
  reason: ActivityTerminalReason = "canceled",
): ActivityAdvanceResult {
  const next = cleanup(state, tick, "canceled", reason);
  return { state: next, events: next.events.slice(state.events.length) };
}

export function preemptActivity(state: ActivityRuntimeState, tick = state.tick): ActivityAdvanceResult {
  if (state.priorityClass !== "decorative" || terminal(state.phase)) return { state, events: [] };
  return cancelActivity(state, tick, "preempted");
}
