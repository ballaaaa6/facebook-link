import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  validateOfficeFacilityUpsizeShellV3,
  type OfficeFacilityUpsizeShellV3Manifest,
} from "../src/officeFacilityUpsizeShellV3.ts";

const manifest = JSON.parse(
  readFileSync(
    new URL(
      "../../../assets/game/manifests/office-facility-upsize-shell-v3.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as OfficeFacilityUpsizeShellV3Manifest;

test("Shell V3 keeps Motion V2 effects and replaces all four shells", () => {
  assert.deepEqual(validateOfficeFacilityUpsizeShellV3(manifest), []);
  assert.equal(manifest.families.length, 4);
  assert.equal(
    manifest.families.reduce(
      (total, family) => total + family.effectAuthority.parts.length,
      0,
    ),
    52,
  );
});

test("Shell V3 owns four sides and a shell-stable seam loop per family", () => {
  for (const family of manifest.families) {
    assert.deepEqual(
      family.shellSource.views.map((view) => view.view),
      ["front", "left", "right", "back"],
    );
    assert.deepEqual(family.seamLoop.outsideDeclaredChangedPixels, [0, 0, 0, 0]);
    assert.deepEqual(family.seamLoop.pivotDeltaPixels, [0, 0]);
    assert.equal(family.finiteUse.idleReturnExact, true);
  }
});

test("Shell V3 remains visual-review-only and cannot enter F9", () => {
  assert.equal(manifest.permissions.visualReview, true);
  assert.equal(manifest.permissions.fullProductionRebuild, false);
  assert.equal(manifest.permissions.reservationSlotTransfer, false);
  assert.equal(manifest.permissions.f9Composition, false);
  assert.equal(manifest.permissions.activeOfficePromotion, false);
  assert.equal(manifest.ownerDecision, null);
});
