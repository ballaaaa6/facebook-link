import assert from "node:assert/strict";
import test from "node:test";
import type {
  FloorLocalCellPosition,
  FloorLocalSubCellPosition,
  ScreenPixelPosition,
} from "@affiliate-ops/office-v2-contracts";
import {
  ELEVATION_HEIGHT_PX,
  HALF_TILE_HEIGHT_PX,
  HALF_TILE_WIDTH_PX,
  OFFICE_PROJECTION_ID,
  project,
  projectGround,
  unprojectGround,
  type ProjectionBounds,
} from "../src/projection.ts";

const floor = {
  id: { kind: "floor", value: "ground-floor" },
  version: 1,
} as const;

const bounds: ProjectionBounds = {
  floor: floor as ProjectionBounds["floor"],
  width: 4,
  depth: 4,
  maxElevation: 2,
};

const origin = { xPx: 320, yPx: 64 };

function cell(x: number, y: number, elevation = 0): FloorLocalCellPosition {
  return {
    space: "floor-local-cell",
    floor: { id: { kind: "floor", value: floor.id.value }, version: floor.version },
    coordinate: { space: "cell", x, y, elevation },
  } as FloorLocalCellPosition;
}

function subCell(x: number, y: number, elevation = 0): FloorLocalSubCellPosition {
  return {
    space: "floor-local-sub-cell",
    floor: { id: { kind: "floor", value: floor.id.value }, version: floor.version },
    coordinate: { space: "sub-cell", x, y, elevation },
  } as FloorLocalSubCellPosition;
}

function screen(xPx: number, yPx: number): ScreenPixelPosition {
  return { space: "screen-pixel", xPx, yPx } as ScreenPixelPosition;
}

test("matches every office-projection-v1 round-trip fixture case", () => {
  const cases = [
    ["origin", cell(0, 0, 0), { xPx: 320, yPx: 64 }],
    ["east-cell", cell(1, 0, 0), { xPx: 352, yPx: 80 }],
    ["south-cell", cell(0, 1, 0), { xPx: 288, yPx: 80 }],
    ["mixed-cell", cell(2, 1, 0), { xPx: 352, yPx: 112 }],
    ["elevated-cell", cell(2, 1, 1), { xPx: 352, yPx: 96 }],
  ] as const;
  for (const [name, position, expected] of cases) {
    const result = project(position, { bounds, origin });
    assert.equal(result.projectionId, OFFICE_PROJECTION_ID, name);
    assert.deepEqual({ xPx: result.xPx, yPx: result.yPx }, expected, name);
    assert.deepEqual(result.screen, screen(expected.xPx, expected.yPx), name);
    assert.deepEqual(
      result.groundContact,
      screen(expected.xPx, expected.yPx + position.coordinate.elevation * ELEVATION_HEIGHT_PX),
      name,
    );
  }
});

test("projects sub-cell positions with the fixed four-unit cell scale", () => {
  const result = project(subCell(2, 1, 1), { origin });
  assert.deepEqual({ xPx: result.xPx, yPx: result.yPx }, {
    xPx: origin.xPx + HALF_TILE_WIDTH_PX / 4,
    yPx: origin.yPx + HALF_TILE_HEIGHT_PX * 3 / 4 - ELEVATION_HEIGHT_PX,
  });
  assert.deepEqual(result.groundContact, screen(result.xPx, result.yPx + ELEVATION_HEIGHT_PX));
});

test("keeps negative sub-cell floor semantics and rejects bounded overflow", () => {
  const result = project(subCell(-1, 3), { origin });
  assert.deepEqual({ xPx: result.xPx, yPx: result.yPx }, { xPx: 288, yPx: 72 });
  assert.throws(
    () => project(cell(bounds.width, 0), { bounds, origin }),
    /projection\.coordinate-out-of-bounds/,
  );
  assert.throws(
    () => project(subCell(bounds.width * 4, 0), { bounds, origin }),
    /projection\.coordinate-out-of-bounds/,
  );
});

test("inverse ground picking round-trips interior and outer boundary cells", () => {
  const positions = [cell(1, 2), cell(0, 0), cell(3, 3), cell(0, 3)];
  for (const position of positions) {
    const projected = projectGround(position, { bounds, origin });
    // Cell projection is the north-corner anchor; move to the cell interior
    // before inverse picking so the edge policy is not involved.
    const picked = unprojectGround(screen(projected.xPx, projected.yPx + 16), { bounds, origin });
    assert.deepEqual(picked.coordinate, position.coordinate);
    assert.deepEqual(picked.floor, position.floor);
  }
});

test("inverse ground picking uses lower y then lower x on exact shared edges", () => {
  const baseX = origin.xPx;
  const baseY = origin.yPx;
  // xWorld = 1 is the shared edge between x=0 and x=1 at yWorld = 0.5.
  const xEdge = screen(baseX + 16, baseY + 24);
  assert.deepEqual(unprojectGround(xEdge, { bounds, origin }).coordinate, {
    space: "cell",
    x: 0,
    y: 0,
    elevation: 0,
  });
  // yWorld = 1 is the shared edge between y=0 and y=1 at xWorld = 0.5.
  const yEdge = screen(baseX - 16, baseY + 24);
  assert.deepEqual(unprojectGround(yEdge, { bounds, origin }).coordinate, {
    space: "cell",
    x: 0,
    y: 0,
    elevation: 0,
  });
  // Both axes are shared at this corner, so the lowest y and then x wins.
  const corner = screen(baseX, baseY + 32);
  assert.deepEqual(unprojectGround(corner, { bounds, origin }).coordinate, {
    space: "cell",
    x: 0,
    y: 0,
    elevation: 0,
  });
});

test("outside and degenerate bounds fail closed", () => {
  assert.throws(
    () => unprojectGround(screen(origin.xPx - 7, origin.yPx), { bounds, origin }),
    /projection\.inverse-outside/,
  );
  assert.throws(
    () => unprojectGround(screen(origin.xPx, origin.yPx), {
      bounds: { ...bounds, width: 0 },
      origin,
    }),
    /projection\.bounds-invalid/,
  );
  assert.throws(
    () => unprojectGround(screen(Number.NaN, origin.yPx), { bounds, origin }),
    /projection\.point-invalid/,
  );
  assert.throws(
    () => unprojectGround(screen(origin.xPx, origin.yPx), { bounds: undefined }),
    /projection\.bounds-required/,
  );
});

test("rejects wrong spaces, floor mismatches, unsafe inputs, and overflow", () => {
  assert.throws(
    () => project({ space: "cell", x: 0, y: 0, elevation: 0 } as never, { bounds, origin }),
    /projection\.coordinate-space-mismatch/,
  );
  assert.throws(
    () => project({
      ...cell(0, 0),
      floor: { id: { kind: "floor", value: "other-floor" }, version: 1 },
    } as never, { bounds, origin }),
    /projection\.floor-mismatch/,
  );
  assert.throws(
    () => project(cell(Number.MAX_SAFE_INTEGER, 0), { origin }),
    /projection\.coordinate-overflow|projection\.coordinate-range/,
  );
  assert.throws(
    () => project(cell(1, 0), { origin: { xPx: Number.MAX_SAFE_INTEGER, yPx: 0 } }),
    /projection\.pixel-overflow/,
  );
  assert.throws(
    () => project({
      ...subCell(0, 0),
      coordinate: { space: "cell", x: 0, y: 0, elevation: 0 },
    } as never, { origin }),
    /projection\.coordinate-space-mismatch/,
  );
});

test("repeated projection is byte-identical and does not mutate input", () => {
  const position = subCell(3, 5, 1);
  const before = JSON.stringify(position);
  const first = project(position, { origin });
  const second = project(position, { origin });
  assert.equal(JSON.stringify(first), JSON.stringify(second));
  assert.equal(JSON.stringify(position), before);
  assert.equal(Number.isFinite(first.xPx), true);
  assert.equal(Number.isFinite(first.yPx), true);
});
