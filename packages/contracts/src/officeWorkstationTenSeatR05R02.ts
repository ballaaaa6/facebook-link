export const workstationTenSeatR05R02ReviewOutputs = [
  "assets/art/layout-references/office-workstation-v3/ten-seat-r05-r02/01-four-station-intersection-clean-debug.png",
  "assets/art/layout-references/office-workstation-v3/ten-seat-r05-r02/02-ten-seat-upper-left-clean.png",
  "assets/art/layout-references/office-workstation-v3/ten-seat-r05-r02/03-ten-seat-upper-left-debug.png",
  "assets/art/layout-references/office-workstation-v3/ten-seat-r05-r02/04-ten-seat-seat-contact-matrix.png",
  "assets/art/layout-references/office-workstation-v3/ten-seat-r05-r02/05-rejected-r05-final-vs-upper-left-rebuild.png",
  "assets/art/layout-references/office-workstation-v3/ten-seat-r05-r02/06-capacity-20-reservation-plan.png",
] as const;

export type WorkstationTenSeatOrientation = "far" | "near";

export interface WorkstationTenSeatPlacement {
  id: string;
  column: number;
  agentId: string;
  characterSlug: string;
  orientation: WorkstationTenSeatOrientation;
  deskOriginWorld: readonly [number, number, 0];
  deskDrawOriginPixels: readonly [number, number];
  chairFloorWorld: readonly [number, number, 0];
  chairSeatWorld: readonly [number, number, 1];
  actorOccupancyOriginWorld: readonly [number, number, 0];
  seatContacts: readonly {
    frame: number;
    actorSeatContactLocal: readonly [number, number];
    chairSeatSocketLocal: readonly [48, 80];
    resolvedDeltaPixels: readonly [0, 0];
  }[];
}

export interface OfficeWorkstationTenSeatR05R02Map {
  schemaVersion: 1;
  id: "office-workstation-ten-seat-r05-r02";
  status: "owner-review-p4-p6";
  developmentOnly: true;
  activeOfficePromotion: false;
  stagePixels: readonly [1365, 768];
  grid: { tilePixels: 32 };
  placement: {
    zone: "upper-left";
    columnCount: 5;
    currentRowCount: 2;
    futureRowCount: 2;
    deskOriginsX: readonly [2, 5, 8, 11, 14];
    currentDeskOriginsY: { far: 11; near: 13 };
    reservedDeskOriginsY: { far: 18; near: 20 };
  };
  capacity: { currentEmployees: 10; reservedEmployees: 10; totalPlannedEmployees: 20 };
  currentWorkstations: readonly WorkstationTenSeatPlacement[];
  futureReservations: readonly {
    id: string;
    column: number;
    orientation: WorkstationTenSeatOrientation;
    deskOriginWorld: readonly [number, number, 0];
    chairFloorWorld: readonly [number, number, 0];
    employeeAssigned: false;
    artRendered: false;
  }[];
  joins: {
    horizontal: readonly { gapPixels: 0 }[];
    depth: readonly { originDeltaTiles: readonly [0, 2, 0]; originDeltaPixels: readonly [0, 64]; tabletopGapPixels: 0 }[];
  };
  rules: {
    deriveFromApprovedPair: true;
    importRejectedTenSeatCoordinates: false;
    renderFutureFurniture: false;
    renderFutureEmployees: false;
    newCharacterOrPose: false;
    otherFurniture: false;
  };
  sourceBackground: { file: string; sha256: string; mustRemainByteIdentical: true };
  seatSockets: { file: string; sha256: string };
  activeOfficeBaseline: { file: string; sha256: string; mustRemainByteIdentical: true };
}

export interface OfficeWorkstationTenSeatR05R02Manifest {
  version: 1;
  id: "office.workstation.ten-seat.r05.r02";
  status: "owner-review-p4-p6";
  derivesFrom: "office.workstation.step5.r05.r02";
  scope: readonly ["P4-four-station-preflight", "P5-ten-seat-upper-left", "P6-capacity-and-browser-qa"];
  layoutDecision: {
    currentEmployees: 10;
    location: "upper-left";
    shape: "five-columns-two-opposing-seats";
    reservedEmptyEmployeesBelow: 10;
    totalPlannedCapacity: 20;
  };
  map: { file: string; sha256: string };
  reviewOutputs: typeof workstationTenSeatR05R02ReviewOutputs;
  browserValidation: {
    required: true;
    captures: readonly string[];
    expectedConsoleErrors: 0;
    expectedBrokenImages: 0;
    expectedSeatContactErrors: 0;
    result: "passed";
    durationSeconds: 60;
    desktop: { bodyOverflow: false; brokenImages: 0 };
    mobile390: { bodyOverflow: false; brokenImages: 0 };
    warningsAndErrors: 0;
    sampledActorSeatDeltasAllZero: true;
  };
  permissions: {
    isolatedTenSeatRenderer: true;
    capacityReservation: true;
    newCharacterOrPose: false;
    otherFurniture: false;
    activeOfficePromotion: false;
  };
  activeOfficeBaseline: { file: string; sha256: string; mustRemainByteIdentical: true };
}

function same(value: unknown, expected: unknown) {
  return JSON.stringify(value) === JSON.stringify(expected);
}

export function validateOfficeWorkstationTenSeatR05R02(
  manifest: OfficeWorkstationTenSeatR05R02Manifest,
  map: OfficeWorkstationTenSeatR05R02Map,
): string[] {
  const issues: string[] = [];
  if (manifest.id !== "office.workstation.ten-seat.r05.r02" || manifest.status !== "owner-review-p4-p6") issues.push("invalid ten-seat manifest identity");
  if (map.id !== "office-workstation-ten-seat-r05-r02" || map.status !== "owner-review-p4-p6") issues.push("invalid ten-seat map identity");
  if (!same(map.stagePixels, [1365, 768]) || map.grid.tilePixels !== 32) issues.push("invalid stage or tile size");
  if (map.placement.zone !== "upper-left" || !same(map.placement.deskOriginsX, [2, 5, 8, 11, 14])) issues.push("current roster is not locked to five upper-left columns");
  if (!same(map.placement.currentDeskOriginsY, { far: 11, near: 13 })) issues.push("current desk rows do not touch at the approved 64 px depth delta");
  if (!same(map.placement.reservedDeskOriginsY, { far: 18, near: 20 })) issues.push("future rows are not reserved below the current roster");
  if (!same(map.capacity, { currentEmployees: 10, reservedEmployees: 10, totalPlannedEmployees: 20 })) issues.push("capacity must be current 10 plus reserved 10");
  if (map.currentWorkstations.length !== 10 || map.futureReservations.length !== 10) issues.push("current and reserved station counts must both equal 10");
  if (new Set(map.currentWorkstations.map((station) => station.agentId)).size !== 10) issues.push("current roster agent ids must be unique");
  if (map.currentWorkstations.some((station) => station.seatContacts.length !== 6 || station.seatContacts.some((contact) => !same(contact.resolvedDeltaPixels, [0, 0])))) issues.push("all 60 seat contacts must resolve at zero error");
  if (map.joins.horizontal.length !== 8 || map.joins.horizontal.some((join) => join.gapPixels !== 0)) issues.push("eight horizontal desk joins must have zero gap");
  if (map.joins.depth.length !== 5 || map.joins.depth.some((join) => !same(join.originDeltaPixels, [0, 64]) || join.tabletopGapPixels !== 0)) issues.push("five depth joins must use the approved 64 px delta with zero gap");
  if (map.futureReservations.some((slot) => slot.employeeAssigned || slot.artRendered)) issues.push("future capacity must remain empty and unrendered");
  if (map.activeOfficePromotion || manifest.permissions.activeOfficePromotion) issues.push("Active Office promotion is forbidden during owner review");
  if (map.rules.importRejectedTenSeatCoordinates || map.rules.newCharacterOrPose || map.rules.otherFurniture) issues.push("rejected coordinates, new poses, and other furniture are forbidden");
  if (!same(manifest.reviewOutputs, workstationTenSeatR05R02ReviewOutputs)) issues.push("review output list mismatch");
  if (manifest.browserValidation.result !== "passed" || manifest.browserValidation.durationSeconds !== 60 || manifest.browserValidation.warningsAndErrors !== 0 || !manifest.browserValidation.sampledActorSeatDeltasAllZero) issues.push("browser validation must record the completed 60-second zero-error run");
  return issues;
}
