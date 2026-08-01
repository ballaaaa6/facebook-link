import assert from "node:assert/strict";
import test from "node:test";
import {
  cellOriginToSubCell,
  screenFacingToWorldFacing,
  splitSubCellPosition,
  worldFacingToScreenFacing,
} from "../src/coordinate-semantics.ts";

test("the four facing values form the accepted bijection", () => {
  const cases = [
    ["north", "north-east"],
    ["east", "south-east"],
    ["south", "south-west"],
    ["west", "north-west"],
  ] as const;
  for (const [worldFacing, screenFacing] of cases) {
    assert.equal(worldFacingToScreenFacing(worldFacing), screenFacing);
    assert.equal(screenFacingToWorldFacing(screenFacing), worldFacing);
  }
});

test("cell origins use four integer sub-cell units", () => {
  assert.deepEqual(
    cellOriginToSubCell({ space: "cell", x: -2, y: 3, elevation: 1 }),
    { space: "sub-cell", x: -8, y: 12, elevation: 1 },
  );
});

test("sub-cell splitting uses floor division for negative coordinates", () => {
  assert.deepEqual(
    splitSubCellPosition({ space: "sub-cell", x: -1, y: 3, elevation: 2 }),
    {
      cell: { space: "cell", x: -1, y: 0, elevation: 2 },
      offsetX: 3,
      offsetY: 3,
    },
  );
  assert.deepEqual(
    splitSubCellPosition({ space: "sub-cell", x: 4, y: -4, elevation: 0 }),
    {
      cell: { space: "cell", x: 1, y: -1, elevation: 0 },
      offsetX: 0,
      offsetY: 0,
    },
  );
});

test("cell conversion rejects unsafe multiplication and wrong spaces", () => {
  assert.throws(
    () => cellOriginToSubCell({ space: "cell", x: Number.MAX_SAFE_INTEGER, y: 0, elevation: 0 }),
    /projection\.coordinate-range: cell\.x/,
  );
  assert.throws(
    () => cellOriginToSubCell({ space: "sub-cell", x: 0, y: 0, elevation: 0 } as never),
    /projection\.coordinate-space-mismatch: expected cell/,
  );
  assert.throws(
    () => splitSubCellPosition({ space: "cell", x: 0, y: 0, elevation: 0 } as never),
    /projection\.coordinate-space-mismatch: expected sub-cell/,
  );
});

test("facing conversion rejects unknown runtime values", () => {
  assert.throws(
    () => worldFacingToScreenFacing("north-east" as never),
    /projection\.facing-invalid: north-east/,
  );
  assert.throws(
    () => screenFacingToWorldFacing("north" as never),
    /projection\.facing-invalid: north/,
  );
});
