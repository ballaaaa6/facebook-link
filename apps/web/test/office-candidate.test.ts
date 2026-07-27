import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  validateOfficeCandidateManifest,
  type OfficeCandidateManifestV1,
} from "@affiliate-ops/contracts";

const repoRoot = new URL("../../../", import.meta.url);

function read(relative: string) {
  return readFileSync(new URL(relative, repoRoot));
}

function source(relative: string) {
  return read(relative).toString("utf8");
}

function sha256(relative: string) {
  return createHash("sha256").update(read(relative)).digest("hex");
}

const manifest = JSON.parse(source(
  "assets/game/manifests/office-candidate-v1.json",
)) as OfficeCandidateManifestV1;
const review = JSON.parse(source(
  "assets/game/manifests/office-candidate-review-r01.json",
)) as {
  status: string;
  ownerApproval: boolean;
  results: Record<string, number | boolean>;
  captures: Array<{ file: string; sha256: string }>;
};

test("Candidate v1 locks all selected staging sources by hash", () => {
  assert.deepEqual(validateOfficeCandidateManifest(manifest), []);
  for (const reference of Object.values(manifest.sources)) {
    assert.equal(sha256(reference.file), reference.sha256, reference.file);
  }
});

test("Candidate Steps 21-23 preserve the Active Office baseline", () => {
  for (const reference of manifest.activeOfficeBaseline) {
    assert.equal(sha256(reference.file), reference.sha256, reference.file);
  }
  assert.equal(manifest.activeOfficePromotion, false);
  assert.equal(manifest.review.ownerApproval, false);
});

test("Candidate lab is development-only and renders real staged characters", () => {
  const main = source("apps/web/src/main.tsx");
  const page = source("apps/web/src/features/office/lab/OfficeCandidateLabPage.tsx");
  const scene = source("apps/web/src/features/office/lab/CandidateWorkstationScene.tsx");
  const composite = source("apps/web/src/features/office/workstation/GeometryWorkstationComposite.tsx");
  assert.match(main, /import\.meta\.env\.DEV/);
  assert.match(main, /office-candidate-v1/);
  assert.match(page, /promotion disabled/);
  assert.match(scene, /AnimatedAgent/);
  assert.match(composite, /actor \?\? <NeutralCalibrationActor/);
});

test("Candidate review exposes all frozen prototype identities", () => {
  const roster = source("apps/web/src/features/office/lab/modernOfficeLabCharacters.ts");
  for (const id of [...manifest.roster.activeAgentIds, ...manifest.roster.alternateCharacterIds]) {
    assert.ok(roster.includes(id), id);
  }
  assert.equal(manifest.roster.activeAgentIds.length + manifest.roster.alternateCharacterIds.length, 18);
  assert.deepEqual(manifest.roster.companionIds, ["boba"]);
});

test("Candidate r01 preserves every browser capture by hash", () => {
  assert.equal(review.status, "awaiting-owner-review");
  assert.equal(review.ownerApproval, false);
  assert.equal(review.captures.length, manifest.review.savedImageCount);
  assert.equal(review.results.activeOfficeBaselineHashMatch, true);
  assert.ok(Number(review.results.stabilitySeconds) >= 60);
  for (const capture of review.captures) {
    assert.equal(sha256(capture.file), capture.sha256, capture.file);
  }
});
