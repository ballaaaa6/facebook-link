export const officeSpatialProjectionV3 = {
  tilePixels: 32,
  axes: {
    x: "increases-right",
    y: "increases-toward-viewer",
    z: "increases-up",
  },
  formula: {
    screenX: "worldX * 32",
    screenY: "worldY * 32 - worldZ * 32",
  },
  levels: {
    floor: 0,
    chairSeat: 1,
    deskSupport: 2,
    personTop: 3,
  },
} as const;

export interface OfficeWorldPoint {
  x: number;
  y: number;
  z: number;
}

export interface OfficeScreenPoint {
  x: number;
  y: number;
}

export function projectOfficeWorldPoint(point: OfficeWorldPoint): OfficeScreenPoint {
  return {
    x: point.x * officeSpatialProjectionV3.tilePixels,
    y: point.y * officeSpatialProjectionV3.tilePixels
      - point.z * officeSpatialProjectionV3.tilePixels,
  };
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exact(value: unknown, expected: unknown) {
  return JSON.stringify(value) === JSON.stringify(expected);
}

export function validateOfficeCameraScaleBibleV3(value: unknown): string[] {
  if (!record(value)) return ["cameraScaleV3: must be an object"];
  const issues: string[] = [];
  const add = (condition: boolean, path: string, message: string) => {
    if (!condition) issues.push(`${path}: ${message}`);
  };
  add(value.version === 3 && value.geometrySchemaVersion === 5,
    "cameraScaleV3.version", "must use Geometry v5");
  add(value.id === "office.camera-scale-bible.v3", "cameraScaleV3.id", "has the wrong identity");
  add(value.status === "owner-calibration-review", "cameraScaleV3.status", "must stop at owner calibration");

  const permissions = value.permissions;
  add(record(permissions), "cameraScaleV3.permissions", "must be an object");
  if (record(permissions)) {
    add(permissions.deterministicMeasurement === true && permissions.calibrationBoards === true,
      "cameraScaleV3.permissions", "must allow measurement and boards");
    for (const key of [
      "artworkGeneration", "rendererImplementation", "singleSeatAssembly",
      "tenSeatAssembly", "activeOfficePromotion",
    ]) {
      add(permissions[key] === false, `cameraScaleV3.permissions.${key}`, "must remain blocked");
    }
  }

  const world = value.world;
  add(record(world) && world.tilePixels === 32, "cameraScaleV3.world", "must use 32 pixels per tile");
  if (record(world)) {
    add(exact(world.levels, officeSpatialProjectionV3.levels),
      "cameraScaleV3.world.levels", "must use integer z levels 0/1/2/3");
    const projection = world.projection;
    add(record(projection)
      && projection.screenX === officeSpatialProjectionV3.formula.screenX
      && projection.screenY === officeSpatialProjectionV3.formula.screenY
      && projection.perspective === false,
    "cameraScaleV3.world.projection", "must use the locked orthographic formula");
  }

  const standards = value.standards;
  add(record(standards), "cameraScaleV3.standards", "must be an object");
  if (record(standards)) {
    const person = standards.person;
    add(record(person) && exact(person.floorFootprint, { width: 1, depth: 1 })
      && exact(person.logicalVolume, { width: 1, depth: 1, height: 3 })
      && exact(person.currentOfficeFramePixels, { width: 96, height: 104 }),
    "cameraScaleV3.standards.person", "must preserve the current Office 1 x 1 x 3 person");
    const chair = standards.chair;
    add(record(chair) && exact(chair.floorFootprint, { width: 1, depth: 1 })
      && exact(chair.logicalVolume, { width: 1, depth: 1, height: 2 })
      && chair.seatLevel === 1 && chair.sharesFloorCellWithSeatedPerson === true,
    "cameraScaleV3.standards.chair", "must define the shared-cell 1 x 1 x 2 chair");
    const desk = standards.desk;
    add(record(desk) && exact(desk.floorFootprint, { width: 3, depth: 2 })
      && exact(desk.logicalVolume, { width: 3, depth: 2, height: 2 })
      && exact(desk.requiredSupportPixels, { width: 96, depth: 64 }),
    "cameraScaleV3.standards.desk", "must define a full 3 x 2 x 2 desk");
  }
  return issues;
}
