export const workstationStep5R03ReviewOutputs = [
  "assets/art/layout-references/office-workstation-v3/step5-r03/01-world-projection-and-z-levels.png",
  "assets/art/layout-references/office-workstation-v3/step5-r03/02-desk-equipment-footprints.png",
  "assets/art/layout-references/office-workstation-v3/step5-r03/03-character-chair-contact.png",
] as const;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exact(value: unknown, expected: unknown) {
  return JSON.stringify(value) === JSON.stringify(expected);
}

export function validateOfficeWorkstationStep5ManifestV3(value: unknown): string[] {
  if (!record(value)) return ["step5R03: must be an object"];
  const issues: string[] = [];
  const add = (condition: boolean, path: string, message: string) => {
    if (!condition) issues.push(`${path}: ${message}`);
  };

  add(value.version === 3 && value.geometrySchemaVersion === 5,
    "step5R03.version", "must use Geometry v5");
  add(value.id === "office.workstation.step5.single-seat.v3",
    "step5R03.id", "has the wrong identity");
  add(value.status === "owner-calibration-review",
    "step5R03.status", "must stop at owner calibration review");
  add(exact(value.completedScope, ["P0", "P1", "P2", "P3"])
    && value.nextScope === "P4-blocked-pending-owner-approval",
  "step5R03.scope", "must stop after P3");

  const permissions = value.permissions;
  add(record(permissions), "step5R03.permissions", "must be an object");
  if (record(permissions)) {
    add(permissions.deterministicMeasurement === true && permissions.calibrationBoards === true,
      "step5R03.permissions", "must allow only measurement and calibration boards");
    for (const key of [
      "newArtworkGeneration", "rendererImplementation", "singleSeatAssembly",
      "rosterWideCalibration", "tenSeatAssembly", "step6", "activeOfficePromotion",
    ]) {
      add(permissions[key] === false, `step5R03.permissions.${key}`, "must remain blocked");
    }
  }

  const baseline = value.activeOfficeBaseline;
  add(record(baseline) && baseline.file === "assets/game/maps/office-c-v2.json"
    && baseline.mustRemainByteIdentical === true && typeof baseline.sha256 === "string",
  "step5R03.activeOfficeBaseline", "must lock the current Office map");

  const standard = value.stationStandard;
  add(record(standard) && standard.tilePixels === 32, "step5R03.stationStandard", "must use 32 px tiles");
  if (record(standard)) {
    add(exact(standard.levels, { floor: 0, chairSeat: 1, deskSupport: 2, personTop: 3 }),
      "step5R03.stationStandard.levels", "must use z 0/1/2/3");
    const person = standard.person;
    add(record(person) && exact(person.footprint, { width: 1, depth: 1 })
      && exact(person.logicalVolume, { width: 1, depth: 1, height: 3 })
      && exact(person.framePixels, { width: 96, height: 104 })
      && person.visualOverflowAllowed === true,
    "step5R03.stationStandard.person", "must preserve the current Office person");
    const chair = standard.chair;
    add(record(chair) && exact(chair.footprint, { width: 1, depth: 1 })
      && exact(chair.logicalVolume, { width: 1, depth: 1, height: 2 })
      && chair.seatLevel === 1 && chair.renderEnvelope === "unlocked",
    "step5R03.stationStandard.chair", "must remain shared-cell and pixel-unlocked");
    const desk = standard.desk;
    add(record(desk) && exact(desk.footprint, { width: 3, depth: 2 })
      && exact(desk.logicalVolume, { width: 3, depth: 2, height: 2 })
      && exact(desk.supportPlanePixels, { width: 96, depth: 64 }),
    "step5R03.stationStandard.desk", "must use the full 3 x 2 x 2 geometry");
    const keyboard = standard.keyboard;
    add(record(keyboard) && exact(keyboard.reservation, { width: 1, depth: 1 })
      && exact(keyboard.maximumVisualEnvelope, { width: 1.5, depth: 1 })
      && exact(keyboard.proposedRenderPixels, { width: 48, height: 24 }),
    "step5R03.stationStandard.keyboard", "must reserve 1 x 1 with a 1.5 x 1 visual maximum");
    const monitor = standard.monitor;
    add(record(monitor) && exact(monitor.reservation, { width: 3, depth: 1 }),
      "step5R03.stationStandard.monitor", "must reserve the complete actor-far row");
  }

  const inputs = Array.isArray(value.lockedInputs) ? value.lockedInputs : [];
  add(inputs.length === 10, "step5R03.lockedInputs", "must contain exactly ten measured sources");
  for (const [index, input] of inputs.entries()) {
    add(record(input) && typeof input.path === "string"
      && typeof input.sha256 === "string" && /^[a-f0-9]{64}$/.test(input.sha256),
    `step5R03.lockedInputs[${index}]`, "must contain a path and lowercase SHA-256");
  }
  add(exact(value.reviewOutputs, workstationStep5R03ReviewOutputs),
    "step5R03.reviewOutputs", "must list exactly the three calibration boards");
  const gate = value.ownerGate;
  add(record(gate) && Array.isArray(gate.explicitlyNotApproved)
    && gate.explicitlyNotApproved.includes("active-office"),
  "step5R03.ownerGate", "must block implementation and Active Office");
  return issues;
}
