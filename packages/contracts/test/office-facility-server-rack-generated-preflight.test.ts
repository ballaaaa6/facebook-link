import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  type OfficeFacilityServerRackGeneratedPreflightManifest,
  validateOfficeFacilityServerRackGeneratedPreflightManifest,
} from "../src/officeFacilityServerRackGeneratedPreflight.ts";

const manifest = JSON.parse(readFileSync(new URL(
  "../../../assets/game/manifests/office-facility-server-rack-n02.json",
  import.meta.url,
), "utf8")) as OfficeFacilityServerRackGeneratedPreflightManifest;

test("Server Rack N02 is a fresh four-side F0-F3 preflight", () => {
  assert.deepEqual(
    validateOfficeFacilityServerRackGeneratedPreflightManifest(manifest),
    [],
  );
  assert.equal(manifest.status, "visual-preflight-owner-approved");
  assert.deepEqual(manifest.render.physicalScale, {
    width: 2,
    depth: 2,
    height: 4,
    unit: "tile",
  });
  assert.deepEqual(
    manifest.render.requiredOrientations,
    ["front", "left", "right", "back"],
  );
  assert.equal(manifest.render.orientations.length, 4);
  assert.equal(manifest.gates.F3.status, "passed");
  assert.equal(manifest.gates.F4.status, "blocked");
  assert.equal(manifest.gates.F10.status, "blocked");
  assert.equal(manifest.visualApproval.status, "owner-approved");
  assert.equal(manifest.visualApproval.approvedReviewHashes.length, 11);
});

test("Server Rack N02 reuses no N01, master, processed, or Active pixels", () => {
  assert.equal(manifest.sourcePolicy.freshImageGeneration, true);
  assert.equal(manifest.sourcePolicy.serverRackN01PixelReuse, false);
  assert.equal(manifest.sourcePolicy.originalMasterPixelReuse, false);
  assert.equal(manifest.sourcePolicy.processedCropDirectReuse, false);
  assert.equal(manifest.sourcePolicy.activeOfficePixelReuse, false);
  assert.deepEqual(
    manifest.generation.sources.map(({ role }) => role),
    ["front-anchor", "turnaround", "status-kit"],
  );
  assert.deepEqual(
    manifest.generation.sources.map(({ inputImageCount }) => inputImageCount),
    [0, 1, 1],
  );
});

test("Server Rack N02 status motion is modular and closes A-D-A", () => {
  assert.equal(
    manifest.statusLoop.compositionFormula,
    "immutableShell[orientation] + statusViewport[n]",
  );
  assert.deepEqual(manifest.statusLoop.transition, ["a", "b", "c", "d", "a"]);
  assert.ok(
    manifest.statusLoop.transitionChangedPixels.every((pixels) => pixels > 0),
  );
  assert.equal(manifest.statusLoop.shellChangedPixels, 0);
  assert.equal(manifest.statusLoop.outsideViewportChangedPixels, 0);
  assert.deepEqual(manifest.statusLoop.pivotDeltaPixels, [0, 0]);
  assert.equal(manifest.statusLoop.closureMismatchPixels, 0);
});

test("Server Rack N02 interaction is empty-hand with no H01 dependency", () => {
  assert.equal(manifest.interactionPreview.semanticAction, "inspect-front");
  assert.equal(
    manifest.interactionPreview.visualPoseAuthority,
    "interact-front",
  );
  assert.equal(manifest.interactionPreview.heldProp, false);
  assert.equal(manifest.interactionPreview.h01Dependency, false);
  assert.equal(manifest.interactionPreview.handoff, false);
  assert.equal(manifest.interactionPreview.timeline.length, 12);
  assert.ok(
    manifest.interactionPreview.timeline.every(
      ({ heldPropVisible }) => heldPropVisible === false,
    ),
  );
  assert.equal(manifest.interactionPreview.placement.magicOffset, false);
  assert.equal(
    manifest.interactionPreview.placement.missingSocketFallback,
    false,
  );
});

test("Server Rack N02 does not claim slots or production cases", () => {
  assert.equal(manifest.instancePreview.reservationSlotContribution, 0);
  assert.equal(
    manifest.instancePreview.plannedReservationSlotContributionAfterF8,
    2,
  );
  assert.equal(
    manifest.instancePreview.facilityV1ReadySlotsAfterServerF8Target,
    17,
  );
  assert.equal(manifest.productionTargets.basePoseCases, 108);
  assert.equal(manifest.productionTargets.orientationCompositeCases, 432);
  assert.equal(manifest.productionTargets.builtPoseCases, 0);
  assert.equal(manifest.productionTargets.builtOrientationCompositeCases, 0);
  assert.equal(manifest.permissions.fullSystemBuild, true);
});

test("Server Rack N02 rejects held props and fabricated production evidence", () => {
  const invalid = structuredClone(manifest) as unknown as {
    interactionPreview: Record<string, unknown>;
    productionTargets: Record<string, unknown>;
  };
  invalid.interactionPreview.heldProp = true;
  invalid.interactionPreview.h01Dependency = true;
  invalid.productionTargets.builtPoseCases = 108;
  const issues =
    validateOfficeFacilityServerRackGeneratedPreflightManifest(invalid);
  assert.ok(issues.some((issue) => issue.includes("empty-hand")));
  assert.ok(issues.some((issue) => issue.includes("fabricated")));
});
