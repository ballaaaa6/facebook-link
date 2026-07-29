import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  type OfficeFacilityPrinterGeneratedPreflightManifest,
  validateOfficeFacilityPrinterGeneratedPreflightManifest,
} from "../src/officeFacilityPrinterGeneratedPreflight.ts";

const manifest = JSON.parse(readFileSync(new URL(
  "../../../assets/game/manifests/office-facility-printer-p01.json",
  import.meta.url,
), "utf8")) as OfficeFacilityPrinterGeneratedPreflightManifest;

test("Printer P01 is a fresh front-only 2x2x4 F3 preflight", () => {
  assert.deepEqual(
    validateOfficeFacilityPrinterGeneratedPreflightManifest(manifest),
    [],
  );
  assert.deepEqual(manifest.render.physicalScale, {
    width: 2,
    depth: 2,
    height: 4,
    unit: "tile",
  });
  assert.deepEqual(manifest.render.requiredOrientations, ["front"]);
  assert.equal(manifest.gates.F3.status, "pending-owner-review");
  assert.equal(manifest.gates.F4.status, "blocked");
  assert.equal(manifest.permissions.fullSystemBuild, false);
});

test("Printer P01 separates seam-loop and finite output motion", () => {
  assert.deepEqual(
    manifest.animation.processingLoop,
    ["A", "B", "C", "D", "A"],
  );
  assert.deepEqual(manifest.animation.finiteOutputSequence, [
    "idle", "wake", "processing", "tray-half", "tray-open",
    "output-ready", "pickup", "tray-half", "tray-closed", "idle",
  ]);
  assert.equal(manifest.animation.shellMoves, false);
  assert.deepEqual(manifest.animation.pivotDeltaPixels, [0, 0]);
});

test("Printer P01 reuses job-driven two-hand H01 outputs", () => {
  assert.deepEqual(manifest.interaction.jobOutputMap, {
    "print-document": "held.paper-sheet",
    "prepare-mail": "held.envelope",
  });
  assert.equal(
    manifest.interaction.propSocketRule,
    "midpoint-primary-secondary",
  );
  assert.deepEqual(manifest.interaction.attachmentDelta, [0, 0]);
  assert.equal(manifest.interaction.newCoordinateSystem, false);
});

test("Printer P01 does not claim its two planned slots before F8", () => {
  assert.equal(manifest.interaction.reservationSlotContribution, 0);
  assert.equal(
    manifest.interaction.plannedReservationSlotContributionAfterF8,
    2,
  );
  assert.equal(manifest.interaction.facilityV1ReadySlotsBeforePrinterF8, 18);
  assert.equal(
    manifest.interaction.facilityV1ReadySlotsAfterPrinterF8Target,
    20,
  );
  assert.equal(manifest.preflightValidation.productionRosterCasesBuilt, 0);
});

test("Printer P01 rejects premature production or slot activation", () => {
  const invalid = structuredClone(manifest) as unknown as {
    interaction: Record<string, unknown>;
    permissions: Record<string, unknown>;
  };
  invalid.interaction.reservationSlotContribution = 2;
  invalid.permissions.fullSystemBuild = true;
  const issues =
    validateOfficeFacilityPrinterGeneratedPreflightManifest(invalid);
  assert.ok(issues.some((issue) => issue.includes("slot preflight stop")));
  assert.ok(issues.some((issue) => issue.includes("permission stop")));
});
