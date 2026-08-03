export type RendererLifecycleState = "mounted" | "visible" | "hidden" | "restoring" | "destroyed";
export type RendererLifecycleEvent =
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

export interface LifecycleResourceSnapshot {
  readonly state: RendererLifecycleState;
  readonly pendingLoads: number;
  readonly animationFrames: number;
  readonly timers: number;
  readonly listeners: number;
  readonly pollers: number;
  readonly subscriptions: number;
  readonly intents: number;
  readonly resourceHandles: number;
  readonly transitions: readonly { readonly from: RendererLifecycleState; readonly event: RendererLifecycleEvent; readonly to: RendererLifecycleState }[];
}

type ResourceKind = Exclude<keyof Omit<LifecycleResourceSnapshot, "state" | "transitions">, "pendingLoads" | "resourceHandles">;

const INITIAL_COUNTS = Object.freeze({
  animationFrames: 0,
  timers: 0,
  listeners: 0,
  pollers: 0,
  subscriptions: 0,
  intents: 0,
});

const NEXT_STATE: Readonly<Record<RendererLifecycleEvent, Readonly<Record<RendererLifecycleState, RendererLifecycleState | null>>>> = {
  mount: { mounted: "mounted", visible: "visible", hidden: "hidden", restoring: "restoring", destroyed: "mounted" },
  show: { mounted: "visible", visible: "visible", hidden: "visible", restoring: "visible", destroyed: null },
  hide: { mounted: "hidden", visible: "hidden", hidden: "hidden", restoring: "hidden", destroyed: null },
  pagehide: { mounted: "hidden", visible: "hidden", hidden: "hidden", restoring: "hidden", destroyed: null },
  pageshow: { mounted: "restoring", visible: "restoring", hidden: "restoring", restoring: "restoring", destroyed: null },
  "bfcache-restore": { mounted: "visible", visible: "visible", hidden: "visible", restoring: "visible", destroyed: null },
  "unmount-during-load": { mounted: "destroyed", visible: "destroyed", hidden: "destroyed", restoring: "destroyed", destroyed: "destroyed" },
  teardown: { mounted: "destroyed", visible: "destroyed", hidden: "destroyed", restoring: "destroyed", destroyed: "destroyed" },
  remount: { mounted: null, visible: null, hidden: null, restoring: null, destroyed: "mounted" },
  "context-lost": { mounted: "restoring", visible: "restoring", hidden: "restoring", restoring: "restoring", destroyed: null },
  "context-restored": { mounted: "visible", visible: "visible", hidden: "visible", restoring: "visible", destroyed: null },
};

function cloneCounts(counts: Readonly<Record<ResourceKind, number>>): Record<ResourceKind, number> {
  return { ...counts };
}

export class RendererLifecycle {
  private currentState: RendererLifecycleState = "destroyed";
  private pendingLoadCount = 0;
  private readonly counts: Record<ResourceKind, number> = cloneCounts(INITIAL_COUNTS);
  private resourceHandleCount = 0;
  private readonly transitionLog: Array<LifecycleResourceSnapshot["transitions"][number]> = [];

  get state(): RendererLifecycleState {
    return this.currentState;
  }

  transition(event: RendererLifecycleEvent): RendererLifecycleState {
    const next = NEXT_STATE[event][this.currentState];
    if (next === null) throw new Error(`presentation.lifecycle-invalid: ${event} is not valid from ${this.currentState}`);
    const from = this.currentState;
    this.currentState = next;
    this.transitionLog.push(Object.freeze({ from, event, to: next }));
    if (next === "destroyed") this.clearResources();
    return next;
  }

  trackResource(kind: ResourceKind): () => void {
    if (this.currentState === "destroyed") throw new Error("presentation.lifecycle-destroyed: cannot register a resource after teardown");
    this.counts[kind] += 1;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.counts[kind] = Math.max(0, this.counts[kind] - 1);
    };
  }

  trackResourceHandle(): () => void {
    if (this.currentState === "destroyed") throw new Error("presentation.lifecycle-destroyed: cannot register a resource after teardown");
    this.resourceHandleCount += 1;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.resourceHandleCount = Math.max(0, this.resourceHandleCount - 1);
    };
  }

  beginLoad(): () => void {
    if (this.currentState === "destroyed") throw new Error("presentation.lifecycle-destroyed: cannot load after teardown");
    this.pendingLoadCount += 1;
    let settled = false;
    return () => {
      if (settled) return;
      settled = true;
      this.pendingLoadCount = Math.max(0, this.pendingLoadCount - 1);
    };
  }

  snapshot(): LifecycleResourceSnapshot {
    return Object.freeze({
      state: this.currentState,
      pendingLoads: this.pendingLoadCount,
      ...this.counts,
      resourceHandles: this.resourceHandleCount,
      transitions: Object.freeze(this.transitionLog.slice()),
    });
  }

  clearResources(): void {
    this.pendingLoadCount = 0;
    this.resourceHandleCount = 0;
    for (const key of Object.keys(this.counts) as ResourceKind[]) this.counts[key] = 0;
  }
}
