import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  resolveOfficeLayout,
  validateOfficeLayout,
} from "../src/features/office/layout/officeLayout.ts";
import {
  modernOfficeLabId,
  modernOfficeLabPresentationAt,
  modernOfficeLabRows,
  modernOfficeLabStabilitySamples,
} from "../src/features/office/lab/modernOfficeLabContract.ts";
import type { OfficeMapDefinition } from "../src/features/office/officeTypes.ts";

interface GeometryManifest {
  assets: Parameters<typeof resolveOfficeLayout>[1];
  slotSets: Parameters<typeof resolveOfficeLayout>[2];
}

interface OfficeLibraryManifest {
  id: string;
  status: string;
  sheets: Array<{
    assets: Array<Parameters<typeof resolveOfficeLayout>[1][string] & {
      id: string;
      file: string;
    }>;
  }>;
}

const map = JSON.parse(
  readFileSync(new URL("../../../assets/game/maps/office-c-v2.json", import.meta.url), "utf8"),
) as OfficeMapDefinition;
const labMap = JSON.parse(
  readFileSync(new URL("../../../assets/game/maps/office-facility-v1-lab.json", import.meta.url), "utf8"),
) as OfficeMapDefinition;
const geometry = JSON.parse(
  readFileSync(new URL("../../../assets/game/manifests/office-assets.json", import.meta.url), "utf8"),
) as GeometryManifest;
const officeLibrary = JSON.parse(
  readFileSync(new URL("../../../assets/game/manifests/office-library-sheets.json", import.meta.url), "utf8"),
) as OfficeLibraryManifest;
const labAssetIds = new Set([
  ...labMap.workstations.flatMap(({ desk, chair }) => [desk, chair]),
  ...labMap.objects.map(({ asset }) => asset),
]);
const labAssets = Object.fromEntries(
  officeLibrary.sheets
    .flatMap(({ assets }) => assets)
    .filter(({ id }) => labAssetIds.has(id))
    .map((asset) => [asset.id, asset]),
) as GeometryManifest["assets"];
labAssets["desk.workstation.front"]!.slotSet = "modern-workstation-front";
labAssets["desk.workstation.back"]!.slotSet = "modern-workstation-back";
const labSlotSets: GeometryManifest["slotSets"] = {
  "modern-workstation-front": {
    monitor: { x: 0, y: 0, surface: "desk-surface" },
    keyboard: { x: 0, y: 1, surface: "desk-surface" },
  },
  "modern-workstation-back": {
    monitor: { x: 0, y: 0, surface: "desk-surface" },
    keyboard: { x: 0, y: 1, surface: "desk-surface" },
  },
};

test("the Office C map has no occupancy or support violations", () => {
  const resolved = resolveOfficeLayout(map, geometry.assets, geometry.slotSets);
  assert.deepEqual(validateOfficeLayout(map, geometry.assets, resolved), []);
});

test("the isolated Office lab has valid geometry without replacing the active map", () => {
  const resolved = resolveOfficeLayout(labMap, labAssets, labSlotSets);
  assert.deepEqual(validateOfficeLayout(labMap, labAssets, resolved), []);
  assert.equal(map.id, "office-c-v2-integer");
  assert.equal(labMap.id, modernOfficeLabId);
  assert.notEqual(map.id, labMap.id);
});

test("the Part 1 lab uses only the modern-bright asset library", () => {
  assert.equal(officeLibrary.id, "office-library-modern-bright-v1");
  assert.equal(officeLibrary.status, "library-only");
  const usedIds = [
    ...labMap.workstations.flatMap(({ desk, chair }) => [desk, chair]),
    ...labMap.objects.map(({ asset }) => asset),
  ];
  const forbidden = [
    "desk.standard.up",
    "desk.creative.up",
    "desk.noc.up",
    "chair.office.up",
    "chair.studio.up",
  ];
  for (const id of usedIds) {
    const asset = officeLibrary.sheets.flatMap(({ assets }) => assets).find((item) => item.id === id);
    assert.ok(asset, `${id} must come from the modern-bright library`);
    assert.match(asset.file, /^assets\/game\/processed\/office-library-modern-bright-v1\//);
    assert.equal(forbidden.includes(id), false);
  }
});

test("the Part 1 lab arranges one continuous paired block of ten desks", () => {
  assert.equal(labMap.workstations.length, 10);
  const rows = Map.groupBy(labMap.workstations, ({ y }) => y);
  assert.deepEqual([...rows.keys()], [9, 11]);
  for (const row of rows.values()) {
    assert.deepEqual(row.map(({ x }) => x), [5, 8, 11, 14, 17]);
    for (let index = 1; index < row.length; index += 1) {
      assert.equal(row[index]!.collision.x, row[index - 1]!.collision.x + 3);
    }
  }
  const [rowA, rowB] = [...rows.values()];
  assert.ok(rowA && rowB);
  for (let index = 0; index < 5; index += 1) {
    assert.equal(rowA[index]!.collision.y + rowA[index]!.collision.height, rowB[index]!.collision.y);
  }
});

test("the Part 1 lab preserves wall clearance, seat direction, and the front aisle", () => {
  const clearance = labMap.routes.find(({ id }) => id === "wall-clearance");
  const aisle = labMap.routes.find(({ id }) => id === "front-aisle");
  assert.deepEqual(clearance, { id: "wall-clearance", x: 0, y: 4, width: 24, height: 1 });
  assert.deepEqual(aisle, { id: "front-aisle", x: 0, y: 15, width: 24, height: 3 });
  for (const station of labMap.workstations.slice(0, 5)) {
    assert.equal(station.facing, "down");
    assert.equal(station.seat.y, 8);
    assert.equal(station.desk, modernOfficeLabRows["row-a"].desk);
    assert.equal(station.chair, modernOfficeLabRows["row-a"].chair);
  }
  for (const station of labMap.workstations.slice(5)) {
    assert.equal(station.facing, "up");
    assert.equal(station.seat.y, 14);
    assert.equal(station.desk, modernOfficeLabRows["row-b"].desk);
    assert.equal(station.chair, modernOfficeLabRows["row-b"].chair);
  }
});

test("the Part 1 lab contains no facilities, companions, or decorative furniture", () => {
  assert.deepEqual(labMap.pois, []);
  assert.deepEqual(labMap.companions, []);
  assert.equal(labMap.objects.length, 20);
  assert.equal(labMap.objects.filter(({ asset }) => asset.startsWith("monitor.")).length, 10);
  assert.equal(labMap.objects.filter(({ asset }) => asset === "keyboard.mouse").length, 10);
  assert.equal(labMap.objects.some(({ layer }) => layer === "decor" || layer === "furniture"), false);
});

test("the Part 1 pose split stays seated and stable for thirty seconds", () => {
  const snapshots = modernOfficeLabStabilitySamples.map((elapsed) =>
    modernOfficeLabPresentationAt(elapsed, labMap));
  for (const snapshot of snapshots) {
    const presentations = Object.values(snapshot);
    assert.equal(presentations.length, 10);
    assert.equal(presentations.filter(({ state }) => state === "working-front-seated").length, 5);
    assert.equal(presentations.filter(({ state }) => state === "working-back-seated").length, 5);
    assert.equal(presentations.every(({ seated }) => seated), true);
  }
  assert.deepEqual(snapshots[1], snapshots[0]);
  assert.deepEqual(snapshots[2], snapshots[0]);
  assert.deepEqual(snapshots[3], snapshots[0]);
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
