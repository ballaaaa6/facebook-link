import assert from "node:assert/strict";
import test from "node:test";
import { createCamera } from "../src/features/office-v2/renderer/camera.ts";
import { buildSyntheticScene } from "../src/features/office-v2/renderer/candidate-scene.ts";
import { createPresentationSnapshot } from "../src/features/office-v2/renderer/presentation-snapshot.ts";

type TestSnapshot = Parameters<typeof createPresentationSnapshot>[0];
const floor = { id: { kind: "floor", value: "ground-floor" }, version: 1 } as TestSnapshot["entities"][number]["transform"]["floor"];
const camera = createCamera({ floor, bounds: { floor, width: 20, depth: 16, maxElevation: 2 }, viewport: { width: 800, height: 600 } });

function snapshot(order: readonly string[]): TestSnapshot {
  return {
    schemaVersion: "office-presentation-snapshot-v1",
    snapshotId: { kind: "snapshot", value: "scene-test" },
    world: { id: "hq-ground-floor-v1", version: 1 },
    tick: 1,
    worldHash: "a".repeat(64),
    entities: order.map((entityId) => ({
      entityId: { kind: "entity-instance", value: entityId },
      transform: { floor, position: { space: "floor-local-sub-cell", floor, coordinate: { space: "sub-cell", x: entityId === "alpha" ? 0 : 4, y: 8, elevation: 0 } } },
      semanticState: "working",
      renderParts: ["actor-body-v1"],
      label: entityId,
      selection: { selected: entityId === "alpha", focused: false },
      freshness: "live",
    })),
    migration: { fromVersion: "office-presentation-snapshot-v0", effect: "reject-and-rehash" },
  } as TestSnapshot;
}

test("synthetic scene commands are stable across snapshot insertion order", () => {
  const first = buildSyntheticScene(createPresentationSnapshot(snapshot(["alpha", "bravo"])), camera);
  const second = buildSyntheticScene(createPresentationSnapshot(snapshot(["bravo", "alpha"])), camera);
  assert.equal(first.revision, "office-synthetic-scene-v1");
  assert.equal(first.sceneHash, second.sceneHash);
  assert.deepEqual(first.commands.map((command) => command.kind), ["floor", "entity", "entity"]);
  assert.equal(Object.isFrozen(first), true);
  assert.equal(Object.isFrozen(first.commands), true);
});
