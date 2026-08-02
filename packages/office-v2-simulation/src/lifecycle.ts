export const LIFECYCLE_PORT_VERSION = "office-lifecycle-port-v1" as const;
export const LIFECYCLE_TICK_RATE_HZ = 10 as const;
export const LIFECYCLE_MAX_TICKS_PER_PUMP = 5 as const;

export type LifecycleState = "mounted" | "visible" | "hidden" | "restoring" | "destroyed";

export type LifecycleEvent =
  | "mount"
  | "show"
  | "hide"
  | "pagehide"
  | "pageshow"
  | "bfcache-restore"
  | "unmount-during-load"
  | "teardown"
  | "remount"
  | "context-lost"
  | "context-restored";

export type LifecycleResourceKind =
  | "listener"
  | "poller"
  | "animation-frame"
  | "subscription"
  | "pending-load"
  | "resource-handle";

export interface LifecycleResource {
  readonly resourceId: string;
  readonly kind: LifecycleResourceKind;
  readonly release: () => void;
}

export interface LifecycleResourceRecord {
  readonly resourceId: string;
  readonly kind: LifecycleResourceKind;
}

export interface LifecycleDiagnostic {
  readonly code: "simulation.lifecycle-catch-up-capped";
  readonly accumulatedTicks: number;
  readonly appliedTicks: number;
  readonly maximumTicksPerPump: number;
}

export interface LifecycleTransitionRecord {
  readonly sequence: number;
  readonly event: LifecycleEvent;
  readonly from: LifecycleState;
  readonly to: LifecycleState;
}

export interface LifecycleSnapshot {
  readonly schemaVersion: typeof LIFECYCLE_PORT_VERSION;
  readonly state: LifecycleState;
  readonly logicalTick: number;
  readonly pendingTicks: number;
  readonly tickRateHz: number;
  readonly maximumTicksPerPump: number;
  readonly resources: readonly LifecycleResourceRecord[];
  readonly diagnostics: readonly LifecycleDiagnostic[];
  readonly transitions: readonly LifecycleTransitionRecord[];
}

export interface LifecycleTransitionResult {
  readonly snapshot: LifecycleSnapshot;
  readonly changed: boolean;
}

export interface LifecyclePumpResult {
  readonly snapshot: LifecycleSnapshot;
  readonly appliedTicks: number;
  readonly discardedTicks: number;
  readonly diagnostic?: LifecycleDiagnostic;
}

export interface LifecyclePortOptions {
  readonly tickRateHz?: number;
  readonly maximumTicksPerPump?: number;
  readonly onTick?: (logicalTick: number) => void;
  readonly onDiagnostic?: (diagnostic: LifecycleDiagnostic) => void;
}

export interface LifecyclePort {
  snapshot(): LifecycleSnapshot;
  transition(event: LifecycleEvent): LifecycleTransitionResult;
  pump(accumulatedTicks: number): LifecyclePumpResult;
  subscribe(resource: LifecycleResource): boolean;
  unsubscribe(resourceId: string): boolean;
  release(resourceId: string): boolean;
  teardown(): LifecycleTransitionResult;
}

const ACTIVE_STATES: readonly LifecycleState[] = ["mounted", "visible", "hidden", "restoring"];

function assertNonNegativeSafeInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative safe integer`);
  }
}

function assertPositiveSafeInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive safe integer`);
  }
}

function nextState(state: LifecycleState, event: LifecycleEvent): LifecycleState {
  if (event === "teardown" || event === "unmount-during-load") {
    return state === "destroyed" ? state : "destroyed";
  }
  if (state === "destroyed") return event === "remount" ? "mounted" : state;
  if (state === "mounted") return event === "show" ? "visible" : state;
  if (state === "visible") {
    if (event === "hide" || event === "pagehide") return "hidden";
    if (event === "context-lost") return "restoring";
    return state;
  }
  if (state === "hidden") return event === "pageshow" ? "restoring" : state;
  if (state === "restoring") {
    if (event === "bfcache-restore" || event === "context-restored") return "visible";
  }
  return state;
}

function assertResource(resource: LifecycleResource): void {
  if (resource.resourceId.length === 0) throw new TypeError("lifecycle resourceId must be non-empty");
  if (typeof resource.release !== "function") throw new TypeError("lifecycle resource release must be callable");
}

function assertPumpTicks(accumulatedTicks: number): void {
  assertNonNegativeSafeInteger(accumulatedTicks, "accumulatedTicks");
}

function snapshotWith(
  snapshot: LifecycleSnapshot,
  updates: Partial<Pick<LifecycleSnapshot, "state" | "logicalTick" | "pendingTicks" | "resources" | "diagnostics" | "transitions">>,
): LifecycleSnapshot {
  return { ...snapshot, ...updates };
}

/**
 * Create a browser-independent lifecycle boundary. Logical progress is driven
 * only by explicit pump calls; browser frames, timers, and wall-clock reads
 * stay outside this port.
 */
export function createLifecyclePort(options: LifecyclePortOptions = {}): LifecyclePort {
  const tickRateHz = options.tickRateHz ?? LIFECYCLE_TICK_RATE_HZ;
  const maximumTicksPerPump = options.maximumTicksPerPump ?? LIFECYCLE_MAX_TICKS_PER_PUMP;
  assertPositiveSafeInteger(tickRateHz, "tickRateHz");
  assertPositiveSafeInteger(maximumTicksPerPump, "maximumTicksPerPump");

  let current: LifecycleSnapshot = {
    schemaVersion: LIFECYCLE_PORT_VERSION,
    state: "mounted",
    logicalTick: 0,
    pendingTicks: 0,
    tickRateHz,
    maximumTicksPerPump,
    resources: [],
    diagnostics: [],
    transitions: [],
  };
  const resources = new Map<string, LifecycleResource>();

  function snapshot(): LifecycleSnapshot {
    return current;
  }

  function releaseResources(): void {
    const toRelease = [...resources.values()];
    resources.clear();
    current = snapshotWith(current, { resources: [] });
    let firstFailure: unknown;
    for (const resource of toRelease) {
      try {
        resource.release();
      } catch (error) {
        firstFailure ??= error;
      }
    }
    if (firstFailure !== undefined) throw firstFailure;
  }

  function transition(event: LifecycleEvent): LifecycleTransitionResult {
    const from = current.state;
    const to = nextState(from, event);
    if (to === from) return { snapshot: current, changed: false };

    const transitionRecord: LifecycleTransitionRecord = {
      sequence: current.transitions.length + 1,
      event,
      from,
      to,
    };
    current = snapshotWith(current, {
      state: to,
      pendingTicks: 0,
      transitions: [...current.transitions, transitionRecord],
    });
    if (to === "destroyed") releaseResources();
    return { snapshot: current, changed: true };
  }

  function pump(accumulatedTicks: number): LifecyclePumpResult {
    assertPumpTicks(accumulatedTicks);
    const requestedTicks = current.pendingTicks + accumulatedTicks;
    if (current.state !== "visible") {
      current = snapshotWith(current, { pendingTicks: 0 });
      return { snapshot: current, appliedTicks: 0, discardedTicks: requestedTicks };
    }

    const appliedTicks = Math.min(requestedTicks, current.maximumTicksPerPump);
    const discardedTicks = requestedTicks - appliedTicks;
    let nextLogicalTick = current.logicalTick;
    for (let index = 0; index < appliedTicks; index += 1) {
      nextLogicalTick += 1;
      options.onTick?.(nextLogicalTick);
    }

    let diagnostic: LifecycleDiagnostic | undefined;
    let diagnostics = current.diagnostics;
    if (discardedTicks > 0) {
      diagnostic = {
        code: "simulation.lifecycle-catch-up-capped",
        accumulatedTicks: requestedTicks,
        appliedTicks,
        maximumTicksPerPump: current.maximumTicksPerPump,
      };
      diagnostics = [...diagnostics, diagnostic];
      options.onDiagnostic?.(diagnostic);
    }

    current = snapshotWith(current, {
      logicalTick: nextLogicalTick,
      pendingTicks: 0,
      diagnostics,
    });
    return { snapshot: current, appliedTicks, discardedTicks, ...(diagnostic === undefined ? {} : { diagnostic }) };
  }

  function subscribe(resource: LifecycleResource): boolean {
    assertResource(resource);
    if (current.state === "destroyed" || resources.has(resource.resourceId)) return false;
    resources.set(resource.resourceId, resource);
    current = snapshotWith(current, {
      resources: [...current.resources, { resourceId: resource.resourceId, kind: resource.kind }],
    });
    return true;
  }

  function unsubscribe(resourceId: string): boolean {
    const resource = resources.get(resourceId);
    if (resource === undefined) return false;
    resources.delete(resourceId);
    current = snapshotWith(current, {
      resources: current.resources.filter((entry) => entry.resourceId !== resourceId),
    });
    resource.release();
    return true;
  }

  return {
    snapshot,
    transition,
    pump,
    subscribe,
    unsubscribe,
    release: unsubscribe,
    teardown: () => transition("teardown"),
  };
}

export function lifecycleStateIsActive(state: LifecycleState): boolean {
  return ACTIVE_STATES.includes(state);
}
