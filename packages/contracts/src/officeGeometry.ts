export const officeAssetTypes = [
  "floor-decal",
  "upright-floor-object",
  "surface-furniture",
  "seat",
  "wall-mounted",
  "structural-opening",
  "animated-shell",
  "character",
] as const;

export type OfficeAssetType = (typeof officeAssetTypes)[number];

export const officePlacementPlanes = [
  "floor",
  "wall",
  "ceiling",
  "furniture-surface",
] as const;

export type OfficePlacementPlane = (typeof officePlacementPlanes)[number];
export type OfficeOrientation = "none" | "front" | "back" | "left" | "right";

export interface OfficeGeometryPoint {
  x: number;
  y: number;
  unit: "tile";
}

export interface OfficeGeometryRectangle {
  width: number;
  depth: number;
  unit: "tile";
}

export interface OfficeSupportPlane extends OfficeGeometryRectangle {
  id: string;
  height: number;
}

export interface OfficeAttachmentSlot {
  id: string;
  surfaceId: string;
  x: number;
  y: number;
  unit: "tile";
}

export interface OfficeSeatSlot {
  id: string;
  x: number;
  y: number;
  unit: "tile";
  facing: Exclude<OfficeOrientation, "none">;
}

export interface OfficeOcclusionPart {
  id: string;
  role: "rear" | "base" | "foreground";
  assetId: string;
}

export interface OfficeGeometryV3 {
  schemaVersion: 3;
  id: string;
  assetType: OfficeAssetType;
  placementPlane: OfficePlacementPlane;
  physicalScale: {
    width: number;
    depth: number;
    height: number;
    unit: "tile";
  };
  footprint: OfficeGeometryRectangle | null;
  supportPlane: OfficeSupportPlane | null;
  basePivot: OfficeGeometryPoint | null;
  sortPivot: OfficeGeometryPoint | null;
  renderBounds: {
    width: number;
    height: number;
    unit: "authoring-pixel";
  };
  renderOffset: {
    x: number;
    y: number;
    unit: "authoring-pixel";
  };
  verticalExtension: {
    aboveBase: number;
    belowBase: number;
    unit: "tile";
  };
  occlusionParts: readonly OfficeOcclusionPart[];
  attachmentSlots: readonly OfficeAttachmentSlot[];
  seatSlots: readonly OfficeSeatSlot[];
  orientation: OfficeOrientation;
  animation?: {
    frameCount: number;
    stableBasePivot: true;
    stableSortPivot: true;
  };
}

const orientations = ["none", "front", "back", "left", "right"] as const;
const occlusionRoles = ["rear", "base", "foreground"] as const;
const facings = ["front", "back", "left", "right"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function positive(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function nonNegative(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function point(value: unknown) {
  return isRecord(value)
    && typeof value.x === "number"
    && Number.isFinite(value.x)
    && typeof value.y === "number"
    && Number.isFinite(value.y)
    && value.unit === "tile";
}

function rectangle(value: unknown) {
  return isRecord(value)
    && positive(value.width)
    && positive(value.depth)
    && value.unit === "tile";
}

function requireValue(
  issues: string[],
  condition: boolean,
  path: string,
  message: string,
) {
  if (!condition) issues.push(`${path}: ${message}`);
}

function validateCommon(record: Record<string, unknown>, issues: string[]) {
  requireValue(issues, record.schemaVersion === 3, "schemaVersion", "must equal 3");
  requireValue(issues, typeof record.id === "string" && record.id.length > 0, "id", "must be a non-empty string");
  requireValue(issues, officeAssetTypes.includes(record.assetType as OfficeAssetType), "assetType", "is not supported");
  requireValue(issues, officePlacementPlanes.includes(record.placementPlane as OfficePlacementPlane), "placementPlane", "is not supported");
  requireValue(issues, orientations.includes(record.orientation as OfficeOrientation), "orientation", "is not supported");

  const physicalScale = record.physicalScale;
  requireValue(issues, isRecord(physicalScale), "physicalScale", "must be an object");
  if (isRecord(physicalScale)) {
    requireValue(issues, positive(physicalScale.width), "physicalScale.width", "must be positive");
    requireValue(issues, nonNegative(physicalScale.depth), "physicalScale.depth", "must be non-negative");
    requireValue(issues, nonNegative(physicalScale.height), "physicalScale.height", "must be non-negative");
    requireValue(issues, physicalScale.unit === "tile", "physicalScale.unit", "must equal tile");
  }

  const renderBounds = record.renderBounds;
  requireValue(issues, isRecord(renderBounds), "renderBounds", "must be an object");
  if (isRecord(renderBounds)) {
    requireValue(issues, positive(renderBounds.width), "renderBounds.width", "must be positive");
    requireValue(issues, positive(renderBounds.height), "renderBounds.height", "must be positive");
    requireValue(issues, renderBounds.unit === "authoring-pixel", "renderBounds.unit", "must equal authoring-pixel");
  }

  const renderOffset = record.renderOffset;
  requireValue(issues, isRecord(renderOffset), "renderOffset", "must be an object");
  if (isRecord(renderOffset)) {
    requireValue(issues, typeof renderOffset.x === "number" && Number.isFinite(renderOffset.x), "renderOffset.x", "must be finite");
    requireValue(issues, typeof renderOffset.y === "number" && Number.isFinite(renderOffset.y), "renderOffset.y", "must be finite");
    requireValue(issues, renderOffset.unit === "authoring-pixel", "renderOffset.unit", "must equal authoring-pixel");
  }

  const extension = record.verticalExtension;
  requireValue(issues, isRecord(extension), "verticalExtension", "must be an object");
  if (isRecord(extension)) {
    requireValue(issues, nonNegative(extension.aboveBase), "verticalExtension.aboveBase", "must be non-negative");
    requireValue(issues, nonNegative(extension.belowBase), "verticalExtension.belowBase", "must be non-negative");
    requireValue(issues, extension.unit === "tile", "verticalExtension.unit", "must equal tile");
  }
}

function validateCollections(record: Record<string, unknown>, issues: string[]) {
  for (const field of ["occlusionParts", "attachmentSlots", "seatSlots"] as const) {
    requireValue(issues, Array.isArray(record[field]), field, "must be an array");
  }
  if (Array.isArray(record.occlusionParts)) {
    const ids = new Set<string>();
    for (const [index, part] of record.occlusionParts.entries()) {
      requireValue(issues, isRecord(part), `occlusionParts[${index}]`, "must be an object");
      if (!isRecord(part)) continue;
      requireValue(issues, typeof part.id === "string" && !ids.has(part.id), `occlusionParts[${index}].id`, "must be unique");
      if (typeof part.id === "string") ids.add(part.id);
      requireValue(issues, occlusionRoles.includes(part.role as typeof occlusionRoles[number]), `occlusionParts[${index}].role`, "is not supported");
      requireValue(issues, typeof part.assetId === "string" && part.assetId.length > 0, `occlusionParts[${index}].assetId`, "must be a non-empty string");
    }
  }

  const supportPlane = record.supportPlane;
  if (Array.isArray(record.attachmentSlots)) {
    const ids = new Set<string>();
    for (const [index, slot] of record.attachmentSlots.entries()) {
      requireValue(issues, isRecord(slot), `attachmentSlots[${index}]`, "must be an object");
      if (!isRecord(slot)) continue;
      requireValue(issues, typeof slot.id === "string" && !ids.has(slot.id), `attachmentSlots[${index}].id`, "must be unique");
      if (typeof slot.id === "string") ids.add(slot.id);
      requireValue(issues, typeof slot.surfaceId === "string" && slot.surfaceId.length > 0, `attachmentSlots[${index}].surfaceId`, "must be a non-empty string");
      requireValue(issues, point(slot), `attachmentSlots[${index}]`, "must use finite tile coordinates");
      if (isRecord(supportPlane) && point(slot)) {
        requireValue(issues, slot.surfaceId === supportPlane.id, `attachmentSlots[${index}].surfaceId`, "must reference supportPlane.id");
        requireValue(issues, (slot.x as number) >= 0 && (slot.x as number) < (supportPlane.width as number), `attachmentSlots[${index}].x`, "must be inside supportPlane");
        requireValue(issues, (slot.y as number) >= 0 && (slot.y as number) < (supportPlane.depth as number), `attachmentSlots[${index}].y`, "must be inside supportPlane");
      }
    }
  }

  if (Array.isArray(record.seatSlots)) {
    const ids = new Set<string>();
    for (const [index, slot] of record.seatSlots.entries()) {
      requireValue(issues, isRecord(slot), `seatSlots[${index}]`, "must be an object");
      if (!isRecord(slot)) continue;
      requireValue(issues, typeof slot.id === "string" && !ids.has(slot.id), `seatSlots[${index}].id`, "must be unique");
      if (typeof slot.id === "string") ids.add(slot.id);
      requireValue(issues, point(slot), `seatSlots[${index}]`, "must use finite tile coordinates");
      requireValue(issues, facings.includes(slot.facing as typeof facings[number]), `seatSlots[${index}].facing`, "is not supported");
    }
  }
}

function validateTypeRules(record: Record<string, unknown>, issues: string[]) {
  const type = record.assetType;
  const plane = record.placementPlane;
  const hasFootprint = rectangle(record.footprint);
  const hasSupport = isRecord(record.supportPlane)
    && rectangle(record.supportPlane)
    && positive(record.supportPlane.height)
    && typeof record.supportPlane.id === "string";
  const hasBase = point(record.basePivot);
  const hasSort = point(record.sortPivot);
  const seats = Array.isArray(record.seatSlots) ? record.seatSlots.length : 0;
  const attachments = Array.isArray(record.attachmentSlots) ? record.attachmentSlots.length : 0;

  if (type === "floor-decal") {
    requireValue(issues, plane === "floor", "placementPlane", "floor-decal must use floor");
    requireValue(issues, record.footprint === null && record.supportPlane === null, "footprint", "floor-decal cannot reserve or support cells");
    requireValue(issues, record.basePivot === null && record.sortPivot === null, "sortPivot", "floor-decal cannot participate in Y-sort");
    requireValue(issues, seats === 0 && attachments === 0, "attachmentSlots", "floor-decal cannot own slots");
  }
  if (type === "upright-floor-object") {
    const validFloorObject = plane === "floor" && hasFootprint && hasBase && hasSort;
    const validSupportedObject = plane === "furniture-surface"
      && record.footprint === null
      && hasBase
      && record.sortPivot === null;
    requireValue(issues, validFloorObject || validSupportedObject, "assetType", "upright-floor-object requires floor geometry or a parent-surface base pivot");
    requireValue(issues, record.supportPlane === null && seats === 0, "supportPlane", "upright-floor-object cannot own support or seat slots");
  }
  if (type === "surface-furniture") {
    requireValue(issues, plane === "floor" && hasFootprint && hasSupport && hasBase && hasSort, "assetType", "surface-furniture requires floor footprint, support plane, and pivots");
  }
  if (type === "seat") {
    requireValue(issues, plane === "floor" && hasFootprint && hasBase && hasSort, "assetType", "seat requires floor footprint and pivots");
    requireValue(issues, seats > 0, "seatSlots", "seat requires at least one seat slot");
  }
  if (type === "wall-mounted" || type === "structural-opening") {
    requireValue(issues, plane === "wall", "placementPlane", `${type} must use wall`);
    requireValue(issues, record.footprint === null && hasBase && record.sortPivot === null, "footprint", `${type} cannot reserve floor cells or use floor Y-sort`);
  }
  if (type === "animated-shell") {
    requireValue(issues, isRecord(record.animation), "animation", "animated-shell requires animation stability metadata");
    if (isRecord(record.animation)) {
      requireValue(issues, Number.isInteger(record.animation.frameCount) && (record.animation.frameCount as number) > 1, "animation.frameCount", "must be an integer greater than one");
      requireValue(issues, record.animation.stableBasePivot === true, "animation.stableBasePivot", "must equal true");
      requireValue(issues, record.animation.stableSortPivot === true, "animation.stableSortPivot", "must equal true");
    }
    if (plane === "floor") requireValue(issues, hasFootprint && hasBase && hasSort, "assetType", "floor animated-shell requires footprint and pivots");
  }
  if (type === "character") {
    requireValue(issues, plane === "floor" && hasFootprint && hasBase && hasSort, "assetType", "character requires floor footprint and pivots");
    if (hasFootprint && isRecord(record.footprint)) {
      requireValue(issues, record.footprint.width === 1 && record.footprint.depth === 1, "footprint", "character must reserve exactly 1 x 1");
    }
  }
}

export function validateOfficeGeometryV3(value: unknown): string[] {
  if (!isRecord(value)) return ["geometry: must be an object"];
  const issues: string[] = [];
  validateCommon(value, issues);
  validateCollections(value, issues);
  validateTypeRules(value, issues);
  return issues;
}
