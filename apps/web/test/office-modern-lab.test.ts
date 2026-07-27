import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { pairedObjectDepth } from "../src/features/office/components/workstationLayering.ts";
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

const activeMap = JSON.parse(
  readFileSync(new URL("../../../assets/game/maps/office-c-v2.json", import.meta.url), "utf8"),
) as OfficeMapDefinition;
const labMap = JSON.parse(
  readFileSync(new URL("../../../assets/game/maps/office-facility-v1-lab.json", import.meta.url), "utf8"),
) as OfficeMapDefinition;
const officeLibrary = JSON.parse(
  readFileSync(new URL("../../../assets/game/manifests/office-library-sheets.json", import.meta.url), "utf8"),
) as OfficeLibraryManifest;
const keyboardOnlyFile = new URL(
  "../../../assets/game/processed/office-facility-v1-lab/derived/keyboard.only.png",
  import.meta.url,
);
const malformedKeyboardFile = new URL(
  "../../../assets/game/processed/office-library-modern-bright-v1/env-01-workstation-static/keyboard.mouse.png",
  import.meta.url,
);
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
labAssets["keyboard.only"] = {
  physicalScale: { width: 1.2, depth: 0.5, height: 0.65 },
  renderBox: { width: 1.2, height: 0.65 },
  footprint: { width: 1, depth: 1 },
  layer: "equipment",
  anchor: "bottom-center",
  supports: ["desk-surface"],
};
const preciseSlots = {
  monitor: { x: 0, y: -0.55, surface: "desk-surface" as const },
  keyboard: { x: 0, y: -0.3, surface: "desk-surface" as const },
  "prop-front-left": { x: -1, y: -0.1, surface: "desk-surface" as const },
  "prop-front-right": { x: 1, y: -0.1, surface: "desk-surface" as const },
  "prop-rear-left": { x: -1, y: -0.55, surface: "desk-surface" as const },
  "prop-rear-right": { x: 1, y: -0.55, surface: "desk-surface" as const },
};
const labSlotSets: GeometryManifest["slotSets"] = {
  "modern-workstation-front": preciseSlots,
  "modern-workstation-back": preciseSlots,
};

function pngDimensions(file: URL) {
  const bytes = readFileSync(file);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

test("the isolated Office lab has valid geometry without replacing the active map", () => {
  const resolved = resolveOfficeLayout(labMap, labAssets, labSlotSets);
  assert.deepEqual(validateOfficeLayout(labMap, labAssets, resolved), []);
  assert.equal(activeMap.id, "office-c-v2-integer");
  assert.equal(labMap.id, modernOfficeLabId);
  assert.notEqual(activeMap.id, labMap.id);
});

test("the Part 1 lab uses only modern-bright assets and the derived clean keyboard", () => {
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
    if (id === "keyboard.only") {
      assert.equal(existsSync(keyboardOnlyFile), true);
      assert.deepEqual(pngDimensions(keyboardOnlyFile), { width: 240, height: 130 });
      assert.deepEqual(pngDimensions(malformedKeyboardFile), { width: 284, height: 130 });
      continue;
    }
    const asset = officeLibrary.sheets.flatMap(({ assets }) => assets).find((item) => item.id === id);
    assert.ok(asset, `${id} must come from the modern-bright library`);
    assert.match(asset.file, /^assets\/game\/processed\/office-library-modern-bright-v1\//);
    assert.equal(forbidden.includes(id), false);
  }
});

test("the Part 1 lab arranges one continuous paired block of ten desks", () => {
  assert.equal(labMap.workstations.length, 10);
  const rows = Map.groupBy(labMap.workstations, ({ y }) => y);
  assert.deepEqual([...rows.keys()], [8, 10]);
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
  assert.deepEqual(aisle, { id: "front-aisle", x: 0, y: 14, width: 24, height: 3 });
  for (const station of labMap.workstations.slice(0, 5)) {
    assert.equal(station.facing, "down");
    assert.equal(station.seat.y, 7);
    assert.equal(station.desk, modernOfficeLabRows["row-a"].desk);
    assert.equal(station.chair, modernOfficeLabRows["row-a"].chair);
  }
  for (const station of labMap.workstations.slice(5)) {
    assert.equal(station.facing, "up");
    assert.equal(station.seat.y, 13);
    assert.equal(station.desk, modernOfficeLabRows["row-b"].desk);
    assert.equal(station.chair, modernOfficeLabRows["row-b"].chair);
  }
});

test("the Part 1 lab contains only the ten monitor and clean-keyboard pairs", () => {
  assert.deepEqual(labMap.pois, []);
  assert.deepEqual(labMap.companions, []);
  assert.equal(labMap.objects.length, 20);
  assert.equal(labMap.objects.filter(({ asset }) => asset.startsWith("monitor.")).length, 10);
  assert.equal(labMap.objects.filter(({ asset }) => asset === "keyboard.only").length, 10);
  assert.equal(labMap.objects.some(({ asset }) => asset === "keyboard.mouse"), false);
  assert.equal(labMap.objects.some(({ layer }) => layer === "decor" || layer === "furniture"), false);
});

test("desk equipment uses precise surface slots and near-row props stay behind actors", () => {
  const resolved = resolveOfficeLayout(labMap, labAssets, labSlotSets);
  for (const station of labMap.workstations) {
    const monitor = resolved.objects.find(({ parentId, slot }) =>
      parentId === station.id && slot === "monitor");
    const keyboard = resolved.objects.find(({ parentId, slot }) =>
      parentId === station.id && slot === "keyboard");
    assert.ok(monitor);
    assert.ok(keyboard);
    assert.equal(monitor.x, station.x);
    assert.equal(monitor.y, station.y - 0.55);
    assert.equal(keyboard.x, station.x);
    assert.equal(keyboard.y, station.y - 0.3);
    assert.ok(keyboard.x - 0.6 >= station.x - 1.5);
    assert.ok(keyboard.x + 0.6 <= station.x + 1.5);
    assert.ok(keyboard.y - 0.65 >= station.y - 1);
    assert.ok(keyboard.y <= station.y + 1);
    const objectDepth = pairedObjectDepth(keyboard, labMap.workstations);
    const actorDepth = 97 + Math.round(station.y * 20);
    if (station.facing === "up") assert.ok((objectDepth ?? Infinity) < actorDepth);
    else assert.ok((objectDepth ?? -Infinity) > actorDepth);
  }
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
