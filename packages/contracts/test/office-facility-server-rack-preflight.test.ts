import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  type OfficeFacilityServerRackPreflightManifest,
  validateOfficeFacilityServerRackPreflightManifest,
} from "../src/officeFacilityServerRackPreflight.ts";

const manifest = JSON.parse(readFileSync(new URL(
  "../../../assets/game/manifests/office-facility-server-rack-n01.json",
  import.meta.url,
), "utf8")) as OfficeFacilityServerRackPreflightManifest;

test("Server Rack N01 preserves the superseded F0-F3 visual preflight", () => {
  assert.deepEqual(
    validateOfficeFacilityServerRackPreflightManifest(manifest),
    [],
  );
  assert.equal(manifest.status, "superseded-owner-redesign-requested");
  assert.equal(manifest.gates.F3.status, "passed");
  assert.equal(manifest.gates.F4.status, "blocked");
  assert.equal(manifest.gates.F10.status, "blocked");
  assert.equal(manifest.permissions.fullSystemBuild, false);
  assert.equal(
    manifest.ownerDecision.supersededBy,
    "office.facility.server-rack.n02",
  );
  assert.equal(manifest.permissions.ownerReview, false);
});

test("Server Rack N01 isolates an immutable shell and A-D status loop", () => {
  assert.equal(
    manifest.statusLoop.compositionFormula,
    "immutableShell + statusViewport[n]",
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

test("Server Rack N01 previews two independent future reservations", () => {
  assert.equal(manifest.instancePreview.familyInstanceCount, 2);
  assert.deepEqual(
    manifest.instancePreview.instanceIds,
    ["server-rack-01", "server-rack-02"],
  );
  assert.equal(manifest.instancePreview.sharedFamilyPixels, true);
  assert.equal(manifest.instancePreview.reservationProductionBuilt, false);
  assert.equal(manifest.instancePreview.reservationSlotContribution, 0);
  assert.equal(
    manifest.instancePreview.plannedReservationSlotContributionAfterF8,
    2,
  );
  assert.equal(
    manifest.instancePreview.facilityV1ReadySlotsAfterServerF8Target,
    17,
  );
});

test("Server Rack N01 tablet demo is non-production and socket exact", () => {
  assert.equal(manifest.interactionPreview.semanticAction, "inspect-front");
  assert.equal(
    manifest.interactionPreview.visualPoseAuthority,
    "interact-front",
  );
  assert.equal(manifest.interactionPreview.heldProp.id, "held.tablet");
  assert.equal(manifest.interactionPreview.timeline.length, 12);
  assert.deepEqual(
    manifest.interactionPreview.timeline
      .filter(({ tabletVisible }) => tabletVisible)
      .map(({ attachmentDelta }) => attachmentDelta),
    [[0, 0], [0, 0], [0, 0]],
  );
  assert.equal(
    manifest.interactionPreview.countsTowardRosterValidation,
    false,
  );
  assert.equal(
    manifest.interactionPreview.countsTowardReservationValidation,
    false,
  );
  assert.equal(manifest.interactionPreview.missingSocketFallback, false);
});

test("Server Rack N01 rejects processed, side, and generated pixels", () => {
  const invalid = structuredClone(manifest) as unknown as {
    sourcePolicy: Record<string, unknown>;
  };
  invalid.sourcePolicy.processedCropDirectReuse = true;
  invalid.sourcePolicy.rejectedSidePixelReuse = true;
  invalid.sourcePolicy.newImageGeneration = true;
  const issues = validateOfficeFacilityServerRackPreflightManifest(invalid);
  assert.ok(
    issues.some((issue) => issue.includes("processedCropDirectReuse")),
  );
  assert.ok(issues.some((issue) => issue.includes("rejectedSidePixelReuse")));
  assert.ok(issues.some((issue) => issue.includes("newImageGeneration")));
});
