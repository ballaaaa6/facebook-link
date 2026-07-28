import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  validateOfficeFurnitureFamilyManifest,
  type OfficeFurnitureFamilyManifest,
} from "../src/officeFurnitureProduction.ts";

const rejectedManifest = JSON.parse(readFileSync(new URL(
  "../../../assets/game/manifests/office-furniture-chair-massage-r01.json",
  import.meta.url,
), "utf8")) as OfficeFurnitureFamilyManifest;
const manifest = JSON.parse(readFileSync(new URL(
  "../../../assets/game/manifests/office-furniture-chair-massage-r02.json",
  import.meta.url,
), "utf8")) as OfficeFurnitureFamilyManifest;

test("rejected massage chair r01 remains valid audit history", () => {
  assert.deepEqual(validateOfficeFurnitureFamilyManifest(rejectedManifest), []);
  assert.equal(rejectedManifest.familyId, "chair.massage.modern");
  assert.equal(rejectedManifest.status, "rejected");
  assert.equal(rejectedManifest.gates.F8.status, "blocked");
  assert.equal(rejectedManifest.ownerDecision?.decision, "rejected");
  assert.equal(rejectedManifest.gates.F9.status, "blocked");
  assert.equal(rejectedManifest.gates.F10.status, "blocked");
});

test("massage chair r02 separates behavior from its approved visual pose", () => {
  assert.deepEqual(validateOfficeFurnitureFamilyManifest(manifest), []);
  assert.equal(manifest.status, "owner-review-f8-pending");
  assert.equal(manifest.gates.F8.status, "pending-owner-review");
  assert.equal(manifest.interaction.slots[0]?.action, "use-massage-chair");
  assert.equal(manifest.interaction.slots[0]?.visualPose, "working-front-seated");
  assert.equal(manifest.rosterValidation.visualPose, "working-front-seated");
  assert.equal(manifest.rosterValidation.poseAuthority.status, "owner-approved");
});

test("current furniture candidates reject conflated action and visual pose", () => {
  const invalid = structuredClone(manifest);
  invalid.interaction.slots[0]!.action = "working-front-seated";
  const issues = validateOfficeFurnitureFamilyManifest(invalid).join("\n");
  assert.match(issues, /separate semantic action from visual pose/);
});

test("furniture production rejects non-uniform scaling and processed crop reuse", () => {
  const invalid = structuredClone(manifest);
  (invalid.render as { nonUniformScaling: boolean }).nonUniformScaling = true;
  (invalid.sourcePolicy as { processedCropDirectReuse: boolean }).processedCropDirectReuse = true;
  invalid.source.path = "assets/game/processed/office-library-modern-bright-v1/chair.png";
  const issues = validateOfficeFurnitureFamilyManifest(invalid).join("\n");
  assert.match(issues, /nonUniformScaling/);
  assert.match(issues, /processedCropDirectReuse/);
  assert.match(issues, /original layout-reference master/);
});

test("furniture production keeps room and Active Office integration blocked", () => {
  const invalid = structuredClone(manifest);
  (invalid as { activeOfficePromotion: boolean }).activeOfficePromotion = true;
  invalid.gates.F9.status = "passed";
  invalid.gates.F10.status = "passed";
  const issues = validateOfficeFurnitureFamilyManifest(invalid).join("\n");
  assert.match(issues, /activeOfficePromotion/);
  assert.match(issues, /gates\.F9/);
  assert.match(issues, /gates\.F10/);
});
