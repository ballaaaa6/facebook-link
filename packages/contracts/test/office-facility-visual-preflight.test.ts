import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  type OfficeFacilityVisualPreflightManifest,
  validateOfficeFacilityVisualPreflightManifest,
} from "../src/officeFacilityVisualPreflight.ts";

const manifest = JSON.parse(readFileSync(new URL(
  "../../../assets/game/manifests/office-facility-arcade-machine-g01.json",
  import.meta.url,
), "utf8")) as OfficeFacilityVisualPreflightManifest;

test("Arcade G01 remains a five-board visual preflight", () => {
  assert.deepEqual(
    validateOfficeFacilityVisualPreflightManifest(manifest),
    [],
  );
  assert.equal(manifest.status, "visual-preflight-owner-review");
  assert.equal(manifest.visualApproval, null);
  assert.equal(manifest.reviewOutputs.length, 5);
  assert.equal(manifest.gates.F3.status, "passed");
  assert.equal(manifest.gates.F4.status, "blocked");
  assert.equal(manifest.gates.F8.status, "blocked");
  assert.equal(manifest.gates.F9.status, "blocked");
  assert.equal(manifest.gates.F10.status, "blocked");
});

test("Arcade G01 cannot fabricate a held controller", () => {
  const invalid = structuredClone(manifest) as unknown as Record<string, unknown>;
  invalid.plannedHeldProp = true;
  const issues = validateOfficeFacilityVisualPreflightManifest(invalid);
  assert.ok(issues.some((issue) => issue.includes("no held prop")));
});

test("Arcade G01 cannot reuse processed or side-orientation pixels", () => {
  const invalid = structuredClone(manifest) as unknown as {
    sourcePolicy: Record<string, unknown>;
    sources: Array<Record<string, unknown>>;
  };
  invalid.sourcePolicy.sideOrientationReuse = true;
  invalid.sources[0]!.path =
    "assets/game/processed/office-library-modern-bright-v1/arcade.png";
  const issues = validateOfficeFacilityVisualPreflightManifest(invalid);
  assert.ok(issues.some((issue) => issue.includes("sideOrientationReuse")));
  assert.ok(issues.some((issue) => issue.includes("original layout-reference")));
});

test("Arcade G01 cannot advance past the visual stop gate", () => {
  const invalid = structuredClone(manifest) as unknown as {
    gates: Record<string, { status: string }>;
    permissions: Record<string, boolean>;
  };
  invalid.gates.F4!.status = "passed";
  invalid.permissions.fullSystemBuild = true;
  const issues = validateOfficeFacilityVisualPreflightManifest(invalid);
  assert.ok(issues.some((issue) => issue.includes("gates.F4")));
  assert.ok(issues.some((issue) => issue.includes("permissions")));
});
