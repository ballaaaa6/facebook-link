import assert from "node:assert/strict";
import { test } from "node:test";

import {
  cleanupCategories,
  evaluateContentionCleanupFixture,
  evaluateFacilityQueueFixture,
  evaluateOneActorCleanupFixture,
  frozenInterfaceVersions,
  readRc01Fixture,
  runRc01Evidence,
} from "./office-v2-rc-01-evidence.mjs";

test("RC-01 valid facility and queue fixture proves capacity, approach, waiting, and stable ticket order", () => {
  const fixture = readRc01Fixture("rc-01-facility-queue-valid.json");
  const result = evaluateFacilityQueueFixture(fixture);

  assert.equal(result.accepted, true);
  assert.deepEqual(result.errors, []);
  assert.equal(result.capacity, fixture.expected.capacity);
  assert.deepEqual(result.approachCells, fixture.expected.approachCells);
  assert.deepEqual(result.waitingCells, fixture.expected.waitingCells);
  assert.deepEqual(result.queueOrder, fixture.expected.queueOrder);
  assert.deepEqual(result.normalizedResourceSets, fixture.expected.normalizedResourceSets);
  assert.equal(fixture.facilitySlot.schemaVersion, frozenInterfaceVersions.facilitySlot);
  assert.equal(fixture.facilitySlot.queuePolicyVersion, frozenInterfaceVersions.queuePolicy);
});

test("RC-01 rejected facility and queue fixture fails closed for missing approach and partial claim", () => {
  const fixture = readRc01Fixture("rc-01-facility-queue-rejected.json");
  const result = evaluateFacilityQueueFixture(fixture);

  assert.equal(result.accepted, false);
  assert.deepEqual(result.errors, fixture.expected.rejectionReasons);
  assert.equal(fixture.partialResourceClaim.length > 0, true);
  assert.equal(fixture.geometry.approachCells.length, 0);
});

test("RC-01 one-actor terminal cleanup releases every resource category exactly once", () => {
  const fixture = readRc01Fixture("rc-01-one-actor-cleanup.json");
  const result = evaluateOneActorCleanupFixture(fixture);

  assert.deepEqual(result.trace, fixture.trace);
  assert.equal(result.categoriesEmpty, true);
  assert.deepEqual(Object.keys(result.remaining), cleanupCategories);
  for (const category of cleanupCategories) assert.deepEqual(result.remaining[category], []);
  assert.deepEqual(result.releasedKeys, fixture.expected.releasedKeys);
  assert.equal(result.cleanupGeneration, fixture.expected.cleanupGeneration);
  assert.equal(result.repeatedCleanupNoOp, true);
  assert.deepEqual(result.second.state, result.first.state);
});

test("RC-01 contention and cancellation keep the winner, reject partial acquisition, and clean the canceled ticket", () => {
  const fixture = readRc01Fixture("rc-01-contention-cleanup.json");
  const result = evaluateContentionCleanupFixture(fixture);

  assert.deepEqual(result.queueOrder, fixture.expected.queueOrder);
  assert.equal(result.winner, fixture.expected.winner);
  assert.equal(result.waitingActor, fixture.cancellation.actorId);
  assert.deepEqual(result.partialClaim, []);
  assert.equal(result.atomicWaiting, true);
  for (const category of cleanupCategories) assert.deepEqual(result.remainingAfterCancellation[category], fixture.cancellation.expectedRemaining[category]);
  assert.equal(result.cancellationNoOpOnRepeat, true);
  assert.deepEqual(result.repeated.state, result.cleanup.state);
});

test("RC-01 report explicitly remains bounded fixture evidence", () => {
  const report = runRc01Evidence();

  assert.deepEqual(report.claims, { reducerReplay: false, crowd: false, t3: false });
  assert.equal(report.evidenceKind, "rc-01-research-closure-fixture");
  assert.equal(report.validFacilityQueue.accepted, true);
  assert.equal(report.rejectedFacilityQueue.accepted, false);
  assert.equal(report.oneActorCleanup.categoriesEmpty, true);
  assert.equal(report.contentionCleanup.atomicWaiting, true);
});
