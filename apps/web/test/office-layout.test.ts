import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  resolveOfficeLayout,
  validateOfficeLayout,
} from "../src/features/office/layout/officeLayout.ts";
import type { OfficeMapDefinition } from "../src/features/office/officeTypes.ts";

interface GeometryManifest {
  assets: Parameters<typeof resolveOfficeLayout>[1];
  slotSets: Parameters<typeof resolveOfficeLayout>[2];
}

const map = JSON.parse(
  readFileSync(new URL("../../../assets/game/maps/office-c-v2.json", import.meta.url), "utf8"),
) as OfficeMapDefinition;
const geometry = JSON.parse(
  readFileSync(new URL("../../../assets/game/manifests/office-assets.json", import.meta.url), "utf8"),
) as GeometryManifest;

test("the Office C map has no occupancy or support violations", () => {
  const resolved = resolveOfficeLayout(map, geometry.assets, geometry.slotSets);
  assert.deepEqual(validateOfficeLayout(map, geometry.assets, resolved), []);
});

test("the Office C authoring contract uses integer tiles only", () => {
  assert.equal(map.width, 36);
  assert.equal(map.height, 24);
  assert.deepEqual(map.zones.map(({ width }) => width), [24, 12]);
  for (const geometryEntry of Object.values(geometry.assets)) {
    assert.ok(Number.isInteger(geometryEntry.renderBox.width));
    assert.ok(Number.isInteger(geometryEntry.renderBox.height));
    if (!geometryEntry.footprint) continue;
    assert.ok(Number.isInteger(geometryEntry.footprint.width));
    assert.ok(Number.isInteger(geometryEntry.footprint.depth));
  }
  for (const slots of Object.values(geometry.slotSets)) {
    for (const slot of Object.values(slots)) {
      assert.ok(Number.isInteger(slot.x));
      assert.ok(Number.isInteger(slot.y));
    }
  }
  for (const companion of map.companions) {
    for (const point of [companion.home, ...companion.route]) {
      assert.ok(Number.isInteger(point.x));
      assert.ok(Number.isInteger(point.y));
    }
  }
});

test("workstation standing points are behind desks and chairs stay on the viewer side", () => {
  for (const station of map.workstations) {
    assert.equal(station.work.y, station.collision.y);
    assert.equal(station.work.x, station.x);
    assert.ok(station.stand.y < station.work.y);
    assert.ok(station.stand.y < station.y);
    assert.equal(station.stand.x, station.x);
    assert.ok(station.seat.y > station.y);
    assert.equal(station.seat.x, station.x);
  }
});

test("surface slots cannot be claimed twice", () => {
  const duplicate = structuredClone(map);
  const existingAttachment = duplicate.objects.find((object) =>
    object.parentId === "market-scout" && object.slot
  );
  assert.ok(existingAttachment?.parentId);
  assert.ok(existingAttachment.slot);
  duplicate.objects.push({
    id: "duplicate-monitor",
    asset: existingAttachment.asset,
    parentId: existingAttachment.parentId,
    slot: existingAttachment.slot,
    layer: "equipment",
    anchor: "bottom-center",
  });
  const resolved = resolveOfficeLayout(duplicate, geometry.assets, geometry.slotSets);
  assert.ok(resolved.issues.some((issue) => issue.includes("parent slot already occupied")));
});

test("floor footprints cannot overlap", () => {
  const overlapping = structuredClone(map);
  const plant = overlapping.objects.find((object) => object.id === "work-plant-a");
  assert.ok(plant);
  plant.x = 1;
  plant.y = 17;
  const resolved = resolveOfficeLayout(overlapping, geometry.assets, geometry.slotSets);
  const issues = validateOfficeLayout(overlapping, geometry.assets, resolved);
  assert.ok(issues.some((issue) => issue.includes("work-plant-a overlaps work-plant-b")));
});
