import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  type OfficeFurnitureOnlyRoomF9Manifest,
  type OfficeFurnitureOnlyRoomF9Map,
  validateOfficeFurnitureOnlyRoomF9Manifest,
  validateOfficeFurnitureOnlyRoomF9Map,
} from "../src/officeFurnitureOnlyRoomF9.ts";

const manifest = JSON.parse(readFileSync(new URL(
  "../../../assets/game/manifests/office-furniture-only-f9-v1.json",
  import.meta.url,
), "utf8")) as OfficeFurnitureOnlyRoomF9Manifest;

const map = JSON.parse(readFileSync(new URL(
  "../../../assets/game/maps/office-furniture-only-f9-v1.json",
  import.meta.url,
), "utf8")) as OfficeFurnitureOnlyRoomF9Map;

test("F9 manifest keeps the review candidate isolated", () => {
  assert.deepEqual(validateOfficeFurnitureOnlyRoomF9Manifest(manifest), []);
  assert.equal(manifest.inventory.workstationCount, 10);
  assert.equal(manifest.inventory.reservationSlotCount, 20);
  assert.equal(manifest.people.visible, false);
  assert.equal(manifest.gates.F9.status, "pending-owner-review");
  assert.equal(manifest.gates.F10.status, "blocked");
  assert.equal(manifest.permissions.activeOfficePromotion, false);
});

test("F9 map preserves the C12 two-row workstation authority", () => {
  assert.deepEqual(validateOfficeFurnitureOnlyRoomF9Map(map), []);
  assert.equal(map.workstations.length, 10);
  assert.deepEqual(map.workstations.map((entry) => entry.origin), [
    [3, 13],
    [6, 13],
    [9, 13],
    [12, 13],
    [15, 13],
    [3, 15],
    [6, 15],
    [9, 15],
    [12, 15],
    [15, 15],
  ]);
});

test("F9 uses approved side views on the right edge", () => {
  const sideBank = map.facilities.filter(
    (entry) => entry.wallRelationship === "right-edge",
  );
  assert.equal(sideBank.length, 3);
  assert.ok(sideBank.every(
    (entry) =>
      entry.visualOrientation === "left"
      && Array.isArray(entry.origin)
      && entry.origin[0] === 41,
  ));
});

test("F9 proves every workstation-to-facility route", () => {
  assert.equal(map.routeValidation.queryCount, 200);
  assert.equal(map.routeValidation.reachableCount, 200);
  assert.equal(map.routeValidation.unreachableCount, 0);
  assert.equal(map.routeValidation.queries.length, 200);
  assert.ok(map.routeValidation.queries.every(
    (query) => query.reachable === true && Number(query.pathLength) >= 0,
  ));
});

test("F9 rejects workstation count and Active Office promotion drift", () => {
  const invalidManifest = structuredClone(manifest) as unknown as {
    inventory: Record<string, unknown>;
    permissions: Record<string, unknown>;
  };
  invalidManifest.inventory.workstationCount = 15;
  invalidManifest.permissions.activeOfficePromotion = true;
  const issues = validateOfficeFurnitureOnlyRoomF9Manifest(invalidManifest);
  assert.ok(issues.some((issue) => issue.includes("10-workstation")));
  assert.ok(issues.some((issue) => issue.includes("permissions")));

  const invalidMap = structuredClone(map) as unknown as {
    interiorPlan: Record<string, unknown>;
    facilities: Array<Record<string, unknown>>;
  };
  invalidMap.interiorPlan.workstationAnchorCell = "A1";
  invalidMap.facilities[0]!.visualOrientation = "front";
  const mapIssues = validateOfficeFurnitureOnlyRoomF9Map(invalidMap);
  assert.ok(mapIssues.some((issue) => issue.includes("C12")));
  assert.ok(mapIssues.some((issue) => issue.includes("right-edge")));
});
