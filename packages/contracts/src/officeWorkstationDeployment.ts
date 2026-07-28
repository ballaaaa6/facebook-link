import type { OfficeWorkstationBundleV1 } from "./officeWorkstation.ts";

export const workstationPresetIds = [
  "standard-single",
  "standard-dual",
  "creative-dual-tablet",
  "noc-dual-status",
] as const;

export type WorkstationPresetId = (typeof workstationPresetIds)[number];
export type WorkstationDeploymentRole = "standard" | "creative" | "noc";

export interface WorkstationEquipment {
  id: string;
  assetId: string;
  kind: "monitor-shell" | "keyboard" | "tablet" | "phone" | "lamp";
  slot: { id: string; x: number; y: number; surfaceId: "desk-surface" };
  renderRole: "monitor-shell" | "surface-equipment";
}

export interface OfficeWorkstationPreset {
  id: WorkstationPresetId;
  role: WorkstationDeploymentRole;
  deskFamilyId: "desk.modular.v1";
  screenThemeId: string;
  equipment: readonly WorkstationEquipment[];
}

/** @deprecated Rejected v1 geometry fixture; do not use for new layouts. */
export interface OfficeWorkstationDeploymentManifestV1 {
  schemaVersion: 1;
  id: string;
  status: "rejected-geometry";
  deskFamilyId: "desk.modular.v1";
  presets: readonly OfficeWorkstationPreset[];
}

/** @deprecated Rejected v1 geometry fixture; do not use for new layouts. */
export interface WorkstationDeploymentV1 {
  id: string;
  agentId: string;
  presetId: WorkstationPresetId;
  role: WorkstationDeploymentRole;
  deskFamilyId: "desk.modular.v1";
  orientation: "front" | "back";
  facing: "down" | "up";
  floorRegionId: string;
  footprint: { x: number; y: number; width: 5; depth: 4 };
  supportPlane: { x: number; y: number; width: 5; depth: 3; id: "desk-surface" };
  seat: { x: number; y: number; width: 1; depth: 1 };
  approach: { x: number; y: number };
  stand: { x: number; y: number };
  basePivot: { x: number; y: number };
  sortPivot: { x: number; y: number };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function issue(issues: string[], condition: boolean, path: string, message: string) {
  if (!condition) issues.push(`${path}: ${message}`);
}

export function validateOfficeWorkstationDeploymentManifestV1(
  value: unknown,
  bundle: OfficeWorkstationBundleV1,
) {
  if (!isRecord(value)) return ["manifest: must be an object"];
  const issues: string[] = [];
  issue(issues, value.schemaVersion === 1, "schemaVersion", "must equal 1");
  issue(issues, value.status === "rejected-geometry", "status", "must remain rejected-geometry evidence");
  issue(issues, value.deskFamilyId === bundle.deskFamily.id, "deskFamilyId", "must reference the canonical desk family");
  const presets = Array.isArray(value.presets) ? value.presets : [];
  issue(issues, presets.length === workstationPresetIds.length, "presets", "must define all four presets");
  const presetIds = new Set<string>();
  for (const [presetIndex, candidate] of presets.entries()) {
    const path = `presets[${presetIndex}]`;
    issue(issues, isRecord(candidate), path, "must be an object");
    if (!isRecord(candidate)) continue;
    const presetId = typeof candidate.id === "string" ? candidate.id : "";
    issue(issues, workstationPresetIds.includes(presetId as WorkstationPresetId), `${path}.id`, "is not a supported preset");
    issue(issues, !presetIds.has(presetId), `${path}.id`, "must be unique");
    presetIds.add(presetId);
    issue(issues, candidate.deskFamilyId === bundle.deskFamily.id, `${path}.deskFamilyId`, "cannot change desk geometry");
    const equipment = Array.isArray(candidate.equipment) ? candidate.equipment : [];
    issue(issues, equipment.some((item) => isRecord(item) && item.kind === "monitor-shell"), `${path}.equipment`, "requires a monitor shell");
    issue(issues, equipment.some((item) => isRecord(item) && item.kind === "keyboard"), `${path}.equipment`, "requires a keyboard");
    const slotIds = new Set<string>();
    for (const [equipmentIndex, item] of equipment.entries()) {
      const itemPath = `${path}.equipment[${equipmentIndex}]`;
      issue(issues, isRecord(item) && isRecord(item.slot), `${itemPath}.slot`, "is required");
      if (!isRecord(item) || !isRecord(item.slot)) continue;
      const slotId = typeof item.slot.id === "string" ? item.slot.id : "";
      issue(issues, slotId.length > 0 && !slotIds.has(slotId), `${itemPath}.slot.id`, "must be non-empty and unique");
      slotIds.add(slotId);
      issue(issues, item.slot.surfaceId === bundle.deskFamily.supportPlane.id, `${itemPath}.slot.surfaceId`, "must reference desk-surface");
      issue(issues, typeof item.slot.x === "number" && item.slot.x >= 0 && item.slot.x < 5, `${itemPath}.slot.x`, "must be inside the support plane");
      issue(issues, typeof item.slot.y === "number" && item.slot.y >= 0 && item.slot.y < 3, `${itemPath}.slot.y`, "must be inside the support plane");
    }
  }
  for (const presetId of workstationPresetIds) {
    issue(issues, presetIds.has(presetId), `presets.${presetId}`, "is required");
  }
  return issues;
}
