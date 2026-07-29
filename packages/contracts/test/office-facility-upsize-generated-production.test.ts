import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  type OfficeFacilityUpsizeBatchProductionManifest,
  type OfficeFacilityUpsizeGeneratedProductionManifest,
  validateOfficeFacilityUpsizeBatchProductionManifest,
  validateOfficeFacilityUpsizeGeneratedProductionManifest,
} from "../src/officeFacilityUpsizeGeneratedProduction.ts";

const root = new URL("../../../", import.meta.url);
const names = [
  "office-facility-coffee-machine-c02-production.json",
  "office-facility-water-dispenser-w02-production.json",
  "office-facility-vending-u02-production.json",
  "office-furniture-chair-massage-r03-production.json",
];
const families = names.map((name) => JSON.parse(readFileSync(new URL(
  `assets/game/manifests/${name}`,
  root,
), "utf8")) as OfficeFacilityUpsizeGeneratedProductionManifest);
const batch = JSON.parse(readFileSync(new URL(
  "assets/game/manifests/office-facility-upsize-2x2x4-production-v1.json",
  root,
), "utf8")) as OfficeFacilityUpsizeBatchProductionManifest;

test("facility upsize production completes F4-F7 and stops at F8", () => {
  for (const family of families) {
    assert.deepEqual(
      validateOfficeFacilityUpsizeGeneratedProductionManifest(family),
      [],
      family.id,
    );
    assert.equal(family.animation.shellMoves, false);
    assert.equal(family.rosterValidation.poseCaseCount, 108);
    assert.equal(family.spatial.orientationCaseCount, 432);
    assert.equal(family.gates.F8.status, "pending-owner-review");
    assert.equal(family.interaction.reservationSlotContribution, 0);
  }
});

test("facility upsize production reuses exact I01/H01 or seat sockets", () => {
  const coffee = families[0]!;
  const water = families[1]!;
  const vending = families[2]!;
  const massage = families[3]!;
  assert.equal(coffee.rosterValidation.primaryGripCaseCount, 54);
  assert.equal(water.rosterValidation.primaryGripCaseCount, 108);
  assert.equal(vending.rosterValidation.primaryGripCaseCount, 162);
  assert.equal(massage.rosterValidation.seatCaseCount, 108);
  assert.equal(massage.interaction.heldPropIds.length, 0);
});

test("facility upsize batch retains 20 slots without double count", () => {
  assert.deepEqual(
    validateOfficeFacilityUpsizeBatchProductionManifest(batch),
    [],
  );
  assert.equal(batch.slotTransferPolicy.facilityV1ReadySlotsCurrent, 20);
  assert.equal(batch.slotTransferPolicy.candidateActiveSlotContribution, 0);
  assert.equal(
    batch.slotTransferPolicy.plannedPredecessorSlotsToTransferAfterAllF8,
    5,
  );
  assert.equal(
    batch.slotTransferPolicy.facilityV1ReadySlotsAfterTransferTarget,
    20,
  );
});

test("facility upsize production rejects early slot activation", () => {
  const invalid = structuredClone(families[0]) as unknown as {
    interaction: Record<string, unknown>;
    permissions: Record<string, unknown>;
  };
  invalid.interaction.reservationSlotContribution = 1;
  invalid.permissions.reservationSlotActivation = true;
  const issues =
    validateOfficeFacilityUpsizeGeneratedProductionManifest(invalid);
  assert.ok(issues.some((issue) => issue.includes("slot stop")));
  assert.ok(issues.some((issue) => issue.includes("permission")));
});

test("facility upsize production rejects shell drift and skipped F8", () => {
  const invalid = structuredClone(families[1]) as unknown as {
    animation: Record<string, unknown>;
    gates: Record<string, Record<string, unknown>>;
  };
  invalid.animation.basePivotDeltaPixels = [2, 0];
  invalid.gates.F8!.status = "passed";
  const issues =
    validateOfficeFacilityUpsizeGeneratedProductionManifest(invalid);
  assert.ok(issues.some((issue) => issue.includes("animation")));
  assert.ok(issues.some((issue) => issue.includes("F8")));
});
