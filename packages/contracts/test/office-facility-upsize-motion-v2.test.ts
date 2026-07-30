import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  validateOfficeFacilityUpsizeMotionV2Manifest,
} from "../src/officeFacilityUpsizeMotionV2.ts";

const manifestPath =
  "../../assets/game/manifests/office-facility-upsize-motion-v2.json";
const load = () => JSON.parse(readFileSync(manifestPath, "utf8"));

test("motion V2 uses authored ImageGen parts and stops for visual review", () => {
  const manifest = load();
  assert.deepEqual(
    validateOfficeFacilityUpsizeMotionV2Manifest(manifest),
    [],
  );
  assert.deepEqual(
    manifest.families.map((family: any) => family.atlas.componentCount),
    [12, 12, 16, 12],
  );
  assert.equal(manifest.sourcePolicy.proceduralRuntimeEffectPixels, false);
  assert.equal(manifest.gates.V2_VISUAL_REVIEW.status, "pending-owner-review");
});

test("motion V2 rejects procedural effect pixels and early slot transfer", () => {
  const manifest = load();
  manifest.sourcePolicy.proceduralRuntimeEffectPixels = true;
  manifest.permissions.reservationSlotTransfer = true;
  manifest.roomIsolation.reservationSlotsActivated = 5;
  const issues = validateOfficeFacilityUpsizeMotionV2Manifest(manifest);
  assert.ok(issues.some((issue) => issue.includes("source policy")));
  assert.ok(issues.some((issue) => issue.includes("isolation")));
});

test("motion V2 rejects escaped effects and skipped owner review", () => {
  const manifest = load();
  manifest.families[0].seamLoop.outsideDeclaredChangedPixels[1] = 1;
  manifest.gates.V2_VISUAL_REVIEW.status = "passed";
  const issues = validateOfficeFacilityUpsizeMotionV2Manifest(manifest);
  assert.ok(issues.some((issue) => issue.includes("seam-loop")));
  assert.ok(issues.some((issue) => issue.includes("gate stop")));
});
