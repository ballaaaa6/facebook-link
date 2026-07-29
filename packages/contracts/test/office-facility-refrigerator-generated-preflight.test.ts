import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  type OfficeFacilityRefrigeratorGeneratedPreflightManifest,
  validateOfficeFacilityRefrigeratorGeneratedPreflightManifest,
} from "../src/officeFacilityRefrigeratorGeneratedPreflight.ts";

const manifest = JSON.parse(readFileSync(new URL(
  "../../../assets/game/manifests/office-facility-refrigerator-r01.json",
  import.meta.url,
), "utf8")) as OfficeFacilityRefrigeratorGeneratedPreflightManifest;

test("Refrigerator R01 is a fresh front-only 2x2x4 F0-F3 preflight", () => {
  assert.deepEqual(
    validateOfficeFacilityRefrigeratorGeneratedPreflightManifest(manifest),
    [],
  );
  assert.deepEqual(manifest.render.physicalScale, {
    width: 2,
    depth: 2,
    height: 4,
    unit: "tile",
  });
  assert.deepEqual(manifest.render.footprint, {
    width: 2,
    depth: 2,
    unit: "tile",
  });
  assert.deepEqual(manifest.render.requiredOrientations, ["front"]);
  assert.equal(manifest.gates.F3.status, "passed");
  assert.equal(manifest.gates.F4.status, "blocked");
  assert.equal(manifest.gates.F10.status, "blocked");
});

test("Refrigerator R01 door motion is modular and reversible", () => {
  assert.equal(
    manifest.finiteAnimation.compositionFormula,
    "immutableShell + lowerDoor[state]",
  );
  assert.equal(manifest.finiteAnimation.repeatingAmbientLoop, false);
  assert.deepEqual(
    manifest.finiteAnimation.reviewTransition,
    ["closed", "half", "open", "half", "closed"],
  );
  assert.ok(
    manifest.finiteAnimation.transitionChangedPixels.every(
      (pixels) => pixels > 0,
    ),
  );
  assert.deepEqual(
    manifest.finiteAnimation.changedPixelsOutsideDoorSwingRegion,
    [0, 0, 0, 0],
  );
  assert.equal(manifest.finiteAnimation.shellChangedPixels, 0);
  assert.deepEqual(manifest.finiteAnimation.pivotDeltaPixels, [0, 0]);
  assert.equal(manifest.finiteAnimation.closedEndpointMismatchPixels, 0);
});

test("Refrigerator R01 reuses I01 and H01 without a new coordinate system", () => {
  assert.equal(
    manifest.interactionPreview.visualPoseAuthority,
    "interact-front",
  );
  assert.deepEqual(
    manifest.interactionPreview.heldPropAuthority.pool.map(
      ({ assetId }) => assetId,
    ),
    ["held.water-bottle", "held.yogurt-box"],
  );
  assert.equal(
    manifest.interactionPreview.handoff.newCoordinateSystem,
    false,
  );
  assert.deepEqual(
    manifest.interactionPreview.handoff.attachmentDelta,
    [0, 0],
  );
  assert.equal(manifest.interactionPreview.handoff.magicOffset, false);
  assert.equal(
    manifest.interactionPreview.handoff.missingSocketFallback,
    false,
  );
  assert.ok(
    manifest.interactionPreview.selection.examples.every(
      ({ assetId }, index, examples) =>
        index === 0 || assetId !== examples[index - 1]?.assetId,
    ),
  );
});

test("Refrigerator R01 does not claim production cases or a Facility slot", () => {
  assert.equal(manifest.productionTargets.builtPoseCases, 0);
  assert.equal(manifest.productionTargets.builtPropOverlayCases, 0);
  assert.equal(manifest.productionTargets.reservationSlotContribution, 0);
  assert.equal(
    manifest.productionTargets.plannedReservationSlotContributionAfterF8,
    1,
  );
  assert.equal(
    manifest.productionTargets.facilityV1ReadySlotsBeforeRefrigeratorF8,
    17,
  );
  assert.equal(
    manifest.productionTargets.facilityV1ReadySlotsAfterRefrigeratorF8Target,
    18,
  );
});

test("Refrigerator R01 rejects static-door or fabricated-slot drift", () => {
  const invalid = structuredClone(manifest) as unknown as {
    finiteAnimation: Record<string, unknown>;
    productionTargets: Record<string, unknown>;
  };
  invalid.finiteAnimation.repeatingAmbientLoop = true;
  invalid.productionTargets.reservationSlotContribution = 1;
  const issues =
    validateOfficeFacilityRefrigeratorGeneratedPreflightManifest(invalid);
  assert.ok(issues.some((issue) => issue.includes("finite animation")));
  assert.ok(issues.some((issue) => issue.includes("slot authority")));
});
