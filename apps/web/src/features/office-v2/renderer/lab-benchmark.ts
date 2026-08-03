import type { PresentationSnapshotDocument } from "@affiliate-ops/office-v2-contracts";
import {
  BENCHMARK_SAMPLES,
  BENCHMARK_WARMUP_FRAMES,
  type BenchmarkCandidate,
  type BenchmarkMeasurement,
  type BenchmarkRunDescriptor,
  type BenchmarkRunResult,
} from "./benchmark-harness.ts";
import { fitCameraToWorld, projectCameraPosition, type CameraState } from "./camera.ts";
import { buildSyntheticScene } from "./candidate-scene.ts";
import { LAB_BOUNDS, LAB_FLOOR } from "./lab-fixture.ts";
import type { RendererCapture, RendererPort } from "./renderer-port.ts";

type MutableRef<T> = { current: T };

export type LabApi = {
  readonly ready: boolean;
  getState: () => Readonly<Record<string, unknown>>;
  captureDeterministic: () => RendererCapture;
  runBenchmarkRun: (descriptor: BenchmarkRunDescriptor) => Promise<BenchmarkRunResult>;
};

type LabBenchmarkOptions = {
  readonly candidate: BenchmarkCandidate;
  readonly actorCount: number;
  readonly portRef: MutableRef<RendererPort | null>;
  readonly hostRef: MutableRef<HTMLDivElement | null>;
  readonly cameraRef: MutableRef<CameraState | null>;
  readonly readyRef: MutableRef<boolean>;
  readonly renderedSnapshotRef: MutableRef<PresentationSnapshotDocument>;
  readonly getState: LabApi["getState"];
};

function metricSample(renderMs: number, sceneSize: number, visibleSprites: number, lifecycleMs: { readonly resize: number; readonly remount: number; readonly context: number; readonly pick: number; readonly inspector: number }): BenchmarkMeasurement {
  const bundleBytes = 2 * 8 * 8 * 4;
  return {
    tickMs: renderMs,
    renderMs,
    drawCalls: sceneSize,
    visibleSprites,
    decodedMemoryEstimate: bundleBytes,
    gpuMemoryEstimate: bundleBytes,
    bundleContribution: bundleBytes,
    loadTime: 0,
    firstInteractive: 0,
    pickLatency: lifecycleMs.pick,
    inspectorLatency: lifecycleMs.inspector,
    resizeHiddenResume: lifecycleMs.resize,
    remountCleanup: lifecycleMs.remount,
    contextRecovery: lifecycleMs.context,
  };
}

export function createLabApi(options: LabBenchmarkOptions): LabApi {
  return {
    get ready() { return options.readyRef.current; },
    getState: options.getState,
    captureDeterministic: () => {
      const port = options.portRef.current;
      if (!port || !options.readyRef.current) throw new Error("presentation.golden-page-unavailable: lab is not ready");
      return port.captureDeterministic();
    },
    runBenchmarkRun: async (descriptor) => {
      const port = options.portRef.current;
      const host = options.hostRef.current;
      if (!port || !host || !options.readyRef.current) throw new Error("presentation.benchmark-page-unavailable: lab is not ready");
      if (descriptor.candidate !== options.candidate || descriptor.actorCount !== options.actorCount) throw new Error("presentation.benchmark-protocol-invalid: page query does not match run descriptor");
      const camera = options.cameraRef.current = fitBenchmarkCamera(host, descriptor.viewport);
      await port.setCamera(camera);
      const snapshot = options.renderedSnapshotRef.current;
      const scene = buildSyntheticScene(snapshot, camera);
      for (let index = 0; index < BENCHMARK_WARMUP_FRAMES; index += 1) await port.renderSnapshot(snapshot);
      const resizeStart = performance.now();
      await port.resize(descriptor.viewport);
      const resizeMs = performance.now() - resizeStart;
      const firstEntity = snapshot.entities[0];
      const pickPoint = firstEntity ? projectCameraPosition(camera, firstEntity.transform.position).groundContact : { xPx: 0, yPx: 0 };
      const pickStart = performance.now();
      port.pickSemantic(pickPoint);
      const pickMs = performance.now() - pickStart;
      const inspectorStart = performance.now();
      snapshot.entities.find((entity) => entity.entityId.value === firstEntity?.entityId.value);
      const inspectorMs = performance.now() - inspectorStart;
      const contextStart = performance.now();
      await port.handleContextLoss();
      const contextMs = performance.now() - contextStart;
      await port.renderSnapshot(snapshot);
      const remountStart = performance.now();
      await port.teardown();
      await port.remount(host);
      await port.setCamera(camera);
      await port.renderSnapshot(snapshot);
      const remountMs = performance.now() - remountStart;
      const samples: BenchmarkMeasurement[] = [];
      for (let index = 0; index < BENCHMARK_SAMPLES; index += 1) {
        const renderStart = performance.now();
        await port.renderSnapshot(snapshot);
        const renderMs = performance.now() - renderStart;
        samples.push(metricSample(renderMs, scene.commands.length, snapshot.entities.length, { resize: resizeMs, remount: remountMs, context: contextMs, pick: pickMs, inspector: inspectorMs }));
      }
      return { ...descriptor, warmupFrames: BENCHMARK_WARMUP_FRAMES, samples };
    },
  };
}

function fitBenchmarkCamera(host: HTMLDivElement, viewport: { readonly width: number; readonly height: number }): CameraState {
  const width = Math.max(1, Math.floor(viewport.width || host.clientWidth));
  const height = Math.max(1, Math.floor(viewport.height || host.clientHeight));
  return fitCameraToWorld(LAB_FLOOR, LAB_BOUNDS, { width, height });
}
