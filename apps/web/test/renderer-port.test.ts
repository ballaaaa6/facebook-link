import assert from "node:assert/strict";
import test from "node:test";
import { createRendererPort, RENDERER_PORT_OPERATIONS, type RendererBackend, type RendererBundle, type RendererPort } from "../src/features/office-v2/renderer/renderer-port.ts";
import { createCamera } from "../src/features/office-v2/renderer/camera.ts";

type TestSnapshot = Parameters<RendererPort["renderSnapshot"]>[0];
const floor = { id: { kind: "floor", value: "ground-floor" }, version: 1 } as TestSnapshot["entities"][number]["transform"]["floor"];
const camera = createCamera({ floor, bounds: { floor, width: 20, depth: 16, maxElevation: 2 }, viewport: { width: 800, height: 600 } });
const snapshot = {
  schemaVersion: "office-presentation-snapshot-v1",
  snapshotId: { kind: "snapshot", value: "port-test" },
  world: { id: "hq-ground-floor-v1", version: 1 },
  tick: 1,
  worldHash: "b".repeat(64),
  entities: [],
  migration: { fromVersion: "office-presentation-snapshot-v0", effect: "reject-and-rehash" },
} as TestSnapshot;

function backendLog() {
  const events: string[] = [];
  const backend: RendererBackend = {
    mount: () => { events.push("mount"); },
    renderSnapshot: () => { events.push("render"); },
    setCamera: () => { events.push("camera"); },
    pickSemantic: () => null,
    resize: () => { events.push("resize"); },
    attachBundle: (_bundle, resource) => { events.push(`attach:${resource.resourceId}`); },
    detachBundle: (_bundle, resource) => { events.push(`detach:${resource.resourceId}`); },
    showMissingAsset: () => { events.push("missing"); },
    captureDeterministic: () => ({ rendererRevision: "test", width: 800, height: 600, payloadHash: "c".repeat(64) }),
    handleContextLoss: () => { events.push("context"); },
    teardown: () => { events.push("teardown"); },
    remount: () => { events.push("remount"); },
  };
  return { backend, events };
}

function bundle(events: string[], delay = 0): RendererBundle {
  return {
    bundleId: "synthetic",
    version: 1,
    load: async (signal) => {
      if (delay > 0) await new Promise<void>((resolve) => setTimeout(resolve, delay));
      if (signal.aborted) throw new Error("aborted");
      return { resourceId: "resource", dispose: () => { events.push("dispose"); } };
    },
  };
}

test("renderer port exposes the exact Closure E operation set", () => {
  assert.deepEqual(RENDERER_PORT_OPERATIONS, ["mount", "renderSnapshot", "setCamera", "pickSemantic", "resize", "loadBundle", "unloadBundle", "swapBundle", "showMissingAsset", "captureDeterministic", "handleContextLoss", "teardown", "remount"]);
});

test("renderer port is presentation-only and lifecycle teardown is idempotent", async () => {
  const { backend, events } = backendLog();
  const port = createRendererPort(backend);
  const container = {} as HTMLElement;
  await port.mount(container);
  await port.renderSnapshot(snapshot);
  await port.setCamera(camera);
  await port.resize({ width: 800, height: 600 });
  const handle = await port.loadBundle(bundle(events));
  const duplicate = await port.loadBundle(bundle(events));
  assert.equal(port.lifecycleSnapshot().resourceHandles, 2);
  await port.unloadBundle(handle);
  await port.unloadBundle(duplicate);
  assert.equal(port.lifecycleSnapshot().resourceHandles, 0);
  assert.equal(events.filter((event) => event === "dispose").length, 1);
  await port.handleContextLoss();
  await port.teardown();
  await port.teardown();
  assert.equal(port.lifecycleSnapshot().state, "destroyed");
  assert.equal(port.lifecycleSnapshot().pendingLoads, 0);
  assert.equal(port.lifecycleSnapshot().resourceHandles, 0);
  assert.equal(events.filter((event) => event === "teardown").length, 1);
});

test("pending bundle loads abort and missing assets remain visible to the inspector", async () => {
  const { backend, events } = backendLog();
  const port = createRendererPort(backend);
  await port.mount({} as HTMLElement);
  const pending = port.loadBundle(bundle(events, 40));
  await port.teardown();
  await assert.rejects(pending, /bundle-load-aborted|aborted/);
  assert.equal(port.lifecycleSnapshot().pendingLoads, 0);
  assert.equal(port.lifecycleSnapshot().resourceHandles, 0);
  const diagnostics = port.diagnostics();
  assert.equal(diagnostics.length, 0);

  const { backend: secondBackend, events: secondEvents } = backendLog();
  const second = createRendererPort(secondBackend);
  await second.mount({} as HTMLElement);
  await assert.rejects(second.loadBundle({ bundleId: "missing", version: 1, load: async () => { throw new Error("missing synthetic bundle"); } }), /bundle-load-failed/);
  assert.ok(secondEvents.includes("missing"));
  assert.equal(second.lifecycleSnapshot().state, "visible");
});

test("remount after teardown starts from a clean lifecycle", async () => {
  const { backend, events } = backendLog();
  const port = createRendererPort(backend);
  const container = {} as HTMLElement;
  await port.mount(container);
  await port.teardown();
  await port.remount(container);
  assert.equal(port.lifecycleSnapshot().state, "visible");
  assert.equal(events.filter((event) => event === "remount").length, 1);
});
