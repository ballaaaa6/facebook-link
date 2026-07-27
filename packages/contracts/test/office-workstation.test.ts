import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { validateOfficeWorkstationBundleV1 } from "../src/officeWorkstation.ts";

const manifestUrl = new URL("../../../assets/game/manifests/office-workstation-bundle-v1.json", import.meta.url);
const bundle = JSON.parse(readFileSync(manifestUrl, "utf8"));

test("Workstation Bundle v1 validates the canonical staging bundle", () => {
  assert.deepEqual(validateOfficeWorkstationBundleV1(bundle), []);
});

test("Workstation Bundle v1 rejects support slots on the employee edge", () => {
  const invalid = structuredClone(bundle);
  invalid.attachmentSlots[0].y = 3;
  assert.match(validateOfficeWorkstationBundleV1(invalid).join("\n"), /support plane/);
});

test("screen animation is a viewport-local child", () => {
  const invalid = structuredClone(bundle);
  invalid.screenLoop.coordinateSpace = "wall";
  invalid.screenLoop.parentViewportId = "office-wall";
  const issues = validateOfficeWorkstationBundleV1(invalid).join("\n");
  assert.match(issues, /viewport-local/);
  assert.match(issues, /monitorFamily\.viewport\.id/);
});

test("all role variants share one physical desk family", () => {
  const invalid = structuredClone(bundle);
  invalid.roleVariants.creative.deskFamilyId = "desk.creative.unique";
  assert.match(validateOfficeWorkstationBundleV1(invalid).join("\n"), /share the canonical desk family/);
});

test("all four desk orientations and unique slots are required", () => {
  const invalid = structuredClone(bundle);
  delete invalid.deskFamily.orientations.left;
  invalid.attachmentSlots[1].id = invalid.attachmentSlots[0].id;
  const issues = validateOfficeWorkstationBundleV1(invalid).join("\n");
  assert.match(issues, /exactly four orientations/);
  assert.match(issues, /orientations\.left/);
  assert.match(issues, /unique/);
});
