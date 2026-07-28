export const workstationStep5R05FinalReviewOutputs = [
  "assets/art/layout-references/office-workstation-v3/step5-r05-final/01-real-chair-source-to-final-layers.png",
  "assets/art/layout-references/office-workstation-v3/step5-r05-final/02-real-chair-approved-pose-front-back.png",
  "assets/art/layout-references/office-workstation-v3/step5-r05-final/03-real-chair-six-frame-contact.png",
  "assets/art/layout-references/office-workstation-v3/step5-r05-final/04-single-workstation-clean-debug.png",
  "assets/art/layout-references/office-workstation-v3/step5-r05-final/05-ten-seat-office-clean.png",
  "assets/art/layout-references/office-workstation-v3/step5-r05-final/06-ten-seat-office-grid-debug.png",
  "assets/art/layout-references/office-workstation-v3/step5-r05-final/07-rejected-v1-before-r05-after.png",
] as const;

export const workstationStep5R05FinalBrowserCaptures = [
  "assets/game/processed/office-workstation-v3/step5-r05-final/qa/01-browser-ten-clean.jpg",
  "assets/game/processed/office-workstation-v3/step5-r05-final/qa/02-browser-ten-debug.jpg",
  "assets/game/processed/office-workstation-v3/step5-r05-final/qa/03-browser-single-clean.jpg",
  "assets/game/processed/office-workstation-v3/step5-r05-final/qa/04-browser-single-debug.jpg",
] as const;

export interface WorkstationStep5R05Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface WorkstationStep5R05Point {
  x: number;
  y: number;
}

export interface WorkstationStep5R05Geometry {
  desk: WorkstationStep5R05Rect;
  support: WorkstationStep5R05Rect;
  actor: WorkstationStep5R05Rect;
  chair: WorkstationStep5R05Rect;
  seatSocket: WorkstationStep5R05Point;
  floorSocket: WorkstationStep5R05Point;
  monitor: WorkstationStep5R05Rect;
  monitorSocket: WorkstationStep5R05Point;
  monitorReservation: WorkstationStep5R05Rect;
  keyboard: WorkstationStep5R05Rect;
  keyboardReservation: WorkstationStep5R05Rect;
}

export interface OfficeWorkstationStep5R05FinalManifest {
  version: 6;
  geometrySchemaVersion: 7;
  id: "office.workstation.step5.r05.final";
  status: "rejected-composition";
  rejectedOn: "2026-07-28";
  supersededBy: "office.workstation.step5.r05.r02";
  rejectionReasons: readonly string[];
  completedScope: readonly ["R05-3B", "R05-4", "R05-5"];
  activeOfficeBaseline: { file: string; sha256: string; mustRemainByteIdentical: true };
  sourceBackground: { file: string; sha256: string; mustRemainByteIdentical: true };
  components: {
    chair: {
      decision: "real-source-normalized-without-scaling";
      reservation: readonly [1, 1];
      logicalVolume: readonly [1, 1, 2];
      physicalParts: readonly ["base-seat", "backrest-arms"];
      renderMasks: readonly ["rear", "foreground"];
      sourceOriginLocal: readonly [16, 32];
      seatSocketLocal: readonly [48, 80];
      floorSocketLocal: readonly [48, 112];
      contactErrorPixels: { far: readonly [0, 0]; near: readonly [0, 0] };
      sourcePixelReconstruction: true;
    };
    monitor: {
      decision: "owner-accepted-and-frozen";
      reservation: readonly [3, 1];
      renderPixels: readonly [52, 40];
      supportFootprint: readonly [1, 1];
      localVisualPivot: readonly [26, 40];
      centerErrorPixels: { far: readonly [0, 0]; near: readonly [0, 0] };
    };
    keyboard: {
      decision: "owner-accepted-and-frozen";
      reservation: readonly [1, 1];
      renderPixels: readonly [48, 24];
      localVisualPivot: readonly [24, 12];
    };
    characters: {
      decision: "existing-ten-only";
      count: 10;
      newCharacterOrPose: false;
      personStandard: readonly [1, 1, 3];
    };
  };
  station: {
    geometry: { far: WorkstationStep5R05Geometry; near: WorkstationStep5R05Geometry };
    animation: { frames: 6; fps: 6; maximumAnchorDriftPixels: 0 };
    layerOrder: { far: readonly string[]; near: readonly string[] };
  };
  tenSeatMap: { file: string; sha256: string };
  reviewOutputs: typeof workstationStep5R05FinalReviewOutputs;
  browserValidation: {
    requiredSeconds: 60;
    completedSeconds: 60;
    consoleErrors: 0;
    consoleWarnings: 0;
    brokenImages: 0;
    maximumAnchorDriftPixels: 0;
    captures: typeof workstationStep5R05FinalBrowserCaptures;
  };
  permissions: {
    deterministicChairDerivatives: true;
    historicalRegressionEvidence: true;
    isolatedRenderer: false;
    singleSeatAssembly: false;
    tenSeatAssembly: false;
    newCharacterOrPose: false;
    otherFurniture: false;
    step24: false;
    activeOfficePromotion: false;
  };
  runtimePolicy: {
    mockupChairAllowed: false;
    legacyCandidateAllowed: false;
    developmentOnly: true;
  };
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exact(value: unknown, expected: unknown) {
  return JSON.stringify(value) === JSON.stringify(expected);
}

export function validateOfficeWorkstationStep5R05Final(value: unknown): string[] {
  if (!record(value)) return ["step5R05Final: must be an object"];
  const issues: string[] = [];
  if (value.version !== 6 || value.geometrySchemaVersion !== 7
    || value.id !== "office.workstation.step5.r05.final"
    || value.status !== "rejected-composition") {
    issues.push("step5R05Final.identity: must remain rejected composition evidence");
  }
  if (value.rejectedOn !== "2026-07-28"
    || value.supersededBy !== "office.workstation.step5.r05.r02"
    || !Array.isArray(value.rejectionReasons) || value.rejectionReasons.length !== 3) {
    issues.push("step5R05Final.rejection: rejection record is missing or stale");
  }
  if (!exact(value.completedScope, ["R05-3B", "R05-4", "R05-5"])) {
    issues.push("step5R05Final.scope: must complete R05-3B through R05-5 only");
  }
  const components = value.components;
  if (!record(components) || !record(components.chair)
    || components.chair.decision !== "real-source-normalized-without-scaling"
    || !exact(components.chair.logicalVolume, [1, 1, 2])
    || !exact(components.chair.physicalParts, ["base-seat", "backrest-arms"])
    || !exact(components.chair.renderMasks, ["rear", "foreground"])
    || !exact(components.chair.sourceOriginLocal, [16, 32])
    || !exact(components.chair.seatSocketLocal, [48, 80])
    || !exact(components.chair.floorSocketLocal, [48, 112])
    || !exact(components.chair.contactErrorPixels, { far: [0, 0], near: [0, 0] })
    || components.chair.sourcePixelReconstruction !== true) {
    issues.push("step5R05Final.chair: real chair masks or measured sockets changed");
  }
  if (!record(components) || !record(components.monitor)
    || components.monitor.decision !== "owner-accepted-and-frozen"
    || !exact(components.monitor.reservation, [3, 1])
    || !exact(components.monitor.localVisualPivot, [26, 40])
    || !exact(components.monitor.centerErrorPixels, { far: [0, 0], near: [0, 0] })) {
    issues.push("step5R05Final.monitor: accepted monitor socket changed");
  }
  if (!record(components) || !record(components.keyboard)
    || components.keyboard.decision !== "owner-accepted-and-frozen"
    || !exact(components.keyboard.reservation, [1, 1])
    || !exact(components.keyboard.renderPixels, [48, 24])
    || !exact(components.keyboard.localVisualPivot, [24, 12])) {
    issues.push("step5R05Final.keyboard: accepted keyboard changed");
  }
  if (!record(components) || !record(components.characters)
    || components.characters.count !== 10 || components.characters.newCharacterOrPose !== false
    || !exact(components.characters.personStandard, [1, 1, 3])) {
    issues.push("step5R05Final.characters: must use ten existing 1x1x3 characters and poses");
  }
  const station = value.station;
  if (!record(station) || !record(station.animation)
    || station.animation.frames !== 6 || station.animation.maximumAnchorDriftPixels !== 0) {
    issues.push("step5R05Final.station: six-frame anchor drift must remain zero");
  }
  if (!exact(value.reviewOutputs, workstationStep5R05FinalReviewOutputs)) {
    issues.push("step5R05Final.reviewOutputs: seven consolidated review boards are required");
  }
  const browserValidation = value.browserValidation;
  if (!record(browserValidation)
    || browserValidation.requiredSeconds !== 60
    || browserValidation.completedSeconds !== 60
    || browserValidation.consoleErrors !== 0
    || browserValidation.consoleWarnings !== 0
    || browserValidation.brokenImages !== 0
    || browserValidation.maximumAnchorDriftPixels !== 0
    || !exact(browserValidation.captures, workstationStep5R05FinalBrowserCaptures)) {
    issues.push("step5R05Final.browserValidation: complete 60-second clean/debug evidence is required");
  }
  const permissions = value.permissions;
  if (!record(permissions)
    || permissions.deterministicChairDerivatives !== true
    || permissions.historicalRegressionEvidence !== true
    || permissions.isolatedRenderer !== false
    || permissions.singleSeatAssembly !== false
    || permissions.tenSeatAssembly !== false
    || permissions.newCharacterOrPose !== false
    || permissions.otherFurniture !== false
    || permissions.step24 !== false
    || permissions.activeOfficePromotion !== false) {
    issues.push("step5R05Final.permissions: rejected composition may remain only as regression evidence");
  }
  const policy = value.runtimePolicy;
  if (!record(policy) || policy.mockupChairAllowed !== false
    || policy.legacyCandidateAllowed !== false || policy.developmentOnly !== true) {
    issues.push("step5R05Final.runtimePolicy: mockup and legacy candidate must be denied");
  }
  return issues;
}
