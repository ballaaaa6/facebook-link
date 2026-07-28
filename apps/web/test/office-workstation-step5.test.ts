import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { OfficeWorkstationStep5ManifestV1 } from "@affiliate-ops/contracts";
import { step5AnchorsStable, step5FrameForTick, step5StationGeometry } from "../src/features/office/lab/workstation-v2-step5/step5Runtime.ts";

const manifestUrl = new URL("../../../assets/game/manifests/office-workstation-step5-single-seat-v1.json", import.meta.url);
const activeOfficeUrl = new URL("../../../assets/game/maps/office-c-v2.json", import.meta.url);
const manifest = JSON.parse(readFileSync(manifestUrl, "utf8")) as OfficeWorkstationStep5ManifestV1;

test("Step 5 keeps both chairs centered outside the accepted 3 x 2 desk", () => {
  const far = step5StationGeometry(manifest, "far");
  const near = step5StationGeometry(manifest, "near");
  assert.deepEqual(far.deskFootprint, { left: 64, top: 96, width: 96, height: 64 });
  assert.deepEqual(far.chairFootprint, { left: 96, top: 64, width: 32, height: 32 });
  assert.deepEqual(near.chairFootprint, { left: 96, top: 160, width: 32, height: 32 });
  assert.equal(far.chairPivot.x, far.deskPivot.x);
  assert.equal(near.chairPivot.x, near.deskPivot.x);
  assert.ok(far.chairFootprint.top + far.chairFootprint.height <= far.deskFootprint.top);
  assert.ok(near.chairFootprint.top >= near.deskFootprint.top + near.deskFootprint.height);
});

test("Step 5 reverses monitor and keyboard rows around the actor", () => {
  const far = step5StationGeometry(manifest, "far");
  const near = step5StationGeometry(manifest, "near");
  assert.equal(far.monitorReservation.top, far.deskFootprint.top + 32);
  assert.equal(far.keyboardReservation.top, far.deskFootprint.top);
  assert.equal(near.monitorReservation.top, near.deskFootprint.top);
  assert.equal(near.keyboardReservation.top, near.deskFootprint.top + 32);
  assert.equal(far.monitor.left + far.monitor.width / 2, far.deskPivot.x);
  assert.equal(near.keyboard.left + near.keyboard.width / 2, near.deskPivot.x);
});

test("Step 5 animation changes frames without changing station anchors", () => {
  assert.deepEqual(manifest.animation.sampleTicks.map((tick) => step5FrameForTick(tick, 6)), [0, 4, 2, 0]);
  assert.equal(step5AnchorsStable(manifest, "far", manifest.animation.sampleTicks), true);
  assert.equal(step5AnchorsStable(manifest, "near", manifest.animation.sampleTicks), true);
});

test("Step 5 route remains development-only and Active Office remains byte-identical", () => {
  const mainSource = readFileSync(new URL("../src/main.tsx", import.meta.url), "utf8");
  const pageSource = readFileSync(new URL("../src/features/office/lab/workstation-v2-step5/OfficeWorkstationStep5LabPage.tsx", import.meta.url), "utf8");
  const activeHash = createHash("sha256").update(readFileSync(activeOfficeUrl)).digest("hex");
  assert.match(mainSource, /import\.meta\.env\.DEV/);
  assert.match(mainSource, /office-workstation-v2-step5/);
  assert.doesNotMatch(pageSource, /office-c-background-modern-v3|officeAssetRegistry|OfficeCanvas/);
  assert.equal(activeHash, manifest.activeOfficeBaseline.sha256);
});
