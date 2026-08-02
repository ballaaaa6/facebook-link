import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateInvalidState,
  evaluateMidActionRestore,
  evaluatePresentationDisabled,
  evaluateRc02Fixtures,
  loadFixture,
} from "./office-v2-rc-02-evidence.mjs";

test("RC-02 keeps interaction state explicit when presentation is disabled", () => {
  const evaluation = evaluatePresentationDisabled(loadFixture("rc-02-interaction-disabled.json"));
  assert.equal(evaluation.ok, true, JSON.stringify(evaluation, null, 2));
  assert.equal(evaluation.checks.hasNoPresentationFacts, true);
  assert.equal(evaluation.checks.hasInteractionProgress, true);
  assert.equal(evaluation.checks.placeholderIsNonEvidence, true);
});

test("RC-02 carries explicit mid-action restore facts and compares continuation descriptions", () => {
  const evaluation = evaluateMidActionRestore(loadFixture("rc-02-mid-action-restore.json"));
  assert.equal(evaluation.ok, true, JSON.stringify(evaluation, null, 2));
  assert.equal(evaluation.checks.explicitRestore, true);
  assert.equal(evaluation.checks.continuationEqual, true);
  assert.deepEqual(evaluation.continuation.normalizedLeft, evaluation.continuation.normalizedRight);
  assert.equal(evaluation.checks.placeholderIsNonEvidence, true);
});

test("RC-02 rejects incomplete in-progress state without reconstructing it", () => {
  const evaluation = evaluateInvalidState(loadFixture("rc-02-invalid-state.json"));
  assert.equal(evaluation.ok, true, JSON.stringify(evaluation, null, 2));
  assert.equal(evaluation.rejected, true);
  assert.equal(evaluation.assertionLabel, "rc-02.invalid-state");
  assert.equal(evaluation.checks.placeholderIsNonEvidence, true);
});

test("RC-02 exercises all fixtures and keeps reducer/replay evidence unclaimed", () => {
  const report = evaluateRc02Fixtures();
  assert.equal(report.ok, true, JSON.stringify(report, null, 2));
  assert.equal(report.disabled.checks.placeholderIsNonEvidence, true);
  assert.equal(report.restore.checks.placeholderIsNonEvidence, true);
  assert.equal(report.invalid.checks.placeholderIsNonEvidence, true);
});
