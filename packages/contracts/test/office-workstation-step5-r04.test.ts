import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  validateOfficeWorkstationComponentsV3,
  validateOfficeWorkstationStep5ManifestV4,
} from "../src/index.ts";

const componentsUrl = new URL("../../../assets/game/manifests/office-workstation-components-v3.json", import.meta.url);
const manifestUrl = new URL("../../../assets/game/manifests/office-workstation-step5-single-seat-v4.json", import.meta.url);
const activeOfficeUrl = new URL("../../../assets/game/maps/office-c-v2.json", import.meta.url);
const components = JSON.parse(readFileSync(componentsUrl, "utf8"));
const manifest = JSON.parse(readFileSync(manifestUrl, "utf8"));

test("R04 retains the accepted desk while rejecting chair and equipment placement", () => {
  assert.deepEqual(validateOfficeWorkstationComponentsV3(components), []);
  assert.equal(components.status, "partially-rejected-physical-composition");
  assert.equal(components.componentDecisions.desk.decision, "accepted");
  assert.equal(components.componentDecisions.chair.decision, "rejected");
  assert.deepEqual(components.geometry.person.logicalVolume, [1, 1, 3]);
  assert.deepEqual(components.geometry.chair.logicalVolume, [1, 1, 2]);
  assert.deepEqual(components.geometry.desk.logicalVolume, [3, 2, 2]);
  assert.deepEqual(components.geometry.desk.supportRows, [0, 64]);
  assert.deepEqual(components.geometry.monitor.reservation, [3, 1]);
  assert.deepEqual(components.geometry.keyboard.reservation, [1, 1]);
  assert.deepEqual(components.geometry.keyboard.renderPixels, [48, 24]);
});

test("R04 retains stable-coordinate evidence without claiming physical correctness", () => {
  assert.deepEqual(validateOfficeWorkstationStep5ManifestV4(manifest), []);
  assert.equal(manifest.lab.stationCount, 1);
  assert.equal(manifest.lab.orientationCount, 2);
  assert.equal(manifest.animation.maximumAnchorDriftPixels, 0);
  assert.deepEqual(manifest.completedScope, ["P4", "P5", "P6"]);
  assert.equal(manifest.browserValidation.animationSeconds, 30);
  assert.equal(manifest.browserValidation.anchorStable, true);
  assert.equal(manifest.browserValidation.physicalCorrectness, false);
  for (const orientation of ["far", "near"]) {
    assert.deepEqual(manifest.geometry[orientation].seatAnchor, manifest.geometry[orientation].hipAnchor);
  }
  assert.ok(manifest.layerOrder.far.indexOf("actor") < manifest.layerOrder.far.indexOf("desk-surface"));
  assert.ok(manifest.layerOrder.near.indexOf("desk-foreground") < manifest.layerOrder.near.indexOf("actor"));
});

test("R04 is rejected, preserves Active Office, and blocks all implementation", () => {
  const digest = (url: URL) => createHash("sha256").update(readFileSync(url)).digest("hex");
  assert.equal(digest(activeOfficeUrl), manifest.activeOfficeBaseline.sha256);
  assert.equal(manifest.permissions.tenSeatAssembly, false);
  assert.equal(manifest.permissions.step6, false);
  assert.equal(manifest.permissions.activeOfficePromotion, false);
  assert.equal(manifest.status, "rejected-physical-composition");
  assert.equal(manifest.permissions.isolatedLabRenderer, false);
  assert.equal(manifest.ownerGate.decision, "rejected");
  assert.equal(manifest.reviewDecision.supersededBy, "office.workstation.step5.r05.calibration");
});

test("R04 validator rejects permission and historical-decision regressions", () => {
  const invalidComponents = structuredClone(components);
  invalidComponents.geometry.keyboard.reservation = [3, 1];
  invalidComponents.geometry.desk.supportRows = [0, 30];
  assert.match(validateOfficeWorkstationComponentsV3(invalidComponents).join("\n"), /keyboard|support/i);

  const invalidManifest = structuredClone(manifest);
  invalidManifest.reviewDecision.decision = "accepted";
  invalidManifest.permissions.activeOfficePromotion = true;
  assert.match(validateOfficeWorkstationStep5ManifestV4(invalidManifest).join("\n"), /reviewDecision|promotion/i);
});
