import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  validateOfficeCandidateManifest,
  type OfficeCandidateManifestV1,
} from "../src/officeCandidate.ts";

const manifest = JSON.parse(readFileSync(new URL(
  "../../../assets/game/manifests/office-candidate-v1.json",
  import.meta.url,
), "utf8")) as OfficeCandidateManifestV1;

test("Office Candidate v1 remains review-only and contract-valid", () => {
  assert.deepEqual(validateOfficeCandidateManifest(manifest), []);
  assert.equal(manifest.activeOfficePromotion, false);
  assert.equal(manifest.commercialCharacterApproval, false);
  assert.equal(manifest.review.ownerApproval, false);
});

test("Office Candidate v1 retains the frozen prototype roster", () => {
  assert.equal(manifest.roster.activeAgentIds.length, 10);
  assert.equal(manifest.roster.alternateCharacterIds.length, 8);
  assert.deepEqual(manifest.roster.companionIds, ["boba"]);
  assert.equal(manifest.selectedCompositeIds.length, 13);
});
