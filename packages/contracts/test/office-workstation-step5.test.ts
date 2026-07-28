import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  officeCharacterFrameForTile,
  validateOfficeCharacterScaleManifest,
  validateOfficeWorkstationStep5Manifest,
} from "../src/index.ts";

const manifestUrl = new URL(
  "../../../assets/game/manifests/office-workstation-step5-single-seat-v2.json",
  import.meta.url,
);
const rejectedUrl = new URL(
  "../../../assets/game/manifests/office-workstation-step5-single-seat-v1.json",
  import.meta.url,
);
const scaleUrl = new URL("../../../assets/game/manifests/office-character-scale-standard-v1.json", import.meta.url);
const activeOfficeUrl = new URL("../../../assets/game/maps/office-c-v2.json", import.meta.url);
const manifest = JSON.parse(readFileSync(manifestUrl, "utf8"));
const rejected = JSON.parse(readFileSync(rejectedUrl, "utf8"));
const scale = JSON.parse(readFileSync(scaleUrl, "utf8"));

test("Step 5 r02 locks the current Office person as a 1 x 1 x 3 standard", () => {
  assert.deepEqual(validateOfficeCharacterScaleManifest(scale), []);
  assert.deepEqual(officeCharacterFrameForTile(32, 1), { width: 96, height: 104 });
  assert.deepEqual(scale.standard.floorFootprint, { width: 1, depth: 1 });
  assert.deepEqual(scale.standard.logicalVolume, { width: 1, depth: 1, height: 3 });
  assert.equal(scale.renderPolicy.visualOverflowAllowed, true);
  assert.equal(scale.renderPolicy.clipToFootprint, false);
});

test("Step 5 r02 is frozen as rejected calibration evidence", () => {
  assert.deepEqual(validateOfficeWorkstationStep5Manifest(manifest), []);
  assert.equal(manifest.status, "rejected-calibration");
  assert.equal(manifest.approvalRecord.resultDecision, "rejected");
  assert.equal(manifest.approvalRecord.supersededBy, "office.workstation.step5.single-seat.v3");
  assert.equal(manifest.permissions.isolatedLabRenderer, false);
  assert.equal(manifest.permissions.singleSeatAssembly, false);
  assert.equal(manifest.permissions.deterministicDerivedAssets, false);
  assert.equal(manifest.permissions.newArtworkGeneration, false);
  assert.equal(manifest.permissions.tenSeatSceneAssembly, false);
  assert.equal(manifest.permissions.activeOfficePromotion, false);
  assert.equal(rejected.status, "rejected-visual");
  assert.equal(rejected.reviewDecision.supersededBy, manifest.id);
});

test("Step 5 r02 retains its desk-side claims only as regression evidence", () => {
  assert.equal(manifest.orientations.far.deskSide, "public-side");
  assert.equal(manifest.deskSides["public-side"].assetView, "back");
  assert.equal(manifest.orientations.near.deskSide, "seat-side");
  assert.equal(manifest.deskSides["seat-side"].assetView, "front");
});

test("Step 5 r02 preserves Active Office and character-scale authority hashes", () => {
  const activeHash = createHash("sha256").update(readFileSync(activeOfficeUrl)).digest("hex");
  const scaleHash = createHash("sha256").update(readFileSync(scaleUrl)).digest("hex");
  assert.equal(activeHash, manifest.activeOfficeBaseline.sha256);
  assert.equal(scaleHash, manifest.characterScaleAuthority.sha256);
});

test("Step 5 r02 rejects footprint, volume, and desk-side regressions", () => {
  const invalid = structuredClone(manifest);
  invalid.station.character.floorFootprint.width = 3;
  invalid.station.equipment.chair.logicalVolume.height = 1;
  invalid.orientations.far.deskSide = "seat-side";
  const issues = validateOfficeWorkstationStep5Manifest(invalid).join("\n");
  assert.match(issues, /station.character/);
  assert.match(issues, /station.equipment.chair/);
  assert.match(issues, /wrong physical desk/);
});
