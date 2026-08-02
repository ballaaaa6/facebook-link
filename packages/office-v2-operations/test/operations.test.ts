import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import type {
  RosterDocument,
  RoutingDocument,
  SnapshotDocument,
} from "@affiliate-ops/office-v2-contracts";
import {
  bindRoster,
  canProposeInteraction,
  inspectOperationsSnapshot,
  reconcileEventWindow,
} from "../src/index.ts";

type ClosureFixture = {
  snapshots: SnapshotDocument[];
  routing: RoutingDocument;
  roster: RosterDocument;
  reconnect: {
    cursorAfter: {
      streamId: string;
      streamEpoch: number;
      throughSequence: number;
      retentionWindowStart: number;
      seenEvents: { durableEventId: string; payloadDigest: string }[];
    };
  };
};

type MutableSnapshot = { -readonly [Key in keyof SnapshotDocument]: SnapshotDocument[Key] };

type AdapterFixture = {
  cursorCases: Array<{
    name: string;
    cursorThroughSequence: number;
    retentionWindowStart?: number;
    snapshotEpoch: number;
    windowStartSequence: number;
    throughSequence: number;
    eventSequences: number[];
    expectedStatus: "resync-required";
    expectedFailure: string;
  }>;
  rosterCases: Array<{ name: string; expectedFailure: string }>;
};

const fixture = JSON.parse(
  readFileSync(resolve(import.meta.dirname, "../../../docs/office-v2/fixtures/operations-closure-c.json"), "utf8"),
) as unknown as ClosureFixture;

const adapterFixture = JSON.parse(
  readFileSync(resolve(import.meta.dirname, "fixtures/p3-w3-2-operations-adapter.json"), "utf8"),
) as AdapterFixture;

function digest(seed: string): string {
  return seed.repeat(64).slice(0, 64);
}

function eventAt(snapshot: SnapshotDocument, sequence: number): SnapshotDocument["events"][number] {
  const base = snapshot.events[0];
  assert.ok(base);
  return {
    ...base,
    durableEventId: { ...base.durableEventId, value: `event-${sequence}` },
    sequence,
    payloadDigest: digest(String(sequence)),
  };
}

test("reconnect applies a contiguous window and duplicate delivery is a no-op", () => {
  const snapshot = fixture.snapshots[0];
  const first = reconcileEventWindow({
    streamId: "operations-stream",
    streamEpoch: 1,
    throughSequence: 9,
    retentionWindowStart: 10,
    seenEvents: [],
  }, snapshot);
  assert.equal(first.status, "applied");
  assert.equal(first.acceptedEvents.length, 2);

  const duplicate = reconcileEventWindow(fixture.reconnect.cursorAfter, snapshot);
  assert.equal(duplicate.status, "duplicate");
  assert.deepEqual(duplicate.duplicateEventIds, ["event-10", "event-11"]);
  assert.equal(duplicate.diagnostics.length, 0);
});

test("the same durable event ID with a changed payload digest fails closed", () => {
  const snapshot = structuredClone(fixture.snapshots[0]);
  snapshot.events[0].payloadDigest = "f".repeat(64);
  const result = reconcileEventWindow({
    streamId: "operations-stream",
    streamEpoch: 1,
    throughSequence: 9,
    retentionWindowStart: 10,
    seenEvents: [{ durableEventId: "event-10", payloadDigest: "0".repeat(64) }],
  }, snapshot);
  assert.equal(result.status, "conflict");
  assert.equal(result.diagnostics[0]?.code, "adapter.event-digest-conflict");
  assert.equal(result.acceptedEvents.length, 0);
  assert.equal(result.nextCursor.throughSequence, 9);
});

test("resync-required cursor cases fail closed without advancing the cursor", () => {
  for (const cursorCase of adapterFixture.cursorCases) {
    const snapshot = structuredClone(fixture.snapshots[0]) as MutableSnapshot;
    snapshot.snapshotId = { ...snapshot.snapshotId, value: `snapshot-${cursorCase.name}` };
    snapshot.streamEpoch = cursorCase.snapshotEpoch;
    snapshot.windowStartSequence = cursorCase.windowStartSequence;
    snapshot.throughSequence = cursorCase.throughSequence;
    snapshot.events = cursorCase.eventSequences.map((sequence) => eventAt(snapshot, sequence));
    const cursor = {
      streamId: "operations-stream",
      streamEpoch: 1,
      throughSequence: cursorCase.cursorThroughSequence,
      retentionWindowStart: cursorCase.retentionWindowStart ?? 10,
      seenEvents: [],
    };
    const result = reconcileEventWindow(cursor, snapshot);
    assert.equal(result.status, cursorCase.expectedStatus, cursorCase.name);
    assert.equal(result.acceptedEvents.length, 0, cursorCase.name);
    assert.equal(result.duplicateEventIds.length, 0, cursorCase.name);
    assert.deepEqual(result.nextCursor, cursor, cursorCase.name);
    assert.ok(result.diagnostics.some((entry) => entry.code === cursorCase.expectedFailure), cursorCase.name);
  }
});

test("cursor fingerprints are returned in stable identity order", () => {
  const snapshot = fixture.snapshots[0];
  const cursor = {
    streamId: "operations-stream",
    streamEpoch: 1,
    throughSequence: 11,
    retentionWindowStart: 10,
    seenEvents: [
      { durableEventId: "event-11", payloadDigest: snapshot.events[1]?.payloadDigest ?? "" },
      { durableEventId: "event-10", payloadDigest: snapshot.events[0]?.payloadDigest ?? "" },
    ],
  };
  const result = reconcileEventWindow(cursor, snapshot);
  assert.equal(result.status, "duplicate");
  assert.deepEqual(result.nextCursor.seenEvents.map((event) => event.durableEventId), ["event-10", "event-11"]);
});

test("valid roster binds without visual data in the operations snapshot", () => {
  const snapshot = fixture.snapshots[0];
  assert.equal(inspectOperationsSnapshot(snapshot).length, 0);
  const result = bindRoster(snapshot, fixture.routing, fixture.roster);
  assert.equal(result.bindings.length, 10);
  assert.equal(result.diagnostics.length, 0);
  assert.equal(Object.hasOwn(snapshot, "characterDefinition"), false);
  assert.equal(Object.hasOwn(snapshot, "homeFacility"), false);
});

test("roster binding rejects duplicate routes, TeamBrain agents, and unknown snapshot roles", () => {
  const routing = structuredClone(fixture.routing);
  routing.routes = [...routing.routes, routing.routes[0]];
  const duplicateRoute = bindRoster(fixture.snapshots[0], routing, fixture.roster);
  assert.ok(duplicateRoute.diagnostics.some((entry) => entry.code === "adapter.routing-role-duplicate"));

  const teambrainRoster = structuredClone(fixture.roster);
  teambrainRoster.bindings = [
    ...teambrainRoster.bindings,
    { ...teambrainRoster.bindings[0], agentInstanceId: { ...teambrainRoster.bindings[0].agentInstanceId, value: "teambrain" }, roleId: "teambrain" },
  ];
  const teambrain = bindRoster(fixture.snapshots[0], fixture.routing, teambrainRoster);
  assert.ok(teambrain.diagnostics.some((entry) => entry.code === "adapter.teambrain-not-agent"));

  const unknownRoleSnapshot = structuredClone(fixture.snapshots[0]) as MutableSnapshot;
  unknownRoleSnapshot.agents = [{ ...unknownRoleSnapshot.agents[0], roleId: "unknown-role" }, ...unknownRoleSnapshot.agents.slice(1)];
  const unknownRole = bindRoster(unknownRoleSnapshot, fixture.routing, fixture.roster);
  assert.ok(unknownRole.diagnostics.some((entry) => entry.code === "adapter.role-unknown"));
});

test("proposal safety preserves adapter ownership for forbidden interactions", () => {
  const result = canProposeInteraction(
    fixture.snapshots[0],
    fixture.routing,
    fixture.roster,
    "agent-market-scout",
    "propose-publish",
  );
  assert.equal(result.allowed, false);
  assert.equal(result.diagnostics[0]?.code, "adapter.forbidden-proposal");
});

test("proposal safety rejects disabled features, stale snapshots, and TeamBrain", () => {
  const disabled = canProposeInteraction(
    fixture.snapshots[0],
    fixture.routing,
    fixture.roster,
    "agent-gemini-copywriter",
    "propose-copy",
  );
  assert.equal(disabled.allowed, false);
  assert.ok(disabled.diagnostics.some((entry) => entry.code === "adapter.feature-disabled"));

  const staleSnapshot = structuredClone(fixture.snapshots[0]) as MutableSnapshot;
  staleSnapshot.freshness = "stale";
  const stale = canProposeInteraction(staleSnapshot, fixture.routing, fixture.roster, "agent-market-scout", "inspect-task");
  assert.equal(stale.allowed, false);
  assert.ok(stale.diagnostics.some((entry) => entry.code === "adapter.stale"));

  const teambrainRoster = structuredClone(fixture.roster);
  teambrainRoster.bindings = [
    ...teambrainRoster.bindings,
    { ...teambrainRoster.bindings[0], agentInstanceId: { ...teambrainRoster.bindings[0].agentInstanceId, value: "teambrain" }, roleId: "teambrain" },
  ];
  const teambrain = canProposeInteraction(fixture.snapshots[0], fixture.routing, teambrainRoster, "teambrain", "propose-action");
  assert.equal(teambrain.allowed, false);
  assert.ok(teambrain.diagnostics.some((entry) => entry.code === "adapter.teambrain-not-agent"));
});

test("adapter operations preserve all input documents", () => {
  const snapshot = structuredClone(fixture.snapshots[0]);
  const routing = structuredClone(fixture.routing);
  const roster = structuredClone(fixture.roster);
  const cursor = structuredClone(fixture.reconnect.cursorAfter);
  const before = {
    snapshot: structuredClone(snapshot),
    routing: structuredClone(routing),
    roster: structuredClone(roster),
    cursor: structuredClone(cursor),
  };

  reconcileEventWindow(cursor, snapshot);
  bindRoster(snapshot, routing, roster);
  canProposeInteraction(snapshot, routing, roster, "agent-market-scout", "inspect-task");

  assert.deepEqual(snapshot, before.snapshot);
  assert.deepEqual(routing, before.routing);
  assert.deepEqual(roster, before.roster);
  assert.deepEqual(cursor, before.cursor);
});
