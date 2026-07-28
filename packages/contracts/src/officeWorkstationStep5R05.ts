export const workstationStep5R05ReviewOutputs = [
  "assets/art/layout-references/office-workstation-v3/step5-r05/01-reservation-vs-visual-pivot.png",
  "assets/art/layout-references/office-workstation-v3/step5-r05/02-chair-person-contact-measurement.png",
  "assets/art/layout-references/office-workstation-v3/step5-r05/03-equipment-center-pivot-calibration.png",
] as const;

export interface OfficeWorkstationStep5R05Manifest {
  version: 5;
  geometrySchemaVersion: 6;
  id: "office.workstation.step5.r05.calibration";
  status: "owner-calibration-review";
  updatedOn: string;
  replaces: "office.workstation.step5.single-seat.v4";
  completedScope: readonly ["R05-0", "R05-1", "R05-2"];
  nextScope: "R05-3-blocked-pending-owner-approval";
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
    worldAnchor: "reservation-center";
    drawFormula: "drawOrigin = worldReservationCenter - localVisualPivot";
    orientationSpecificMagicOffsets: "forbidden";
  };
  componentContracts: {
    chair: {
      reservation: readonly [1, 1];
      logicalVolume: readonly [1, 1, 2];
      baseAndSeatVolume: readonly [1, 1, 1];
      backrestVolume: readonly [1, 1, 1];
      levels: { floor: 0; seatPlane: 1; backrestTop: 2 };
      requiredPartMasks: readonly ["base-seat", "backrest-rear", "backrest-foreground"];
      requiredMeasuredPivots: readonly [
        "floor-contact", "seat-plane", "back-support", "person-pelvis-contact",
      ];
    };
    monitor: {
      reservation: readonly [3, 1];
      targetVisualWidthPixels: readonly [72, 80];
      pivot: "base-contact-center";
      maximumOppositeSideClearanceDeltaPixels: 1;
    };
    keyboard: {
      reservation: readonly [1, 1];
      targetVisualPixels: { width: readonly [44, 48]; depth: readonly [18, 20] };
      pivot: "visual-alpha-center";
      minimumFrontBackClearancePixels: 6;
      maximumSideOverhangPixels: 8;
    };
  };
  measurementEvidence: { file: string; sha256: string };
  reviewOutputs: typeof workstationStep5R05ReviewOutputs;
  permissions: {
    deterministicMeasurement: true;
    calibrationBoards: true;
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
    || value.status !== "owner-calibration-review") {
    issues.push("step5R05.identity: must stop at owner calibration review");
  }
  if (!exact(value.completedScope, ["R05-0", "R05-1", "R05-2"])
    || value.nextScope !== "R05-3-blocked-pending-owner-approval") {
    issues.push("step5R05.scope: R05-3 must remain blocked");
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
    || coordinates.worldAnchor !== "reservation-center"
    || coordinates.drawFormula !== "drawOrigin = worldReservationCenter - localVisualPivot"
    || coordinates.orientationSpecificMagicOffsets !== "forbidden") {
    issues.push("step5R05.coordinateContract: reservation and pivot authority changed");
  }
  const components = value.componentContracts;
  if (!record(components) || !record(components.chair)
    || !exact(components.chair.baseAndSeatVolume, [1, 1, 1])
    || !exact(components.chair.backrestVolume, [1, 1, 1])
    || !exact(components.chair.requiredPartMasks, ["base-seat", "backrest-rear", "backrest-foreground"])
    || !record(components.monitor) || !exact(components.monitor.reservation, [3, 1])
    || !exact(components.monitor.targetVisualWidthPixels, [72, 80])
    || components.monitor.pivot !== "base-contact-center"
    || !record(components.keyboard) || !exact(components.keyboard.reservation, [1, 1])
    || !exact(components.keyboard.targetVisualPixels, { width: [44, 48], depth: [18, 20] })
    || components.keyboard.minimumFrontBackClearancePixels !== 6
    || components.keyboard.maximumSideOverhangPixels !== 8) {
    issues.push("step5R05.componentContracts: chair or equipment constraints changed");
  }
  if (!exact(value.reviewOutputs, workstationStep5R05ReviewOutputs)) {
    issues.push("step5R05.reviewOutputs: exactly three calibration boards are required");
  }
  const permissions = value.permissions;
  if (!record(permissions) || permissions.deterministicMeasurement !== true
    || permissions.calibrationBoards !== true) {
    issues.push("step5R05.permissions: measurement and boards must remain enabled");
  } else for (const key of [
    "newArtworkGeneration", "rendererImplementation", "singleSeatAssembly",
    "rosterWideCalibration", "tenSeatAssembly", "step6", "activeOfficePromotion",
  ]) {
    if (permissions[key] !== false) issues.push(`step5R05.permissions.${key}: must remain false`);
  }
  return issues;
}
