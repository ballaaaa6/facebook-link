import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import type { OfficeWorkstationBundleV1 } from "@affiliate-ops/contracts";
import {
  screenFrameAt,
  stationSortPivotY,
  validateWorkstationLabMap,
  workstationLayerDepths,
  type WorkstationLabMap,
} from "../src/features/office/workstation/workstationBundleRuntime.ts";

const bundle = JSON.parse(readFileSync(new URL(
  "../../../assets/game/manifests/office-workstation-bundle-v1.json",
  import.meta.url,
), "utf8")) as OfficeWorkstationBundleV1;
const map = JSON.parse(readFileSync(new URL(
  "../../../assets/game/maps/office-workstation-v1-lab.json",
  import.meta.url,
), "utf8")) as WorkstationLabMap;
const activeMap = JSON.parse(readFileSync(new URL(
  "../../../assets/game/maps/office-c-v2.json",
  import.meta.url,
), "utf8")) as { id: string };
const activeRegistrySource = readFileSync(new URL(
  "../src/features/office/components/officeAssetRegistry.ts",
  import.meta.url,
), "utf8");

test("the rejected Workstation v1 slice remains valid evidence and isolated from Active Office", () => {
  assert.deepEqual(validateWorkstationLabMap(map, bundle), []);
  assert.equal(map.status, "rejected-geometry");
  assert.equal(map.activeOfficePromotion, false);
  assert.equal(activeMap.id, "office-c-v2-integer");
  assert.notEqual(activeMap.id, map.id);
  assert.equal(activeRegistrySource.includes("desk.modular.v1"), false);
});

test("the two rejected v1 footprints remain stable regression evidence", () => {
  const [far, near] = map.stations;
  assert.ok(far && near);
  assert.deepEqual(far.footprint, { x: 5, y: 3, width: 5, depth: 4 });
  assert.deepEqual(near.footprint, { x: 5, y: 7, width: 5, depth: 4 });
  assert.equal(far.footprint.y + far.footprint.depth, near.footprint.y);
  assert.equal(far.seat.y + far.seat.depth, far.footprint.y);
  assert.equal(near.footprint.y + near.footprint.depth, near.seat.y);
  assert.equal(far.facing, "down");
  assert.equal(near.facing, "up");
});

test("depth order derives from sortPivot and preserves semantic composition order", () => {
  for (const station of map.stations) {
    const pivot = stationSortPivotY(station);
    const depths = workstationLayerDepths(pivot);
    assert.equal(pivot, station.footprint.y + 4);
    assert.ok(depths["desk-rear"] < depths["desk-surface"]);
    assert.ok(depths["desk-surface"] < depths["monitor-shell"]);
    assert.ok(depths["monitor-shell"] < depths["monitor-viewport"]);
    assert.ok(depths.actor < depths["desk-foreground"]);
  }
  assert.ok(stationSortPivotY(map.stations[0]!) < stationSortPivotY(map.stations[1]!));
});

test("the viewport-local four-frame loop is stable over the thirty-second gate", () => {
  assert.equal(bundle.screenLoop.coordinateSpace, "viewport-local");
  assert.equal(bundle.screenLoop.parentViewportId, bundle.monitorFamily.viewport.id);
  const samples = Array.from({ length: 61 }, (_, index) => index * 500);
  for (const elapsed of samples) {
    const frame = screenFrameAt(elapsed, bundle.screenLoop.frameDurationMs, bundle.screenLoop.frameAssetIds.length);
    assert.ok(frame >= 0 && frame < 4);
    assert.equal(frame, Math.floor(elapsed / 500) % 4);
  }
  assert.equal(samples.at(-1), 30_000);
});

test("all sixteen rejected v1 desk parts remain preserved by exact render size", () => {
  for (const orientation of ["front", "back", "left", "right"] as const) {
    for (const part of ["rear", "surface", "base", "foreground"] as const) {
      const file = new URL(
        `../../../assets/game/processed/office-workstation-v1/desk.modular.${orientation}.${part}.png`,
        import.meta.url,
      );
      assert.equal(existsSync(file), true);
      const bytes = readFileSync(file);
      assert.equal(bytes.readUInt32BE(16), 160);
      assert.equal(bytes.readUInt32BE(20), 160);
    }
  }
});
