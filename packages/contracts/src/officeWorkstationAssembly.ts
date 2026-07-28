export const workstationAssemblyPartRoles = [
  "rear",
  "surface",
  "base",
  "foreground",
] as const;

export const workstationBlueprintOutputFiles = [
  "assets/art/layout-references/office-workstation-v2/01-target-decomposition-v2.png",
  "assets/art/layout-references/office-workstation-v2/02-furniture-exploded-parts-v2.png",
  "assets/art/layout-references/office-workstation-v2/03-assembly-and-adjacency-v2.png",
  "assets/art/layout-references/office-workstation-v2/00-owner-review-contact-sheet-v2.png",
] as const;

type AssemblyPartRole = (typeof workstationAssemblyPartRoles)[number];

interface TileBounds {
  x: number;
  y: number;
  width: number;
  depth: number;
}

export interface OfficeWorkstationAssemblyBibleV2 {
  version: 2;
  geometrySchemaVersion: 3;
  id: "office.workstation.assembly-bible.v2";
  status: "desk-artwork-authorized";
  updatedOn: string;
  permissions: {
    ownerApproval: true;
    deskArtworkGeneration: true;
    chairArtworkGeneration: false;
    monitorArtworkGeneration: false;
    rendererImplementation: false;
    tenSeatSceneAssembly: false;
    activeOfficePromotion: false;
  };
  approvalRecord: {
    approvedOn: string;
    approvedScope: string;
    nextStepBlocked: string;
  };
  sourceReference: {
    file: string;
    sha256: string;
    observationCrop: { x: number; y: number; width: number; height: number };
    measurementPolicy: "composition-reference-not-runtime-pixel-measurement";
  };
  activeOfficeBaseline: {
    file: string;
    sha256: string;
    grid: { width: 36; height: 24; tilePixels: 32 };
    workZone: { x: 0; y: 0; width: 24; height: 24 };
    mustRemainUnchangedDuringBlueprintReview: true;
  };
  coordinateConvention: {
    x: "increases-right";
    y: "increases-toward-viewer";
    localOrigin: "desk-footprint-top-left";
    footprintMeaning: string;
    renderOverflowMeaning: string;
  };
  desk: {
    familyId: "desk.workstation.modern.v2";
    footprint: { width: 3; depth: 2; unit: "tile" };
    supportPlane: TileBounds & { id: "desk-surface"; height: 2.4; unit: "tile" };
    generationRenderBox: { width: 3; height: 4; unit: "tile" };
    basePivot: { x: 1.5; y: 2; unit: "tile" };
    sortPivot: { x: 1.5; y: 2; unit: "tile" };
    employeeEdgeRow: null;
    partContract: ReadonlyArray<{
      role: AssemblyPartRole;
      meaning: string;
      changesFootprint: false;
      mayOverflowFootprint: boolean;
      artworkStatus: "step4-review";
    }>;
  };
  equipment: {
    monitor: {
      reservation: { width: 3; depth: 1; unit: "tile" };
      visualMayUseLessThanReservation: true;
      anchor: { x: 1.5; unit: "tile" };
      rule: string;
    };
    keyboard: {
      reservation: { width: 3; depth: 1; unit: "tile" };
      visualMayUseLessThanReservation: true;
      anchor: { x: 1.5; unit: "tile" };
      rule: string;
    };
  };
  orientations: Record<"far" | "near", {
    deskView: "front" | "back";
    actorFacing: "down" | "up";
    chairFootprintRelative: TileBounds;
    monitorReservationRelative: TileBounds;
    keyboardReservationRelative: TileBounds;
    monitorVisibleSide: "back" | "front";
    assemblyOrderBackToFront: readonly string[];
  }>;
  normalizedTenSeatBlock: {
    targetSeatCount: 10;
    columnCount: 5;
    deskOriginsX: readonly [4, 7, 10, 13, 16];
    farDeskOriginY: 6;
    nearDeskOriginY: 8;
    farChairOriginY: 5;
    nearChairOriginY: 10;
    deskBankBounds: { x: 4; y: 6; width: 15; depth: 4 };
    rules: readonly string[];
  };
  legacyDenyList: {
    deskFamilyIds: readonly string[];
    chairAssetIds: readonly string[];
    geometryRules: readonly string[];
    policy: string;
  };
  reviewOutputs: readonly string[];
  approvalGate: {
    requiredBeforeArtwork: readonly string[];
    nextPhaseWhenApproved: string;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function add(issues: string[], condition: boolean, path: string, message: string) {
  if (!condition) issues.push(`${path}: ${message}`);
}

function exactBounds(value: unknown, expected: TileBounds) {
  return isRecord(value)
    && value.x === expected.x
    && value.y === expected.y
    && value.width === expected.width
    && value.depth === expected.depth;
}

function validatePermissions(value: Record<string, unknown>, issues: string[]) {
  const permissions = value.permissions;
  add(issues, isRecord(permissions), "permissions", "must be an object");
  if (!isRecord(permissions)) return;
  for (const key of [
    "chairArtworkGeneration",
    "monitorArtworkGeneration",
    "rendererImplementation",
    "tenSeatSceneAssembly",
    "activeOfficePromotion",
  ]) {
    add(issues, permissions[key] === false, `permissions.${key}`, "must remain false during Step 4");
  }
  add(issues, permissions.ownerApproval === true, "permissions.ownerApproval", "must record the owner's Step 4 approval");
  add(issues, permissions.deskArtworkGeneration === true, "permissions.deskArtworkGeneration", "must authorize only bare desk artwork");
}

function validateDesk(value: Record<string, unknown>, issues: string[]) {
  const desk = value.desk;
  add(issues, isRecord(desk), "desk", "must be an object");
  if (!isRecord(desk)) return;
  add(issues, desk.familyId === "desk.workstation.modern.v2", "desk.familyId", "must use the v2 family");
  const footprint = desk.footprint;
  add(issues, isRecord(footprint) && footprint.width === 3 && footprint.depth === 2
    && footprint.unit === "tile", "desk.footprint", "must equal 3 x 2 tiles");
  const support = desk.supportPlane;
  add(issues, isRecord(support) && support.id === "desk-surface" && support.x === 0 && support.y === 0
    && support.width === 3 && support.depth === 2 && support.height === 2.4 && support.unit === "tile",
  "desk.supportPlane", "must equal the complete 3 x 2 tabletop plan");
  add(issues, desk.employeeEdgeRow === null, "desk.employeeEdgeRow", "must be null; height cannot add a footprint row");
  for (const pivotName of ["basePivot", "sortPivot"]) {
    const pivot = desk[pivotName];
    add(issues, isRecord(pivot) && pivot.x === 1.5 && pivot.y === 2 && pivot.unit === "tile",
      `desk.${pivotName}`, "must equal (1.5, 2) tiles");
  }
  const parts = Array.isArray(desk.partContract) ? desk.partContract : [];
  add(issues, parts.length === workstationAssemblyPartRoles.length, "desk.partContract", "must define four semantic parts");
  const roles = new Set<string>();
  parts.forEach((candidate, index) => {
    add(issues, isRecord(candidate), `desk.partContract[${index}]`, "must be an object");
    if (!isRecord(candidate)) return;
    const role = typeof candidate.role === "string" ? candidate.role : "";
    add(issues, workstationAssemblyPartRoles.includes(role as AssemblyPartRole) && !roles.has(role),
      `desk.partContract[${index}].role`, "must be a unique semantic part role");
    roles.add(role);
    add(issues, candidate.changesFootprint === false, `desk.partContract[${index}].changesFootprint`, "must remain false");
    add(issues, candidate.artworkStatus === "step4-review", `desk.partContract[${index}].artworkStatus`, "must remain in Step 4 review");
  });
}

function validateEquipment(value: Record<string, unknown>, issues: string[]) {
  const equipment = value.equipment;
  add(issues, isRecord(equipment), "equipment", "must be an object");
  if (!isRecord(equipment)) return;
  for (const name of ["monitor", "keyboard"]) {
    const item = equipment[name];
    add(issues, isRecord(item), `equipment.${name}`, "must be an object");
    if (!isRecord(item)) continue;
    const reservation = item.reservation;
    add(issues, isRecord(reservation) && reservation.width === 3 && reservation.depth === 1
      && reservation.unit === "tile", `equipment.${name}.reservation`, "must reserve 3 x 1 tiles");
    add(issues, item.visualMayUseLessThanReservation === true,
      `equipment.${name}.visualMayUseLessThanReservation`, "must permit smaller artwork inside the reservation");
  }
}

function validateOrientations(value: Record<string, unknown>, issues: string[]) {
  const orientations = value.orientations;
  add(issues, isRecord(orientations), "orientations", "must be an object");
  if (!isRecord(orientations)) return;
  const expected = {
    far: {
      chair: { x: 1, y: -1, width: 1, depth: 1 },
      monitor: { x: 0, y: 1, width: 3, depth: 1 },
      keyboard: { x: 0, y: 0, width: 3, depth: 1 },
    },
    near: {
      chair: { x: 1, y: 2, width: 1, depth: 1 },
      monitor: { x: 0, y: 0, width: 3, depth: 1 },
      keyboard: { x: 0, y: 1, width: 3, depth: 1 },
    },
  } as const;
  for (const orientation of ["far", "near"] as const) {
    const item = orientations[orientation];
    add(issues, isRecord(item), `orientations.${orientation}`, "must be an object");
    if (!isRecord(item)) continue;
    add(issues, exactBounds(item.chairFootprintRelative, expected[orientation].chair),
      `orientations.${orientation}.chairFootprintRelative`, "must center the external 1 x 1 chair");
    add(issues, exactBounds(item.monitorReservationRelative, expected[orientation].monitor),
      `orientations.${orientation}.monitorReservationRelative`, "must place the monitor farthest from the actor");
    add(issues, exactBounds(item.keyboardReservationRelative, expected[orientation].keyboard),
      `orientations.${orientation}.keyboardReservationRelative`, "must place the keyboard nearest the actor");
    add(issues, Array.isArray(item.assemblyOrderBackToFront) && item.assemblyOrderBackToFront.length === 9,
      `orientations.${orientation}.assemblyOrderBackToFront`, "must define nine explicit layers");
  }
}

function validateBlock(value: Record<string, unknown>, issues: string[]) {
  const block = value.normalizedTenSeatBlock;
  add(issues, isRecord(block), "normalizedTenSeatBlock", "must be an object");
  if (!isRecord(block)) return;
  add(issues, block.targetSeatCount === 10 && block.columnCount === 5,
    "normalizedTenSeatBlock", "must describe five columns and ten seats");
  add(issues, JSON.stringify(block.deskOriginsX) === JSON.stringify([4, 7, 10, 13, 16]),
    "normalizedTenSeatBlock.deskOriginsX", "must use edge-touching three-tile columns");
  add(issues, block.farDeskOriginY === 6 && block.nearDeskOriginY === 8,
    "normalizedTenSeatBlock.deskRows", "must use directly touching two-tile rows");
  add(issues, block.farChairOriginY === 5 && block.nearChairOriginY === 10,
    "normalizedTenSeatBlock.chairRows", "must keep both chair rows outside the desk block");
  add(issues, exactBounds(block.deskBankBounds, { x: 4, y: 6, width: 15, depth: 4 }),
    "normalizedTenSeatBlock.deskBankBounds", "must fit the 15 x 4 block inside the current work zone");
}

export function validateOfficeWorkstationAssemblyBibleV2(value: unknown): string[] {
  if (!isRecord(value)) return ["assemblyBible: must be an object"];
  const issues: string[] = [];
  add(issues, value.version === 2, "version", "must equal 2");
  add(issues, value.geometrySchemaVersion === 3, "geometrySchemaVersion", "must equal 3");
  add(issues, value.id === "office.workstation.assembly-bible.v2", "id", "must equal the v2 authority ID");
  add(issues, value.status === "desk-artwork-authorized", "status", "must record the Step 4 desk-artwork gate");
  validatePermissions(value, issues);
  validateDesk(value, issues);
  validateEquipment(value, issues);
  validateOrientations(value, issues);
  validateBlock(value, issues);
  add(issues, JSON.stringify(value.reviewOutputs) === JSON.stringify(workstationBlueprintOutputFiles),
    "reviewOutputs", "must list the exact deterministic owner-review images");
  const denyList = value.legacyDenyList;
  add(issues, isRecord(denyList) && Array.isArray(denyList.deskFamilyIds)
    && denyList.deskFamilyIds.includes("desk.modular.v1"),
  "legacyDenyList.deskFamilyIds", "must block the rejected v1 desk family");
  return issues;
}
