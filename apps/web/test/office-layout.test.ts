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

test("the Office C map declares distinct floor and wall placement surfaces", () => {
  assert.deepEqual(
    map.surfaces.map(({ id, support }) => ({ id, support })),
    [
      { id: "office-floor", support: "floor" },
      { id: "back-wall", support: "wall" },
    ],
  );
  for (const object of map.objects) {
    if (object.parentId) {
      assert.equal(object.surfaceId, undefined);
      continue;
    }
    const surface = map.surfaces.find(({ id }) => id === object.surfaceId);
    assert.ok(surface, `${object.id} needs an explicit structural surface`);
    assert.ok(geometry.assets[object.asset]?.supports.includes(surface.support));
  }
});

test("the Office C authoring contract uses integer tiles only", () => {
  assert.equal(map.width, 36);
  assert.equal(map.height, 24);
  assert.deepEqual(map.zones.map(({ width }) => width), [24, 12]);
  for (const geometryEntry of Object.values(geometry.assets)) {
    assert.ok(Number.isInteger(geometryEntry.physicalScale?.width));
    assert.ok(Number.isInteger(geometryEntry.physicalScale?.depth));
    assert.ok(Number.isInteger(geometryEntry.physicalScale?.height));
    assert.ok((geometryEntry.physicalScale?.width ?? 0) > 0);
    assert.ok((geometryEntry.physicalScale?.depth ?? -1) >= 0);
    assert.ok((geometryEntry.physicalScale?.height ?? 0) > 0);
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

test("every workstation uses a monitor without a keyboard visual", () => {
  const workstationIds = new Set(map.workstations.map((station) => station.id));
  const attachments = map.objects.filter((object) => object.parentId && workstationIds.has(object.parentId));
  assert.equal(attachments.some((object) => object.asset === "keyboard.mouse"), false);
  for (const station of map.workstations) {
    assert.ok(
      attachments.some((object) => object.parentId === station.id && object.asset.startsWith("monitor.")),
      `${station.id} needs a monitor`,
    );
  }
});

test("the support zone separates service, pantry, lounge, and symmetric meeting furniture", () => {
  const object = (id: string) => {
    const match = map.objects.find((candidate) => candidate.id === id);
    assert.ok(match && typeof match.x === "number" && typeof match.y === "number");
    return match as typeof match & { x: number; y: number };
  };
  assert.ok(object("server-a").y < object("coffee-counter").y);
  assert.ok(object("server-b").y < object("water-dispenser").y);
  assert.ok(object("coffee-counter").y < object("lounge-sofa").y);
  assert.ok(object("lounge-sofa").y < object("cafe-table-a").y);
  assert.equal(object("cafe-table-a").y, object("cafe-table-b").y);
  assert.equal(object("cafe-chair-a1").x, object("cafe-table-a").x);
  assert.equal(object("cafe-chair-a2").x, object("cafe-table-a").x);
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

test("wall assets cannot be placed on the floor", () => {
  const invalid = structuredClone(map);
  const television = invalid.objects.find((object) => object.id === "lounge-tv");
  assert.ok(television);
  television.surfaceId = "office-floor";
  const resolved = resolveOfficeLayout(invalid, geometry.assets, geometry.slotSets);
  assert.ok(resolved.issues.some((issue) => issue.includes("wall cannot use floor surface office-floor")));
});

test("coordinate placement cannot bypass a required furniture slot", () => {
  const invalid = structuredClone(map);
  const monitor = invalid.objects.find((object) => object.id === "market-monitor");
  assert.ok(monitor);
  delete monitor.parentId;
  delete monitor.slot;
  monitor.surfaceId = "office-floor";
  monitor.x = 4;
  monitor.y = 6;
  const resolved = resolveOfficeLayout(invalid, geometry.assets, geometry.slotSets);
  assert.ok(resolved.issues.some((issue) => issue.includes("desk-surface cannot use floor surface office-floor")));
});

test("coordinate placement requires an explicit structural surface", () => {
  const invalid = structuredClone(map);
  const plant = invalid.objects.find((object) => object.id === "work-plant-a");
  assert.ok(plant);
  delete plant.surfaceId;
  const resolved = resolveOfficeLayout(invalid, geometry.assets, geometry.slotSets);
  assert.ok(resolved.issues.some((issue) => issue.includes("unknown placement surface (missing)")));
});

test("wall anchors must remain inside their declared wall region", () => {
  const invalid = structuredClone(map);
  const television = invalid.objects.find((object) => object.id === "lounge-tv");
  assert.ok(television);
  television.y = 5;
  const resolved = resolveOfficeLayout(invalid, geometry.assets, geometry.slotSets);
  const issues = validateOfficeLayout(invalid, geometry.assets, resolved);
  assert.ok(issues.some((issue) => issue.includes("lounge-tv: anchor leaves surface back-wall")));
});

test("floor footprints must remain inside their declared floor region", () => {
  const invalid = structuredClone(map);
  const plant = invalid.objects.find((object) => object.id === "work-plant-a");
  assert.ok(plant);
  plant.x = 0;
  const resolved = resolveOfficeLayout(invalid, geometry.assets, geometry.slotSets);
  const issues = validateOfficeLayout(invalid, geometry.assets, resolved);
  assert.ok(issues.some((issue) => issue.includes("work-plant-a: footprint leaves surface office-floor")));
});

test("workstations require a declared floor surface", () => {
  const invalid = structuredClone(map);
  invalid.workstations[0]!.surfaceId = "back-wall";
  const resolved = resolveOfficeLayout(invalid, geometry.assets, geometry.slotSets);
  const issues = validateOfficeLayout(invalid, geometry.assets, resolved);
  assert.ok(issues.some((issue) => issue.includes("market-scout: workstation requires a floor surface")));
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
