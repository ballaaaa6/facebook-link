import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const fixtureDirectory = resolve(scriptDirectory, "..", "packages", "office-v2-simulation", "test", "fixtures");

export const rc01FixtureDirectory = fixtureDirectory;

export const frozenInterfaceVersions = Object.freeze({
  queuePolicy: "office-queue-policy-v1",
  facilitySlot: "office-facility-slot-v1",
  queueTicket: "office-queue-ticket-v1",
  reservation: "office-reservation-v1",
  actionQueue: "office-action-queue-v1",
  interaction: "office-interaction-v1",
});

export const cleanupCategories = Object.freeze([
  "taskClaims",
  "facilityUseSlots",
  "approachWaitingCells",
  "reservations",
  "queueTickets",
  "heldProps",
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function compareUtf16(left, right) {
  const length = Math.min(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const difference = left.charCodeAt(index) - right.charCodeAt(index);
    if (difference !== 0) return difference;
  }
  return left.length - right.length;
}

export function readRc01Fixture(fileName) {
  return JSON.parse(readFileSync(resolve(fixtureDirectory, fileName), "utf8"));
}

function identityValue(identity) {
  return identity?.value ?? "";
}

function assertUnique(values) {
  return new Set(values).size === values.length;
}

function queueOrderKey(ticket) {
  return [
    ticket.priorityClass === "durable" ? 0 : 1,
    ticket.enqueueTick,
    identityValue(ticket.ticketId),
  ];
}

function compareQueueTickets(left, right) {
  const leftKey = queueOrderKey(left);
  const rightKey = queueOrderKey(right);
  for (let index = 0; index < 2; index += 1) {
    const difference = leftKey[index] - rightKey[index];
    if (difference !== 0) return difference;
  }
  return compareUtf16(leftKey[2], rightKey[2]);
}

function resourceKey(resource) {
  if (typeof resource === "string") return resource;
  if (resource?.key) return resource.key;
  if (resource?.resourceKey) return resource.resourceKey;
  if (resource?.ticketId?.value) return `queue-ticket:${resource.ticketId.value}`;
  return "";
}

function allResourceKeys(resources) {
  return resources.map(resourceKey);
}

function validateFacilitySlot(fixture) {
  const slot = fixture.facilitySlot;
  const errors = [];
  if (slot?.schemaVersion !== frozenInterfaceVersions.facilitySlot) errors.push("facility-slot-version");
  if (slot?.queuePolicyVersion !== frozenInterfaceVersions.queuePolicy) errors.push("queue-policy-version");
  if (!Number.isSafeInteger(slot?.capacity) || slot.capacity < 1) errors.push("capacity-invalid");
  if (slot?.availability !== "available") errors.push("facility-unavailable");
  if (!Number.isSafeInteger(slot?.targetGeneration) || slot.targetGeneration < 0) errors.push("target-generation-invalid");
  if (!Number.isSafeInteger(slot?.revision) || slot.revision < 1) errors.push("facility-revision-invalid");
  return errors;
}

function validateQueueTickets(tickets) {
  const errors = [];
  const ticketIds = tickets.map((ticket) => identityValue(ticket.ticketId));
  if (!assertUnique(ticketIds)) errors.push("queue-ticket-duplicate");
  for (const ticket of tickets) {
    if (ticket.schemaVersion !== frozenInterfaceVersions.queueTicket) errors.push("queue-ticket-version");
    if (ticket.queuePolicyVersion !== frozenInterfaceVersions.queuePolicy) errors.push("queue-policy-version");
    if (!Array.isArray(ticket.resourceKeys) || ticket.resourceKeys.length === 0) errors.push("queue-resource-set-empty");
    if (!assertUnique(ticket.resourceKeys ?? [])) errors.push("queue-resource-duplicate");
  }
  return errors;
}

export function evaluateFacilityQueueFixture(fixture) {
  const errors = validateFacilitySlot(fixture);
  const approachCells = fixture.geometry?.approachCells ?? [];
  const waitingCells = fixture.geometry?.waitingCells ?? [];
  const queueTickets = fixture.queueTickets ?? [];
  const requestedResourceSets = fixture.requestedResourceSets ?? {};

  if (approachCells.length === 0) errors.push("missing-approach");
  if ((fixture.partialResourceClaim ?? []).length > 0) errors.push("partial-resource-claim");
  if (!assertUnique(approachCells)) errors.push("approach-duplicate");
  if (!assertUnique(waitingCells)) errors.push("waiting-duplicate");
  errors.push(...validateQueueTickets(queueTickets));

  for (const [intentId, resources] of Object.entries(requestedResourceSets)) {
    const keys = allResourceKeys(resources);
    if (keys.length === 0) errors.push(`resource-set-empty:${intentId}`);
    if (!assertUnique(keys)) errors.push(`resource-set-duplicate:${intentId}`);
  }

  const orderedTickets = [...queueTickets].sort(compareQueueTickets).map((ticket) => identityValue(ticket.ticketId));
  const activeUsers = fixture.activeUsers ?? [];
  if (activeUsers.length > (fixture.facilitySlot?.capacity ?? 0)) errors.push("capacity-overflow");

  return {
    accepted: errors.length === 0,
    errors,
    queueOrder: orderedTickets,
    normalizedResourceSets: Object.fromEntries(Object.entries(requestedResourceSets).map(([intentId, resources]) => [
      intentId,
      allResourceKeys(resources).toSorted(compareUtf16),
    ])),
    capacity: fixture.facilitySlot?.capacity ?? null,
    approachCells: [...approachCells],
    waitingCells: [...waitingCells],
  };
}

function resourceOwner(resource) {
  const owner = resource?.actorId ?? resource?.ownerActorId ?? null;
  return typeof owner === "string" ? owner : owner?.value ?? null;
}

function belongsToActor(resource, actorId) {
  return resourceOwner(resource) === actorId;
}

export function cleanupActorResources(state, actorId) {
  const next = clone(state);
  const cleanupGeneration = next.cleanupGeneration ?? 0;
  if (cleanupGeneration > 0) {
    return { state: next, noOp: true, released: [] };
  }

  const released = [];
  for (const category of cleanupCategories) {
    const resources = Array.isArray(next[category]) ? next[category] : [];
    const retained = [];
    for (const resource of resources) {
      if (belongsToActor(resource, actorId)) {
        released.push({ category, key: resourceKey(resource) });
      } else {
        retained.push(resource);
      }
    }
    next[category] = retained;
  }
  next.cleanupGeneration = cleanupGeneration + 1;
  return { state: next, noOp: false, released };
}

function sortedReleasedKeys(released) {
  return released.map(({ key }) => key).sort(compareUtf16);
}

function evaluateExpectedResources(state) {
  return Object.fromEntries(cleanupCategories.map((category) => [category, state[category] ?? []]));
}

export function evaluateOneActorCleanupFixture(fixture) {
  const actorId = fixture.actorId;
  const first = cleanupActorResources(fixture.initial, actorId);
  const second = cleanupActorResources(first.state, actorId);
  const expectedCategories = Object.fromEntries(cleanupCategories.map((category) => [category, []]));
  const actualRemaining = evaluateExpectedResources(first.state);
  const categoriesEmpty = cleanupCategories.every((category) => actualRemaining[category].length === 0);

  return {
    actorId,
    trace: fixture.trace,
    first,
    second,
    categoriesEmpty,
    remaining: actualRemaining,
    expectedCategories,
    releasedKeys: sortedReleasedKeys(first.released),
    cleanupGeneration: first.state.cleanupGeneration,
    repeatedCleanupNoOp: second.noOp && JSON.stringify(second.state) === JSON.stringify(first.state),
  };
}

function hasOnlyCompleteOrNoClaim(occupiedKeys, requestedKeys) {
  return requestedKeys.every((key) => occupiedKeys.includes(key)) || requestedKeys.every((key) => !occupiedKeys.includes(key));
}

export function evaluateContentionCleanupFixture(fixture) {
  const queueTickets = fixture.actors.map((actor) => actor.queueTicket);
  const queueOrder = [...queueTickets].sort(compareQueueTickets).map((ticket) => identityValue(ticket.ticketId));
  const durableActor = fixture.actors.find((actor) => actor.priorityClass === "durable");
  const waitingActor = fixture.actors.find((actor) => actor.actorId === fixture.cancellation.actorId);
  const occupiedKeys = fixture.occupiedResourceKeys ?? [];
  const partialClaim = waitingActor.partialResourceClaim ?? [];
  const atomicWaiting = hasOnlyCompleteOrNoClaim(occupiedKeys, waitingActor.requestedResourceKeys);
  const cleanup = cleanupActorResources(fixture.cancellation.beforeCleanup, waitingActor.actorId);
  const repeated = cleanupActorResources(cleanup.state, waitingActor.actorId);

  return {
    queueOrder,
    winner: durableActor?.actorId ?? null,
    waitingActor: waitingActor?.actorId ?? null,
    partialClaim,
    atomicWaiting,
    cleanup,
    repeated,
    remainingAfterCancellation: evaluateExpectedResources(cleanup.state),
    cancellationNoOpOnRepeat: repeated.noOp && JSON.stringify(repeated.state) === JSON.stringify(cleanup.state),
  };
}

export function runRc01Evidence() {
  const valid = readRc01Fixture("rc-01-facility-queue-valid.json");
  const rejected = readRc01Fixture("rc-01-facility-queue-rejected.json");
  const oneActor = readRc01Fixture("rc-01-one-actor-cleanup.json");
  const contention = readRc01Fixture("rc-01-contention-cleanup.json");
  return {
    evidenceKind: "rc-01-research-closure-fixture",
    claims: { reducerReplay: false, crowd: false, t3: false },
    validFacilityQueue: evaluateFacilityQueueFixture(valid),
    rejectedFacilityQueue: evaluateFacilityQueueFixture(rejected),
    oneActorCleanup: evaluateOneActorCleanupFixture(oneActor),
    contentionCleanup: evaluateContentionCleanupFixture(contention),
  };
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  console.log(JSON.stringify(runRc01Evidence(), null, 2));
}
