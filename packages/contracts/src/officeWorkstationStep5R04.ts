export const workstationStep5R04LayerOrder = {
  far: [
    "chair-rear", "chair-seat", "actor", "chair-foreground",
    "desk-rear", "desk-surface", "monitor-back", "keyboard", "desk-base", "desk-foreground",
  ],
  near: [
    "desk-rear", "desk-surface", "monitor-front", "keyboard", "desk-base", "desk-foreground",
    "chair-rear", "chair-seat", "actor", "chair-foreground",
  ],
} as const;

export const workstationStep5R04ReviewOutputs = [
  "assets/art/layout-references/office-workstation-v3/step5-r04/01-components-and-semantic-sides.png",
  "assets/art/layout-references/office-workstation-v3/step5-r04/02-far-front-clean.png",
  "assets/art/layout-references/office-workstation-v3/step5-r04/03-near-back-clean.png",
  "assets/art/layout-references/office-workstation-v3/step5-r04/04-footprint-contact-and-z-overlay.png",
  "assets/art/layout-references/office-workstation-v3/step5-r04/05-six-frame-animation-stability-strip.png",
  "assets/art/layout-references/office-workstation-v3/step5-r04/06-current-office-context-preview.png",
  "assets/art/layout-references/office-workstation-v3/step5-r04/07-browser-runtime-review.png",
  "assets/art/layout-references/office-workstation-v3/step5-r04/08-browser-office-context.png",
] as const;

export type WorkstationStep5R04Orientation = "far" | "near";
export interface WorkstationStep5R04Rect { left: number; top: number; width: number; height: number }
export interface WorkstationStep5R04Point { x: number; y: number }

export interface WorkstationStep5R04Geometry {
  desk: WorkstationStep5R04Rect;
  support: WorkstationStep5R04Rect;
  deskFloorOrigin: WorkstationStep5R04Point;
  actorFloor: WorkstationStep5R04Point;
  actor: WorkstationStep5R04Rect;
  chair: WorkstationStep5R04Rect;
  seatAnchor: WorkstationStep5R04Point;
  hipAnchor: WorkstationStep5R04Point;
  monitor: WorkstationStep5R04Rect;
  keyboard: WorkstationStep5R04Rect;
  monitorReservation: WorkstationStep5R04Rect;
  keyboardReservation: WorkstationStep5R04Rect;
}

export interface OfficeWorkstationStep5ManifestV4 {
  version: 4;
  geometrySchemaVersion: 5;
  id: "office.workstation.step5.single-seat.v4";
  status: "isolated-runtime-owner-review";
  updatedOn: string;
  replaces: "office.workstation.step5.single-seat.v3";
  completedScope: readonly ["P4", "P5", "P6"];
  runtimeScope: "P6-isolated-lab-complete";
  componentsAuthority: { file: string; sha256: string };
  activeOfficeBaseline: { file: string; sha256: string; mustRemainByteIdentical: true };
  lab: {
    route: "/?lab=office-workstation-v3-step5";
    developmentOnly: true;
    productionReachable: false;
    stationCount: 1;
    orientationCount: 2;
  };
  animation: {
    frames: 6;
    fps: 6;
    rows: Record<WorkstationStep5R04Orientation, 13 | 14>;
    maximumAnchorDriftPixels: 0;
  };
  geometry: Record<WorkstationStep5R04Orientation, WorkstationStep5R04Geometry>;
  layerOrder: Record<WorkstationStep5R04Orientation, readonly string[]>;
  reviewOutputs: typeof workstationStep5R04ReviewOutputs;
  browserValidation: {
    animationSeconds: 30;
    desktopViewport: readonly [1280, 720];
    contextViewport: readonly [1280, 1100];
    narrowViewport: readonly [390, 844];
    consoleErrors: 0;
    brokenImages: 0;
    maximumHorizontalOverflowPixels: 0;
    anchorStable: true;
  };
  permissions: {
    newCharacterOrPose: false;
    isolatedLabRenderer: true;
    tenSeatAssembly: false;
    rosterWideCalibration: false;
    step6: false;
    activeOfficePromotion: false;
  };
  ownerGate: { decision: "pending"; approveOnly: string; stillBlocked: readonly string[] };
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exact(value: unknown, expected: unknown) {
  return JSON.stringify(value) === JSON.stringify(expected);
}

export function validateOfficeWorkstationComponentsV3(value: unknown): string[] {
  if (!record(value)) return ["componentsV3: must be an object"];
  const issues: string[] = [];
  const geometry = value.geometry;
  if (value.version !== 3 || value.geometrySchemaVersion !== 5) issues.push("componentsV3.version: must use Geometry v5");
  if (value.status !== "isolated-owner-review") issues.push("componentsV3.status: must stop at owner review");
  if (!record(geometry)) return [...issues, "componentsV3.geometry: must be an object"];
  if (!exact(geometry.person, { footprint: [1, 1], logicalVolume: [1, 1, 3], framePixels: [96, 104], hipAnchorPixels: [48, 72] })) {
    issues.push("componentsV3.person: must preserve current Office scale");
  }
  if (!record(geometry.chair) || !exact(geometry.chair.renderPixels, [64, 80])
    || geometry.chair.seatOffsetFromFloorPixels !== 32) issues.push("componentsV3.chair: must lock 64 x 80 with z1 contact");
  if (!record(geometry.desk) || !exact(geometry.desk.supportRows, [0, 64])
    || !exact(geometry.desk.renderPixels, [96, 128])) issues.push("componentsV3.desk: must expose a full 96 x 64 support");
  if (!record(geometry.monitor) || !exact(geometry.monitor.renderPixels, [52, 40])) issues.push("componentsV3.monitor: must use non-overlapping 52 x 40 visual");
  if (!record(geometry.keyboard) || !exact(geometry.keyboard.reservation, [1, 1])
    || !exact(geometry.keyboard.renderPixels, [48, 24])) issues.push("componentsV3.keyboard: must reserve 1 x 1 and render 48 x 24");
  const permissions = value.permissions;
  if (!record(permissions) || permissions.componentArtwork !== true
    || permissions.staticSingleSeatAssembly !== true || permissions.isolatedLabRenderer !== true
    || permissions.tenSeatAssembly !== false || permissions.step6 !== false
    || permissions.activeOfficePromotion !== false) issues.push("componentsV3.permissions: only isolated Step 5 work is authorized");
  return issues;
}

export function validateOfficeWorkstationStep5ManifestV4(value: unknown): string[] {
  if (!record(value)) return ["step5R04: must be an object"];
  const issues: string[] = [];
  if (value.version !== 4 || value.geometrySchemaVersion !== 5) issues.push("step5R04.version: must use Geometry v5");
  if (value.id !== "office.workstation.step5.single-seat.v4") issues.push("step5R04.id: has the wrong identity");
  if (value.status !== "isolated-runtime-owner-review") issues.push("step5R04.status: must stop at owner review");
  if (!exact(value.completedScope, ["P4", "P5", "P6"]) || value.runtimeScope !== "P6-isolated-lab-complete") {
    issues.push("step5R04.scope: must contain P4-P6 only");
  }
  const permissions = value.permissions;
  if (!record(permissions) || permissions.isolatedLabRenderer !== true
    || permissions.newCharacterOrPose !== false || permissions.tenSeatAssembly !== false
    || permissions.rosterWideCalibration !== false || permissions.step6 !== false
    || permissions.activeOfficePromotion !== false) issues.push("step5R04.permissions: implementation escaped the isolated lab");
  const lab = value.lab;
  if (!record(lab) || lab.route !== "/?lab=office-workstation-v3-step5"
    || lab.developmentOnly !== true || lab.productionReachable !== false
    || lab.stationCount !== 1 || lab.orientationCount !== 2) issues.push("step5R04.lab: must remain one development-only station");
  const animation = value.animation;
  if (!record(animation) || animation.frames !== 6 || animation.fps !== 6
    || animation.maximumAnchorDriftPixels !== 0) issues.push("step5R04.animation: must lock six stable frames");
  const geometry = value.geometry;
  if (!record(geometry)) issues.push("step5R04.geometry: must be an object");
  else for (const orientation of ["far", "near"] as const) {
    const item = geometry[orientation];
    if (!record(item)) { issues.push(`step5R04.geometry.${orientation}: is required`); continue; }
    if (!exact(item.seatAnchor, item.hipAnchor)) issues.push(`step5R04.geometry.${orientation}: seat and hip must match`);
    if (!exact(item.actor, { left: 208, top: orientation === "far" ? 108 : 204, width: 96, height: 104 })) {
      issues.push(`step5R04.geometry.${orientation}.actor: current Office frame changed`);
    }
    if (!exact(item.chair, { left: 224, top: orientation === "far" ? 132 : 228, width: 64, height: 80 })) {
      issues.push(`step5R04.geometry.${orientation}.chair: normalized chair changed`);
    }
    if (!exact(item.support, { left: 208, top: 180, width: 96, height: 64 })) {
      issues.push(`step5R04.geometry.${orientation}.support: must equal 96 x 64`);
    }
  }
  const orders = value.layerOrder;
  if (!record(orders) || !exact(orders.far, workstationStep5R04LayerOrder.far)
    || !exact(orders.near, workstationStep5R04LayerOrder.near)) issues.push("step5R04.layerOrder: changed");
  if (!exact(value.reviewOutputs, workstationStep5R04ReviewOutputs)) issues.push("step5R04.reviewOutputs: must list eight review images");
  if (!exact(value.browserValidation, {
    animationSeconds: 30,
    desktopViewport: [1280, 720],
    contextViewport: [1280, 1100],
    narrowViewport: [390, 844],
    consoleErrors: 0,
    brokenImages: 0,
    maximumHorizontalOverflowPixels: 0,
    anchorStable: true,
  })) issues.push("step5R04.browserValidation: P6 evidence changed");
  return issues;
}
