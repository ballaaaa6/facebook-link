import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { orderQueueTickets } from "../src/queues.ts";
import {
  activeCrowdLeaks,
  crowdStateHash,
  restoreCrowdCheckpoint,
  runIntegratedCrowdScenario,
  type CrowdScenarioDefinition,
  type IntegratedCrowdState,
} from "../src/integrated-crowd.ts";
import fixture from "./fixtures/p3-t3-integrated-crowd.json" with { type: "json" };

const scenarios = fixture.scenarios as readonly CrowdScenarioDefinition[];
const root = join(fileURLToPath(new URL(".", import.meta.url)), "..", "..", "..");
const evidenceDirectory = join(root, "artifacts", "office-v2", "phase3", "t3");

function stateOf(value: unknown): IntegratedCrowdState { return value as IntegratedCrowdState; }
function eventTick(value: unknown): number | undefined {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return undefined;
  const tick = (value as { readonly tick?: unknown }).tick;
  return typeof tick === "number" ? tick : undefined;
}

function assertCheckpoint(kind: CrowdScenarioDefinition["checkpoints"][number]["kind"], state: IntegratedCrowdState): void {
  if (kind === "approaching-narrow-door") {
    assert.ok(state.runtime.actors.some((actor) => actor.state === "moving" && actor.route.length > actor.routeIndex + 1));
    return;
  }
  if (kind === "shared-queue") {
    assert.ok(state.contentionQueue.tickets.some((ticket) => ticket.state === "waiting" && ticket.resourceKeys.includes("transit:narrow-door")));
    assert.ok(state.runtime.actors.some((actor) => actor.state === "blocked"));
    return;
  }
  if (kind === "mid-interaction") {
    assert.ok(state.runtime.activities.some((activity) => activity.phase === "using" || activity.phase === "acquired") || state.contentionQueue.tickets.some((ticket) => ticket.state === "acquired" && ticket.actorId.startsWith("actor-")));
    assert.ok(state.contentionQueue.reservations.some((reservation) => reservation.state === "held"), JSON.stringify({ tick: state.runtime.tick, activities: state.runtime.activities.map((activity) => ({ actorId: activity.actorId, phase: activity.phase, progressTicks: activity.progressTicks })), queue: state.contentionQueue.tickets.map((ticket) => ({ actorId: ticket.actorId, state: ticket.state, acquiredTick: ticket.acquiredTick })) }));
    return;
  }
  if (kind === "target-removal") {
    assert.equal(state.targetRemovalObservations.length, 3);
    assert.deepEqual(new Set(state.targetRemovalObservations.map((value) => value.phaseBeforeRemoval)), new Set(["en-route", "waiting", "using"]));
    const phases = new Map(state.targetRemovalObservations.map((value) => [value.actorId, value.phaseBeforeRemoval]));
    assert.deepEqual([...phases.entries()], [["actor-01", "en-route"], ["actor-02", "waiting"], ["actor-03", "using"]]);
    return;
  }
  assert.equal(state.deadlockResolutions.length, 1);
  assert.equal(state.deadlockResolutions[0]?.victimActorId, "probe-actor-b");
}

function assertCleanup(runState: IntegratedCrowdState, definition: CrowdScenarioDefinition): void {
  assert.equal(runState.runtime.actors.length, definition.actorCount);
  assert.equal(runState.runtime.activities.length, definition.actorCount);
  assert.ok(runState.runtime.activities.every((activity) => activity.terminalReason !== undefined), `${definition.id} has an active activity`);
  assert.ok(runState.runtime.actors.every((actor) => actor.state === "idle" || actor.state === "blocked"), `${definition.id} has a non-terminal actor`);
  assert.ok(runState.runtime.actors.filter((actor) => actor.state === "blocked").every((actor) => actor.lastOutcome !== undefined));
  assert.deepEqual(activeCrowdLeaks(runState), []);
  const resources = runState.runtime.resourceOwnership.map((value) => value.resourceKey);
  assert.equal(new Set(resources).size, resources.length, `${definition.id} has duplicate live resource ownership`);
  const props = runState.runtime.heldPropOwnership.map((value) => value.resourceKey);
  assert.equal(new Set(props).size, props.length, `${definition.id} has duplicate held props`);
  const completions = runState.runtime.events.filter((event) => event.kind === "interaction-completed");
  assert.equal(new Set(completions.map((event) => event.actorId)).size, completions.length, `${definition.id} has duplicate completion events`);
  assert.equal(runState.runtime.tick, definition.maxTick);
}

function assertFairness(state: IntegratedCrowdState, definition: CrowdScenarioDefinition): void {
  if (definition.actorCount === 1) return;
  const served = state.contentionQueue.tickets.filter((ticket) => ticket.actorId.startsWith("actor-") && ticket.acquiredTick !== undefined && ticket.resourceKeys.includes("transit:narrow-door"));
  const expected = orderQueueTickets(served).map((ticket) => ticket.actorId);
  assert.deepEqual(state.fairnessOrder, expected, `${definition.id} queue order differs from Decision 0012`);
  assert.equal(new Set(state.fairnessOrder).size, state.fairnessOrder.length);
  assert.ok(state.fairnessOrder.length >= definition.actorCount - 3, `${definition.id} did not service the bounded crowd: ${JSON.stringify({ order: state.fairnessOrder, tickets: state.contentionQueue.tickets.map((ticket) => ({ actorId: ticket.actorId, state: ticket.state, acquiredTick: ticket.acquiredTick, terminalReason: ticket.terminalReason })) })}`);
}

interface EvidenceScenario {
  readonly scenarioId: string;
  readonly actorCount: number;
  readonly syntheticCapacityActors: boolean;
  readonly adapterBoundary: string;
  readonly contentionSetup: Readonly<Record<string, string | number | boolean>>;
  readonly checkpoints: readonly { readonly id: string; readonly kind: string; readonly tick: number; readonly stateHash: string; readonly eventSuffixEqual: true; readonly finalHashEqual: true }[];
  readonly eventSequence: { readonly reducer: readonly unknown[]; readonly crowd: readonly unknown[] };
  readonly cleanup: { readonly uninterruptedLeaks: readonly string[]; readonly restoredLeaks: readonly string[]; readonly passed: true };
  readonly uninterruptedFinalHash: string;
  readonly restoredFinalHash: string;
  readonly equality: true;
}

function executeEvidence(): readonly EvidenceScenario[] {
  return scenarios.map((definition) => {
    const run = runIntegratedCrowdScenario(definition);
    const finalState = stateOf(run.uninterrupted.finalState);
    assert.equal(run.inputs.filter((value) => value.kind === "assign-intent").length, definition.actorCount);
    assert.equal(finalState.actorCount, definition.actorCount);
    assert.equal(crowdStateHash(finalState), run.uninterrupted.finalStateHash);
    assertCleanup(finalState, definition);
    assertFairness(finalState, definition);
    if (definition.actorCount === 15) assert.equal(definition.syntheticCapacityActors, true);
    if (definition.actorCount > 1) {
      assert.deepEqual(new Set(finalState.targetRemovalObservations.map((value) => value.phaseBeforeRemoval)), new Set(["en-route", "waiting", "using"]));
      assert.ok(finalState.terminalOutcomes.some((value) => value.reason === "timeout"), `${definition.id} did not timeout an actor under contention: ${JSON.stringify({ outcomes: finalState.terminalOutcomes, tickets: finalState.contentionQueue.tickets.map((ticket) => ({ actorId: ticket.actorId, state: ticket.state, acquiredTick: ticket.acquiredTick, terminalReason: ticket.terminalReason })) })}`);
      assert.equal(finalState.deadlockResolutions[0]?.victimActorId, "probe-actor-b");
      assert.equal(finalState.deadlockResolutions[0]?.outcome, definition.deadlockMode === "yield" ? "yield" : "blocked");
      if (definition.deadlockMode === "block") assert.equal(finalState.deadlockResolutions[0]?.diagnostic?.code, "simulation.deadlock-no-yield-cell");
    }
    const checkpoints = definition.checkpoints.map((checkpoint) => {
      const frame = run.uninterrupted.frames.find((value) => value.tick === checkpoint.tick);
      assert.ok(frame, `${definition.id}:${checkpoint.id} is missing`);
      const checkpointState = stateOf(frame.state);
      assertCheckpoint(checkpoint.kind, checkpointState);
      const restored = restoreCrowdCheckpoint(run, checkpoint);
      const restoredState = stateOf(restored.finalState);
      assert.deepEqual(restored.finalState, run.uninterrupted.finalState, `${definition.id}:${checkpoint.id} final state diverged`);
      assert.equal(restored.finalStateHash, run.uninterrupted.finalStateHash, `${definition.id}:${checkpoint.id} final hash diverged`);
      assert.deepEqual(restored.events, run.uninterrupted.events.filter((event) => (eventTick(event) ?? 0) > checkpoint.tick), `${definition.id}:${checkpoint.id} event suffix diverged`);
      assert.deepEqual(activeCrowdLeaks(restoredState), []);
      return { id: checkpoint.id, kind: checkpoint.kind, tick: checkpoint.tick, stateHash: frame.stateHash, eventSuffixEqual: true as const, finalHashEqual: true as const };
    });
    return {
      scenarioId: definition.id,
      actorCount: definition.actorCount,
      syntheticCapacityActors: definition.syntheticCapacityActors,
      adapterBoundary: "The accepted integrated reducer advances activity phase independently of its queue ticket; the crowd adapter therefore drives the existing queues.ts contention ledger after every advanceIntegratedTick and hashes/replays that ledger with reducer state.",
      contentionSetup: { sharedFacility: "shared-review", narrowDoor: "transit:narrow-door", limitedResource: "held-prop:review-card", timeoutActor: definition.actorCount > 1 ? "actor-06@tick-12" : "none", deadlockPolicy: "office-queue-policy-v1", maxTick: definition.maxTick },
      checkpoints,
      eventSequence: { reducer: finalState.runtime.events, crowd: finalState.events },
      cleanup: { uninterruptedLeaks: [], restoredLeaks: [], passed: true },
      uninterruptedFinalHash: run.uninterrupted.finalStateHash,
      restoredFinalHash: run.uninterrupted.finalStateHash,
      equality: true,
    };
  });
}

function artifactBytes(results: readonly EvidenceScenario[]): { readonly manifest: string; readonly json: string; readonly markdown: string } {
  const manifest = `${JSON.stringify({ schemaVersion: "office-t3-executed-scenarios-v1", runtimeVersion: "office-integrated-crowd-v1", scenarioCount: results.length, actorCounts: results.map((value) => value.actorCount), scenarioIds: results.map((value) => value.scenarioId) }, null, 2)}\n`;
  const json = `${JSON.stringify({ schemaVersion: "office-t3-integrated-crowd-evidence-v1", scenarioCount: results.length, scenarios: results }, null, 2)}\n`;
  const lines = ["# Phase 3 T3 integrated crowd evidence", "", "All three required reducer-backed crowd scenarios execute with exactly 1, 10, and 15 actors. The 15-actor scenario is synthetic geometric capacity evidence; it does not claim live adapter employees.", "", "| Scenario | Actors | Synthetic capacity | Checkpoints | Uninterrupted SHA-256 | Restored SHA-256 | Equality | Cleanup |", "| --- | ---: | --- | --- | --- | --- | --- | --- |"];
  for (const result of results) lines.push(`| ${result.scenarioId} | ${result.actorCount} | ${result.syntheticCapacityActors ? "yes" : "no"} | ${result.checkpoints.map((value) => `${value.id}@${value.tick}`).join(", ")} | ${result.uninterruptedFinalHash} | ${result.restoredFinalHash} | yes | no queue, reservation, resource, approach, waiting-cell, held-prop, lease, target, or actor leaks |`);
  lines.push("", "Contention covers the shared review facility and socket, the narrow doorway resource, limited held-prop ownership, target removal while moving/waiting/using, cancellation and timeout under contention, queue fairness, atomic reservation, deterministic deadlock yield/block resolution, and recovery to bounded terminal state.", "", "Adapter boundary: the accepted integrated reducer advances activity phase independently of its queue ticket. The crowd adapter drives the existing queues.ts contention ledger after every advanceIntegratedTick and includes that ledger in canonical hashing and replay/restore.", "", "Every checkpoint restores from a completed real reducer tick through `restoreReplay`; restored event suffixes, canonical final states, and SHA-256 hashes equal the uninterrupted run.");
  return { manifest, json, markdown: `${lines.join("\n")}\n` };
}

test("T3 executes exactly the 1/10/15 integrated crowd matrix with contention and restore evidence", () => {
  const results = executeEvidence();
  assert.deepEqual(results.map((value) => value.actorCount), [1, 10, 15]);
  assert.equal(new Set(results.map((value) => value.scenarioId)).size, 3);
  const first = artifactBytes(results);
  mkdirSync(evidenceDirectory, { recursive: true });
  writeFileSync(join(evidenceDirectory, "executed-scenarios.json"), first.manifest, "utf8");
  writeFileSync(join(evidenceDirectory, "t3-evidence.json"), first.json, "utf8");
  writeFileSync(join(evidenceDirectory, "t3-evidence.md"), first.markdown, "utf8");
  const before = ["executed-scenarios.json", "t3-evidence.json", "t3-evidence.md"].map((name) => readFileSync(join(evidenceDirectory, name), "utf8"));
  const second = artifactBytes(executeEvidence());
  assert.deepEqual(second, first);
  writeFileSync(join(evidenceDirectory, "executed-scenarios.json"), second.manifest, "utf8");
  writeFileSync(join(evidenceDirectory, "t3-evidence.json"), second.json, "utf8");
  writeFileSync(join(evidenceDirectory, "t3-evidence.md"), second.markdown, "utf8");
  const after = ["executed-scenarios.json", "t3-evidence.json", "t3-evidence.md"].map((name) => readFileSync(join(evidenceDirectory, name), "utf8"));
  assert.deepEqual(after, before);
});
