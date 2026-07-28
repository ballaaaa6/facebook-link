import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  validateOfficeWorkstationStep5R05Final,
  workstationStep5R05FinalBrowserCaptures,
  workstationStep5R05FinalReviewOutputs,
} from "../src/index.ts";

const root = new URL("../../../", import.meta.url);
const readJson = (path: string) => JSON.parse(readFileSync(new URL(path, root), "utf8"));
const digest = (path: string) => createHash("sha256").update(readFileSync(new URL(path, root))).digest("hex");
const manifest = readJson("assets/game/manifests/office-workstation-step5-r05-final.json");
const map = readJson("assets/game/maps/office-ten-r05.json");

test("rejected R05 final retains the real chair source and measured contact sockets as evidence", () => {
  assert.deepEqual(validateOfficeWorkstationStep5R05Final(manifest), []);
  assert.equal(manifest.status, "rejected-composition");
  assert.equal(manifest.supersededBy, "office.workstation.step5.r05.r02");
  assert.equal(manifest.rejectionReasons.length, 3);
  const chair = manifest.components.chair;
  assert.equal(chair.decision, "real-source-normalized-without-scaling");
  assert.deepEqual(chair.physicalParts, ["base-seat", "backrest-arms"]);
  assert.deepEqual(chair.renderMasks, ["rear", "foreground"]);
  assert.deepEqual(chair.seatSocketLocal, [48, 80]);
  assert.deepEqual(chair.floorSocketLocal, [48, 112]);
  assert.deepEqual(chair.contactErrorPixels, { far: [0, 0], near: [0, 0] });
  assert.equal(chair.sourcePixelReconstruction, true);
  for (const source of Object.values(chair.source) as Array<{ path: string; sha256: string }>) {
    assert.equal(digest(source.path), source.sha256);
  }
});

test("R05 final freezes the accepted monitor, keyboard, characters, and poses", () => {
  assert.equal(manifest.components.monitor.decision, "owner-accepted-and-frozen");
  assert.deepEqual(manifest.components.monitor.centerErrorPixels, { far: [0, 0], near: [0, 0] });
  assert.equal(manifest.components.keyboard.decision, "owner-accepted-and-frozen");
  assert.deepEqual(manifest.components.keyboard.renderPixels, [48, 24]);
  assert.equal(manifest.components.characters.count, 10);
  assert.equal(manifest.components.characters.newCharacterOrPose, false);
  assert.deepEqual(manifest.components.characters.personStandard, [1, 1, 3]);
});

test("R05 final lays out two rows of five edge-touching 3x2 desks", () => {
  assert.equal(map.workstations.length, 10);
  assert.deepEqual(map.layout.deskOriginsX, [4, 7, 10, 13, 16]);
  assert.equal(map.layout.horizontalJoinCount, 8);
  assert.equal(map.layout.horizontalGapPixels, 0);
  assert.equal(map.layout.horizontalOverlapPixels, 0);
  assert.equal(map.workstations.filter((station: { orientation: string }) => station.orientation === "far").length, 5);
  assert.equal(map.workstations.filter((station: { orientation: string }) => station.orientation === "near").length, 5);
  for (const station of map.workstations) {
    assert.deepEqual([station.desk.width, station.desk.depth], [3, 2]);
    assert.deepEqual([station.chair.width, station.chair.depth, station.chair.height], [1, 1, 2]);
    assert.deepEqual([station.person.width, station.person.depth, station.person.height], [1, 1, 3]);
    assert.equal(station.desk.x + station.desk.width <= 24, true);
  }
  assert.deepEqual(map.legacyFurnitureReferences, []);
  assert.equal(map.otherFurnitureCount, 0);
});

test("R05 final review remains isolated from Active Office", () => {
  assert.equal(digest(manifest.activeOfficeBaseline.file), manifest.activeOfficeBaseline.sha256);
  assert.equal(digest(manifest.sourceBackground.file), manifest.sourceBackground.sha256);
  assert.equal(digest(manifest.tenSeatMap.file), manifest.tenSeatMap.sha256);
  assert.deepEqual(manifest.reviewOutputs, workstationStep5R05FinalReviewOutputs);
  for (const path of manifest.reviewOutputs) assert.doesNotThrow(() => readFileSync(new URL(path, root)));
  assert.equal(manifest.browserValidation.completedSeconds, 60);
  assert.equal(manifest.browserValidation.consoleErrors, 0);
  assert.equal(manifest.browserValidation.consoleWarnings, 0);
  assert.equal(manifest.browserValidation.brokenImages, 0);
  assert.equal(manifest.browserValidation.maximumAnchorDriftPixels, 0);
  assert.deepEqual(manifest.browserValidation.captures, workstationStep5R05FinalBrowserCaptures);
  for (const path of manifest.browserValidation.captures) {
    assert.doesNotThrow(() => readFileSync(new URL(path, root)));
  }
  assert.equal(manifest.permissions.activeOfficePromotion, false);
  assert.equal(manifest.permissions.step24, false);
  assert.equal(manifest.permissions.historicalRegressionEvidence, true);
  assert.equal(manifest.permissions.isolatedRenderer, false);
  assert.equal(manifest.permissions.tenSeatAssembly, false);
  assert.equal(manifest.runtimePolicy.mockupChairAllowed, false);
  assert.equal(manifest.runtimePolicy.legacyCandidateAllowed, false);
});
