import assert from "node:assert/strict";
import test from "node:test";
import { createCamera } from "../src/features/office-v2/renderer/camera.ts";
import { CANVAS_RENDERER_REVISION, createCanvasRendererBackend } from "../src/features/office-v2/renderer/canvas-renderer.ts";
import { createPresentationSnapshot } from "../src/features/office-v2/renderer/presentation-snapshot.ts";
import type { RendererBackend } from "../src/features/office-v2/renderer/renderer-port.ts";

type TestSnapshot = Parameters<typeof createPresentationSnapshot>[0];
const floor = { id: { kind: "floor", value: "ground-floor" }, version: 1 } as TestSnapshot["entities"][number]["transform"]["floor"];
const camera = createCamera({ floor, bounds: { floor, width: 20, depth: 16, maxElevation: 2 }, viewport: { width: 800, height: 600 } });

function snapshot(): TestSnapshot {
  return {
    schemaVersion: "office-presentation-snapshot-v1",
    snapshotId: { kind: "snapshot", value: "canvas-test" },
    world: { id: "hq-ground-floor-v1", version: 1 },
    tick: 1,
    worldHash: "a".repeat(64),
    entities: [{
      entityId: { kind: "entity-instance", value: "market-scout" },
      transform: { floor, position: { space: "floor-local-sub-cell", floor, coordinate: { space: "sub-cell", x: 4, y: 8, elevation: 0 } } },
      semanticState: "working",
      renderParts: ["actor-body-v1"],
      label: "Market Scout",
      selection: { selected: true, focused: true },
      freshness: "live",
    }],
    migration: { fromVersion: "office-presentation-snapshot-v0", effect: "reject-and-rehash" },
  } as TestSnapshot;
}

function fakeCanvas() {
  const context = {
    save() {}, restore() {}, setTransform() {}, clearRect() {}, fillRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, fill() {}, stroke() {}, arc() {}, fillText() {},
    fillStyle: "", strokeStyle: "", lineWidth: 0, globalAlpha: 1, font: "", textBaseline: "",
  } as unknown as CanvasRenderingContext2D;
  const canvas = {
    width: 0,
    height: 0,
    dataset: {} as DOMStringMap,
    style: {} as CSSStyleDeclaration,
    setAttribute() {},
    getContext: () => context,
    toDataURL: () => "data:image/png;base64,synthetic-canvas",
  } as unknown as HTMLCanvasElement;
  return { canvas, context };
}

function fakeDom() {
  const created = fakeCanvas();
  let child: HTMLCanvasElement | undefined;
  const container = {
    clientWidth: 800,
    clientHeight: 600,
    appendChild(next: HTMLCanvasElement) { child = next; },
    removeChild(next: HTMLCanvasElement) { if (child === next) child = undefined; },
  } as unknown as HTMLElement;
  const documentValue = { createElement: () => created.canvas } as unknown as Document;
  return { created, container, documentValue, get child() { return child; } };
}

test("Canvas candidate renders through the shared backend contract and cleans up", () => {
  const globals = globalThis as unknown as { document?: Document };
  const previousDocument = globals.document;
  const dom = fakeDom();
  globals.document = dom.documentValue;
  try {
    const backend: RendererBackend = createCanvasRendererBackend();
    backend.mount(dom.container);
    backend.setCamera(camera);
    backend.renderSnapshot(createPresentationSnapshot(snapshot()));
    assert.equal(dom.created.canvas.dataset.renderer, "canvas-2d");
    assert.equal(dom.created.canvas.width, 800);
    assert.equal(dom.created.canvas.height, 600);
    const capture = backend.captureDeterministic();
    assert.equal(capture.rendererRevision, CANVAS_RENDERER_REVISION);
    assert.equal(capture.payloadHash.length, 64);
    const diagnostic: Parameters<RendererBackend["showMissingAsset"]>[0] = { code: "presentation.synthetic-missing", message: "synthetic", owner: "presentation" };
    backend.showMissingAsset(diagnostic);
    backend.handleContextLoss();
    backend.teardown();
    backend.teardown();
    assert.equal(dom.child, undefined);
  } finally {
    if (previousDocument === undefined) delete globals.document;
    else globals.document = previousDocument;
  }
});
