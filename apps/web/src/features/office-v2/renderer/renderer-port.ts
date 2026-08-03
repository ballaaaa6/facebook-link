import type {
  PresentationSnapshotDocument,
  RendererPortOperation,
} from "@affiliate-ops/office-v2-contracts";
import {
  createPresentationSnapshot,
  type PresentationSnapshotDiagnosticCode,
} from "./presentation-snapshot.ts";
import type { CameraState, ScreenPoint } from "./camera.ts";
import type { SemanticPickResult } from "./semantic-picking.ts";
import { RendererLifecycle, type LifecycleResourceSnapshot } from "./lifecycle.ts";

export const RENDERER_PORT_OPERATIONS = Object.freeze([
  "mount",
  "renderSnapshot",
  "setCamera",
  "pickSemantic",
  "resize",
  "loadBundle",
  "unloadBundle",
  "swapBundle",
  "showMissingAsset",
  "captureDeterministic",
  "handleContextLoss",
  "teardown",
  "remount",
] as const satisfies readonly RendererPortOperation["name"][]);

export type RendererPortOperationName = (typeof RENDERER_PORT_OPERATIONS)[number];

export interface RendererBundleResource {
  readonly resourceId: string;
  readonly dispose?: () => void;
}

export interface RendererBundle {
  readonly bundleId: string;
  readonly version: number;
  readonly load: (signal: AbortSignal) => Promise<RendererBundleResource>;
}

export interface RendererBundleHandle {
  readonly bundleId: string;
  readonly version: number;
  readonly release: () => Promise<void>;
}

export interface RendererCapture {
  readonly rendererRevision: string;
  readonly width: number;
  readonly height: number;
  readonly payloadHash: string;
  readonly dataUrl?: string;
}

export interface RendererDiagnostic {
  readonly code: string;
  readonly message: string;
  readonly owner: "presentation";
  readonly details?: Readonly<Record<string, unknown>>;
}

export interface RendererBackend {
  mount(container: HTMLElement): void | Promise<void>;
  renderSnapshot(snapshot: Readonly<PresentationSnapshotDocument>): void | Promise<void>;
  setCamera(camera: CameraState): void | Promise<void>;
  pickSemantic(point: ScreenPoint): SemanticPickResult | null;
  resize(viewport: { readonly width: number; readonly height: number }): void | Promise<void>;
  attachBundle(bundle: RendererBundle, resource: RendererBundleResource): void | Promise<void>;
  detachBundle(bundle: RendererBundle, resource: RendererBundleResource): void | Promise<void>;
  showMissingAsset(diagnostic: RendererDiagnostic): void | Promise<void>;
  captureDeterministic(): RendererCapture;
  handleContextLoss(): void | Promise<void>;
  teardown(): void | Promise<void>;
  remount(container: HTMLElement): void | Promise<void>;
}

export interface RendererPort {
  mount(container: HTMLElement): Promise<void>;
  renderSnapshot(snapshot: PresentationSnapshotDocument): Promise<void>;
  setCamera(camera: CameraState): Promise<void>;
  pickSemantic(point: ScreenPoint): SemanticPickResult | null;
  resize(viewport: { readonly width: number; readonly height: number }): Promise<void>;
  loadBundle(bundle: RendererBundle): Promise<RendererBundleHandle>;
  unloadBundle(handle: RendererBundleHandle): Promise<void>;
  swapBundle(previous: RendererBundleHandle | undefined, next: RendererBundle): Promise<RendererBundleHandle>;
  showMissingAsset(diagnostic: RendererDiagnostic): Promise<void>;
  captureDeterministic(): RendererCapture;
  handleContextLoss(): Promise<void>;
  teardown(): Promise<void>;
  remount(container?: HTMLElement): Promise<void>;
  lifecycleSnapshot(): LifecycleResourceSnapshot;
  diagnostics(): readonly RendererDiagnostic[];
}

export class RendererPortError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(`${code}: ${message}`);
    this.name = "RendererPortError";
    this.code = code;
  }
}

interface BundleRecord {
  readonly bundle: RendererBundle;
  readonly finishLoad: () => void;
  readonly controller: AbortController;
  readonly promise: Promise<RendererBundleResource>;
  refs: number;
  resource?: RendererBundleResource;
  attached: boolean;
  disposed: boolean;
  abandoned: boolean;
  cleanupPromise?: Promise<void>;
}

function bundleKey(bundle: Pick<RendererBundle, "bundleId" | "version">): string {
  return `${bundle.bundleId}@${bundle.version}`;
}

function isSnapshotError(error: unknown): error is { readonly code: PresentationSnapshotDiagnosticCode; readonly message: string } {
  return typeof error === "object" && error !== null && "code" in error && typeof error.code === "string" && "message" in error && typeof error.message === "string";
}

class BundleStore {
  private readonly records = new Map<string, BundleRecord>();
  private readonly lifecycle: RendererLifecycle;
  private readonly backend: RendererBackend;

  constructor(lifecycle: RendererLifecycle, backend: RendererBackend) {
    this.lifecycle = lifecycle;
    this.backend = backend;
  }

  async acquire(bundle: RendererBundle): Promise<RendererBundleHandle> {
    const key = bundleKey(bundle);
    const existing = this.records.get(key);
    if (existing && !existing.abandoned) {
      existing.refs += 1;
      return this.handle(existing);
    }
    if (existing?.abandoned) this.records.delete(key);
    const controller = new AbortController();
    const finishLoad = this.lifecycle.beginLoad();
    const record: BundleRecord = {
      bundle,
      controller,
      finishLoad,
      promise: Promise.resolve().then(() => bundle.load(controller.signal)),
      refs: 1,
      attached: false,
      disposed: false,
      abandoned: false,
    };
    this.records.set(key, record);
    try {
      record.resource = await record.promise;
      finishLoad();
      if (record.abandoned || controller.signal.aborted) throw new RendererPortError("presentation.bundle-load-aborted", "bundle load was released before completion");
      await this.backend.attachBundle(bundle, record.resource);
      record.attached = true;
      if (record.abandoned || controller.signal.aborted) throw new RendererPortError("presentation.bundle-load-aborted", "bundle load was released before completion");
      return this.handle(record);
    } catch (error) {
      finishLoad();
      await this.disposeRecord(record);
      if (this.records.get(key) === record) this.records.delete(key);
      if (record.abandoned || controller.signal.aborted) {
        throw new RendererPortError("presentation.bundle-load-aborted", "bundle load was released before completion");
      }
      throw error;
    }
  }

  async release(handle: RendererBundleHandle): Promise<void> {
    const record = this.records.get(bundleKey(handle));
    if (!record) return;
    record.refs = Math.max(0, record.refs - 1);
    if (record.refs !== 0) return;
    record.abandoned = true;
    this.records.delete(bundleKey(record.bundle));
    if (!record.resource) {
      record.controller.abort();
      await record.promise.catch(() => undefined);
    }
    await this.disposeRecord(record);
  }

  async teardown(): Promise<void> {
    const records = [...this.records.values()];
    for (const record of records) {
      record.abandoned = true;
      record.controller.abort();
    }
    await Promise.allSettled(records.map(async (record) => {
      await record.promise.catch(() => undefined);
      await this.disposeRecord(record);
    }));
    this.records.clear();
  }

  count(): number {
    return [...this.records.values()].reduce((total, record) => total + record.refs, 0);
  }

  private handle(record: BundleRecord): RendererBundleHandle {
    const release = this.lifecycle.trackResourceHandle();
    let released = false;
    return Object.freeze({
      bundleId: record.bundle.bundleId,
      version: record.bundle.version,
      release: async () => {
        if (released) return;
        released = true;
        release();
        await this.release(this.handleIdentity(record));
      },
    });
  }

  private handleIdentity(record: BundleRecord): RendererBundleHandle {
    return { bundleId: record.bundle.bundleId, version: record.bundle.version, release: async () => undefined };
  }

  private disposeRecord(record: BundleRecord): Promise<void> {
    if (record.cleanupPromise) return record.cleanupPromise;
    record.cleanupPromise = (async () => {
      if (!record.resource || record.disposed) return;
      if (record.attached) {
        await this.backend.detachBundle(record.bundle, record.resource);
        record.attached = false;
      }
      record.resource.dispose?.();
      record.disposed = true;
    })();
    return record.cleanupPromise;
  }
}

export function createRendererPort(backend: RendererBackend): RendererPort {
  const lifecycle = new RendererLifecycle();
  const store = new BundleStore(lifecycle, backend);
  const diagnostics: RendererDiagnostic[] = [];
  let container: HTMLElement | undefined;
  let snapshot: Readonly<PresentationSnapshotDocument> | undefined;

  function requireMounted(): void {
    if (lifecycle.state === "destroyed") throw new RendererPortError("presentation.renderer-port-destroyed", "renderer port is torn down");
    if (!container) throw new RendererPortError("presentation.renderer-port-not-mounted", "renderer port must be mounted first");
  }

  return {
    async mount(nextContainer) {
      if (lifecycle.state === "destroyed") lifecycle.transition("mount");
      if (!container) {
        container = nextContainer;
        await backend.mount(nextContainer);
      }
      lifecycle.transition("show");
    },
    async renderSnapshot(nextSnapshot) {
      requireMounted();
      try {
        snapshot = createPresentationSnapshot(nextSnapshot);
      } catch (error) {
        const diagnostic: RendererDiagnostic = {
          code: isSnapshotError(error) ? error.code : "presentation.snapshot-invalid",
          message: error instanceof Error ? error.message : "invalid presentation snapshot",
          owner: "presentation",
        };
        diagnostics.push(Object.freeze(diagnostic));
        throw new RendererPortError(diagnostic.code, diagnostic.message);
      }
      await backend.renderSnapshot(snapshot);
    },
    async setCamera(camera) {
      requireMounted();
      await backend.setCamera(camera);
    },
    pickSemantic(point) {
      requireMounted();
      return backend.pickSemantic(point);
    },
    async resize(viewport) {
      requireMounted();
      await backend.resize(viewport);
    },
    async loadBundle(bundle) {
      requireMounted();
      try {
        return await store.acquire(bundle);
      } catch (error) {
        if (error instanceof RendererPortError && error.code === "presentation.bundle-load-aborted") throw error;
        const diagnostic: RendererDiagnostic = {
          code: "presentation.bundle-load-failed",
          message: error instanceof Error ? error.message : "bundle load failed",
          owner: "presentation",
          details: { bundleId: bundle.bundleId, version: bundle.version },
        };
        diagnostics.push(Object.freeze({ ...diagnostic }));
        await backend.showMissingAsset(diagnostic);
        throw new RendererPortError(diagnostic.code, diagnostic.message);
      }
    },
    async unloadBundle(handle) {
      await handle.release();
    },
    async swapBundle(previous, next) {
      if (previous) await previous.release();
      return this.loadBundle(next);
    },
    async showMissingAsset(diagnostic) {
      diagnostics.push(Object.freeze({ ...diagnostic }));
      await backend.showMissingAsset(diagnostic);
    },
    captureDeterministic() {
      requireMounted();
      return Object.freeze(backend.captureDeterministic());
    },
    async handleContextLoss() {
      requireMounted();
      lifecycle.transition("context-lost");
      await backend.handleContextLoss();
      lifecycle.transition("context-restored");
      if (snapshot) await backend.renderSnapshot(snapshot);
    },
    async teardown() {
      if (lifecycle.state === "destroyed") return;
      lifecycle.transition("teardown");
      await store.teardown();
      await backend.teardown();
      container = undefined;
      snapshot = undefined;
    },
    async remount(nextContainer) {
      if (lifecycle.state !== "destroyed") return;
      lifecycle.transition("remount");
      container = nextContainer ?? container;
      if (!container) throw new RendererPortError("presentation.renderer-port-not-mounted", "remount requires a container");
      await backend.remount(container);
      lifecycle.transition("show");
    },
    lifecycleSnapshot() {
      return lifecycle.snapshot();
    },
    diagnostics() {
      return Object.freeze(diagnostics.slice());
    },
  };
}
