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

test("Printer P01 is the approved fresh front-only 2x2x4 F3 preflight", () => {
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
  assert.equal(manifest.gates.F3.status, "passed");
  assert.equal(manifest.gates.F4.status, "blocked");
  assert.equal(manifest.permissions.fullSystemBuild, true);
  assert.equal(manifest.ownerDecision.decision, "approved");
  assert.equal(manifest.ownerDecision.approvedReviewHashes.length, 12);
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

test("Printer P01 pins each job output to the existing primary hand grip", () => {
  assert.deepEqual(manifest.interaction.jobOutputMap, {
    "print-document": "held.paper-sheet",
    "prepare-mail": "held.envelope",
  });
  assert.equal(
    manifest.interaction.propSocketRule,
    "primary-grip-to-primary-grip",
  );
  assert.deepEqual(manifest.interaction.attachmentDelta, [0, 0]);
  assert.equal(manifest.interaction.newCoordinateSystem, false);
  assert.equal(manifest.preflightValidation.primaryGripCaseCount, 6);
  assert.equal(manifest.preflightValidation.midpointPlacementUses, 0);
  assert.ok(
    manifest.preflightValidation.primaryGripCases.every(
      ({ actorPrimaryGripSocket, resolvedPropPrimaryGrip, primaryGripDelta }) =>
        actorPrimaryGripSocket[0] === resolvedPropPrimaryGrip[0]
        && actorPrimaryGripSocket[1] === resolvedPropPrimaryGrip[1]
        && primaryGripDelta[0] === 0
        && primaryGripDelta[1] === 0,
    ),
  );
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

test("Printer P01 rejects reservation activation before production F8", () => {
  const invalid = structuredClone(manifest) as unknown as {
    interaction: Record<string, unknown>;
    permissions: Record<string, unknown>;
  };
  invalid.interaction.reservationSlotContribution = 2;
  invalid.permissions.reservationSlotActivation = true;
  const issues =
    validateOfficeFacilityPrinterGeneratedPreflightManifest(invalid);
  assert.ok(issues.some((issue) => issue.includes("slot preflight stop")));
  assert.ok(issues.some((issue) => issue.includes("permission stop")));
});

test("Printer P01 rejects midpoint-only placement or visible grip drift", () => {
  const invalid = structuredClone(manifest) as unknown as {
    interaction: Record<string, unknown>;
    preflightValidation: {
      primaryGripCases: Array<Record<string, unknown>>;
    };
  };
  invalid.interaction.propSocketRule = "midpoint-primary-secondary";
  invalid.preflightValidation.primaryGripCases[0]!.primaryGripDelta = [7, 0];
  const issues =
    validateOfficeFacilityPrinterGeneratedPreflightManifest(invalid);
  assert.ok(issues.some((issue) => issue.includes("interaction")));
  assert.ok(issues.some((issue) => issue.includes("production validation")));
});
