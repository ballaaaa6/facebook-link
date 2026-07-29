import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  type OfficeFacilityPrinterProductionManifest,
  validateOfficeFacilityPrinterProductionManifest,
} from "../src/officeFacilityPrinterProduction.ts";

const manifest = JSON.parse(readFileSync(new URL(
  "../../../assets/game/manifests/"
    + "office-facility-printer-p01-production.json",
  import.meta.url,
), "utf8")) as OfficeFacilityPrinterProductionManifest;

test("Printer P01 production stops at F8 with zero active slots", () => {
  assert.deepEqual(
    validateOfficeFacilityPrinterProductionManifest(manifest),
    [],
  );
  assert.equal(manifest.gates.F7.status, "passed");
  assert.equal(manifest.gates.F8.status, "pending-owner-review");
  assert.equal(manifest.gates.F9.status, "blocked");
  assert.equal(manifest.interaction.reservationSlotContribution, 0);
  assert.equal(manifest.interaction.facilityV1ReadySlotsCurrent, 18);
  assert.equal(manifest.permissions.reservationSlotActivation, false);
});

test("Printer P01 isolates seam-loop processing from finite tray motion", () => {
  assert.deepEqual(
    manifest.animation.processingLoop,
    ["A", "B", "C", "D", "A"],
  );
  assert.deepEqual(
    manifest.animation.processingChangedPixelsOutsideLocalRegions,
    [0, 0, 0, 0],
  );
  assert.deepEqual(
    manifest.animation.finiteTrayPath,
    ["closed", "half", "open", "half", "closed"],
  );
  assert.deepEqual(
    manifest.animation.trayChangedPixelsOutsideTrayRegion,
    [0, 0, 0, 0],
  );
  assert.equal(manifest.animation.shellChangedPixels, 0);
});

test("Printer P01 proves 108 base poses and 108 exact prop grips", () => {
  assert.equal(manifest.rosterValidation.poseCases.length, 108);
  assert.equal(manifest.propOverlayValidation.cases.length, 108);
  assert.ok(
    manifest.propOverlayValidation.cases.every(
      (entry) =>
        entry.actorPrimaryGripSocket[0] === entry.resolvedPropPrimaryGrip[0]
        && entry.actorPrimaryGripSocket[1] === entry.resolvedPropPrimaryGrip[1]
        && entry.primaryGripDelta[0] === 0
        && entry.primaryGripDelta[1] === 0
        && entry.fullPropAlphaVisible
        && entry.actorAlphaContactDistance <= 3
        && entry.propAlphaContactDistance === 0,
    ),
  );
  assert.equal(manifest.propOverlayValidation.midpointPlacementUses, 0);
  assert.equal(manifest.propOverlayValidation.magicOffsetCases, 0);
  assert.equal(manifest.propOverlayValidation.fallbackSocketCases, 0);
});

test("Printer P01 proves two independent capacity-one reservations", () => {
  assert.deepEqual(
    manifest.reservationValidation.instanceIds,
    ["printer-01", "printer-02"],
  );
  assert.equal(
    manifest.reservationValidation.maximumConcurrentReservations,
    2,
  );
  assert.equal(
    manifest.reservationValidation.maximumPerInstanceReservations,
    1,
  );
  assert.equal(manifest.reservationValidation.actorCount, 3);
  assert.equal(manifest.reservationValidation.samples.length, 31);
  assert.equal(manifest.reservationValidation.blockedAttemptCount, 1);
  assert.equal(manifest.reservationValidation.failureCount, 1);
  assert.equal(manifest.reservationValidation.retrySuccessCount, 1);
  assert.equal(manifest.reservationValidation.orphanPropCountAtEnd, 0);
});

test("Printer P01 rejects primary-grip drift and premature F8 activation", () => {
  const invalid = structuredClone(manifest) as unknown as {
    propOverlayValidation: {
      cases: Array<Record<string, unknown>>;
    };
    interaction: Record<string, unknown>;
    permissions: Record<string, unknown>;
  };
  invalid.propOverlayValidation.cases[0]!.primaryGripDelta = [1, 0];
  invalid.interaction.reservationSlotContribution = 2;
  invalid.permissions.reservationSlotActivation = true;
  const issues = validateOfficeFacilityPrinterProductionManifest(invalid);
  assert.ok(issues.some((issue) => issue.includes("primary-grip")));
  assert.ok(issues.some((issue) => issue.includes("slot stop")));
  assert.ok(issues.some((issue) => issue.includes("permission stop")));
});
