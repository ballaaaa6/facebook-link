import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  type OfficeFacilityArcadeGeneratedPreflightManifest,
  validateOfficeFacilityArcadeGeneratedPreflightManifest,
} from "../src/officeFacilityArcadeGeneratedPreflight.ts";

const manifest = JSON.parse(readFileSync(new URL(
  "../../../assets/game/manifests/office-facility-arcade-machine-g02.json",
  import.meta.url,
), "utf8")) as OfficeFacilityArcadeGeneratedPreflightManifest;

test("Arcade G02 remains a generated four-side visual preflight", () => {
  assert.deepEqual(
    validateOfficeFacilityArcadeGeneratedPreflightManifest(manifest),
    [],
  );
  assert.deepEqual(manifest.render.physicalScale, {
    width: 2,
    depth: 2,
    height: 4,
    unit: "tile",
  });
  assert.equal(manifest.render.orientations.length, 4);
  assert.equal(manifest.visualApproval, null);
  assert.equal(manifest.gates.F3.status, "passed");
  assert.equal(manifest.gates.F4.status, "blocked");
  assert.equal(manifest.gates.F10.status, "blocked");
});

test("Arcade G02 owns three four-frame seam loops", () => {
  assert.equal(manifest.screenSystem.games.length, 3);
  assert.deepEqual(manifest.screenSystem.transition, ["a", "b", "c", "d", "a"]);
  for (const game of manifest.screenSystem.games) {
    assert.equal(game.screenFrames.length, 4);
    assert.equal(game.compositeFrames.length, 4);
    assert.equal(game.closureMismatchPixels, 0);
    assert.equal(game.outsideViewportChangedPixels, 0);
    assert.equal(game.controlRegionChangedPixels, 0);
    assert.ok(game.transitionChangedPixels.every((pixels) => pixels > 0));
  }
});

test("Arcade G02 actor GIF remains a development-only I01 preview", () => {
  const demo = manifest.interactionPreview.singleActorDemo;
  assert.equal(demo.actorId, "anna");
  assert.equal(demo.pose, "interact-front");
  assert.equal(demo.timeline.length, 12);
  assert.deepEqual(
    demo.timeline.slice(0, 3).map(({ animation }) => animation),
    ["walk-left", "walk-left", "walk-left"],
  );
  assert.deepEqual(
    demo.timeline.slice(-2).map(({ animation }) => animation),
    ["walk-right", "walk-right"],
  );
  assert.equal(demo.heldController, false);
  assert.equal(demo.countsTowardRosterValidation, false);
  assert.equal(demo.countsTowardReservationValidation, false);
  assert.equal(demo.placement.magicOffset, false);
  assert.equal(demo.placement.fallbackSocket, false);
  assert.equal(demo.placement.productionSocketClaim, false);
  assert.deepEqual(demo.gif.size, [768, 512]);
});

test("Arcade G02 rejects previous Arcade or Active Office pixels", () => {
  const invalid = structuredClone(manifest) as unknown as {
    sourcePolicy: Record<string, unknown>;
  };
  invalid.sourcePolicy.previousArcadePixelReuse = true;
  invalid.sourcePolicy.activeOfficePixelReuse = true;
  const issues = validateOfficeFacilityArcadeGeneratedPreflightManifest(invalid);
  assert.ok(issues.some((issue) => issue.includes("previousArcadePixelReuse")));
  assert.ok(issues.some((issue) => issue.includes("activeOfficePixelReuse")));
});

test("Arcade G02 cannot animate controls or advance past the visual stop", () => {
  const invalid = structuredClone(manifest) as unknown as {
    screenSystem: Record<string, unknown>;
    gates: Record<string, { status: string }>;
    permissions: Record<string, boolean>;
  };
  invalid.screenSystem.controlsChangedPixels = 1;
  invalid.gates.F4!.status = "passed";
  invalid.permissions.fullSystemBuild = true;
  const issues = validateOfficeFacilityArcadeGeneratedPreflightManifest(invalid);
  assert.ok(issues.some((issue) => issue.includes("screen viewport")));
  assert.ok(issues.some((issue) => issue.includes("gates.F4")));
  assert.ok(issues.some((issue) => issue.includes("permissions")));
});
