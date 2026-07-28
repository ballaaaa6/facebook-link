import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { validateOfficeWorkstationBundleV2 } from "../src/officeWorkstationV2.ts";

const manifestUrl = new URL(
  "../../../assets/game/manifests/office-workstation-bundle-v2.json",
  import.meta.url,
);
const bundle = JSON.parse(readFileSync(manifestUrl, "utf8"));

test("Workstation Bundle v2 contains only the Step 4 bare desk", () => {
  assert.deepEqual(validateOfficeWorkstationBundleV2(bundle), []);
  assert.deepEqual(bundle.deskFamily.contains, ["bare-desk"]);
  assert.equal(bundle.permissions.singleSeatAssembly, false);
  assert.equal(bundle.permissions.activeOfficePromotion, false);
});

test("Workstation Bundle v2 rejects a thin tabletop camera", () => {
  const invalid = structuredClone(bundle);
  invalid.deskFamily.normalization.tabletopRows.endExclusive = 60;
  invalid.deskFamily.normalization.tabletopHeightRatio = 0.25;
  const issues = validateOfficeWorkstationBundleV2(invalid).join("\n");
  assert.match(issues, /35 visible tabletop rows/);
  assert.match(issues, /at least 0\.4/);
});

test("Workstation Bundle v2 rejects the old extra footprint row", () => {
  const invalid = structuredClone(bundle);
  invalid.deskFamily.footprint.depth = 3;
  invalid.deskFamily.employeeEdge = { originY: 2, depth: 1 };
  const issues = validateOfficeWorkstationBundleV2(invalid).join("\n");
  assert.match(issues, /must equal 3 x 2/);
  assert.match(issues, /must remain null/);
});

test("Workstation Bundle v2 keeps Step 5 and the renderer blocked", () => {
  const invalid = structuredClone(bundle);
  invalid.permissions.singleSeatAssembly = true;
  invalid.permissions.rendererImplementation = true;
  const issues = validateOfficeWorkstationBundleV2(invalid).join("\n");
  assert.match(issues, /singleSeatAssembly/);
  assert.match(issues, /rendererImplementation/);
});
