import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  validateOfficeFurnitureFamilyManifest,
  type OfficeFurnitureFamilyManifest,
} from "../src/officeFurnitureProduction.ts";

const manifest = JSON.parse(readFileSync(new URL(
  "../../../assets/game/manifests/office-furniture-chair-massage-r01.json",
  import.meta.url,
), "utf8")) as OfficeFurnitureFamilyManifest;

test("massage chair r01 passes the furniture family production contract", () => {
  assert.deepEqual(validateOfficeFurnitureFamilyManifest(manifest), []);
  assert.equal(manifest.familyId, "chair.massage.modern");
  assert.equal(manifest.status, "owner-review-f8-pending");
  assert.equal(manifest.gates.F8.status, "pending-owner-review");
  assert.equal(manifest.gates.F9.status, "blocked");
  assert.equal(manifest.gates.F10.status, "blocked");
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
