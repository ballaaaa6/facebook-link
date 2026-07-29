import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  type OfficeFacilityUpsizeBatchPreflightManifest,
  type OfficeFacilityUpsizeGeneratedPreflightManifest,
  validateOfficeFacilityUpsizeBatchPreflightManifest,
  validateOfficeFacilityUpsizeGeneratedPreflightManifest,
} from "../src/officeFacilityUpsizeGeneratedPreflight.ts";

const root = new URL("../../../", import.meta.url);
const familyPaths = [
  "office-facility-coffee-machine-c02.json",
  "office-facility-water-dispenser-w02.json",
  "office-facility-vending-u02.json",
  "office-furniture-chair-massage-r03.json",
];
const families = familyPaths.map((name) => JSON.parse(readFileSync(new URL(
  `assets/game/manifests/${name}`,
  root,
), "utf8")) as OfficeFacilityUpsizeGeneratedPreflightManifest);
const batch = JSON.parse(readFileSync(new URL(
  "assets/game/manifests/office-facility-upsize-2x2x4-preflight-v1.json",
  root,
), "utf8")) as OfficeFacilityUpsizeBatchPreflightManifest;

test("facility upsize families are fresh four-side 2x2x4 F3 preflights", () => {
  for (const family of families) {
    assert.deepEqual(
      validateOfficeFacilityUpsizeGeneratedPreflightManifest(family),
      [],
      family.id,
    );
    assert.equal(family.views.length, 4);
    assert.equal(family.interactionPreflight.reservationSlotContribution, 0);
    assert.equal(family.modularMotionPlan.seamLoopFramesBuilt, 0);
    assert.equal(family.gates.F3.status, "pending-owner-review");
  }
  assert.equal(
    families.reduce(
      (sum, family) =>
        sum + family.interactionPreflight.plannedReservationSlotsAfterF8,
      0,
    ),
    5,
  );
});

test("facility upsize batch retains Counter and does not mutate F9", () => {
  assert.deepEqual(
    validateOfficeFacilityUpsizeBatchPreflightManifest(batch),
    [],
  );
  assert.equal(batch.counterPolicy.deleteAsset, false);
  assert.equal(batch.f9Policy.currentF9Changed, false);
  assert.equal(batch.f9Policy.workstationAnchorToPreserve, "C12");
  assert.equal(batch.f9Policy.workstationCountToPreserve, 10);
  assert.equal(batch.f9Policy.routeQueriesToRebuild, 200);
});

test("facility upsize family rejects production or reservation claims", () => {
  const invalid = structuredClone(families[0]) as unknown as {
    interactionPreflight: Record<string, unknown>;
    permissions: Record<string, unknown>;
  };
  invalid.interactionPreflight.reservationSlotContribution = 1;
  invalid.permissions.productionBuild = true;
  const issues =
    validateOfficeFacilityUpsizeGeneratedPreflightManifest(invalid);
  assert.ok(issues.some((issue) => issue.includes("reservation")));
  assert.ok(issues.some((issue) => issue.includes("permission")));
});

test("facility upsize batch rejects Counter deletion or early F9 replacement", () => {
  const invalid = structuredClone(batch) as unknown as {
    counterPolicy: Record<string, unknown>;
    f9Policy: Record<string, unknown>;
  };
  invalid.counterPolicy.deleteAsset = true;
  invalid.f9Policy.currentF9Changed = true;
  const issues = validateOfficeFacilityUpsizeBatchPreflightManifest(invalid);
  assert.ok(issues.some((issue) => issue.includes("Counter")));
  assert.ok(issues.some((issue) => issue.includes("F9")));
});
