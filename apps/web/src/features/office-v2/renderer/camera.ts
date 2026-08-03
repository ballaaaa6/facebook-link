import type {
  FloorLocalCellPosition,
  FloorLocalSubCellPosition,
  FloorReference,
  ScreenPixelPosition,
} from "@affiliate-ops/office-v2-contracts";
import {
  project,
  unprojectGround,
  type ProjectionBounds,
  type ProjectedPosition,
} from "@affiliate-ops/office-v2-world";

export interface CameraViewport { readonly width: number; readonly height: number; }
export interface CameraZoomLimits { readonly min: number; readonly max: number; }
export interface CameraFocus { readonly x: number; readonly y: number; readonly elevation: number; }
export interface CameraState {
  readonly floor: FloorReference;
  readonly bounds: ProjectionBounds;
  readonly focus: CameraFocus;
  readonly viewport: CameraViewport;
  readonly zoom: number;
  readonly zoomLimits: CameraZoomLimits;
}

export interface CameraInput {
  readonly floor: FloorReference;
  readonly bounds: ProjectionBounds;
  readonly focus?: Partial<CameraFocus>;
  readonly viewport: CameraViewport;
  readonly zoom?: number;
  readonly zoomLimits?: CameraZoomLimits;
}

export interface ScreenPoint { readonly xPx: number; readonly yPx: number; }

const DEFAULT_ZOOM_LIMITS: CameraZoomLimits = Object.freeze({ min: 0.5, max: 2 });
const DEFAULT_MARGIN_PX = 48;

function finite(value: number, name: string): number {
  if (!Number.isFinite(value)) throw new RangeError(`presentation.camera-invalid: ${name} must be finite`);
  return value;
}

function positive(value: number, name: string): number {
  finite(value, name);
  if (value <= 0) throw new RangeError(`presentation.camera-invalid: ${name} must be positive`);
  return value;
}

function viewport(value: CameraViewport): CameraViewport {
  const width = Math.floor(positive(value.width, "viewport.width"));
  const height = Math.floor(positive(value.height, "viewport.height"));
  return Object.freeze({ width, height });
}

function limits(value: CameraZoomLimits | undefined): CameraZoomLimits {
  const next = value ?? DEFAULT_ZOOM_LIMITS;
  const min = positive(next.min, "zoomLimits.min");
  const max = positive(next.max, "zoomLimits.max");
  if (min > max) throw new RangeError("presentation.camera-invalid: zoomLimits.min must not exceed max");
  return Object.freeze({ min, max });
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function focusFor(bounds: ProjectionBounds, value: Partial<CameraFocus> | undefined): CameraFocus {
  const focus = {
    x: value?.x ?? bounds.width / 2,
    y: value?.y ?? bounds.depth / 2,
    elevation: value?.elevation ?? 0,
  };
  finite(focus.x, "focus.x");
  finite(focus.y, "focus.y");
  finite(focus.elevation, "focus.elevation");
  return Object.freeze({
    x: clamp(focus.x, 0, bounds.width),
    y: clamp(focus.y, 0, bounds.depth),
    elevation: clamp(focus.elevation, 0, bounds.maxElevation),
  });
}

function baseFocusPosition(camera: Pick<CameraState, "floor" | "focus">): FloorLocalSubCellPosition {
  return {
    space: "floor-local-sub-cell",
    floor: camera.floor,
    coordinate: {
      space: "sub-cell",
      x: Math.round(camera.focus.x * 4),
      y: Math.round(camera.focus.y * 4),
      elevation: Math.round(camera.focus.elevation),
    },
  } as FloorLocalSubCellPosition;
}

function baseProjection(position: FloorLocalCellPosition | FloorLocalSubCellPosition): ProjectedPosition {
  return project(position, { origin: { xPx: 0, yPx: 0 } });
}

function screenFromBase(camera: CameraState, xPx: number, yPx: number): ScreenPoint {
  const focus = baseProjection(baseFocusPosition(camera));
  return Object.freeze({
    xPx: camera.viewport.width / 2 + (xPx - focus.xPx) * camera.zoom,
    yPx: camera.viewport.height / 2 + (yPx - focus.yPx) * camera.zoom,
  });
}

function baseFromScreen(camera: CameraState, point: ScreenPoint): ScreenPoint {
  finite(point.xPx, "point.xPx");
  finite(point.yPx, "point.yPx");
  const focus = baseProjection(baseFocusPosition(camera));
  return {
    space: "screen-pixel",
    xPx: focus.xPx + (point.xPx - camera.viewport.width / 2) / camera.zoom,
    yPx: focus.yPx + (point.yPx - camera.viewport.height / 2) / camera.zoom,
  } as ScreenPoint;
}

export function createCamera(input: CameraInput): CameraState {
  if (input.bounds.floor.id.value !== input.floor.id.value || input.bounds.floor.version !== input.floor.version) {
    throw new RangeError("presentation.camera-floor-mismatch: bounds and camera floor must agree");
  }
  const zoomLimits = limits(input.zoomLimits);
  return Object.freeze({
    floor: input.floor,
    bounds: input.bounds,
    focus: focusFor(input.bounds, input.focus),
    viewport: viewport(input.viewport),
    zoom: clamp(input.zoom ?? 1, zoomLimits.min, zoomLimits.max),
    zoomLimits,
  });
}

export function setCameraViewport(camera: CameraState, nextViewport: CameraViewport): CameraState {
  return createCamera({ ...camera, viewport: nextViewport });
}

export function setCameraZoom(camera: CameraState, zoom: number): CameraState {
  return createCamera({ ...camera, zoom });
}

export function setCameraFocus(camera: CameraState, focus: Partial<CameraFocus>): CameraState {
  return createCamera({ ...camera, focus: { ...camera.focus, ...focus } });
}

export function fitCameraToWorld(
  floor: FloorReference,
  bounds: ProjectionBounds,
  viewportValue: CameraViewport,
  marginPx = DEFAULT_MARGIN_PX,
  zoomLimits = DEFAULT_ZOOM_LIMITS,
): CameraState {
  const viewportResult = viewport(viewportValue);
  const margin = Math.max(0, finite(marginPx, "marginPx"));
  const corners = [
    { x: 0, y: 0 },
    { x: bounds.width, y: 0 },
    { x: 0, y: bounds.depth },
    { x: bounds.width, y: bounds.depth },
  ].map(({ x, y }) => baseProjection({
    space: "floor-local-cell",
    floor,
    coordinate: { space: "cell", x, y, elevation: 0 },
  } as FloorLocalCellPosition));
  const width = Math.max(...corners.map((point) => point.xPx)) - Math.min(...corners.map((point) => point.xPx));
  const height = Math.max(...corners.map((point) => point.yPx)) - Math.min(...corners.map((point) => point.yPx));
  const availableWidth = Math.max(1, viewportResult.width - margin * 2);
  const availableHeight = Math.max(1, viewportResult.height - margin * 2);
  const zoom = Math.min(availableWidth / Math.max(width, 1), availableHeight / Math.max(height, 1));
  return createCamera({
    floor,
    bounds,
    viewport: viewportResult,
    zoom,
    zoomLimits,
    focus: { x: bounds.width / 2, y: bounds.depth / 2, elevation: 0 },
  });
}

export function projectCameraPosition(camera: CameraState, position: FloorLocalCellPosition | FloorLocalSubCellPosition): ScreenPoint & { readonly groundContact: ScreenPoint } {
  if (position.floor.id.value !== camera.floor.id.value || position.floor.version !== camera.floor.version) {
    throw new RangeError("presentation.camera-floor-mismatch: position belongs to another floor");
  }
  const projected = baseProjection(position);
  return Object.freeze({ ...screenFromBase(camera, projected.xPx, projected.yPx), groundContact: screenFromBase(camera, projected.groundContact.xPx, projected.groundContact.yPx) });
}

export function unprojectCameraGround(camera: CameraState, point: ScreenPoint): FloorLocalCellPosition {
  const base = baseFromScreen(camera, point);
  return unprojectGround({ space: "screen-pixel", xPx: base.xPx, yPx: base.yPx } as ScreenPixelPosition, { bounds: camera.bounds, origin: { xPx: 0, yPx: 0 } });
}

export function cameraKey(camera: CameraState): string {
  return [camera.floor.id.value, camera.floor.version, camera.viewport.width, camera.viewport.height, camera.zoom, camera.focus.x, camera.focus.y, camera.focus.elevation].join("|");
}
