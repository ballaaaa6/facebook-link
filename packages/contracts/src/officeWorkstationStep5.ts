export const workstationStep5Orientations = ["far", "near"] as const;

export const workstationStep5LayerOrders = {
  far: [
    "chair-backrest", "actor", "chair-seat-base", "desk-rear", "desk-surface",
    "keyboard", "monitor-back", "desk-base", "desk-foreground",
  ],
  near: [
    "desk-rear", "desk-surface", "monitor-front", "keyboard", "desk-base",
    "desk-foreground", "actor", "chair-backrest", "chair-seat-base",
  ],
} as const;

export const workstationStep5ReviewOutputs = [
  "assets/art/layout-references/office-workstation-v2/step5-r02/01-character-scale-and-parts.png",
  "assets/art/layout-references/office-workstation-v2/step5-r02/02-far-front-corrected.png",
  "assets/art/layout-references/office-workstation-v2/step5-r02/03-near-back-corrected.png",
  "assets/art/layout-references/office-workstation-v2/step5-r02/04-volume-anchor-overlay.png",
  "assets/art/layout-references/office-workstation-v2/step5-r02/05-step5-r02-owner-contact-sheet.png",
] as const;

type Step5Orientation = (typeof workstationStep5Orientations)[number];
type Bounds = { x: number; y: number; width: number; depth: number };
type PixelSize = { width: number; height: number };

export interface OfficeWorkstationStep5ManifestV2 {
  version: 2;
  geometrySchemaVersion: 4;
  id: "office.workstation.step5.single-seat.v2";
  status: "rejected-calibration";
  updatedOn: string;
  replaces: "office.workstation.step5.single-seat.v1";
  permissions: {
    ownerPlanApproval: true;
    isolatedLabRenderer: false;
    singleSeatAssembly: false;
    deterministicDerivedAssets: false;
    newArtworkGeneration: false;
    rosterWideCalibration: false;
    tenSeatSceneAssembly: false;
    activeOfficePromotion: false;
  };
  approvalRecord: {
    planDecision: "accepted";
    approvedOn: string;
    approvedScope: string;
    resultDecision: "rejected";
    rejectedOn: string;
    rejectionReason: string;
    supersededBy: "office.workstation.step5.single-seat.v3";
    nextGate: string;
  };
  activeOfficeBaseline: { file: "assets/game/maps/office-c-v2.json"; sha256: string; mustRemainByteIdentical: true };
  characterScaleAuthority: { file: string; id: "office.character.scale.v1"; sha256: string };
  lab: {
    route: "/?lab=office-workstation-v2-step5";
    developmentOnly: true;
    productionReachable: false;
    background: "neutral-calibration-grid";
    stationCount: 1;
    reviewViewCount: 2;
    historicalEvidenceOnly: true;
  };
  lockedInputs: ReadonlyArray<{ role: string; path: string; sha256: string }>;
  station: {
    character: {
      id: "einstein";
      rows: 15;
      columns: 8;
      floorFootprint: { width: 1; depth: 1 };
      logicalVolume: { width: 1; depth: 1; height: 3 };
      framePixels: { width: 96; height: 104 };
      hipAnchorPixels: { x: 48; y: 72 };
      visualOverflowAllowed: true;
    };
    desk: {
      origin: { x: 2; y: 4 };
      footprint: { width: 3; depth: 2 };
      basePivot: { x: 1.5; y: 2 };
      renderPixels: { width: 96; height: 128 };
      sourcePivotPixels: { x: 48; y: 112 };
      surfaceRows: { start: 42; endExclusive: 72 };
    };
    canvas: { width: 7; height: 8; tilePixels: 32 };
    equipment: {
      monitor: { reservation: { width: 3; depth: 1 }; renderPixels: PixelSize };
      keyboard: { reservation: { width: 3; depth: 1 }; renderPixels: PixelSize; fullSpriteRequired: true };
      chair: {
        footprint: { width: 1; depth: 1 };
        logicalVolume: { width: 1; depth: 1; height: 2 };
        seatAnchor: { z: 1; screenOffsetFromFloorPixels: 32 };
        renderPixels: Record<"front" | "back", PixelSize>;
        visualOverflowAllowed: true;
      };
    };
  };
  deskSides: {
    "public-side": { assetView: "back"; visual: "modesty-panel"; usedBy: "far" };
    "seat-side": { assetView: "front"; visual: "drawers-and-knee-space"; usedBy: "near" };
  };
  orientations: Record<Step5Orientation, {
    deskSide: "public-side" | "seat-side";
    chairView: "front" | "back";
    actorState: "working-front-seated" | "working-back-seated";
    actorFacing: "down" | "up";
    chairFootprintRelative: Bounds;
    monitorReservationRelative: Bounds;
    keyboardReservationRelative: Bounds;
    assemblyOrderBackToFront: readonly string[];
  }>;
  animation: { sampleTicks: readonly [0, 10, 20, 30]; frames: 6; fps: 6; anchorMustRemainStable: true };
  denyList: readonly string[];
  reviewOutputs: typeof workstationStep5ReviewOutputs;
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exact(value: unknown, expected: unknown) {
  return JSON.stringify(value) === JSON.stringify(expected);
}

export function validateOfficeWorkstationStep5Manifest(value: unknown): string[] {
  if (!record(value)) return ["step5: must be an object"];
  const issues: string[] = [];
  const add = (condition: boolean, path: string, message: string) => {
    if (!condition) issues.push(`${path}: ${message}`);
  };
  add(value.version === 2 && value.geometrySchemaVersion === 4, "version", "must use corrected Step 5 Geometry v4");
  add(value.id === "office.workstation.step5.single-seat.v2", "id", "must use the corrected Step 5 id");
  add(value.status === "rejected-calibration", "status", "must remain rejected calibration evidence");

  const permissions = value.permissions;
  add(record(permissions), "permissions", "must be an object");
  if (record(permissions)) {
    add(permissions.ownerPlanApproval === true, "permissions.ownerPlanApproval", "must preserve the historical plan approval");
    for (const key of [
      "isolatedLabRenderer", "singleSeatAssembly", "deterministicDerivedAssets",
      "newArtworkGeneration", "rosterWideCalibration", "tenSeatSceneAssembly", "activeOfficePromotion",
    ]) {
      add(permissions[key] === false, `permissions.${key}`, "must remain blocked");
    }
  }

  const authority = value.characterScaleAuthority;
  add(record(authority) && authority.id === "office.character.scale.v1" && typeof authority.sha256 === "string",
    "characterScaleAuthority", "must lock the current Office character scale");
  const baseline = value.activeOfficeBaseline;
  add(record(baseline) && baseline.file === "assets/game/maps/office-c-v2.json"
    && baseline.mustRemainByteIdentical === true && typeof baseline.sha256 === "string",
  "activeOfficeBaseline", "must lock Active Office");
  const lab = value.lab;
  add(record(lab) && lab.developmentOnly === true && lab.productionReachable === false
    && lab.stationCount === 1 && lab.reviewViewCount === 2 && lab.historicalEvidenceOnly === true,
  "lab", "must remain historical one-station evidence");

  const station = value.station;
  add(record(station), "station", "must be an object");
  if (record(station)) {
    add(exact(station.canvas, { width: 7, height: 8, tilePixels: 32 }), "station.canvas", "must fit full Office-scale characters");
    const character = station.character;
    add(record(character) && exact(character.floorFootprint, { width: 1, depth: 1 })
      && exact(character.logicalVolume, { width: 1, depth: 1, height: 3 })
      && exact(character.framePixels, { width: 96, height: 104 }) && character.visualOverflowAllowed === true,
    "station.character", "must use the current Office 1 x 1 x 3 character standard");
    const desk = station.desk;
    add(record(desk) && exact(desk.origin, { x: 2, y: 4 }) && exact(desk.footprint, { width: 3, depth: 2 })
      && exact(desk.basePivot, { x: 1.5, y: 2 }), "station.desk", "must preserve the 3 x 2 desk");
    const equipment = station.equipment;
    const chair = record(equipment) ? equipment.chair : undefined;
    add(record(chair) && exact(chair.footprint, { width: 1, depth: 1 })
      && exact(chair.logicalVolume, { width: 1, depth: 1, height: 2 })
      && chair.visualOverflowAllowed === true, "station.equipment.chair", "must separate 1 x 1 footprint from 1 x 1 x 2 volume");
  }

  add(exact(value.deskSides, {
    "public-side": { assetView: "back", visual: "modesty-panel", usedBy: "far" },
    "seat-side": { assetView: "front", visual: "drawers-and-knee-space", usedBy: "near" },
  }), "deskSides", "must correct the reversed desk sides");
  const expected = {
    far: { deskSide: "public-side", chairView: "front", chair: { x: 1, y: -1, width: 1, depth: 1 }, monitor: { x: 0, y: 1, width: 3, depth: 1 }, keyboard: { x: 0, y: 0, width: 3, depth: 1 } },
    near: { deskSide: "seat-side", chairView: "back", chair: { x: 1, y: 2, width: 1, depth: 1 }, monitor: { x: 0, y: 0, width: 3, depth: 1 }, keyboard: { x: 0, y: 1, width: 3, depth: 1 } },
  } as const;
  const orientations = value.orientations;
  add(record(orientations), "orientations", "must be an object");
  if (record(orientations)) {
    for (const orientation of workstationStep5Orientations) {
      const item = orientations[orientation];
      add(record(item), `orientations.${orientation}`, "is required");
      if (!record(item)) continue;
      add(item.deskSide === expected[orientation].deskSide && item.chairView === expected[orientation].chairView,
        `orientations.${orientation}`, "uses the wrong physical desk or chair side");
      add(exact(item.chairFootprintRelative, expected[orientation].chair),
        `orientations.${orientation}.chairFootprintRelative`, "must remain outside and centered");
      add(exact(item.monitorReservationRelative, expected[orientation].monitor)
        && exact(item.keyboardReservationRelative, expected[orientation].keyboard),
      `orientations.${orientation}.equipment`, "must place monitor farthest and keyboard nearest");
      add(exact(item.assemblyOrderBackToFront, workstationStep5LayerOrders[orientation]),
        `orientations.${orientation}.assemblyOrderBackToFront`, "must use the v2 semantic layer order");
    }
  }

  const inputs = Array.isArray(value.lockedInputs) ? value.lockedInputs : [];
  add(inputs.length === 24, "lockedInputs", "must contain exactly 24 source and deterministic derived inputs");
  for (const [index, input] of inputs.entries()) {
    add(record(input) && typeof input.path === "string" && typeof input.sha256 === "string"
      && /^[a-f0-9]{64}$/.test(input.sha256), `lockedInputs[${index}]`, "must contain a path and lowercase SHA-256");
  }
  add(exact(value.reviewOutputs, workstationStep5ReviewOutputs), "reviewOutputs", "must list the five corrected review images");
  return issues;
}
