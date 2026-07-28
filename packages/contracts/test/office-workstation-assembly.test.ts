import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { validateOfficeWorkstationAssemblyBibleV2 } from "../src/officeWorkstationAssembly.ts";

const manifestUrl = new URL(
  "../../../assets/game/manifests/office-workstation-assembly-bible-v2.json",
  import.meta.url,
);
const bible = JSON.parse(readFileSync(manifestUrl, "utf8"));

test("Workstation Assembly Bible v2 authorizes only Step 4 bare desk artwork", () => {
  assert.deepEqual(validateOfficeWorkstationAssemblyBibleV2(bible), []);
  assert.equal(bible.status, "desk-artwork-accepted");
  assert.equal(bible.approvalRecord.step4ArtworkDecision, "accepted");
  assert.equal(bible.permissions.ownerApproval, true);
  assert.equal(bible.permissions.deskArtworkGeneration, true);
  assert.equal(bible.permissions.rendererImplementation, false);
  assert.equal(bible.permissions.tenSeatSceneAssembly, false);
});

test("height parts cannot recreate the rejected employee-edge footprint row", () => {
  const invalid = structuredClone(bible);
  invalid.desk.employeeEdgeRow = { originY: 2, depth: 1 };
  invalid.desk.partContract[2].changesFootprint = true;
  const issues = validateOfficeWorkstationAssemblyBibleV2(invalid).join("\n");
  assert.match(issues, /employeeEdgeRow/);
  assert.match(issues, /changesFootprint/);
});

test("monitor and keyboard rows reverse around the paired actors", () => {
  const invalid = structuredClone(bible);
  invalid.orientations.far.monitorReservationRelative.y = 0;
  invalid.orientations.near.keyboardReservationRelative.y = 0;
  const issues = validateOfficeWorkstationAssemblyBibleV2(invalid).join("\n");
  assert.match(issues, /monitorReservationRelative/);
  assert.match(issues, /keyboardReservationRelative/);
});

test("five three-tile columns must touch inside the existing left work zone", () => {
  const invalid = structuredClone(bible);
  invalid.normalizedTenSeatBlock.deskOriginsX[2] = 11;
  invalid.normalizedTenSeatBlock.deskBankBounds.width = 16;
  const issues = validateOfficeWorkstationAssemblyBibleV2(invalid).join("\n");
  assert.match(issues, /deskOriginsX/);
  assert.match(issues, /deskBankBounds/);
});
