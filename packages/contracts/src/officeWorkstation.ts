import type { OfficeOrientation } from "./officeGeometry.ts";

export const workstationOrientations = ["front", "back", "left", "right"] as const;
export const workstationRoles = ["standard", "creative", "noc"] as const;
export const workstationCompositeOrder = [
  "desk-rear",
  "desk-surface",
  "desk-base",
  "monitor-shell",
  "monitor-viewport",
  "surface-equipment",
  "chair",
  "actor",
  "desk-foreground",
] as const;

type WorkstationOrientation = Exclude<OfficeOrientation, "none">;
type WorkstationRole = (typeof workstationRoles)[number];

export interface OfficeWorkstationBundleV1 {
  version: 1;
  geometrySchemaVersion: 3;
  id: string;
  status: "staging";
  deskFamily: {
    id: string;
    physicalScale: { width: 5; depth: 4; height: 2.4; unit: "tile" };
    footprint: { width: 5; depth: 4; unit: "tile" };
    supportPlane: { id: "desk-surface"; width: 5; depth: 3; height: 2.4; unit: "tile" };
    employeeEdge: { originY: 3; depth: 1; attachmentSlots: 0 };
    generationRenderBox: { width: 5; height: 5; unit: "tile" };
    basePivot: { x: 2.5; y: 4; unit: "tile" };
    sortPivot: { x: 2.5; y: 4; unit: "tile" };
    orientations: Record<WorkstationOrientation, {
      rearAssetId: string;
      surfaceAssetId: string;
      baseAssetId: string;
      foregroundAssetId: string;
    }>;
  };
  attachmentSlots: ReadonlyArray<{
    id: string;
    surfaceId: "desk-surface";
    x: number;
    y: number;
    unit: "tile";
    accepts: readonly string[];
  }>;
  chairFamily: {
    id: string;
    orientationAssets: Record<WorkstationOrientation, string>;
    seatAnchor: { x: number; y: number; unit: "asset-normalized" };
  };
  actorCalibration: {
    id: string;
    source: "code-generated-neutral";
    seatedScale: { width: 1; depth: 1; height: 2; unit: "tile" };
    seatLevel: 1;
    pelvisAnchor: { x: number; y: number; unit: "asset-normalized" };
    headSafeRegion: { top: number; left: number; right: number; unit: "authoring-pixel" };
  };
  monitorFamily: {
    id: string;
    orientationAssets: Record<WorkstationOrientation, string>;
    viewport: { id: string; x: number; y: number; width: number; height: number; unit: "asset-pixel" };
  };
  screenLoop: {
    id: string;
    coordinateSpace: "viewport-local";
    parentViewportId: string;
    frameAssetIds: readonly string[];
    frameDurationMs: number;
  };
  roleVariants: Record<WorkstationRole, {
    deskFamilyId: string;
    equipmentProfile: string;
    screenThemeId: string;
  }>;
  compositeOrder: typeof workstationCompositeOrder;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactNumber(value: unknown, expected: number) {
  return typeof value === "number" && value === expected;
}

function add(issues: string[], condition: boolean, path: string, message: string) {
  if (!condition) issues.push(`${path}: ${message}`);
}

function validateCanonicalDesk(bundle: Record<string, unknown>, issues: string[]) {
  const desk = bundle.deskFamily;
  add(issues, isRecord(desk), "deskFamily", "must be an object");
  if (!isRecord(desk)) return;
  const scale = desk.physicalScale;
  add(issues, isRecord(scale) && exactNumber(scale.width, 5) && exactNumber(scale.depth, 4)
    && exactNumber(scale.height, 2.4) && scale.unit === "tile", "deskFamily.physicalScale", "must match the accepted 5 x 4 x 2.4 calibration");
  const footprint = desk.footprint;
  add(issues, isRecord(footprint) && exactNumber(footprint.width, 5) && exactNumber(footprint.depth, 4)
    && footprint.unit === "tile", "deskFamily.footprint", "must match the accepted 5 x 4 footprint");
  const support = desk.supportPlane;
  add(issues, isRecord(support) && support.id === "desk-surface" && exactNumber(support.width, 5)
    && exactNumber(support.depth, 3) && exactNumber(support.height, 2.4) && support.unit === "tile",
  "deskFamily.supportPlane", "must match the accepted 5 x 3 support plane");
  const employeeEdge = desk.employeeEdge;
  add(issues, isRecord(employeeEdge) && exactNumber(employeeEdge.originY, 3) && exactNumber(employeeEdge.depth, 1)
    && exactNumber(employeeEdge.attachmentSlots, 0), "deskFamily.employeeEdge", "must reserve the fourth row without attachment slots");
  const orientations = desk.orientations;
  add(issues, isRecord(orientations), "deskFamily.orientations", "must be an object");
  if (isRecord(orientations)) {
    add(issues, Object.keys(orientations).length === workstationOrientations.length, "deskFamily.orientations", "must contain exactly four orientations");
    for (const orientation of workstationOrientations) {
      const parts = orientations[orientation];
      add(issues, isRecord(parts), `deskFamily.orientations.${orientation}`, "is required");
      if (!isRecord(parts)) continue;
      for (const field of ["rearAssetId", "surfaceAssetId", "baseAssetId", "foregroundAssetId"] as const) {
        add(issues, typeof parts[field] === "string" && parts[field].length > 0, `deskFamily.orientations.${orientation}.${field}`, "must be a non-empty asset id");
      }
    }
  }
}

function validateSlots(bundle: Record<string, unknown>, issues: string[]) {
  const slots = bundle.attachmentSlots;
  add(issues, Array.isArray(slots) && slots.length > 0, "attachmentSlots", "must be a non-empty array");
  if (!Array.isArray(slots)) return;
  const ids = new Set<string>();
  for (const [index, slot] of slots.entries()) {
    add(issues, isRecord(slot), `attachmentSlots[${index}]`, "must be an object");
    if (!isRecord(slot)) continue;
    const id = typeof slot.id === "string" ? slot.id : "";
    add(issues, id.length > 0 && !ids.has(id), `attachmentSlots[${index}].id`, "must be non-empty and unique");
    ids.add(id);
    add(issues, slot.surfaceId === "desk-surface", `attachmentSlots[${index}].surfaceId`, "must reference desk-surface");
    add(issues, typeof slot.x === "number" && slot.x >= 0 && slot.x < 5, `attachmentSlots[${index}].x`, "must be inside the 5 x 3 support plane");
    add(issues, typeof slot.y === "number" && slot.y >= 0 && slot.y < 3, `attachmentSlots[${index}].y`, "must be inside the 5 x 3 support plane");
    add(issues, slot.unit === "tile", `attachmentSlots[${index}].unit`, "must equal tile");
    add(issues, Array.isArray(slot.accepts) && slot.accepts.length > 0, `attachmentSlots[${index}].accepts`, "must be a non-empty array");
  }
}

function validateComposition(bundle: Record<string, unknown>, issues: string[]) {
  const monitor = bundle.monitorFamily;
  const loop = bundle.screenLoop;
  add(issues, isRecord(monitor) && isRecord(monitor.viewport), "monitorFamily.viewport", "is required");
  add(issues, isRecord(loop), "screenLoop", "must be an object");
  if (isRecord(monitor) && isRecord(monitor.viewport) && isRecord(loop)) {
    add(issues, loop.coordinateSpace === "viewport-local", "screenLoop.coordinateSpace", "must equal viewport-local");
    add(issues, loop.parentViewportId === monitor.viewport.id, "screenLoop.parentViewportId", "must reference monitorFamily.viewport.id");
    add(issues, Array.isArray(loop.frameAssetIds) && loop.frameAssetIds.length === 4
      && new Set(loop.frameAssetIds).size === 4, "screenLoop.frameAssetIds", "must contain four unique frames");
    add(issues, typeof loop.frameDurationMs === "number" && loop.frameDurationMs > 0, "screenLoop.frameDurationMs", "must be positive");
  }
  add(issues, JSON.stringify(bundle.compositeOrder) === JSON.stringify(workstationCompositeOrder), "compositeOrder", "must preserve the workstation occlusion contract");

  const desk = bundle.deskFamily;
  const variants = bundle.roleVariants;
  add(issues, isRecord(desk) && typeof desk.id === "string", "deskFamily.id", "must be a string");
  add(issues, isRecord(variants), "roleVariants", "must be an object");
  if (isRecord(desk) && isRecord(variants)) {
    add(issues, Object.keys(variants).length === workstationRoles.length, "roleVariants", "must contain exactly standard, creative, and noc");
    for (const role of workstationRoles) {
      const variant = variants[role];
      add(issues, isRecord(variant), `roleVariants.${role}`, "is required");
      if (!isRecord(variant)) continue;
      add(issues, variant.deskFamilyId === desk.id, `roleVariants.${role}.deskFamilyId`, "must share the canonical desk family");
    }
  }
}

export function validateOfficeWorkstationBundleV1(value: unknown): string[] {
  if (!isRecord(value)) return ["bundle: must be an object"];
  const issues: string[] = [];
  add(issues, value.version === 1, "version", "must equal 1");
  add(issues, value.geometrySchemaVersion === 3, "geometrySchemaVersion", "must equal 3");
  add(issues, value.status === "staging", "status", "must equal staging until explicit promotion");
  add(issues, typeof value.id === "string" && value.id.length > 0, "id", "must be a non-empty string");
  validateCanonicalDesk(value, issues);
  validateSlots(value, issues);
  validateComposition(value, issues);
  return issues;
}
