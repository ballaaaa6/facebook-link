import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  QueueRuntimeError,
  acquireQueueTicket,
  cleanupQueueTicket,
  createQueueState,
  detectWaitForCycles,
  enqueueQueueTicket,
  normalizeQueueResourceKeys,
  orderQueueTickets,
  recordQueueProgress,
  resolveDeadlocks,
  setWaitForEdges,
  simulateQueueProfile,
} from "../src/queues.ts";

const fixture = JSON.parse(readFileSync(new URL("./fixtures/p3-w2-4-queues.json", import.meta.url), "utf8")) as {
  profiles: readonly { requestCount: 1 | 10 | 15; maximumTick: number }[];
  deadlock: { noProgressThreshold: number; cycle: readonly string[]; yieldCells: readonly string[] };
};

function ticket(
  ticketId: string,
  actorId = `actor-${ticketId}`,
  overrides: Partial<Parameters<typeof enqueueQueueTicket>[1]> = {},
) {
  return {
    ticketId,
    intentId: `intent-${ticketId}`,
    actorId,
    priorityClass: "durable" as const,
    issuedTick: 0,
    enqueueTick: 0,
    resourceKeys: [`socket:${ticketId}`],
    legalYieldCells: [`cell:yield:${actorId}`],
    ...overrides,
  };
}

function stateWith(...inputs: Parameters<typeof enqueueQueueTicket>[1][]) {
  return inputs.reduce((state, input) => enqueueQueueTicket(state, input).state, createQueueState({ noProgressThreshold: 3 }));
}

test("normalizes complete resource sets with the UTF-16 comparator", () => {
  assert.deepEqual(normalizeQueueResourceKeys(["socket:z", "cell:a", "socket:A"]), ["cell:a", "socket:A", "socket:z"]);
});

test("rejects malformed and duplicate resources before state mutation", () => {
  const state = createQueueState({ noProgressThreshold: 3 });
  assert.throws(() => normalizeQueueResourceKeys(["socket:a", "socket:a"]), (error: unknown) => (
    error instanceof QueueRuntimeError && error.code === "simulation.queue-resource-duplicate"
  ));
  assert.throws(() => enqueueQueueTicket(state, ticket("duplicate", "actor-duplicate", { resourceKeys: [] })), (error: unknown) => (
    error instanceof QueueRuntimeError && error.code === "simulation.queue-resource-invalid"
  ));
  assert.deepEqual(state.tickets, []);
});

test("duplicate ticket is idempotent and conflicting identity is rejected without mutation", () => {
  const first = enqueueQueueTicket(createQueueState({ noProgressThreshold: 3 }), ticket("ticket-one"));
  const duplicate = enqueueQueueTicket(first.state, ticket("ticket-one"));
  assert.equal(duplicate.accepted, false);
  assert.equal(duplicate.diagnostic?.code, "simulation.queue-ticket-duplicate");
  assert.deepEqual(duplicate.state, first.state);
  const conflict = enqueueQueueTicket(first.state, ticket("ticket-one", "actor-other"));
  assert.equal(conflict.diagnostic?.code, "simulation.queue-ticket-conflict");
  assert.deepEqual(conflict.state, first.state);
});

test("orders durable work before decorative work, then enqueue tick and ticket ID", () => {
  let state = createQueueState({ noProgressThreshold: 3 });
  for (const input of [
    ticket("z", "actor-z", { priorityClass: "decorative", enqueueTick: 1 }),
    ticket("b", "actor-b", { priorityClass: "durable", enqueueTick: 2 }),
    ticket("a", "actor-a", { priorityClass: "durable", enqueueTick: 2 }),
    ticket("c", "actor-c", { priorityClass: "durable", enqueueTick: 1 }),
  ]) state = enqueueQueueTicket(state, input).state;
  assert.deepEqual(orderQueueTickets(state.tickets).map((entry) => entry.ticketId), ["c", "a", "b", "z"]);
});

test("contention never leaves a partial claim and fair service grants all resources", () => {
  let state = stateWith(
    ticket("holder", "actor-holder", { resourceKeys: ["socket:shared"] }),
    ticket("waiter", "actor-waiter", { resourceKeys: ["cell:wait", "socket:shared"] }),
  );
  state = acquireQueueTicket(state, "holder", 1).state;
  const blocked = acquireQueueTicket(state, "waiter", 2);
  assert.equal(blocked.accepted, false);
  assert.deepEqual(blocked.state.reservations.filter((entry) => entry.ticketId === "waiter"), []);
  assert.deepEqual(blocked.blockedResourceKeys, ["socket:shared"]);
  state = cleanupQueueTicket(blocked.state, "holder", 3, "completed").state;
  const acquired = acquireQueueTicket(state, "waiter", 4);
  assert.equal(acquired.accepted, true);
  assert.deepEqual(acquired.state.reservations.filter((entry) => entry.state === "held").map((entry) => entry.resourceKey), ["cell:wait", "socket:shared"]);
});

test("earlier same-resource tickets retain fairness even when resources are free", () => {
  let state = stateWith(
    ticket("later", "actor-later", { enqueueTick: 2, resourceKeys: ["socket:shared"] }),
    ticket("earlier", "actor-earlier", { enqueueTick: 1, resourceKeys: ["socket:shared"] }),
  );
  const later = acquireQueueTicket(state, "later", 2);
  assert.equal(later.accepted, false);
  assert.deepEqual(later.blockedByTicketIds, ["earlier"]);
  state = acquireQueueTicket(later.state, "earlier", 2).state;
  assert.equal(acquireQueueTicket(state, "earlier", 2).accepted, true);
});

test("cleanup releases claims exactly once for completion, cancellation, and target removal", () => {
  let state = stateWith(ticket("cleanup", "actor-cleanup", { resourceKeys: ["a", "b"] }));
  state = acquireQueueTicket(state, "cleanup", 1).state;
  const completed = cleanupQueueTicket(state, "cleanup", 2, "completed");
  assert.equal(completed.ticket?.state, "released");
  assert.deepEqual(completed.releasedResourceKeys, ["a", "b"]);
  assert.equal(completed.ticket?.cleanupGeneration, 1);
  const repeated = cleanupQueueTicket(completed.state, "cleanup", 3, "canceled");
  assert.deepEqual(repeated.state, completed.state);
  assert.deepEqual(repeated.releasedResourceKeys, ["a", "b"]);

  let removedState = stateWith(ticket("removed"));
  removedState = acquireQueueTicket(removedState, "removed", 1).state;
  const removed = cleanupQueueTicket(removedState, "removed", 2, "target-removed");
  assert.equal(removed.ticket?.state, "canceled");
  assert.equal(removed.ticket?.terminalReason, "target-removed");
  assert.equal(removed.state.reservations.every((entry) => entry.state === "released"), true);
});

test("wait-for cycles are deterministic and only resolve after no-progress threshold", () => {
  let state = stateWith(
    ticket("a-ticket", "actor-a", { priorityClass: "durable", issuedTick: 1, legalYieldCells: fixture.deadlock.yieldCells }),
    ticket("b-ticket", "actor-b", { priorityClass: "decorative", issuedTick: 2, legalYieldCells: ["cell:yield-b"] }),
  );
  state = acquireQueueTicket(state, "a-ticket", 1).state;
  state = acquireQueueTicket(state, "b-ticket", 1).state;
  state = setWaitForEdges(state, [
    { fromActorId: "actor-b", toActorId: "actor-a", kind: "resource", resourceKey: "resource:a", createdTick: 1 },
    { fromActorId: "actor-a", toActorId: "actor-b", kind: "resource", resourceKey: "resource:b", createdTick: 1 },
  ], 1);
  assert.deepEqual(detectWaitForCycles(state).map((cycle) => cycle.actorIds), [["actor-a", "actor-b"]]);
  const beforeThreshold = resolveDeadlocks(state, 3);
  assert.deepEqual(beforeThreshold.resolutions, []);
  const resolved = resolveDeadlocks(beforeThreshold.state, 4);
  assert.equal(resolved.resolutions.length, 1);
  assert.equal(resolved.resolutions[0]?.victimActorId, "actor-b");
  assert.equal(resolved.resolutions[0]?.outcome, "yield");
  assert.equal(resolved.resolutions[0]?.yieldCell, "cell:yield-b");
  assert.deepEqual(resolved.resolutions[0]?.releasedResourceKeys, ["socket:b-ticket"]);
  assert.equal(resolved.state.tickets.find((entry) => entry.ticketId === "b-ticket")?.state, "yielding");
});

test("victim tie-break uses latest intent then greatest actor ID", () => {
  let state = stateWith(
    ticket("a", "actor-a", { priorityClass: "decorative", issuedTick: 3, legalYieldCells: ["cell:a"] }),
    ticket("b", "actor-b", { priorityClass: "decorative", issuedTick: 4, legalYieldCells: ["cell:b"] }),
  );
  state = setWaitForEdges(state, [
    { fromActorId: "actor-a", toActorId: "actor-b", kind: "spatial", createdTick: 0 },
    { fromActorId: "actor-b", toActorId: "actor-a", kind: "spatial", createdTick: 0 },
  ]);
  const resolved = resolveDeadlocks(state, 3);
  assert.equal(resolved.resolutions[0]?.victimActorId, "actor-b");
});

test("missing legal yield cell is a stable blocked result with the exact diagnostic", () => {
  let state = stateWith(
    ticket("a", "actor-a", { legalYieldCells: [] }),
    ticket("b", "actor-b", { legalYieldCells: [] }),
  );
  state = setWaitForEdges(state, [
    { fromActorId: "actor-a", toActorId: "actor-b", kind: "resource", createdTick: 0 },
    { fromActorId: "actor-b", toActorId: "actor-a", kind: "resource", createdTick: 0 },
  ]);
  const result = resolveDeadlocks(state, 3);
  assert.equal(result.resolutions[0]?.outcome, "blocked");
  assert.equal(result.diagnostics[0]?.code, "simulation.deadlock-no-yield-cell");
  assert.equal(result.resolutions[0]?.diagnostic?.code, "simulation.deadlock-no-yield-cell");
  assert.equal(result.state.tickets.find((entry) => entry.ticketId === "b")?.state, "blocked");
});

test("one, ten, and fifteen request profiles complete within their bounded fixture limits", () => {
  for (const profile of fixture.profiles) {
    const result = simulateQueueProfile(profile.requestCount);
    assert.equal(result.accepted, profile.requestCount);
    assert.equal(result.completed, profile.requestCount);
    assert.equal(result.state.tickets.every((entry) => entry.state === "released"), true);
    assert.ok(result.state.tick <= profile.maximumTick);
  }
});

test("progress updates are immutable and reset deadlock aging", () => {
  const state = stateWith(ticket("progress", "actor-progress"));
  const next = recordQueueProgress(state, "actor-progress", 9);
  assert.equal(state.actors[0]?.lastProgressTick, 0);
  assert.equal(next.actors[0]?.lastProgressTick, 9);
  assert.notEqual(next, state);
});
