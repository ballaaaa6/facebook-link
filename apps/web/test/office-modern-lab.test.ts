import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import {
  pairedObjectDepth,
  pairedWorkstationDepths,
  workstationDeskRenderPoint,
  workstationSeatRenderPoint,
} from "../src/features/office/components/workstationLayering.ts";
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
const rectangularDeskFiles = {
  "desk.workstation.viewer-front.v5": new URL(
    "../../../assets/game/processed/office-facility-v1-lab/derived/desk.workstation.viewer-front.v5.png",
    import.meta.url,
  ),
  "desk.workstation.viewer-back.v5": new URL(
    "../../../assets/game/processed/office-facility-v1-lab/derived/desk.workstation.viewer-back.v5.png",
    import.meta.url,
  ),
};
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
labAssets["desk.workstation.viewer-front.v5"] = {
  physicalScale: { width: 5, depth: 4, height: 2.4 },
  renderBox: { width: 5, height: 5 },
  fit: "fill",
  footprint: { width: 5, depth: 4 },
  layer: "furniture",
  anchor: "bottom-center",
  supports: ["floor"],
  slotSet: "rectangular-workstation-viewer-front",
};
labAssets["desk.workstation.viewer-back.v5"] = {
  physicalScale: { width: 5, depth: 4, height: 2.4 },
  renderBox: { width: 5, height: 5 },
  fit: "fill",
  footprint: { width: 5, depth: 4 },
  layer: "furniture",
  anchor: "bottom-center",
  supports: ["floor"],
  slotSet: "rectangular-workstation-viewer-back",
};
labAssets["keyboard.only"] = {
  physicalScale: { width: 1.8, depth: 0.65, height: 0.75 },
  renderBox: { width: 1.8, height: 0.75 },
  footprint: { width: 1, depth: 1 },
  layer: "equipment",
  anchor: "bottom-center",
  supports: ["desk-surface"],
};
for (const monitorId of ["monitor.front", "monitor.back"]) {
  labAssets[monitorId] = {
    physicalScale: { width: 2, depth: 0.5, height: 2.1 },
    renderBox: { width: 2, height: 2.1 },
    footprint: { width: 1, depth: 1 },
    layer: "equipment",
    anchor: "bottom-center",
    supports: ["desk-surface"],
  };
}
function workstationSlots(farY: number, middleY: number, nearY: number) {
  const rows = { far: farY, middle: middleY, near: nearY };
  const slots: GeometryManifest["slotSets"][string] = {
    monitor: { x: 0.5, y: farY, surface: "desk-surface" },
    keyboard: { x: 0.5, y: middleY, surface: "desk-surface" },
  };
  for (const [side, xValues] of [
    ["left", [-1.5, -0.5]],
    ["right", [1.5, 2.5]],
  ] as const) {
    for (const [row, y] of Object.entries(rows)) {
      for (const [columnIndex, x] of xValues.entries()) {
        slots[`prop-${side}-${row}-${columnIndex + 1}`] = {
          x,
          y,
          surface: "desk-surface",
        };
      }
    }
  }
  return slots;
}
const labSlotSets: GeometryManifest["slotSets"] = {
  "rectangular-workstation-viewer-back": workstationSlots(1.5, 0.5, -0.5),
  "rectangular-workstation-viewer-front": workstationSlots(-1.5, -0.5, 0.5),
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

test("the Part 1 lab uses rectangular v5 desks, modern-bright props, and the clean keyboard", () => {
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
    if (id in rectangularDeskFiles) {
      const file = rectangularDeskFiles[id as keyof typeof rectangularDeskFiles];
      assert.equal(existsSync(file), true);
      assert.deepEqual(pngDimensions(file), { width: 752, height: 508 });
      continue;
    }
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
  assert.deepEqual(labAssets["monitor.front"]?.footprint, { width: 1, depth: 1 });
  assert.deepEqual(labAssets["monitor.front"]?.renderBox, { width: 2, height: 2.1 });
  assert.deepEqual(labAssets["keyboard.only"]?.footprint, { width: 1, depth: 1 });
  assert.deepEqual(labAssets["keyboard.only"]?.renderBox, { width: 1.8, height: 0.75 });
});

test("the Part 1 lab arranges one continuous paired block of ten 5-by-4 desks", () => {
  assert.equal(labMap.workstations.length, 10);
  const rows = Map.groupBy(labMap.workstations, ({ y }) => y);
  assert.deepEqual([...rows.keys()], [8, 12]);
  for (const row of rows.values()) {
    assert.deepEqual(row.map(({ x }) => x), [4, 9, 14, 19, 24]);
    for (let index = 1; index < row.length; index += 1) {
      assert.equal(row[index]!.collision.x, row[index - 1]!.collision.x + 5);
    }
    assert.equal(row.every(({ collision }) => collision.width === 5 && collision.height === 4), true);
    for (const station of row) {
      assert.deepEqual(workstationDeskRenderPoint(station), {
        x: station.collision.x + 2.5,
        y: station.collision.y + 4,
      });
      assert.deepEqual(workstationSeatRenderPoint(station), {
        x: station.seatCollision!.x + 0.5,
        y: station.seatCollision!.y + 1,
      });
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
  assert.deepEqual(clearance, { id: "wall-clearance", x: 0, y: 4, width: 29, height: 1 });
  assert.deepEqual(aisle, { id: "front-aisle", x: 0, y: 16, width: 29, height: 4 });
  for (const station of labMap.workstations.slice(0, 5)) {
    assert.equal(station.facing, "down");
    assert.equal(station.seat.y, 6);
    assert.ok(station.seatCollision);
    assert.deepEqual(station.seatCollision, {
      x: station.x,
      y: 5,
      width: 1,
      height: 1,
    });
    assert.equal(station.seatCollision.y + station.seatCollision.height, station.collision.y);
    assert.equal(station.desk, modernOfficeLabRows["row-a"].desk);
    assert.equal(station.chair, modernOfficeLabRows["row-a"].chair);
  }
  for (const station of labMap.workstations.slice(5)) {
    assert.equal(station.facing, "up");
    assert.equal(station.seat.y, 15);
    assert.ok(station.seatCollision);
    assert.deepEqual(station.seatCollision, {
      x: station.x,
      y: 14,
      width: 1,
      height: 1,
    });
    assert.equal(station.collision.y + station.collision.height, station.seatCollision.y);
    assert.equal(station.desk, modernOfficeLabRows["row-b"].desk);
    assert.equal(station.chair, modernOfficeLabRows["row-b"].chair);
  }
});

test("the Part 1 lab contains ten equipment pairs and twenty sample desk props", () => {
  assert.deepEqual(labMap.pois, []);
  assert.deepEqual(labMap.companions, []);
  assert.equal(labMap.objects.length, 40);
  assert.equal(labMap.objects.filter(({ asset }) => asset.startsWith("monitor.")).length, 10);
  assert.equal(labMap.objects.filter(({ asset }) => asset === "keyboard.only").length, 10);
  assert.equal(labMap.objects.filter(({ slot }) => slot?.startsWith("prop-")).length, 20);
  assert.equal(labMap.objects.some(({ asset }) => asset === "keyboard.mouse"), false);
  assert.equal(labMap.objects.some(({ layer }) => layer === "furniture"), false);
  assert.equal(labMap.objects
    .filter(({ layer }) => layer === "decor")
    .every(({ slot }) => slot?.startsWith("prop-")), true);
});

test("each desk has six left and six right prop cells plus a mirrored center lane", () => {
  for (const slotSet of Object.values(labSlotSets)) {
    const propSlots = Object.entries(slotSet).filter(([slot]) => slot.startsWith("prop-"));
    assert.equal(propSlots.filter(([slot]) => slot.startsWith("prop-left-")).length, 6);
    assert.equal(propSlots.filter(([slot]) => slot.startsWith("prop-right-")).length, 6);
    assert.equal(new Set(propSlots.map(([, slot]) => `${slot.x}:${slot.y}`)).size, 12);
    assert.equal("prop-center-near" in slotSet, false);
  }

  const resolved = resolveOfficeLayout(labMap, labAssets, labSlotSets);
  for (const station of labMap.workstations) {
    const monitor = resolved.objects.find(({ parentId, slot }) =>
      parentId === station.id && slot === "monitor");
    const keyboard = resolved.objects.find(({ parentId, slot }) =>
      parentId === station.id && slot === "keyboard");
    assert.ok(monitor);
    assert.ok(keyboard);
    assert.equal(monitor.x, station.x + 0.5);
    assert.equal(keyboard.x, station.x + 0.5);
    assert.equal(keyboard.y, station.y + (station.facing === "down" ? 0.5 : -0.5));
    assert.equal(monitor.y, station.y + (station.facing === "down" ? 1.5 : -1.5));
    const propObjects = resolved.objects.filter(({ parentId, slot }) =>
      parentId === station.id && slot?.startsWith("prop-"));
    assert.equal(propObjects.length, 2);
    assert.equal(propObjects.every(({ x }) => x !== station.x + 0.5), true);
    const objectDepth = pairedObjectDepth(keyboard, labMap.workstations);
    const actorDepth = pairedWorkstationDepths(station).actor;
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
    assert.equal(presentations.every(({ renderOffset }) =>
      renderOffset?.x === 0.5 && renderOffset.y === 0), true);
  }
  assert.deepEqual(snapshots[1], snapshots[0]);
  assert.deepEqual(snapshots[2], snapshots[0]);
  assert.deepEqual(snapshots[3], snapshots[0]);
});
