export const workstationStep5R05R02ReviewOutputs = [
  "assets/art/layout-references/office-workstation-v3/step5-r05-r02/01-coordinate-contract.png",
  "assets/art/layout-references/office-workstation-v3/step5-r05-r02/02-roster-front-overview.png",
  "assets/art/layout-references/office-workstation-v3/step5-r05-r02/03-roster-back-overview.png",
  "assets/art/layout-references/office-workstation-v3/step5-r05-r02/04-roster-front-six-frames-a.png",
  "assets/art/layout-references/office-workstation-v3/step5-r05-r02/05-roster-front-six-frames-b.png",
  "assets/art/layout-references/office-workstation-v3/step5-r05-r02/06-roster-back-six-frames-a.png",
  "assets/art/layout-references/office-workstation-v3/step5-r05-r02/07-roster-back-six-frames-b.png",
  "assets/art/layout-references/office-workstation-v3/step5-r05-r02/08-desk-depth-before-after.png",
  "assets/art/layout-references/office-workstation-v3/step5-r05-r02/09-far-equipment-before-after.png",
  "assets/art/layout-references/office-workstation-v3/step5-r05-r02/10-back-seat-before-after.png",
  "assets/art/layout-references/office-workstation-v3/step5-r05-r02/11-paired-workstation-clean-debug.png",
] as const;

export type WorkstationSeatOrientation = "front" | "back";
export type WorkstationPairOrientation = "far" | "near";

export interface WorkstationSeatSocketFrame {
  frame: number;
  pelvisPivotLocal: readonly [number, number];
  seatContactLocal: readonly [number, number];
  contactSpanLocalX: readonly [number, number];
  alphaBounds: readonly [number, number, number, number];
}

export interface WorkstationSeatCapableCharacter {
  slug: string;
  seatCapability: "working-seated";
  framePixels: readonly [96, 104];
  occupancy: readonly [1, 1, 3];
  source: { file: string; sha256: string };
  orientations: Record<WorkstationSeatOrientation, {
    row: 13 | 14;
    measurementStatus: string;
    frames: readonly WorkstationSeatSocketFrame[];
  }>;
}

export interface WorkstationSeatIncapableCompanion {
  slug: "boba";
  seatCapability: "not-applicable-companion-atlas";
  reason: string;
  source: { file: string; sha256: string };
}

export interface OfficeCharacterSeatSocketsManifest {
  version: 1;
  schema: "office-character-seat-sockets";
  status: "owner-approved";
  tilePixels: 32;
  placementFormula: string;
  rules: {
    canvasBoundsAreFootprint: false;
    alphaBoundsAreFootprint: false;
    orientationMagicOffsets: false;
    frameSpecificSeatSocketsAllowed: true;
    newCharacterOrPose: false;
    handSocketsInScope: false;
  };
  audit: {
    directoryCount: 19;
    seatCapableCount: 18;
    companionNotApplicableCount: 1;
    seatFrameRecordCount: 216;
  };
  entries: readonly (WorkstationSeatCapableCharacter | WorkstationSeatIncapableCompanion)[];
}

export interface OfficeWorkstationStep5R05R02Manifest {
  version: 7;
  geometrySchemaVersion: 8;
  id: "office.workstation.step5.r05.r02";
  status: "owner-approved-p0-p3";
  supersedesForPlacementAuthority: "office.workstation.step5.r05.final";
  ownerDecision: {
    decision: "approved";
    approvedOn: "2026-07-28";
    approvedScope: readonly ["coordinate-system", "seat-sockets", "equipment-depth", "paired-workstation"];
  };
  completedScope: readonly ["P0", "P1", "P2", "P3"];
  stopGate: "approved-awaiting-ten-seat-plan-execution";
  rosterSockets: {
    file: string;
    sha256: string;
    directoriesAudited: 19;
    seatCapableCharacters: 18;
    frameRecords: 216;
  };
  components: {
    desk: { footprint: readonly [3, 2]; logicalVolume: readonly [3, 2, 2]; renderPixels: readonly [96, 128]; supportPixels: readonly [96, 64] };
    chair: { footprint: readonly [1, 1]; logicalVolume: readonly [1, 1, 2]; seatSocketLocal: readonly [48, 80]; floorSocketLocal: readonly [48, 112] };
    person: { footprint: readonly [1, 1]; logicalVolume: readonly [1, 1, 3]; newCharacterOrPose: false };
    monitor: { reservation: readonly [3, 1]; baseSocketLocal: readonly [26, 40]; farLayerOrder: "keyboard-before-monitor" };
    keyboard: { reservation: readonly [1, 1]; renderPixels: readonly [48, 24] };
  };
  station: {
    animation: { frames: 6; fps: 6 };
    layerOrder: Record<WorkstationPairOrientation, readonly string[]>;
  };
  pairMap: { file: string; sha256: string };
  reviewOutputs: typeof workstationStep5R05R02ReviewOutputs;
  browserValidation: {
    consoleErrors: 0;
    consoleWarnings: 0;
    brokenImages: 0;
    stationTopDeltaPixels: 64;
    actorSeatDeltaPixels: readonly [0, 0];
    farEquipmentOrder: readonly ["keyboard", "monitor-back"];
    contractPass: true;
    captures: readonly string[];
  };
  permissions: {
    isolatedCoordinateRenderer: true;
    rosterSeatSocketAudit: true;
    pairedWorkstationProof: true;
    tenSeatExpansion: false;
    handSockets: false;
    newCharacterOrPose: false;
    otherFurniture: false;
    activeOfficePromotion: false;
  };
  activeOfficeBaseline: { file: string; sha256: string; mustRemainByteIdentical: true };
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exact(value: unknown, expected: unknown) {
  return JSON.stringify(value) === JSON.stringify(expected);
}

export function validateOfficeCharacterSeatSockets(value: unknown): string[] {
  if (!record(value)) return ["seatSockets: must be an object"];
  const issues: string[] = [];
  if (value.version !== 1 || value.schema !== "office-character-seat-sockets"
    || value.status !== "owner-approved" || value.tilePixels !== 32) {
    issues.push("seatSockets.identity: invalid coordinate manifest identity");
  }
  if (!record(value.rules) || value.rules.canvasBoundsAreFootprint !== false
    || value.rules.alphaBoundsAreFootprint !== false
    || value.rules.orientationMagicOffsets !== false
    || value.rules.frameSpecificSeatSocketsAllowed !== true
    || value.rules.newCharacterOrPose !== false
    || value.rules.handSocketsInScope !== false) {
    issues.push("seatSockets.rules: footprint/socket scope changed");
  }
  if (!record(value.audit) || value.audit.directoryCount !== 19
    || value.audit.seatCapableCount !== 18
    || value.audit.companionNotApplicableCount !== 1
    || value.audit.seatFrameRecordCount !== 216) {
    issues.push("seatSockets.audit: must cover 18 seated atlases and one non-seated companion");
  }
  if (!Array.isArray(value.entries) || value.entries.length !== 19) {
    issues.push("seatSockets.entries: exactly nineteen directory records are required");
    return issues;
  }
  const seated = value.entries.filter((entry) => record(entry) && entry.seatCapability === "working-seated");
  const companion = value.entries.filter((entry) => record(entry) && entry.seatCapability === "not-applicable-companion-atlas");
  if (seated.length !== 18 || companion.length !== 1 || companion[0]?.slug !== "boba") {
    issues.push("seatSockets.capability: eighteen seat-capable characters plus Boba are required");
  }
  for (const entry of seated) {
    if (!record(entry) || !record(entry.orientations)) continue;
    for (const orientation of ["front", "back"] as const) {
      const item = entry.orientations[orientation];
      if (!record(item) || !Array.isArray(item.frames) || item.frames.length !== 6) {
        issues.push(`seatSockets.${String(entry.slug)}.${orientation}: six frames required`);
        continue;
      }
      for (const [frameIndex, frame] of item.frames.entries()) {
        if (!record(frame) || frame.frame !== frameIndex
          || !Array.isArray(frame.seatContactLocal)
          || frame.seatContactLocal[0] !== 48
          || typeof frame.seatContactLocal[1] !== "number") {
          issues.push(`seatSockets.${String(entry.slug)}.${orientation}.${frameIndex}: invalid seat contact`);
        }
      }
    }
  }
  return issues;
}

export function validateOfficeWorkstationStep5R05R02(value: unknown): string[] {
  if (!record(value)) return ["step5R05R02: must be an object"];
  const issues: string[] = [];
  if (value.version !== 7 || value.geometrySchemaVersion !== 8
    || value.id !== "office.workstation.step5.r05.r02"
    || value.status !== "owner-approved-p0-p3") {
    issues.push("step5R05R02.identity: invalid approved coordinate baseline");
  }
  if (value.supersedesForPlacementAuthority !== "office.workstation.step5.r05.final"
    || !record(value.ownerDecision) || value.ownerDecision.decision !== "approved"
    || value.ownerDecision.approvedOn !== "2026-07-28"
    || !exact(value.ownerDecision.approvedScope,
      ["coordinate-system", "seat-sockets", "equipment-depth", "paired-workstation"])) {
    issues.push("step5R05R02.ownerDecision: owner approval record is missing or stale");
  }
  if (!exact(value.completedScope, ["P0", "P1", "P2", "P3"])
    || value.stopGate !== "approved-awaiting-ten-seat-plan-execution") {
    issues.push("step5R05R02.scope: approved P0-P3 must await the named ten-seat execution phase");
  }
  if (!record(value.rosterSockets) || value.rosterSockets.directoriesAudited !== 19
    || value.rosterSockets.seatCapableCharacters !== 18
    || value.rosterSockets.frameRecords !== 216) {
    issues.push("step5R05R02.rosterSockets: full directory/socket audit required");
  }
  if (!record(value.components) || !record(value.components.desk)
    || !exact(value.components.desk.footprint, [3, 2])
    || !exact(value.components.desk.supportPixels, [96, 64])
    || !record(value.components.monitor)
    || value.components.monitor.farLayerOrder !== "keyboard-before-monitor") {
    issues.push("step5R05R02.components: physical desk or far equipment depth changed");
  }
  if (!exact(value.reviewOutputs, workstationStep5R05R02ReviewOutputs)) {
    issues.push("step5R05R02.reviewOutputs: eleven deterministic proof boards required");
  }
  const browserValidation = value.browserValidation;
  if (!record(browserValidation) || browserValidation.consoleErrors !== 0
    || browserValidation.consoleWarnings !== 0 || browserValidation.brokenImages !== 0
    || browserValidation.stationTopDeltaPixels !== 64
    || !exact(browserValidation.actorSeatDeltaPixels, [0, 0])
    || !exact(browserValidation.farEquipmentOrder, ["keyboard", "monitor-back"])
    || browserValidation.contractPass !== true
    || !Array.isArray(browserValidation.captures) || browserValidation.captures.length !== 4) {
    issues.push("step5R05R02.browserValidation: clean/debug runtime evidence is incomplete");
  }
  const permissions = value.permissions;
  if (!record(permissions) || permissions.isolatedCoordinateRenderer !== true
    || permissions.rosterSeatSocketAudit !== true
    || permissions.pairedWorkstationProof !== true
    || permissions.tenSeatExpansion !== false
    || permissions.handSockets !== false
    || permissions.newCharacterOrPose !== false
    || permissions.otherFurniture !== false
    || permissions.activeOfficePromotion !== false) {
    issues.push("step5R05R02.permissions: only the isolated P0-P3 proof is authorized");
  }
  return issues;
}
