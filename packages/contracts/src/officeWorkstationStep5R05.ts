export const workstationStep5R05ReviewOutputs = [
  "assets/art/layout-references/office-workstation-v3/step5-r05/01-reservation-vs-visual-pivot.png",
  "assets/art/layout-references/office-workstation-v3/step5-r05/02-chair-person-contact-measurement.png",
  "assets/art/layout-references/office-workstation-v3/step5-r05/03-equipment-center-pivot-calibration.png",
  "assets/art/layout-references/office-workstation-v3/step5-r05/04-monitor-base-socket-before-after.png",
  "assets/art/layout-references/office-workstation-v3/step5-r05/05-chair-two-volume-before-after.png",
  "assets/art/layout-references/office-workstation-v3/step5-r05/06-person-seat-contact-six-frames.png",
] as const;

export interface OfficeWorkstationStep5R05Manifest {
  version: 5;
  geometrySchemaVersion: 6;
  id: "office.workstation.step5.r05.calibration";
  status: "owner-anchor-proof-approved";
  updatedOn: string;
  replaces: "office.workstation.step5.single-seat.v4";
  completedScope: readonly ["R05-0", "R05-1", "R05-2", "R05-3A"];
  nextScope: "R05-3B-authorized";
  activeOfficeBaseline: { file: string; sha256: string; mustRemainByteIdentical: true };
  acceptedInputs: {
    desk: {
      decision: "retain-byte-identical";
      reservation: readonly [3, 2];
      logicalVolume: readonly [3, 2, 2];
      supportPixels: readonly [96, 64];
    };
    charactersAndPoses: {
      decision: "retain-existing-roster-and-seated-rows";
      newCharacterOrPose: false;
      personStandard: readonly [1, 1, 3];
    };
  };
  coordinateContract: {
    tilePixels: 32;
    reservationSpace: "top-down-world-grid";
    visualSpace: "perspective-alpha-envelope-independent-from-reservation";
    supportHeight: "world-z-independent-from-top-down-reservation";
    supportAnchorDefault: "reservation-center";
    supportAnchorOverride: "explicit-semantic-socket-inside-reservation-only";
    drawFormula: "drawOrigin = project(worldSupportAnchor.xyz) - localVisualPivot.xy";
    orientationSpecificMagicOffsets: "forbidden";
  };
  componentContracts: {
    chair: {
      reservation: readonly [1, 1];
      logicalVolume: readonly [1, 1, 2];
      baseAndSeatVolume: readonly [1, 1, 1];
      backrestVolume: readonly [1, 1, 1];
      levels: { floor: 0; seatPlane: 1; backrestTop: 2 };
      physicalParts: readonly [
        { id: "base-seat"; volume: readonly [1, 1, 1]; zRange: readonly [0, 1] },
        { id: "backrest-arms"; volume: readonly [1, 1, 1]; zRange: readonly [1, 2] },
      ];
      derivedRenderMasks: readonly string[];
      requiredMeasuredPivots: readonly [
        "floor-contact", "seat-plane", "back-support", "person-pelvis-contact",
      ];
      anchorProof: {
        actorLogicalFloorSocketLocal: readonly [48, 112];
        seatPlaneCandidateLocal: readonly [48, 80];
        seatHeightPixels: 32;
        candidateBasis: string;
        contactErrorPixels: { front: readonly [0, 0]; back: readonly [0, 0] };
        status: "owner-approved-calibration-proof-not-runtime-art";
      };
    };
    monitor: {
      reservation: readonly [3, 1];
      supportFootprint: readonly [1, 1];
      supportAnchorDeskLocal: readonly [1.5, 0.5, 2];
      targetVisualWidthPixels: readonly [72, 80];
      pivot: "base-contact-center";
      temporaryProofVisualPivot: readonly [26, 40];
      beforeCenterErrorPixels: { far: readonly [0, 16]; near: readonly [0, 16] };
      afterCenterErrorPixels: { far: readonly [0, 0]; near: readonly [0, 0] };
      maximumOppositeSideClearanceDeltaPixels: 1;
    };
    keyboard: {
      decision: "owner-accepted-and-frozen";
      reservation: readonly [1, 1];
      renderPixels: readonly [48, 24];
      asset: { path: string; sha256: string };
      pivot: "visual-alpha-center";
      localVisualPivot: readonly [24, 12];
      minimumFrontBackClearancePixels: 6;
      maximumSideOverhangPixels: 8;
    };
  };
  measurementEvidence: { file: string; sha256: string };
  reviewOutputs: typeof workstationStep5R05ReviewOutputs;
  permissions: {
    deterministicMeasurement: true;
    calibrationBoards: true;
    anchorProofBoards: true;
    newArtworkGeneration: false;
    rendererImplementation: false;
    singleSeatAssembly: false;
    rosterWideCalibration: false;
    tenSeatAssembly: false;
    step6: false;
    activeOfficePromotion: false;
  };
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exact(value: unknown, expected: unknown) {
  return JSON.stringify(value) === JSON.stringify(expected);
}

export function validateOfficeWorkstationStep5R05(value: unknown): string[] {
  if (!record(value)) return ["step5R05: must be an object"];
  const issues: string[] = [];
  if (value.version !== 5 || value.geometrySchemaVersion !== 6) {
    issues.push("step5R05.version: must use R05 Geometry v6");
  }
  if (value.id !== "office.workstation.step5.r05.calibration"
    || value.status !== "owner-anchor-proof-approved") {
    issues.push("step5R05.identity: must record the approved anchor proof");
  }
  if (!exact(value.completedScope, ["R05-0", "R05-1", "R05-2", "R05-3A"])
    || value.nextScope !== "R05-3B-authorized") {
    issues.push("step5R05.scope: owner approval must authorize R05-3B");
  }
  const accepted = value.acceptedInputs;
  if (!record(accepted) || !record(accepted.desk)
    || accepted.desk.decision !== "retain-byte-identical"
    || !exact(accepted.desk.reservation, [3, 2])
    || !exact(accepted.desk.supportPixels, [96, 64])
    || !record(accepted.charactersAndPoses)
    || accepted.charactersAndPoses.newCharacterOrPose !== false
    || !exact(accepted.charactersAndPoses.personStandard, [1, 1, 3])) {
    issues.push("step5R05.acceptedInputs: desk and current characters/poses must be retained");
  }
  const coordinates = value.coordinateContract;
  if (!record(coordinates) || coordinates.tilePixels !== 32
    || coordinates.reservationSpace !== "top-down-world-grid"
    || coordinates.supportAnchorDefault !== "reservation-center"
    || coordinates.supportAnchorOverride !== "explicit-semantic-socket-inside-reservation-only"
    || coordinates.drawFormula !== "drawOrigin = project(worldSupportAnchor.xyz) - localVisualPivot.xy"
    || coordinates.orientationSpecificMagicOffsets !== "forbidden") {
    issues.push("step5R05.coordinateContract: reservation and pivot authority changed");
  }
  const components = value.componentContracts;
  if (!record(components) || !record(components.chair)
    || !exact(components.chair.baseAndSeatVolume, [1, 1, 1])
    || !exact(components.chair.backrestVolume, [1, 1, 1])
    || !exact(components.chair.physicalParts, [
      { id: "base-seat", volume: [1, 1, 1], zRange: [0, 1] },
      { id: "backrest-arms", volume: [1, 1, 1], zRange: [1, 2] },
    ])
    || !record(components.chair.anchorProof)
    || !exact(components.chair.anchorProof.actorLogicalFloorSocketLocal, [48, 112])
    || !exact(components.chair.anchorProof.seatPlaneCandidateLocal, [48, 80])
    || !exact(components.chair.anchorProof.contactErrorPixels, { front: [0, 0], back: [0, 0] })
    || !record(components.monitor) || !exact(components.monitor.reservation, [3, 1])
    || !exact(components.monitor.supportFootprint, [1, 1])
    || !exact(components.monitor.supportAnchorDeskLocal, [1.5, 0.5, 2])
    || !exact(components.monitor.targetVisualWidthPixels, [72, 80])
    || components.monitor.pivot !== "base-contact-center"
    || !exact(components.monitor.afterCenterErrorPixels, { far: [0, 0], near: [0, 0] })
    || !record(components.keyboard) || !exact(components.keyboard.reservation, [1, 1])
    || components.keyboard.decision !== "owner-accepted-and-frozen"
    || !exact(components.keyboard.renderPixels, [48, 24])
    || !exact(components.keyboard.localVisualPivot, [24, 12])
    || components.keyboard.minimumFrontBackClearancePixels !== 6
    || components.keyboard.maximumSideOverhangPixels !== 8) {
    issues.push("step5R05.componentContracts: chair or equipment constraints changed");
  }
  if (!exact(value.reviewOutputs, workstationStep5R05ReviewOutputs)) {
    issues.push("step5R05.reviewOutputs: three calibration and three before/after boards are required");
  }
  const permissions = value.permissions;
  if (!record(permissions) || permissions.deterministicMeasurement !== true
    || permissions.calibrationBoards !== true || permissions.anchorProofBoards !== true) {
    issues.push("step5R05.permissions: measurement and boards must remain enabled");
  } else for (const key of [
    "newArtworkGeneration", "rendererImplementation", "singleSeatAssembly",
    "rosterWideCalibration", "tenSeatAssembly", "step6", "activeOfficePromotion",
  ]) {
    if (permissions[key] !== false) issues.push(`step5R05.permissions.${key}: must remain false`);
  }
  return issues;
}
