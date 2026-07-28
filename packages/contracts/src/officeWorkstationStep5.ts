export const workstationStep5Orientations = ["far", "near"] as const;

export const workstationStep5LayerOrders = {
  far: [
    "desk-rear", "chair-base", "desk-surface", "keyboard", "actor",
    "chair-foreground", "monitor-back", "desk-base", "desk-foreground",
  ],
  near: [
    "desk-rear", "desk-surface", "monitor-front", "keyboard", "desk-base",
    "desk-foreground", "chair-base", "actor", "chair-foreground",
  ],
} as const;

export const workstationStep5ReviewOutputs = [
  "assets/art/layout-references/office-workstation-v2/step5/01-asset-provenance-and-scale.png",
  "assets/art/layout-references/office-workstation-v2/step5/02-front-seat-layer-stack.png",
  "assets/art/layout-references/office-workstation-v2/step5/03-back-seat-layer-stack.png",
  "assets/art/layout-references/office-workstation-v2/step5/04-anchor-occlusion-overlay.png",
  "assets/art/layout-references/office-workstation-v2/step5/05-step5-owner-contact-sheet.png",
] as const;

type Step5Orientation = (typeof workstationStep5Orientations)[number];
type Bounds = { x: number; y: number; width: number; depth: number };

export interface OfficeWorkstationStep5ManifestV1 {
  version: 1;
  geometrySchemaVersion: 3;
  id: "office.workstation.step5.single-seat.v1";
  status: "owner-review";
  updatedOn: string;
  permissions: {
    ownerPlanApproval: true;
    isolatedLabRenderer: true;
    singleSeatAssembly: true;
    newArtworkGeneration: false;
    rosterWideCalibration: false;
    tenSeatSceneAssembly: false;
    activeOfficePromotion: false;
  };
  approvalRecord: {
    planDecision: "accepted";
    approvedOn: string;
    approvedScope: string;
    nextGate: string;
  };
  activeOfficeBaseline: {
    file: "assets/game/maps/office-c-v2.json";
    sha256: string;
    mustRemainByteIdentical: true;
  };
  lab: {
    route: "/?lab=office-workstation-v2-step5";
    developmentOnly: true;
    productionReachable: false;
    background: "neutral-calibration-grid";
    stationCount: 1;
    reviewViewCount: 2;
  };
  lockedInputs: ReadonlyArray<{ role: string; path: string; sha256: string }>;
  station: {
    character: { id: "einstein"; rows: 15; columns: 8; framePixels: { width: 96; height: 104 } };
    desk: {
      origin: { x: 2; y: 3 };
      footprint: { width: 3; depth: 2 };
      basePivot: { x: 1.5; y: 2 };
      renderPixels: { width: 96; height: 128 };
      sourcePivotPixels: { x: 48; y: 112 };
      surfaceRows: { start: 42; endExclusive: 72 };
    };
    canvas: { width: 7; height: 7; tilePixels: 32 };
    equipment: Record<"monitor" | "keyboard" | "chair" | "actor", Record<string, unknown>>;
  };
  orientations: Record<Step5Orientation, {
    deskView: "front" | "back";
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function add(issues: string[], condition: boolean, path: string, message: string) {
  if (!condition) issues.push(`${path}: ${message}`);
}

function exact(value: unknown, expected: unknown) {
  return JSON.stringify(value) === JSON.stringify(expected);
}

export function validateOfficeWorkstationStep5Manifest(value: unknown): string[] {
  if (!isRecord(value)) return ["step5: must be an object"];
  const issues: string[] = [];
  add(issues, value.version === 1 && value.geometrySchemaVersion === 3, "version", "must use Step 5 Geometry v3");
  add(issues, value.id === "office.workstation.step5.single-seat.v1", "id", "must use the isolated Step 5 id");
  add(issues, value.status === "owner-review", "status", "must stop at owner review");

  const permissions = value.permissions;
  add(issues, isRecord(permissions), "permissions", "must be an object");
  if (isRecord(permissions)) {
    for (const key of ["ownerPlanApproval", "isolatedLabRenderer", "singleSeatAssembly"]) {
      add(issues, permissions[key] === true, `permissions.${key}`, "must be explicitly authorized");
    }
    for (const key of ["newArtworkGeneration", "rosterWideCalibration", "tenSeatSceneAssembly", "activeOfficePromotion"]) {
      add(issues, permissions[key] === false, `permissions.${key}`, "must remain blocked");
    }
  }

  const approval = value.approvalRecord;
  add(issues, isRecord(approval) && approval.planDecision === "accepted" && typeof approval.approvedOn === "string",
    "approvalRecord", "must record the owner's Step 5 plan approval");
  const baseline = value.activeOfficeBaseline;
  add(issues, isRecord(baseline) && baseline.file === "assets/game/maps/office-c-v2.json"
    && baseline.mustRemainByteIdentical === true && typeof baseline.sha256 === "string"
    && /^[a-f0-9]{64}$/.test(baseline.sha256), "activeOfficeBaseline", "must lock the Active Office map");
  const lab = value.lab;
  add(issues, isRecord(lab) && lab.developmentOnly === true && lab.productionReachable === false
    && lab.stationCount === 1 && lab.reviewViewCount === 2 && lab.background === "neutral-calibration-grid",
  "lab", "must remain a neutral, development-only one-station review lab");

  const station = value.station;
  add(issues, isRecord(station), "station", "must be an object");
  if (isRecord(station)) {
    add(issues, exact(station.canvas, { width: 7, height: 7, tilePixels: 32 }), "station.canvas", "must use the 7 x 7 calibration canvas");
    const desk = station.desk;
    add(issues, isRecord(desk) && exact(desk.origin, { x: 2, y: 3 })
      && exact(desk.footprint, { width: 3, depth: 2 }) && exact(desk.basePivot, { x: 1.5, y: 2 })
      && exact(desk.sourcePivotPixels, { x: 48, y: 112 }) && exact(desk.surfaceRows, { start: 42, endExclusive: 72 }),
    "station.desk", "must preserve the accepted 3 x 2 desk and pivot");
    const character = station.character;
    add(issues, isRecord(character) && character.id === "einstein" && character.rows === 15 && character.columns === 8,
      "station.character", "must reuse the existing Einstein v3 atlas");
  }

  const expectedBounds = {
    far: { chair: { x: 1, y: -1, width: 1, depth: 1 }, monitor: { x: 0, y: 1, width: 3, depth: 1 }, keyboard: { x: 0, y: 0, width: 3, depth: 1 } },
    near: { chair: { x: 1, y: 2, width: 1, depth: 1 }, monitor: { x: 0, y: 0, width: 3, depth: 1 }, keyboard: { x: 0, y: 1, width: 3, depth: 1 } },
  } as const;
  const orientations = value.orientations;
  add(issues, isRecord(orientations), "orientations", "must be an object");
  if (isRecord(orientations)) {
    for (const orientation of workstationStep5Orientations) {
      const item = orientations[orientation];
      add(issues, isRecord(item), `orientations.${orientation}`, "is required");
      if (!isRecord(item)) continue;
      add(issues, exact(item.chairFootprintRelative, expectedBounds[orientation].chair),
        `orientations.${orientation}.chairFootprintRelative`, "must keep the chair outside and centered");
      add(issues, exact(item.monitorReservationRelative, expectedBounds[orientation].monitor),
        `orientations.${orientation}.monitorReservationRelative`, "must place the monitor farthest from the actor");
      add(issues, exact(item.keyboardReservationRelative, expectedBounds[orientation].keyboard),
        `orientations.${orientation}.keyboardReservationRelative`, "must place the keyboard nearest the actor");
      add(issues, exact(item.assemblyOrderBackToFront, workstationStep5LayerOrders[orientation]),
        `orientations.${orientation}.assemblyOrderBackToFront`, "must use the reviewed semantic layer order");
    }
  }

  const inputs = Array.isArray(value.lockedInputs) ? value.lockedInputs : [];
  add(issues, inputs.length === 18, "lockedInputs", "must contain exactly the 18 approved runtime inputs");
  for (const [index, input] of inputs.entries()) {
    add(issues, isRecord(input) && typeof input.path === "string" && typeof input.sha256 === "string"
      && /^[a-f0-9]{64}$/.test(input.sha256), `lockedInputs[${index}]`, "must contain a path and lowercase SHA-256");
  }
  add(issues, exact(value.reviewOutputs, workstationStep5ReviewOutputs), "reviewOutputs", "must list the five Step 5 evidence images");
  return issues;
}
