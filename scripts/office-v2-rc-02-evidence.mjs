import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
export const repositoryRoot = resolve(scriptDirectory, "..");
export const fixtureRoot = join(repositoryRoot, "packages", "office-v2-simulation", "test", "fixtures");

const requiredVersions = {
  interaction: "office-interaction-v1",
  snapshot: "office-simulation-snapshot-v2",
  trace: "office-simulation-trace-v2",
};

export function loadFixture(fileName) {
  return JSON.parse(readFileSync(join(fixtureRoot, fileName), "utf8"));
}

function hasKeys(value, keys) {
  return Boolean(value && typeof value === "object" && keys.every((key) => Object.hasOwn(value, key)));
}

function versionedFixture(fixture) {
  return Object.entries(requiredVersions).every(([key, version]) => fixture.contractVersions?.[key] === version);
}

function placeholderIsNonEvidence(fixture) {
  return fixture.placeholderHash?.isReducerReplayEvidence === false &&
    typeof fixture.placeholderHash?.value === "string" &&
    fixture.placeholderHash.value.length === 64;
}

function utf16Compare(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function normalizeDescription(value, unorderedArrayKeys = new Set(), currentKey = undefined) {
  if (Array.isArray(value)) {
    const normalized = value.map((entry) => normalizeDescription(entry, unorderedArrayKeys));
    if (unorderedArrayKeys.has(currentKey)) {
      return normalized.slice().sort((left, right) => utf16Compare(JSON.stringify(left), JSON.stringify(right)));
    }
    return normalized;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => utf16Compare(left, right))
        .map(([key, entry]) => [key, normalizeDescription(entry, unorderedArrayKeys, key)]),
    );
  }
  return value;
}

export function compareDescriptions(left, right, unorderedArrayKeys = []) {
  const unordered = new Set(unorderedArrayKeys);
  const normalizedLeft = normalizeDescription(left, unordered);
  const normalizedRight = normalizeDescription(right, unordered);
  const leftText = JSON.stringify(normalizedLeft);
  const rightText = JSON.stringify(normalizedRight);
  return { equal: leftText === rightText, normalizedLeft, normalizedRight };
}

export function evaluatePresentationDisabled(fixture) {
  const durableActor = fixture.durableStateDescription?.actor;
  const requiredFields = fixture.expected?.durableStateFields ?? [];
  const hasDurableFields = hasKeys(durableActor, requiredFields);
  const hasNoPresentationFacts = !["rendererState", "animationFrame", "screenPosition", "acknowledgement"]
    .some((key) => Object.hasOwn(fixture.durableStateDescription ?? {}, key));
  const hasInteractionProgress = fixture.interaction?.phase === "interacting" &&
    Number.isSafeInteger(fixture.interaction.progressTicks) &&
    fixture.interaction.progressTicks > 0;
  const hasCorrelation = hasKeys(fixture.interaction?.correlation, ["workflowRunId", "taskId", "sourceEventId"]);
  return {
    case: fixture.case,
    ok: versionedFixture(fixture) && fixture.presentation?.enabled === false &&
      fixture.presentation?.derivedView === null && fixture.presentation?.acknowledgement === null &&
      fixture.expected?.presentationMayCommitSimulation === false &&
      fixture.expected?.interactionRemainsDescribedWhenPresentationDisabled === true &&
      hasDurableFields && hasNoPresentationFacts && hasInteractionProgress && hasCorrelation &&
      placeholderIsNonEvidence(fixture),
    checks: { versionedFixture: versionedFixture(fixture), hasDurableFields, hasNoPresentationFacts, hasInteractionProgress, hasCorrelation, placeholderIsNonEvidence: placeholderIsNonEvidence(fixture) },
  };
}

export function evaluateMidActionRestore(fixture) {
  const restorePoint = fixture.restorePoint;
  const action = restorePoint?.action;
  const requiredRestoreFields = ["snapshotBoundary", "tickRateHz", "tick", "worldRevision", "actor", "action", "queueTicket", "pendingCommands", "eventSequence", "cleanupGeneration", "randomStreams"];
  const requiredActionFields = ["actionId", "phase", "progressTicks", "durationTicks", "resourceKeys", "reservations", "correlation", "targetGeneration", "heldProp"];
  const requiredCorrelationFields = ["workflowRunId", "taskId", "sourceEventId"];
  const continuation = compareDescriptions(
    fixture.uninterruptedContinuation,
    fixture.restoredContinuation,
    fixture.comparison?.unorderedArrayKeys ?? [],
  );
  const explicitRestore = hasKeys(restorePoint, requiredRestoreFields) &&
    hasKeys(action, requiredActionFields) &&
    action.resourceKeys.length > 0 &&
    hasKeys(action.correlation, requiredCorrelationFields) &&
    restorePoint.snapshotBoundary === "completed-tick" &&
    restorePoint.tickRateHz === 10;
  return {
    case: fixture.case,
    ok: versionedFixture(fixture) && explicitRestore && continuation.equal && placeholderIsNonEvidence(fixture),
    checks: { versionedFixture: versionedFixture(fixture), explicitRestore, continuationEqual: continuation.equal, placeholderIsNonEvidence: placeholderIsNonEvidence(fixture) },
    continuation,
  };
}

export function evaluateInvalidState(fixture) {
  const invalidState = fixture.invalidState;
  const action = invalidState?.action;
  const missingResources = Array.isArray(action?.resourceKeys) && action.resourceKeys.length === 0;
  const missingCorrelation = action?.correlation === null || action?.correlation === undefined;
  const rejected = invalidState?.actor?.state === "interacting" && action?.phase === "using" && missingResources && missingCorrelation;
  return {
    case: fixture.case,
    ok: versionedFixture(fixture) && rejected &&
      fixture.expectedRejection?.assertionLabel === "rc-02.invalid-state" &&
      fixture.reconstructionForbidden?.includes("actor.position") &&
      fixture.reconstructionForbidden?.includes("invalidState.presentation") &&
      placeholderIsNonEvidence(fixture),
    rejected,
    assertionLabel: fixture.expectedRejection?.assertionLabel,
    checks: { versionedFixture: versionedFixture(fixture), missingResources, missingCorrelation, rejected, placeholderIsNonEvidence: placeholderIsNonEvidence(fixture) },
  };
}

export function evaluateRc02Fixtures() {
  const disabled = evaluatePresentationDisabled(loadFixture("rc-02-interaction-disabled.json"));
  const restore = evaluateMidActionRestore(loadFixture("rc-02-mid-action-restore.json"));
  const invalid = evaluateInvalidState(loadFixture("rc-02-invalid-state.json"));
  return { ok: disabled.ok && restore.ok && invalid.ok, disabled, restore, invalid };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(evaluateRc02Fixtures(), null, 2));
}
