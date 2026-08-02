import type {
  CellPosition,
  FloorLocalCellPosition,
  FloorLocalSubCellPosition,
  FloorReference,
  ProjectionId,
  ScreenPixelPosition,
  SubCellPosition,
} from "@affiliate-ops/office-v2-contracts";
import {
  cellOriginToSubCell,
  splitSubCellPosition,
  SUBCELL_UNITS_PER_CELL,
} from "./coordinate-semantics.ts";

export const OFFICE_PROJECTION_ID = "office-projection-v1" as ProjectionId;
export const TILE_WIDTH_PX = 64;
export const TILE_HEIGHT_PX = 32;
export const HALF_TILE_WIDTH_PX = TILE_WIDTH_PX / 2;
export const HALF_TILE_HEIGHT_PX = TILE_HEIGHT_PX / 2;
export const ELEVATION_HEIGHT_PX = 16;

export const OFFICE_PROJECTION_V1 = Object.freeze({
  id: OFFICE_PROJECTION_ID,
  tileWidthPx: TILE_WIDTH_PX,
  tileHeightPx: TILE_HEIGHT_PX,
  halfTileWidthPx: HALF_TILE_WIDTH_PX,
  halfTileHeightPx: HALF_TILE_HEIGHT_PX,
  elevationHeightPx: ELEVATION_HEIGHT_PX,
  subCellUnitsPerCell: SUBCELL_UNITS_PER_CELL,
  cameraRotation: 0,
});

const MAX_SAFE = Number.MAX_SAFE_INTEGER;

export type FloorLocalCoordinate = FloorLocalCellPosition | FloorLocalSubCellPosition;

export interface ProjectionOrigin { readonly xPx: number; readonly yPx: number; readonly space?: "screen-pixel"; }

/** The canonical floor-local envelope used by projection and ground picking. */
export interface ProjectionBounds { readonly floor: FloorReference; readonly width: number; readonly depth: number; readonly maxElevation: number; }

export interface ProjectionOptions { readonly bounds?: ProjectionBounds; readonly origin?: ProjectionOrigin; }

export type ProjectionDiagnosticCode = "projection.bounds-invalid" | "projection.bounds-overflow" | "projection.bounds-required"
  | "projection.coordinate-out-of-bounds" | "projection.coordinate-overflow" | "projection.coordinate-space-mismatch"
  | "projection.floor-reference-invalid" | "projection.floor-mismatch" | "projection.inverse-outside"
  | "projection.origin-invalid" | "projection.pixel-overflow" | "projection.point-invalid" | "projection.options-invalid";

export class ProjectionError extends RangeError {
  readonly code: ProjectionDiagnosticCode;

  constructor(code: ProjectionDiagnosticCode, message: string) {
    super(`${code}: ${message}`);
    this.name = "ProjectionError";
    this.code = code;
  }
}

export interface ProjectedPosition {
  readonly projectionId: ProjectionId; readonly xPx: number; readonly yPx: number;
  readonly screen: ScreenPixelPosition; readonly groundContact: ScreenPixelPosition;
}

export type ProjectedGroundContact = ScreenPixelPosition;

interface NormalizedCoordinate { readonly kind: "cell" | "sub-cell"; readonly floor: FloorReference; readonly x: number; readonly y: number; readonly elevation: number; }

interface NormalizedProjectionOptions { readonly bounds?: ProjectionBounds; readonly origin: ProjectionOrigin; }

const DEFAULT_ORIGIN: ProjectionOrigin = Object.freeze({ xPx: 0, yPx: 0 });

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function fail(code: ProjectionDiagnosticCode, message: string): never {
  throw new ProjectionError(code, message);
}

function requireFloorReference(value: unknown): FloorReference {
  if (!isRecord(value) || !isRecord(value.id)) {
    fail("projection.floor-reference-invalid", "a versioned floor reference is required");
  }
  if (value.id.kind !== "floor" || typeof value.id.value !== "string" || value.id.value.length === 0) {
    fail("projection.floor-reference-invalid", "floor.id must use the floor namespace");
  }
  if (!Number.isSafeInteger(value.version) || (value.version as number) < 1) {
    fail("projection.floor-reference-invalid", "floor.version must be a positive safe integer");
  }
  return value as unknown as FloorReference;
}

function floorKey(floor: FloorReference): string {
  return `${floor.id.kind}:${floor.id.value}@${floor.version}`;
}

function requireOrigin(value: unknown): ProjectionOrigin {
  if (!isRecord(value)) {
    fail("projection.origin-invalid", "origin must contain finite xPx and yPx");
  }
  if (value.space !== undefined && value.space !== "screen-pixel") {
    fail("projection.coordinate-space-mismatch", "expected screen-pixel origin");
  }
  if (typeof value.xPx !== "number" || !Number.isFinite(value.xPx) || Math.abs(value.xPx) > MAX_SAFE) {
    fail("projection.origin-invalid", "origin.xPx must be a finite contract number");
  }
  if (typeof value.yPx !== "number" || !Number.isFinite(value.yPx) || Math.abs(value.yPx) > MAX_SAFE) {
    fail("projection.origin-invalid", "origin.yPx must be a finite contract number");
  }
  return {
    xPx: value.xPx,
    yPx: value.yPx,
    ...(value.space === undefined ? {} : { space: "screen-pixel" as const }),
  };
}

function requireBounds(value: unknown): ProjectionBounds {
  if (!isRecord(value)) {
    fail("projection.bounds-invalid", "bounds must contain a floor and positive dimensions");
  }
  const floor = requireFloorReference(value.floor);
  if (!Number.isSafeInteger(value.width) || (value.width as number) < 1) {
    fail("projection.bounds-invalid", "bounds.width must be a positive safe integer");
  }
  if (!Number.isSafeInteger(value.depth) || (value.depth as number) < 1) {
    fail("projection.bounds-invalid", "bounds.depth must be a positive safe integer");
  }
  if (!Number.isSafeInteger(value.maxElevation) || (value.maxElevation as number) < 0) {
    fail("projection.bounds-invalid", "bounds.maxElevation must be a non-negative safe integer");
  }
  return {
    floor,
    width: value.width as number,
    depth: value.depth as number,
    maxElevation: value.maxElevation as number,
  };
}

function normalizeOptions(
  value: unknown,
  positionalOrigin: unknown,
): NormalizedProjectionOptions {
  let bounds: ProjectionBounds | undefined;
  let origin = DEFAULT_ORIGIN;

  if (value !== undefined) {
    if (!isRecord(value)) {
      fail("projection.options-invalid", "projection options must be an object");
    }
    if ("bounds" in value || "origin" in value) {
      if (value.bounds !== undefined) bounds = requireBounds(value.bounds);
      if (value.origin !== undefined) origin = requireOrigin(value.origin);
    } else if ("width" in value || "depth" in value || "maxElevation" in value || "floor" in value) {
      bounds = requireBounds(value);
    } else if ("xPx" in value || "yPx" in value) {
      origin = requireOrigin(value);
    } else if (Object.keys(value).length > 0) {
      fail("projection.options-invalid", "unknown projection options");
    }
  }

  if (positionalOrigin !== undefined) origin = requireOrigin(positionalOrigin);
  return bounds === undefined ? { origin } : { bounds, origin };
}

function requireFloorLocalCoordinate(value: unknown): NormalizedCoordinate {
  if (!isRecord(value)) {
    fail("projection.coordinate-space-mismatch", "expected floor-local-cell or floor-local-sub-cell");
  }
  if (value.space !== "floor-local-cell" && value.space !== "floor-local-sub-cell") {
    fail("projection.coordinate-space-mismatch", "expected floor-local-cell or floor-local-sub-cell");
  }
  const floor = requireFloorReference(value.floor);
  if (!isRecord(value.coordinate)) {
    fail("projection.coordinate-space-mismatch", "a floor-local coordinate is required");
  }

  if (value.space === "floor-local-cell") {
    if (value.coordinate.space !== "cell") {
      fail("projection.coordinate-space-mismatch", "expected cell coordinate");
    }
    const coordinate = value.coordinate as unknown as CellPosition;
    cellOriginToSubCell(coordinate);
    return {
      kind: "cell",
      floor,
      x: coordinate.x,
      y: coordinate.y,
      elevation: coordinate.elevation,
    };
  }

  if (value.coordinate.space !== "sub-cell") {
    fail("projection.coordinate-space-mismatch", "expected sub-cell coordinate");
  }
  const coordinate = value.coordinate as unknown as SubCellPosition;
  splitSubCellPosition(coordinate);
  return {
    kind: "sub-cell",
    floor,
    x: coordinate.x,
    y: coordinate.y,
    elevation: coordinate.elevation,
  };
}

function checkedCoordinateOperation(value: number, code: "projection.coordinate-overflow" | "projection.bounds-overflow", field: string): number {
  if (!Number.isSafeInteger(value)) fail(code, `${field} leaves the safe integer range`);
  return value;
}

function checkedSubtract(left: number, right: number, field: string): number {
  return checkedCoordinateOperation(left - right, "projection.coordinate-overflow", field);
}

function checkedAdd(left: number, right: number, field: string): number {
  return checkedCoordinateOperation(left + right, "projection.coordinate-overflow", field);
}

function checkedMultiply(left: number, right: number, field: string): number {
  return checkedCoordinateOperation(left * right, "projection.coordinate-overflow", field);
}

function checkedBoundsMultiply(left: number, right: number, field: string): number {
  return checkedCoordinateOperation(left * right, "projection.bounds-overflow", field);
}

function checkedTranslate(origin: number, delta: number, field: string): number {
  const result = origin + delta;
  if (!Number.isFinite(result) || Math.abs(result) > MAX_SAFE) {
    fail("projection.pixel-overflow", `${field} leaves the finite pixel range`);
  }
  return result;
}

function checkedPixelDifference(left: number, right: number, field: string): number {
  const result = left - right;
  if (!Number.isFinite(result) || Math.abs(result) > MAX_SAFE) {
    fail("projection.pixel-overflow", `${field} leaves the finite pixel range`);
  }
  return result;
}

function checkedContinuous(value: number, field: string): number {
  if (!Number.isFinite(value) || Math.abs(value) > MAX_SAFE) {
    fail("projection.pixel-overflow", `${field} is not finite`);
  }
  return value;
}

function validateBoundsMatch(coordinate: NormalizedCoordinate, bounds: ProjectionBounds): void {
  if (floorKey(coordinate.floor) !== floorKey(bounds.floor)) {
    fail("projection.floor-mismatch", "coordinate and bounds refer to different floors");
  }
  const limitX = coordinate.kind === "cell"
    ? bounds.width
    : checkedBoundsMultiply(bounds.width, SUBCELL_UNITS_PER_CELL, "bounds.width in sub-cell units");
  const limitY = coordinate.kind === "cell"
    ? bounds.depth
    : checkedBoundsMultiply(bounds.depth, SUBCELL_UNITS_PER_CELL, "bounds.depth in sub-cell units");
  if (coordinate.x < 0 || coordinate.x >= limitX) {
    fail("projection.coordinate-out-of-bounds", "coordinate.x is outside the floor-local bounds");
  }
  if (coordinate.y < 0 || coordinate.y >= limitY) {
    fail("projection.coordinate-out-of-bounds", "coordinate.y is outside the floor-local bounds");
  }
  if (coordinate.elevation > bounds.maxElevation) {
    fail("projection.coordinate-out-of-bounds", "coordinate.elevation is outside the floor-local bounds");
  }
}

function screenPoint(xPx: number, yPx: number): ScreenPixelPosition {
  return { space: "screen-pixel", xPx, yPx } as ScreenPixelPosition;
}

function projectNumbers(
  coordinate: NormalizedCoordinate,
  origin: ProjectionOrigin,
): ProjectedPosition {
  const xScale = coordinate.kind === "cell" ? HALF_TILE_WIDTH_PX : HALF_TILE_WIDTH_PX / SUBCELL_UNITS_PER_CELL;
  const yScale = coordinate.kind === "cell" ? HALF_TILE_HEIGHT_PX : HALF_TILE_HEIGHT_PX / SUBCELL_UNITS_PER_CELL;
  const difference = checkedSubtract(coordinate.x, coordinate.y, "world x-y");
  const sum = checkedAdd(coordinate.x, coordinate.y, "world x+y");
  const xDelta = checkedMultiply(difference, xScale, "screen x multiplication");
  const groundYDelta = checkedMultiply(sum, yScale, "ground screen y multiplication");
  const elevationDelta = checkedMultiply(coordinate.elevation, ELEVATION_HEIGHT_PX, "elevation multiplication");
  const xPx = checkedTranslate(origin.xPx, xDelta, "screen x");
  const groundYPx = checkedTranslate(origin.yPx, groundYDelta, "ground screen y");
  const yPx = checkedTranslate(groundYPx, -elevationDelta, "screen y");
  return {
    projectionId: OFFICE_PROJECTION_ID,
    xPx,
    yPx,
    screen: screenPoint(xPx, yPx),
    groundContact: screenPoint(xPx, groundYPx),
  };
}

/** Project a validated floor-local cell or sub-cell position. */
export function project(position: FloorLocalCoordinate, options?: ProjectionOptions): ProjectedPosition;
export function project(position: FloorLocalCoordinate, bounds: ProjectionBounds, origin?: ProjectionOrigin): ProjectedPosition;
export function project(position: FloorLocalCoordinate, origin: ProjectionOrigin): ProjectedPosition;
export function project(
  position: FloorLocalCoordinate,
  optionsOrBoundsOrOrigin: ProjectionOptions | ProjectionBounds | ProjectionOrigin = {},
  positionalOrigin?: ProjectionOrigin,
): ProjectedPosition {
  const coordinate = requireFloorLocalCoordinate(position);
  const options = normalizeOptions(optionsOrBoundsOrOrigin, positionalOrigin);
  if (options.bounds !== undefined) validateBoundsMatch(coordinate, options.bounds);
  return projectNumbers(coordinate, options.origin);
}

/** Project only the ground contact of a floor-local position. */
export function projectGround(position: FloorLocalCoordinate, options?: ProjectionOptions): ProjectedGroundContact;
export function projectGround(position: FloorLocalCoordinate, bounds: ProjectionBounds, origin?: ProjectionOrigin): ProjectedGroundContact;
export function projectGround(
  position: FloorLocalCoordinate,
  optionsOrBoundsOrOrigin: ProjectionOptions | ProjectionBounds | ProjectionOrigin = {},
  positionalOrigin?: ProjectionOrigin,
): ProjectedGroundContact {
  const result = positionalOrigin === undefined
    ? project(position, optionsOrBoundsOrOrigin as ProjectionOptions)
    : project(position, optionsOrBoundsOrOrigin as ProjectionBounds, positionalOrigin);
  return result.groundContact;
}

export const projectGroundContact = projectGround;

function requireScreenPoint(value: unknown): { readonly xPx: number; readonly yPx: number } {
  if (!isRecord(value) || value.space !== "screen-pixel") {
    fail("projection.coordinate-space-mismatch", "expected screen-pixel ground point");
  }
  if (typeof value.xPx !== "number" || !Number.isFinite(value.xPx) || Math.abs(value.xPx) > MAX_SAFE) {
    fail("projection.point-invalid", "ground point.xPx must be a finite contract number");
  }
  if (typeof value.yPx !== "number" || !Number.isFinite(value.yPx) || Math.abs(value.yPx) > MAX_SAFE) {
    fail("projection.point-invalid", "ground point.yPx must be a finite contract number");
  }
  return { xPx: value.xPx, yPx: value.yPx };
}

function pickBoundedAxis(value: number, limit: number, axis: "x" | "y"): number {
  const integer = Number.isInteger(value);
  if (integer) {
    const lowerCoordinate = value - 1;
    if (lowerCoordinate >= 0 && lowerCoordinate < limit) return lowerCoordinate;
    if (value >= 0 && value < limit) return Object.is(value, -0) ? 0 : value;
    fail("projection.inverse-outside", `ground point is outside the bounded ${axis} axis`);
  }
  const coordinate = Math.floor(value);
  if (coordinate < 0 || coordinate >= limit) {
    fail("projection.inverse-outside", `ground point is outside the bounded ${axis} axis`);
  }
  return coordinate;
}

/**
 * Pick the bounded floor-local cell containing a ground screen point.
 * Shared edges use the lower y coordinate first, then the lower x coordinate.
 * At an outer bound, the only in-bounds cell owns the edge.
 */
export function unprojectGround(
  point: ScreenPixelPosition,
  options: ProjectionOptions,
): FloorLocalCellPosition;
export function unprojectGround(
  point: ScreenPixelPosition,
  bounds: ProjectionBounds,
  origin?: ProjectionOrigin,
): FloorLocalCellPosition;
export function unprojectGround(
  point: ScreenPixelPosition,
  optionsOrBounds: ProjectionOptions | ProjectionBounds = {},
  positionalOrigin?: ProjectionOrigin,
): FloorLocalCellPosition {
  const screen = requireScreenPoint(point);
  const options = normalizeOptions(optionsOrBounds, positionalOrigin);
  const bounds = options.bounds;
  if (bounds === undefined) fail("projection.bounds-required", "inverse ground picking requires explicit floor bounds");

  const dx = checkedPixelDifference(screen.xPx, options.origin.xPx, "inverse screen x");
  const dy = checkedPixelDifference(screen.yPx, options.origin.yPx, "inverse screen y");
  const xWorld = checkedContinuous(
    dx / TILE_WIDTH_PX + dy / TILE_HEIGHT_PX,
    "inverse world x",
  );
  const yWorld = checkedContinuous(
    dy / TILE_HEIGHT_PX - dx / TILE_WIDTH_PX,
    "inverse world y",
  );
  const x = pickBoundedAxis(xWorld, bounds.width, "x");
  const y = pickBoundedAxis(yWorld, bounds.depth, "y");
  return {
    space: "floor-local-cell",
    floor: {
      id: { kind: "floor", value: bounds.floor.id.value },
      version: bounds.floor.version,
    } as FloorReference,
    coordinate: {
      space: "cell",
      x,
      y,
      elevation: 0,
    } as CellPosition,
  } as FloorLocalCellPosition;
}

/** A named alias for callers that prefer the mathematical inverse vocabulary. */
export const unproject = unprojectGround;
