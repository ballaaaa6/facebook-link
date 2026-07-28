import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { OfficeWorkstationStep5ManifestV2 } from "@affiliate-ops/contracts";
import { pixelAlignedCharacterFrame } from "../src/features/office/motion/pixelGeometry.ts";
import {
  step5AnchorsStable,
  step5FrameForTick,
  step5StationGeometry,
} from "../src/features/office/lab/workstation-v2-step5/step5Runtime.ts";

const manifestUrl = new URL("../../../assets/game/manifests/office-workstation-step5-single-seat-v2.json", import.meta.url);
const activeOfficeUrl = new URL("../../../assets/game/maps/office-c-v2.json", import.meta.url);
const manifest = JSON.parse(readFileSync(manifestUrl, "utf8")) as OfficeWorkstationStep5ManifestV2;

test("Step 5 r02 shares the exact current Office character frame", () => {
  assert.deepEqual(pixelAlignedCharacterFrame(32, 1), { width: 96, height: 104 });
  const far = step5StationGeometry(manifest, "far");
  assert.deepEqual(far.actor, { left: 64, top: 24, width: 96, height: 104 });
  assert.deepEqual(far.actorFootprint, { left: 96, top: 96, width: 32, height: 32 });
  assert.deepEqual(far.actorLogicalVolume, { left: 96, top: 32, width: 32, height: 96 });
  assert.ok(far.actor.left < far.actorFootprint.left, "visible hair/body may overflow the logical footprint");
});

test("Step 5 r02 separates chair floor footprint from its two-unit volume", () => {
  const far = step5StationGeometry(manifest, "far");
  const near = step5StationGeometry(manifest, "near");
  assert.deepEqual(far.chairFootprint, { left: 96, top: 96, width: 32, height: 32 });
  assert.deepEqual(far.chairLogicalVolume, { left: 96, top: 64, width: 32, height: 64 });
  assert.deepEqual(near.chairFootprint, { left: 96, top: 192, width: 32, height: 32 });
  assert.deepEqual(near.chairLogicalVolume, { left: 96, top: 160, width: 32, height: 64 });
  assert.equal(far.hipAnchor.x, far.seatAnchor.x);
  assert.equal(far.hipAnchor.y, far.seatAnchor.y);
  assert.equal(near.hipAnchor.y, near.seatAnchor.y);
});

test("Step 5 r02 keeps the chair outside the 3 x 2 desk and equipment on the correct rows", () => {
  const far = step5StationGeometry(manifest, "far");
  const near = step5StationGeometry(manifest, "near");
  assert.deepEqual(far.deskFootprint, { left: 64, top: 128, width: 96, height: 64 });
  assert.ok(far.chairFootprint.top + far.chairFootprint.height <= far.deskFootprint.top);
  assert.ok(near.chairFootprint.top >= near.deskFootprint.top + near.deskFootprint.height);
  assert.equal(far.monitorReservation.top, far.deskFootprint.top + 32);
  assert.equal(far.keyboardReservation.top, far.deskFootprint.top);
  assert.equal(near.monitorReservation.top, near.deskFootprint.top);
  assert.equal(near.keyboardReservation.top, near.deskFootprint.top + 32);
  assert.equal(far.keyboard.width, 72);
  assert.equal(far.keyboard.height, 37);
});

test("Step 5 r02 animation changes frames without moving spatial anchors", () => {
  assert.deepEqual(manifest.animation.sampleTicks.map((tick) => step5FrameForTick(tick, 6)), [0, 4, 2, 0]);
  assert.equal(step5AnchorsStable(manifest, "far", manifest.animation.sampleTicks), true);
  assert.equal(step5AnchorsStable(manifest, "near", manifest.animation.sampleTicks), true);
});

test("Step 5 r02 remains isolated and Active Office remains byte-identical", () => {
  const mainSource = readFileSync(new URL("../src/main.tsx", import.meta.url), "utf8");
  const pageSource = readFileSync(new URL("../src/features/office/lab/workstation-v2-step5/OfficeWorkstationStep5LabPage.tsx", import.meta.url), "utf8");
  const activeHash = createHash("sha256").update(readFileSync(activeOfficeUrl)).digest("hex");
  assert.match(mainSource, /import\.meta\.env\.DEV/);
  assert.match(mainSource, /office-workstation-v2-step5/);
  assert.doesNotMatch(pageSource, /office-c-background-modern-v3|officeAssetRegistry|OfficeCanvas/);
  assert.equal(activeHash, manifest.activeOfficeBaseline.sha256);
});
