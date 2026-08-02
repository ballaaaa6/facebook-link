import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = join(scriptDirectory, "..");

export const rc03FixturePaths = Object.freeze({
  assignment: join(repositoryRoot, "packages", "office-v2-simulation", "test", "fixtures", "rc-03-assignment-reorder.json"),
  target: join(repositoryRoot, "packages", "office-v2-simulation", "test", "fixtures", "rc-03-target-revalidation.json"),
  retry: join(repositoryRoot, "packages", "office-v2-simulation", "test", "fixtures", "rc-03-retry-cancellation.json"),
});

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function compareUtf16(left, right) {
  const length = Math.min(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const difference = left.charCodeAt(index) - right.charCodeAt(index);
    if (difference !== 0) return difference;
  }
  return left.length - right.length;
}

function evaluateAssignment(fixture, equivalentInput) {
  const facilitiesById = new Map(fixture.assignment.facilities.map((facility) => [facility.facilityId, facility]));
  const capability = fixture.assignment.intent.capability;
  const eligible = equivalentInput.facilityIds
    .map((facilityId) => facilitiesById.get(facilityId))
    .filter((facility) => facility?.available === true && facility.capabilities.includes(capability))
    .sort((left, right) => compareUtf16(left.facilityId, right.facilityId));

  return {
    eligibleFacilityIds: eligible.map((facility) => facility.facilityId),
    selectedFacilityId: eligible[0]?.facilityId ?? null,
  };
}

function revalidateTarget(fixture, scenario) {
  const command = fixture.command;
  const targetEntityId = command.targetEntityId;
  if (scenario.targetExists !== true) {
    return { status: "terminal", reason: "target-removed", targetEntityId };
  }
  if (scenario.currentWorldRevision !== command.expectedWorldRevision) {
    return { status: "failed", reason: "world-revision-mismatch", targetEntityId };
  }
  if (scenario.targetGeneration !== command.expectedTargetGeneration) {
    return { status: "failed", reason: "target-generation-mismatch", targetEntityId };
  }
  if (scenario.facilityRevision !== command.expectedFacilityRevision) {
    return { status: "failed", reason: "target-revision-mismatch", targetEntityId };
  }
  if (scenario.targetAvailable !== true) {
    return { status: "blocked", reason: "target-unavailable", targetEntityId };
  }
  return { status: "ready", reason: null, targetEntityId };
}

function replayRetryStates(retry) {
  return retry.attempts.map((attempt) => ({
    commandId: retry.commandId,
    intentId: retry.intentId,
    attempt: attempt.attempt,
    status: attempt.status,
    terminalOutcome: attempt.terminalOutcome ?? null,
    reason: attempt.reason,
  }));
}

function applyCancellation(action, state = { status: "pending", releasedResources: [] }) {
  if (state.status === "terminal") return state;
  const canceled = action.states.find((candidate) => candidate.phase === "canceled");
  assert.ok(canceled, "RC-03 local cancellation assertion: canceled state is explicit");
  return {
    status: canceled.status,
    terminalOutcome: canceled.terminalOutcome,
    cleanupGeneration: canceled.cleanupGeneration,
    releasedResources: [...new Set(canceled.releasedResources)].sort(compareUtf16),
  };
}

export function loadRc03Fixtures() {
  return {
    assignment: readJson(rc03FixturePaths.assignment),
    target: readJson(rc03FixturePaths.target),
    retry: readJson(rc03FixturePaths.retry),
  };
}

export function evaluateRc03Evidence(fixtures = loadRc03Fixtures()) {
  const assignmentResults = fixtures.assignment.assignment.equivalentInputs.map((input) => evaluateAssignment(fixtures.assignment, input));
  const targetResults = fixtures.target.cases.map((scenario) => ({
    name: scenario.name,
    result: revalidateTarget(fixtures.target, scenario),
  }));
  const retryStates = replayRetryStates(fixtures.retry.retry);
  const cancellation = fixtures.retry.cancellation;
  const cancellationState = applyCancellation(cancellation);
  const restore = fixtures.retry.restoreInputs;

  return {
    assignmentResults,
    targetResults,
    retryStates,
    cancellationState,
    restore,
  };
}

export function assertRc03Evidence(fixtures = loadRc03Fixtures()) {
  const evidence = evaluateRc03Evidence(fixtures);
  const expectedAssignment = fixtures.assignment.assignment.expected;
  assert.deepEqual(evidence.assignmentResults[0], {
    eligibleFacilityIds: expectedAssignment.eligibleFacilityIds,
    selectedFacilityId: expectedAssignment.selectedFacilityId,
  }, "RC-03 local assignment assertion: canonical capability selection");
  assert.deepEqual(evidence.assignmentResults[1], evidence.assignmentResults[0], "RC-03 local assignment assertion: reorder equivalence");
  assert.equal(evidence.assignmentResults[0].selectedFacilityId, "facility:copy-lime", "RC-03 local assignment assertion: capability-only winner");

  for (const [index, scenario] of fixtures.target.cases.entries()) {
    const result = evidence.targetResults[index].result;
    assert.equal(result.status, scenario.expected.status, `RC-03 local target assertion: ${scenario.name} status`);
    assert.equal(result.reason, scenario.expected.reason, `RC-03 local target assertion: ${scenario.name} reason`);
    assert.equal(result.targetEntityId, fixtures.target.command.targetEntityId, `RC-03 local target assertion: ${scenario.name} stable target ID`);
    assert.equal(Object.hasOwn(result, "visualIdentity"), false, `RC-03 local target assertion: ${scenario.name} has no visual fallback`);
    assert.equal(Object.hasOwn(result, "fallbackTargetId"), false, `RC-03 local target assertion: ${scenario.name} has no array fallback`);
  }
  assert.equal(fixtures.target.target.visualIdentity, fixtures.target.replacementTarget.visualIdentity, "RC-03 local target assertion: visual identities are non-authoritative");
  assert.deepEqual(fixtures.target.expectedNoFallbacks, ["visual-identity", "array-position", "actor-position"]);

  const retry = fixtures.retry.retry;
  assert.deepEqual(evidence.retryStates.map((state) => state.commandId), retry.attempts.map(() => retry.commandId), "RC-03 local retry assertion: stable command ID");
  assert.deepEqual(evidence.retryStates.map((state) => state.intentId), retry.attempts.map(() => retry.intentId), "RC-03 local retry assertion: stable intent ID");
  assert.deepEqual(evidence.retryStates.map((state) => state.status), ["pending", "pending", "terminal"], "RC-03 local retry assertion: explicit pending and terminal states");
  assert.equal(evidence.retryStates.at(-1).terminalOutcome, retry.expected.terminalOutcome, "RC-03 local retry assertion: terminal outcome");

  const cancellation = fixtures.retry.cancellation;
  assert.equal(cancellation.states[0].status, "pending", "RC-03 local cancellation assertion: pending state");
  assert.equal(cancellation.states.at(-1).status, "terminal", "RC-03 local cancellation assertion: terminal state");
  assert.equal(cancellation.states.at(-1).terminalOutcome, cancellation.expected.terminalOutcome, "RC-03 local cancellation assertion: canceled outcome");
  assert.deepEqual(evidence.cancellationState, applyCancellation(cancellation, evidence.cancellationState), "RC-03 local cancellation assertion: repeated cleanup is a no-op");
  assert.deepEqual(evidence.cancellationState.releasedResources, [...cancellation.states.at(-1).releasedResources].sort(compareUtf16), "RC-03 local cancellation assertion: complete cleanup set");

  const { snapshot, trace, hashEvidence } = evidence.restore;
  assert.equal(snapshot.schemaVersion, "office-simulation-snapshot-v2", "RC-03 local restore assertion: snapshot version");
  assert.equal(trace.schemaVersion, "office-simulation-trace-v2", "RC-03 local restore assertion: trace version");
  assert.ok(snapshot.pendingCommands.length > 0, "RC-03 local restore assertion: pending commands are explicit");
  assert.ok(snapshot.externalInputs.length > 0, "RC-03 local restore assertion: external inputs are explicit");
  assert.equal(snapshot.pendingCommands[0].commandId, retry.commandId, "RC-03 local restore assertion: pending command identity");
  assert.deepEqual(trace.inputs, [snapshot.externalInputs[0].inputId], "RC-03 local restore assertion: trace input identity");
  assert.equal(hashEvidence.status, "placeholder-only", "RC-03 local hash assertion: placeholder status");
  assert.equal(hashEvidence.reducerProduced, false, "RC-03 local hash assertion: no reducer-produced hash claim");
  assert.equal(Object.hasOwn(hashEvidence, "computedStateHash"), false, "RC-03 local hash assertion: no computed hash");

  return evidence;
}
