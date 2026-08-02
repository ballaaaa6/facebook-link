import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { CommandDocument, JsonValue } from "@affiliate-ops/office-v2-contracts";
import { canonicalHashHex } from "@affiliate-ops/office-v2-contracts";
import {
  activeResourceLeaks,
  advanceIntegratedTick,
  createIntegratedSimulationState,
  integratedStateAsJson,
  type IntegratedIntentDefinition,
  type IntegratedSimulationState,
  type IntegratedWorld,
} from "../src/integrated-runtime.ts";
import { createReplaySnapshot, restoreReplay, runReplay, type ReplayInput, type ReplayRunResult } from "../src/replay.ts";
import fixture from "./fixtures/p3-t2-integrated-scenarios.json" with { type: "json" };

type Scenario = (typeof fixture.scenarios)[number];
type CheckpointKind = Scenario["checkpointKind"];
const worldRevision = 7;
const worldReference = { id: "t2-integration-world", version: 1 };
const baseWorld: IntegratedWorld = {
  revision: worldRevision,
  bounds: { minX: 0, maxX: 4, minY: 0, maxY: 4 },
  obstacles: [],
  targets: [{ targetId: "review-desk", generation: 3, availability: "available", facility: { facilityId: "review-desk", slotId: "review-desk-use", capability: "review-content", capacity: 1, availability: "available", targetGeneration: 3, revision: worldRevision, approachCells: ["2,0"], waitingCells: ["0,1", "1,1"] } }],
};

const definition = (scenario: Scenario): IntegratedIntentDefinition => ({
  intentId: scenario.intentId,
  actorId: "actor-one",
  targetId: "review-desk",
  startCell: "0,0",
  capability: "review-content",
  priorityClass: "durable",
  durationTicks: scenario.id.includes("queue") ? 2 : scenario.id.includes("interaction") || scenario.id.includes("held-prop") ? 5 : 3,
  expectedWorldRevision: worldRevision,
  expectedTargetGeneration: 3,
  resourceKeys: [],
  ...(scenario.id.includes("timeout") ? { expiresTick: 4 } : {}),
  ...(scenario.id.includes("held-prop") ? { heldPropKey: "review-card" } : {}),
});

function command(value: string, kind: CommandDocument["kind"], scenario: Scenario, scheduledTick: number, reason?: string): CommandDocument {
  const payload = { intentId: { kind: "intent" as const, value: scenario.intentId }, ...(reason === undefined ? {} : { reason }) };
  const payloadDigest = canonicalHashHex({ domain: "office-v2:t2-command", domainVersion: "office-t2-command-v1", payload });
  return { schemaVersion: "office-simulation-command-v2", commandId: { kind: "command", value }, commandVersion: 1, ownerKind: "actor", actorId: { kind: "actor", value: "actor-one" }, issuedTick: scheduledTick, scheduledTick, sourceRank: 0, sourceSequence: scheduledTick, kind, correlation: {}, payload, payloadDigest, expectedWorldRevision: worldRevision } as CommandDocument;
}

function scenarioSetup(scenario: Scenario): { readonly world: IntegratedWorld; readonly commands: readonly CommandDocument[]; readonly endTick: number; readonly blockers?: readonly { readonly releaseTick: number; readonly ticket: { readonly ticketId: string; readonly intentId: string; readonly actorId: string; readonly priorityClass: "durable"; readonly issuedTick: number; readonly enqueueTick: number; readonly resourceKeys: readonly string[]; readonly legalYieldCells: readonly string[] } }[] } {
  let world = baseWorld;
  if (scenario.id.includes("unreachable")) world = { ...world, obstacles: ["0,1", "1,0"] };
  if (scenario.id.includes("unavailable")) world = { ...world, targets: world.targets.map((target) => ({ ...target, availability: "removed" as const, facility: { ...target.facility, availability: "removed" as const } })) };
  const commands: CommandDocument[] = [command(`${scenario.intentId}:assign`, "assign-intent", scenario, 1)];
  if (scenario.id.includes("cancel")) commands.push(command(`${scenario.intentId}:cancel`, "cancel-intent", scenario, 3));
  if (scenario.id.includes("target-removed")) commands.push(command(`${scenario.intentId}:remove`, "cancel-intent", scenario, 2, "target-removed"));
  const blockers = scenario.id.includes("queue") ? [{ releaseTick: 6, ticket: { ticketId: "blocker-ticket", intentId: "blocker-intent", actorId: "actor-blocker", priorityClass: "durable" as const, issuedTick: 0, enqueueTick: 0, resourceKeys: ["facility:review-desk", "socket:review-desk-use"], legalYieldCells: ["2,2"] } }] : undefined;
  return { world, commands, endTick: scenario.id.includes("unreachable") || scenario.id.includes("unavailable") ? 3 : scenario.id.includes("cancel") || scenario.id.includes("target-removed") ? 6 : 10, ...(blockers === undefined ? {} : { blockers }) };
}

function state(value: JsonValue): IntegratedSimulationState {
  return value as IntegratedSimulationState;
}

function replayStep(value: JsonValue, input: ReplayInput | undefined, tick: number) {
  const commandValue = input?.payload && typeof input.payload === "object" && !Array.isArray(input.payload) ? input.payload.command : undefined;
  const result = advanceIntegratedTick(state(value), commandValue as CommandDocument | undefined === undefined ? [] : [commandValue as CommandDocument], tick);
  return { state: integratedStateAsJson(result.state), results: result.results, events: result.events, subsystem: "integrated-simulation" };
}

function run(initial: IntegratedSimulationState, inputs: readonly ReplayInput[], endTick: number): ReplayRunResult<JsonValue> {
  return runReplay({ initialState: integratedStateAsJson(initial), initialTick: 0, untilTick: endTick, inputs, world: worldReference, worldRevision, definitionVersion: "t2-world-v1", step: replayStep });
}

function checkpointContext(checkpoint: IntegratedSimulationState) {
  const activity = checkpoint.activities[0];
  assert.ok(activity);
  return { actionPhase: activity.phase, progressTicks: activity.progressTicks, resourceKeys: activity.requestedResourceKeys.length > 0 ? activity.requestedResourceKeys : ["planned:resource"], reservationIds: activity.reservations.length > 0 ? activity.reservations.map((value) => value.reservationId) : [`${activity.intentId}:planned-reservation`], targetGeneration: activity.targetGeneration ?? 0, worldRevision, heldPropState: { owners: checkpoint.heldPropOwnership }, correlation: { workflowRunId: "t2-workflow", taskId: activity.actionId, eventId: `${activity.intentId}:checkpoint` } };
}

function checkpointAssertion(kind: CheckpointKind, checkpoint: IntegratedSimulationState): void {
  const actor = checkpoint.actors[0];
  const activity = checkpoint.activities[0];
  assert.ok(actor && activity);
  if (kind === "mid-route") assert.equal(actor.state, "moving");
  if (kind === "mid-queue") { assert.equal(actor.state, "blocked"); assert.equal(activity.phase, "waiting"); assert.equal(checkpoint.queue.tickets.some((ticket) => ticket.state === "waiting"), true); }
  if (kind === "mid-interaction") { assert.equal(actor.state, "interacting"); assert.equal(activity.phase, "using"); assert.equal(checkpoint.resourceOwnership.length > 0, true); }
  if (kind === "held-prop/resource") assert.equal(checkpoint.heldPropOwnership.some((value) => value.resourceKey === "held-prop:review-card"), true);
  if (kind === "terminal-cleanup") assert.equal(["released", "canceled", "failed"].includes(activity.phase), true, `${kind}:${activity.phase}`);
}

export interface T2ScenarioEvidence {
  readonly scenarioId: string;
  readonly checkpointKind: string;
  readonly inputCommands: readonly CommandDocument[];
  readonly eventSequence: readonly IntegratedSimulationState["events"][number][];
  readonly checkpoint: { readonly tick: number; readonly stateHash: string; readonly completeTick: true };
  readonly replayResult: { readonly equal: true; readonly restoredEventTailEqual: true };
  readonly cleanup: { readonly uninterruptedLeaks: readonly string[]; readonly restoredLeaks: readonly string[]; readonly passed: true };
  readonly uninterruptedFinalHash: string;
  readonly restoredFinalHash: string;
  readonly equality: true;
}

export function executeT2Scenarios(): readonly T2ScenarioEvidence[] {
  return fixture.scenarios.map((scenario) => {
    const setup = scenarioSetup(scenario);
    const initial = createIntegratedSimulationState({ world: setup.world, intents: [definition(scenario)], ...(setup.blockers === undefined ? {} : { queueBlockers: setup.blockers }) });
    const inputs = setup.commands.map((value) => ({ inputId: value.commandId.value, scheduledTick: value.scheduledTick, kind: value.kind, payload: { command: value }, payloadDigest: canonicalHashHex({ domain: "office-v2:t2-input", domainVersion: "office-t2-input-v1", payload: value }) }));
    const uninterrupted = run(initial, inputs, setup.endTick);
    const frame = uninterrupted.frames.find((value) => value.tick === scenario.checkpointTick);
    assert.ok(frame);
    const checkpoint = state(frame.state);
    checkpointAssertion(scenario.checkpointKind, checkpoint);
    const snapshot = createReplaySnapshot({ state: frame.state, tick: frame.tick, stateHash: frame.stateHash, world: worldReference, worldRevision, definitionVersion: "t2-world-v1", inProgress: checkpointContext(checkpoint) });
    const restored = restoreReplay(snapshot, { untilTick: setup.endTick, inputs: inputs.filter((value) => value.scheduledTick > scenario.checkpointTick), world: worldReference, worldRevision, definitionVersion: "t2-world-v1", step: replayStep });
    assert.deepEqual(restored.finalState, uninterrupted.finalState);
    assert.equal(restored.finalStateHash, uninterrupted.finalStateHash);
    assert.deepEqual(restored.events, uninterrupted.events.filter((event) => event.tick > scenario.checkpointTick));
    assert.equal(activeResourceLeaks(state(uninterrupted.finalState)).length, 0);
    assert.equal(activeResourceLeaks(state(restored.finalState)).length, 0);
    assert.equal(state(uninterrupted.finalState).activities[0]?.terminalReason, scenario.terminalReason);
    return { scenarioId: scenario.id, checkpointKind: scenario.checkpointKind, inputCommands: setup.commands, eventSequence: state(uninterrupted.finalState).events, checkpoint: { tick: frame.tick, stateHash: frame.stateHash, completeTick: true }, replayResult: { equal: true, restoredEventTailEqual: true }, cleanup: { uninterruptedLeaks: [], restoredLeaks: [], passed: true }, uninterruptedFinalHash: uninterrupted.finalStateHash, restoredFinalHash: restored.finalStateHash, equality: true };
  });
}

export function writeT2Evidence(results: readonly T2ScenarioEvidence[]): void {
  const repositoryRoot = join(fileURLToPath(new URL(".", import.meta.url)), "..", "..", "..");
  const directory = join(repositoryRoot, "artifacts", "office-v2", "phase3", "t2");
  mkdirSync(directory, { recursive: true });
  const manifest = { schemaVersion: "office-t2-executed-scenarios-v1", runtimeVersion: "office-integrated-runtime-v1", scenarioCount: results.length, scenarioIds: results.map((value) => value.scenarioId) };
  writeFileSync(join(directory, "executed-scenarios.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  writeFileSync(join(directory, "t2-evidence.json"), `${JSON.stringify({ schemaVersion: "office-t2-evidence-v1", scenarioCount: results.length, scenarios: results }, null, 2)}\n`, "utf8");
  const lines = ["# Phase 3 T2 integrated one-actor evidence", "", `Scenario count: ${results.length}`, "", "All scenarios use the reducer-owned integrated runtime, real command pipeline, activity, queue, lifecycle, canonical hashing, and replay/restore APIs.", "", "| Scenario | Checkpoint | Uninterrupted hash | Restored hash | Replay equal | Cleanup |", "| --- | --- | --- | --- | --- | --- |"];
  for (const result of results) lines.push(`| ${result.scenarioId} | ${result.checkpointKind} @ tick ${result.checkpoint.tick} | ${result.uninterruptedFinalHash} | ${result.restoredFinalHash} | yes | no active queue, reservation, activity, or prop leaks |`);
  lines.push("", "The uninterrupted and restored final states, event sequences, and SHA-256 hashes are identical for every scenario.");
  writeFileSync(join(directory, "t2-evidence.md"), `${lines.join("\n")}\n`, "utf8");
}
