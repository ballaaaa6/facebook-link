import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { JsonValue } from "@affiliate-ops/office-v2-contracts";
import {
  ReplayRuntimeError,
  compareReplays,
  createReplaySnapshot,
  createSecretSafeBugBundle,
  firstReplayDivergence,
  migrateReplaySnapshot,
  restoreReplay,
  runReplay,
  validateReplaySnapshot,
} from "../src/replay.ts";

type TestState = { readonly counter: number; readonly ordered: readonly string[]; readonly unordered: readonly { readonly id: string }[] };
const fixture = JSON.parse(readFileSync(new URL("./fixtures/p3-w2-5-replay.json", import.meta.url), "utf8")) as {
  initialState: TestState;
  inputs: readonly { readonly inputId: string; readonly scheduledTick: number; readonly kind: string; readonly payload: JsonValue }[];
  unorderedPointers: readonly string[];
};
const asJson = (value: TestState): JsonValue => value as unknown as JsonValue;
const testState = (value: JsonValue): TestState => value as TestState;

function run(untilTick = 3, inputs = fixture.inputs) {
  return runReplay({
    initialState: asJson(fixture.initialState),
    initialTick: 0,
    untilTick,
    inputs,
    collectionPointers: fixture.unorderedPointers,
    step: (state, input, tick) => {
      const current = testState(state);
      const payload = input?.payload;
      const amount = typeof payload === "object" && payload !== null && !Array.isArray(payload) && typeof payload.amount === "number" ? payload.amount : 0;
      return {
        state: asJson({ ...current, counter: current.counter + amount }),
        results: input === undefined ? [] : [{ inputId: input.inputId, tick, counter: current.counter + amount }],
        events: input === undefined ? [] : [{ kind: "counter-changed", tick, counter: current.counter + amount }],
        subsystem: "counter",
      };
    },
  });
}

function hasCode(code: string) {
  return (error: unknown): boolean => error instanceof ReplayRuntimeError && error.code === code;
}

test("deterministic replay captures ordered inputs, per-tick frames, real hashes, results, and events", () => {
  const left = run();
  const right = run();
  assert.deepEqual(left.trace, right.trace);
  assert.deepEqual(left.finalState, { counter: 6, ordered: ["first", "second"], unordered: [{ id: "b" }, { id: "a" }] });
  assert.equal(left.frames.length, 3);
  assert.equal(left.trace.inputs[0]?.inputId, "input-one");
  assert.equal(left.frames[1]?.events[0]?.kind, "counter-changed");
  assert.match(left.finalStateHash, /^[0-9a-f]{64}$/u);
  assert.notEqual(new Set(left.trace.stateHashes.map((entry) => entry.stateHash)).size, 1);
  assert.equal(compareReplays(left, right).equal, true);
});

test("ordered arrays remain ordered while only declared unordered collections normalize", () => {
  const reordered = run(0, []);
  const otherState = { ...fixture.initialState, unordered: [...fixture.initialState.unordered].reverse() };
  const other = runReplay({
    initialState: asJson(otherState),
    initialTick: 0,
    untilTick: 0,
    inputs: [],
    collectionPointers: fixture.unorderedPointers,
    step: (state) => ({ state }),
  });
  assert.equal(reordered.finalStateHash, other.finalStateHash);
  const orderedChanged = runReplay({
    initialState: asJson({ ...otherState, ordered: ["second", "first"] }),
    initialTick: 0,
    untilTick: 0,
    inputs: [],
    collectionPointers: fixture.unorderedPointers,
    step: (state) => ({ state }),
  });
  assert.notEqual(reordered.finalStateHash, orderedChanged.finalStateHash);
});

test("restore from a completed frame reaches the uninterrupted final state and hash", () => {
  const uninterrupted = run();
  const frame = uninterrupted.frames[1];
  assert.ok(frame);
  const snapshot = createReplaySnapshot({ state: frame.state, tick: frame.tick, stateHash: frame.stateHash, worldRevision: 0, collectionPointers: fixture.unorderedPointers });
  const restored = restoreReplay(snapshot, {
    untilTick: 3,
    inputs: fixture.inputs.slice(2),
    collectionPointers: fixture.unorderedPointers,
    step: (state, input, tick) => {
      const current = testState(state);
      const payload = input?.payload;
      const amount = typeof payload === "object" && payload !== null && !Array.isArray(payload) && typeof payload.amount === "number" ? payload.amount : 0;
      return { state: asJson({ ...current, counter: current.counter + amount }), results: [{ inputId: input?.inputId ?? "", tick, counter: current.counter + amount }], events: [{ kind: "counter-changed", tick, counter: current.counter + amount }] };
    },
  });
  assert.deepEqual(restored.finalState, uninterrupted.finalState);
  assert.equal(restored.finalStateHash, uninterrupted.finalStateHash);
  assert.deepEqual(restored.events, uninterrupted.events.slice(2));
});

test("restore rejects incomplete in-progress resource context, invalid boundaries, and incompatible definitions", () => {
  const valid = createReplaySnapshot({ state: asJson(fixture.initialState), tick: 0, worldRevision: 3 });
  assert.throws(() => validateReplaySnapshot({ ...valid, completedTick: false } as unknown as typeof valid), hasCode("simulation.replay-restore-boundary-invalid"));
  assert.throws(() => validateReplaySnapshot({ ...valid, inProgress: { actionPhase: "using" } } as unknown as typeof valid), hasCode("simulation.replay-incomplete-resource-state"));
  assert.throws(() => validateReplaySnapshot(valid, { expectedWorldRevision: 4 }), hasCode("simulation.replay-definition-incompatible"));
  assert.throws(() => runReplay({ ...runOptions(), inputs: [{ ...fixture.inputs[0]!, scheduledTick: 0 }] }), hasCode("simulation.replay-input-boundary-invalid"));
});

function runOptions() {
  return {
    initialState: asJson(fixture.initialState),
    initialTick: 0,
    untilTick: 2,
    inputs: fixture.inputs.slice(0, 2),
    collectionPointers: fixture.unorderedPointers,
    step: (state: JsonValue) => ({ state }),
  };
}

test("unknown future and missing migration paths fail closed, while explicit migration is one-directional", () => {
  const snapshot = createReplaySnapshot({ state: asJson(fixture.initialState), tick: 0 });
  const future = { ...snapshot, schemaVersion: "office-simulation-snapshot-v3" } as unknown as typeof snapshot;
  assert.throws(() => migrateReplaySnapshot(future), hasCode("simulation.replay-version-unknown"));
  const old = { ...snapshot, schemaVersion: "office-simulation-snapshot-v1" } as unknown as typeof snapshot;
  assert.throws(() => migrateReplaySnapshot(old), hasCode("simulation.replay-migration-missing"));
  const migrated = migrateReplaySnapshot(old, "office-simulation-snapshot-v2", [{
    fromSchemaVersion: "office-simulation-snapshot-v1",
    toSchemaVersion: "office-simulation-snapshot-v2",
    migrate: (value) => ({ ...value, schemaVersion: "office-simulation-snapshot-v2" }),
  }]);
  assert.equal(migrated.schemaVersion, "office-simulation-snapshot-v2");
});

test("first divergence reports tick, subsystem, stable path, values, and hashes", () => {
  const expected = run();
  const actual = runReplay({
    ...runOptions(),
    untilTick: 3,
    inputs: fixture.inputs,
    step: (state, input, tick) => {
      const current = testState(state);
      const payload = input?.payload;
      const amount = typeof payload === "object" && payload !== null && !Array.isArray(payload) && typeof payload.amount === "number" ? payload.amount : 0;
      return { state: asJson({ ...current, counter: current.counter + amount + (tick === 2 ? 1 : 0) }), subsystem: "movement" };
    },
  });
  const divergence = firstReplayDivergence(expected, actual);
  assert.ok(divergence);
  assert.equal(divergence.tick, 2);
  assert.equal(divergence.subsystem, "counter");
  assert.equal(divergence.path, "/counter");
  assert.equal(divergence.expected, 3);
  assert.equal(divergence.actual, 4);
  assert.notEqual(divergence.expectedHash, divergence.actualHash);
  assert.equal(compareReplays(expected, actual).equal, false);
});

test("bug bundle uses an explicit secret-safe allowlist and never promotes placeholders", () => {
  const result = run();
  const bundle = createSecretSafeBugBundle({ trace: result.trace, diagnostics: [{ code: "simulation.example" }], relevantState: { counter: 6 } });
  assert.equal(bundle.schemaVersion, "office-replay-bug-bundle-v1");
  assert.equal("payload" in (bundle.inputs[0] ?? {}), false);
  assert.equal(JSON.stringify(bundle).includes("token"), false);
  assert.throws(() => createSecretSafeBugBundle({ trace: result.trace, diagnostics: [], relevantState: { token: "do-not-export" } }), hasCode("simulation.replay-bundle-secret"));
  assert.throws(() => createReplaySnapshot({ state: asJson(fixture.initialState), tick: 0, stateHash: "0".repeat(64) }), hasCode("simulation.replay-placeholder-hash"));
});

test("ordered input and duplicate identities fail before execution", () => {
  assert.throws(() => runReplay({ ...runOptions(), inputs: [...fixture.inputs.slice(0, 2)].reverse() }), hasCode("simulation.replay-input-order-invalid"));
  assert.throws(() => runReplay({ ...runOptions(), inputs: [fixture.inputs[0]!, fixture.inputs[0]!] }), hasCode("simulation.replay-input-duplicate"));
});
