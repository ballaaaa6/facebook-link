import assert from "node:assert/strict";
import test from "node:test";
import {
  SIMULATION_STATE_HASH_DOMAIN,
  SIMULATION_STATE_HASH_VERSION,
  createRandomStream,
  hashSimulationState,
  nextRandom,
  projectHashableSimulationState,
  simulationCollectionDeclarations,
} from "../src/state-hash.ts";

const declarations = simulationCollectionDeclarations(["/commands", "/streams"]);

function input(commands: readonly string[], streams: readonly string[], presentationState: unknown = { frame: 1 }) {
  return {
    state: {
      tick: 12,
      commands: commands.map((id) => ({ commandId: { kind: "command", value: id }, applied: true })),
      streams: streams.map((streamId) => ({ streamId, state: streamId.length + 1, drawCount: 0 })),
      orderedEvents: ["first", "second"],
    },
    presentationState,
    collectionDeclarations: declarations,
  } as const;
}

test("shuffles declared unordered collections but preserves ordered arrays", () => {
  const left = hashSimulationState(input(["b", "a"], ["presentation", "gameplay"]));
  const right = hashSimulationState(input(["a", "b"], ["gameplay", "presentation"]));
  assert.equal(left.stateHash, right.stateHash);
  assert.deepEqual((left.normalizedState as { commands: unknown[] }).commands.map((entry) => (entry as any).commandId.value), ["a", "b"]);
  assert.deepEqual((left.normalizedState as { orderedEvents: string[] }).orderedEvents, ["first", "second"]);
});

test("presentation state is outside the hashable projection", () => {
  const left = hashSimulationState(input(["a"], ["gameplay"], { frame: 1, sprite: "idle" }));
  const right = hashSimulationState(input(["a"], ["gameplay"], { frame: 999, sprite: "working" }));
  assert.equal(left.stateHash, right.stateHash);
  assert.equal("presentationState" in (left.normalizedState as Record<string, unknown>), false);
});

test("repeated hashing produces identical canonical bytes and digest", () => {
  const first = hashSimulationState(input(["a"], ["gameplay"]));
  const second = hashSimulationState(input(["a"], ["gameplay"]));
  assert.deepEqual(first.canonicalBytes, second.canonicalBytes);
  assert.equal(first.stateHash, second.stateHash);
  assert.equal(first.stateHash.length, 64);
  assert.equal(first.domain, SIMULATION_STATE_HASH_DOMAIN);
  assert.equal(first.domainVersion, SIMULATION_STATE_HASH_VERSION);
});

test("domain and projection version are hash-separated", () => {
  const base = hashSimulationState(input(["a"], ["gameplay"]));
  const changedField = hashSimulationState({
    ...input(["a"], ["gameplay"]),
    state: { ...input(["a"], ["gameplay"]).state, tick: 13 },
  });
  assert.notEqual(base.stateHash, changedField.stateHash);
  assert.equal(SIMULATION_STATE_HASH_DOMAIN, "office-v2:simulation");
  assert.equal(SIMULATION_STATE_HASH_VERSION, "office-simulation-state-v2");
});

test("named PRNG streams are deterministic and independent", () => {
  const gameplay = createRandomStream(20260802, "gameplay");
  const presentation = createRandomStream(20260802, "presentation");
  assert.notEqual(gameplay.state, presentation.state);
  const first = nextRandom(gameplay);
  const replay = nextRandom(createRandomStream(20260802, "gameplay"));
  assert.equal(first.value, replay.value);
  assert.deepEqual(first.stream, replay.stream);
  assert.equal(gameplay.drawCount, 0);
  assert.equal(first.stream.drawCount, 1);
});

test("PRNG progression stays in range and advances only the selected stream", () => {
  const first = createRandomStream(1, "gameplay");
  const draw = nextRandom(first);
  const second = nextRandom(draw.stream);
  assert.ok(draw.value >= 0 && draw.value < 1);
  assert.ok(second.value >= 0 && second.value < 1);
  assert.equal(second.stream.drawCount, 2);
  assert.equal(first.state !== second.stream.state, true);
});

test("first-field divergence changes the state hash", () => {
  const base = hashSimulationState(input(["a"], ["gameplay"]));
  const divergent = hashSimulationState({
    ...input(["a"], ["gameplay"]),
    state: { ...input(["a"], ["gameplay"]).state, tick: 99 },
  });
  assert.notEqual(base.stateHash, divergent.stateHash);
});

test("projection is pure and does not mutate caller state", () => {
  const original = input(["b", "a"], ["gameplay"]);
  const before = structuredClone(original.state);
  projectHashableSimulationState(original);
  assert.deepEqual(original.state, before);
});
