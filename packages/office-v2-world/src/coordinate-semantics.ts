import type {
  CellPosition,
  ScreenFacing,
  SubCellPosition,
  WorldFacing,
} from "@affiliate-ops/office-v2-contracts";

export const SUBCELL_UNITS_PER_CELL = 4;

export type SubCellOffset = 0 | 1 | 2 | 3;

export interface SubCellDecomposition {
  readonly cell: CellPosition;
  readonly offsetX: SubCellOffset;
  readonly offsetY: SubCellOffset;
}

function requireSafeInteger(value: number, field: string): void {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`projection.coordinate-integrality: ${field}`);
  }
}

function requireNonNegativeSafeInteger(value: number, field: string): void {
  requireSafeInteger(value, field);
  if (value < 0) {
    throw new RangeError(`projection.coordinate-range: ${field}`);
  }
}

function requireCellPosition(position: CellPosition): void {
  if (position.space !== "cell") {
    throw new TypeError("projection.coordinate-space-mismatch: expected cell");
  }
  requireSafeInteger(position.x, "cell.x");
  requireSafeInteger(position.y, "cell.y");
  requireNonNegativeSafeInteger(position.elevation, "cell.elevation");
}

function requireSubCellPosition(position: SubCellPosition): void {
  if (position.space !== "sub-cell") {
    throw new TypeError("projection.coordinate-space-mismatch: expected sub-cell");
  }
  requireSafeInteger(position.x, "sub-cell.x");
  requireSafeInteger(position.y, "sub-cell.y");
  requireNonNegativeSafeInteger(position.elevation, "sub-cell.elevation");
}

function multiplyCellCoordinate(value: number, field: string): number {
  const subCellValue = value * SUBCELL_UNITS_PER_CELL;
  if (!Number.isSafeInteger(subCellValue)) {
    throw new RangeError(`projection.coordinate-range: ${field}`);
  }
  return subCellValue;
}

/** Convert a whole-cell origin to the equivalent fixed-point sub-cell origin. */
export function cellOriginToSubCell(position: CellPosition): SubCellPosition {
  requireCellPosition(position);
  return {
    space: "sub-cell",
    x: multiplyCellCoordinate(position.x, "cell.x"),
    y: multiplyCellCoordinate(position.y, "cell.y"),
    elevation: position.elevation,
  } as SubCellPosition;
}

/** Split a fixed-point sub-cell position using mathematical floor division. */
export function splitSubCellPosition(position: SubCellPosition): SubCellDecomposition {
  requireSubCellPosition(position);
  const cellX = Math.floor(position.x / SUBCELL_UNITS_PER_CELL);
  const cellY = Math.floor(position.y / SUBCELL_UNITS_PER_CELL);
  const offsetX = position.x - cellX * SUBCELL_UNITS_PER_CELL;
  const offsetY = position.y - cellY * SUBCELL_UNITS_PER_CELL;
  if (offsetX < 0 || offsetX >= SUBCELL_UNITS_PER_CELL || offsetY < 0 || offsetY >= SUBCELL_UNITS_PER_CELL) {
    throw new RangeError("projection.coordinate-range: sub-cell offset");
  }
  return {
    cell: {
      space: "cell",
      x: cellX,
      y: cellY,
      elevation: position.elevation,
    } as CellPosition,
    offsetX: offsetX as SubCellOffset,
    offsetY: offsetY as SubCellOffset,
  };
}

/** Map projection-independent world facing to the presentation facing vocabulary. */
export function worldFacingToScreenFacing(facing: WorldFacing): ScreenFacing {
  switch (facing) {
    case "north":
      return "north-east";
    case "east":
      return "south-east";
    case "south":
      return "south-west";
    case "west":
      return "north-west";
    default:
      throw new RangeError(`projection.facing-invalid: ${String(facing)}`);
  }
}

/** Map a presentation facing back to the projection-independent world facing. */
export function screenFacingToWorldFacing(facing: ScreenFacing): WorldFacing {
  switch (facing) {
    case "north-east":
      return "north";
    case "south-east":
      return "east";
    case "south-west":
      return "south";
    case "north-west":
      return "west";
    default:
      throw new RangeError(`projection.facing-invalid: ${String(facing)}`);
  }
}
