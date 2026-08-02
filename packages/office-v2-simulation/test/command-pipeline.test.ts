import assert from "node:assert/strict";
import test from "node:test";
import type { CommandDocument } from "@affiliate-ops/office-v2-contracts";
import {
  advanceCommandPipeline,
  createCommandPipelineState,
} from "../src/command-pipeline.ts";

const digest = (value: string): string => value.repeat(64).slice(0, 64);

function command(
  value: string,
  options: Partial<Pick<CommandDocument, "scheduledTick" | "sourceRank" | "sourceSequence" | "payloadDigest" | "commandVersion" | "expectedWorldRevision" | "ownerKind">> = {},
): CommandDocument {
  const ownerKind = options.ownerKind ?? "actor";
  const base = {
    schemaVersion: "office-simulation-command-v2" as const,
    commandId: { kind: "command" as const, value },
    commandVersion: options.commandVersion ?? 1,
    ownerKind,
    actorId: ownerKind === "actor" ? { kind: "actor" as const, value: `actor-${value}` } : undefined,
    systemOwner: ownerKind === "system" ? "workflow-coordinator" : undefined,
    issuedTick: options.scheduledTick ?? 0,
    scheduledTick: options.scheduledTick ?? 0,
    sourceRank: options.sourceRank ?? 0,
    sourceSequence: options.sourceSequence ?? 0,
    kind: "assign-intent" as const,
    correlation: {},
    payload: {
      intentId: { kind: "intent" as const, value: `intent-${value}` },
      targetEntityId: { kind: "entity-instance" as const, value: `target-${value}` },
    },
    payloadDigest: options.payloadDigest ?? digest(value),
    expectedWorldRevision: options.expectedWorldRevision ?? 0,
  };
  return base as CommandDocument;
}

function sameState(left: unknown, right: unknown): void {
  assert.deepEqual(left, right);
}

test("orders eligible commands by the frozen total key and applies only once", () => {
  const state = createCommandPipelineState(0, 0);
  const result = advanceCommandPipeline(state, [
    command("z", { scheduledTick: 1, sourceRank: 1, sourceSequence: 1 }),
    command("a", { scheduledTick: 1, sourceRank: 1, sourceSequence: 1 }),
    command("b", { scheduledTick: 1, sourceRank: 0, sourceSequence: 9 }),
  ], 1);

  assert.deepEqual(result.appliedCommandIds, ["b", "a", "z"]);
  assert.deepEqual(result.events.map((event) => event.sequence), [1, 2, 3]);
  assert.equal(result.state.tick, 1);
});

test("rejects a scheduled-past command without mutating state", () => {
  const state = createCommandPipelineState(0, 5);
  const result = advanceCommandPipeline(state, [command("past", { scheduledTick: 4 })], 5);

  sameState(result.state, state);
  assert.equal(result.results[0]?.status, "rejected");
  assert.equal(result.results[0]?.diagnostic?.code, "simulation.command-scheduled-in-past");
});

test("returns an idempotent duplicate without a second mutation or event", () => {
  const state = createCommandPipelineState(0, 0);
  const first = advanceCommandPipeline(state, [command("same")], 0);
  const second = advanceCommandPipeline(first.state, [command("same")], 0);

  sameState(second.state, first.state);
  assert.equal(second.results[0]?.status, "idempotent-duplicate");
  assert.deepEqual(second.events, []);
});

test("rejects a conflicting command identity and preserves the accepted ledger", () => {
  const state = createCommandPipelineState(0, 0);
  const first = advanceCommandPipeline(state, [command("conflict")], 0);
  const second = advanceCommandPipeline(first.state, [command("conflict", { payloadDigest: digest("different") })], 0);

  sameState(second.state, first.state);
  assert.equal(second.results[0]?.status, "rejected");
  assert.equal(second.results[0]?.diagnostic?.code, "simulation.command-id-conflict");
});

test("rejects stale world revisions without partial mutation", () => {
  const state = createCommandPipelineState(3, 0);
  const result = advanceCommandPipeline(state, [command("stale", { expectedWorldRevision: 2 })], 0);

  sameState(result.state, state);
  assert.equal(result.results[0]?.diagnostic?.code, "simulation.world-revision-stale");
});

test("rejects contradictory actor and system owner identity before apply", () => {
  const state = createCommandPipelineState(0, 0);
  const invalid = { ...command("invalid-owner"), actorId: undefined, systemOwner: undefined } as CommandDocument;
  const result = advanceCommandPipeline(state, [invalid], 0);

  sameState(result.state, state);
  assert.equal(result.results[0]?.diagnostic?.code, "simulation.command-owner-invalid");
});

test("emits deterministic schema-shaped result and event facts", () => {
  const result = advanceCommandPipeline(createCommandPipelineState(0, 0), [command("facts")], 0);
  const accepted = result.results[0];
  const event = result.events[0];

  assert.equal(accepted?.schemaVersion, "office-simulation-result-v2");
  assert.equal(accepted?.status, "accepted");
  assert.equal(accepted?.stateChanged, true);
  assert.equal(event?.schemaVersion, "office-simulation-event-v2");
  assert.equal(event?.kind, "command-accepted");
  assert.equal(event?.sequence, 1);
  assert.equal(event?.emittedTick, 0);
  assert.deepEqual(event?.sourceCommandId, { kind: "command", value: "facts" });
});

test("explicit tick advancement is deterministic and retains future commands", () => {
  const state = createCommandPipelineState(0, 0);
  const scheduled = command("future", { scheduledTick: 3 });
  const left = advanceCommandPipeline(state, [scheduled], 2);
  const right = advanceCommandPipeline(state, [scheduled], 2);

  sameState(left, right);
  assert.deepEqual(left.state.pendingCommands.map((entry) => entry.commandId.value), ["future"]);
  const completed = advanceCommandPipeline(left.state, [], 3);
  assert.deepEqual(completed.appliedCommandIds, ["future"]);
  assert.equal(completed.state.tick, 3);
});
