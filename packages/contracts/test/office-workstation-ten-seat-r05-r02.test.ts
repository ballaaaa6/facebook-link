import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  validateOfficeWorkstationTenSeatR05R02,
  workstationTenSeatR05R02ReviewOutputs,
} from "../src/index.ts";

const root = new URL("../../../", import.meta.url);
const readJson = (path: string) => JSON.parse(readFileSync(new URL(path, root), "utf8"));
const digest = (path: string) => createHash("sha256").update(readFileSync(new URL(path, root))).digest("hex");
const manifest = readJson("assets/game/manifests/office-workstation-ten-seat-r05-r02.json");
const map = readJson("assets/game/maps/office-workstation-ten-seat-r05-r02.json");

test("rejected ten-seat R05-r02 retains its historical placement evidence", () => {
  assert.deepEqual(validateOfficeWorkstationTenSeatR05R02(manifest, map), []);
  assert.equal(map.status, "rejected-floor-map");
  assert.equal(map.supersededBy, "office-full-grid-v1");
  assert.deepEqual(map.capacity, { currentEmployees: 10, reservedEmployees: 10, totalPlannedEmployees: 20 });
  assert.deepEqual(map.placement.deskOriginsX, [2, 5, 8, 11, 14]);
  assert.deepEqual(map.placement.currentDeskOriginsY, { far: 11, near: 13 });
  assert.deepEqual(map.placement.reservedDeskOriginsY, { far: 18, near: 20 });
  assert.equal(map.futureReservations.every((slot: { employeeAssigned: boolean; artRendered: boolean }) => !slot.employeeAssigned && !slot.artRendered), true);
});

test("ten-seat R05-r02 preserves all joins and sixty seat contacts", () => {
  assert.equal(map.joins.horizontal.length, 8);
  assert.equal(map.joins.horizontal.every((join: { gapPixels: number }) => join.gapPixels === 0), true);
  assert.equal(map.joins.depth.length, 5);
  assert.equal(map.currentWorkstations.flatMap((station: { seatContacts: unknown[] }) => station.seatContacts).length, 60);
  assert.equal(map.currentWorkstations.every((station: { seatContacts: { resolvedDeltaPixels: number[] }[] }) => station.seatContacts.every((contact) => JSON.stringify(contact.resolvedDeltaPixels) === "[0,0]")), true);
});

test("ten-seat R05-r02 remains isolated and keeps all evidence available", () => {
  assert.equal(map.developmentOnly, true);
  assert.equal(map.activeOfficePromotion, false);
  assert.equal(manifest.permissions.activeOfficePromotion, false);
  assert.equal(digest(manifest.map.file), manifest.map.sha256);
  assert.equal(digest(manifest.activeOfficeBaseline.file), manifest.activeOfficeBaseline.sha256);
  assert.deepEqual(manifest.reviewOutputs, workstationTenSeatR05R02ReviewOutputs);
  for (const path of manifest.reviewOutputs) assert.doesNotThrow(() => readFileSync(new URL(path, root)));
});

test("ten-seat R05-r02 records the footprint and coordinate failure", () => {
  assert.equal(map.rejection.canonicalWorldOffsetOmitted, true);
  assert.deepEqual(map.rejection.historicalFootprint, { x: 2, y: 10, width: 15, height: 6 });
  assert.deepEqual(map.rejection.historicalProtectedEnvelope, { x: 1, y: 9, width: 17, height: 8 });
});
