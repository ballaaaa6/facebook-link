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

const fixture = JSON.parse(
  readFileSync(resolve(import.meta.dirname, "../../../docs/office-v2/fixtures/operations-closure-c.json"), "utf8"),
) as unknown as ClosureFixture;

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
