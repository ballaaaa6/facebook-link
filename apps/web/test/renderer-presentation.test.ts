import assert from "node:assert/strict";
import test from "node:test";
import {
  cameraKey,
  createCamera,
  fitCameraToWorld,
  projectCameraPosition,
  unprojectCameraGround,
} from "../src/features/office-v2/renderer/camera.ts";
import {
  createPresentationSnapshot,
  parsePresentationSnapshot,
  PresentationSnapshotError,
} from "../src/features/office-v2/renderer/presentation-snapshot.ts";
import { pickSemanticEntity } from "../src/features/office-v2/renderer/semantic-picking.ts";

type TestSnapshot = Parameters<typeof createPresentationSnapshot>[0];
const floor = { id: { kind: "floor", value: "ground-floor" }, version: 1 } as TestSnapshot["entities"][number]["transform"]["floor"];
const bounds = { floor, width: 20, depth: 16, maxElevation: 2 };

function snapshot(): TestSnapshot {
  return {
    schemaVersion: "office-presentation-snapshot-v1",
    snapshotId: { kind: "snapshot", value: "renderer-test" },
    world: { id: "hq-ground-floor-v1", version: 1 } as TestSnapshot["world"],
    tick: 42,
    worldHash: "a".repeat(64),
    entities: [
      {
        entityId: { kind: "entity-instance", value: "alpha" },
        transform: { floor, position: { space: "floor-local-sub-cell", floor, coordinate: { space: "sub-cell", x: 16, y: 16, elevation: 0 } } },
        semanticState: "working",
        renderParts: ["actor-body-v1"],
        label: "Alpha",
        selection: { selected: true, focused: true },
        freshness: "live",
      },
      {
        entityId: { kind: "entity-instance", value: "zulu" },
        transform: { floor, position: { space: "floor-local-sub-cell", floor, coordinate: { space: "sub-cell", x: 16, y: 16, elevation: 0 } } },
        semanticState: "waiting",
        renderParts: ["actor-body-v1"],
        label: "Zulu",
        selection: { selected: false, focused: false },
        freshness: "stale",
      },
    ],
    migration: { fromVersion: "office-presentation-snapshot-v0", effect: "reject-and-rehash" },
  } as TestSnapshot;
}

test("presentation snapshots clone/freeze valid derived data and preserve caller input", () => {
  const input = snapshot();
  const result = createPresentationSnapshot(input);
  assert.notEqual(result, input);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.entities), true);
  assert.equal(Object.isFrozen(result.entities[0]), true);
  assert.equal(result.entities[0]?.label, "Alpha");
  (input as unknown as { entities: Array<{ label: string }> }).entities[0]!.label = "changed";
  assert.equal(result.entities[0]?.label, "Alpha");
});

test("snapshot boundary rejects renderer, DOM, browser-clock, and mutable-state ownership", () => {
  for (const key of ["renderer", "domNode", "browserClock", "texture", "simulationState"]) {
    assert.throws(() => parsePresentationSnapshot({ ...snapshot(), [key]: {} } as unknown), (error: unknown) => error instanceof PresentationSnapshotError && error.code === "presentation.snapshot-owned-state-forbidden");
  }
  assert.throws(() => parsePresentationSnapshot({ ...snapshot(), entities: [snapshot().entities[0], snapshot().entities[0]] } as unknown), (error: unknown) => error instanceof PresentationSnapshotError && error.code === "presentation.snapshot-duplicate-entity");
});

test("camera fit, projection, and inverse ground picking are deterministic across viewports", () => {
  const first = fitCameraToWorld(floor, bounds, { width: 1440, height: 900 });
  const second = fitCameraToWorld(floor, bounds, { width: 1440, height: 900 });
  assert.equal(cameraKey(first), cameraKey(second));
  const position = snapshot().entities[0]!.transform.position;
  const projected = projectCameraPosition(first, position);
  const picked = unprojectCameraGround(first, projected.groundContact);
  assert.deepEqual(picked.coordinate, { space: "cell", x: 4, y: 3, elevation: 0 });
  const phone = fitCameraToWorld(floor, bounds, { width: 390, height: 844 });
  assert.ok(phone.zoom >= phone.zoomLimits.min);
  assert.ok(phone.zoom <= phone.zoomLimits.max);
});

test("semantic picking uses deterministic depth/ID ties and returns no mutation intent", () => {
  const camera = createCamera({ floor, bounds, viewport: { width: 1000, height: 700 }, zoom: 1 });
  const contact = projectCameraPosition(camera, snapshot().entities[0]!.transform.position).groundContact;
  const result = pickSemanticEntity(snapshot(), camera, contact, { hitRadiusPx: 8 });
  assert.equal(result?.entityId, "zulu");
  assert.equal(result?.freshness, "stale");
});
