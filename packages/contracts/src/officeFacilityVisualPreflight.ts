export const officeFacilityVisualPreflightGates = [
  "F0",
  "F1",
  "F2",
  "F3",
  "F4",
  "F5",
  "F6",
  "F7",
  "F8",
  "F9",
  "F10",
] as const;

export type OfficeFacilityVisualPreflightGate =
  (typeof officeFacilityVisualPreflightGates)[number];

export interface OfficeFacilityVisualPreflightManifest {
  schemaVersion: 1;
  id: "office.facility.arcade-machine.g01";
  familyId: "machine.game.arcade.modern";
  revision: "g01-preflight-r01";
  status: "visual-preflight-owner-review";
  productionStage: "visual-preflight";
  developmentOnly: true;
  activeOfficePromotion: false;
  plannedInteractionMode: "machine-local-controls";
  plannedHeldProp: false;
  sourcePolicy: {
    processedCropDirectReuse: false;
    activeOfficePixelReuse: false;
    legacyOrRejectedPixelReuse: false;
    sideOrientationReuse: false;
    generativeRepair: false;
    missingAssetFallback: false;
    allowlist: readonly string[];
  };
  sources: readonly OfficeFacilityPreflightSource[];
  render: {
    physicalScale: { width: 2; depth: 2; height: 3; unit: "tile" };
    footprint: { width: 2; depth: 2; unit: "tile" };
    renderBox: { width: 3; height: 3; unit: "tile" };
    authoringCanvas: readonly [384, 384];
    runtimeCanvas: readonly [96, 96];
    uniformIntegerDivisor: 4;
    nonUniformScaling: false;
    anchor: "bottom-center";
    requiredOrientations: readonly ["front"];
    basePivot: { x: 1; y: 2; unit: "tile" };
    sortPivot: { x: 1; y: 2; unit: "tile" };
  };
  interactionPreview: {
    capacity: 1;
    visualPose: "interact-front";
    action: "play-arcade-machine";
    frontApproachCells: 1;
    stand: { x: 1; y: 2 };
    approach: { x: 1; y: 3 };
    exit: { x: 0; y: 3 };
    heldController: false;
    reservationSimulationBuilt: false;
    rosterCasesBuilt: 0;
  };
  preflightAssets: {
    runtimeFront: { file: string; sha256: string; size: readonly [96, 96] };
    runtimeAlphaBounds: readonly [number, number, number, number];
  };
  gates: Record<
    OfficeFacilityVisualPreflightGate,
    { status: "passed" | "blocked"; evidence: readonly string[] }
  >;
  reviewOutputs: readonly string[];
  reviewEvidence: readonly {
    path: string;
    sha256: string;
    size: readonly [number, number];
  }[];
  visualApproval: null;
  permissions: {
    ownerReview: true;
    fullSystemBuild: false;
    furnitureOnlyRoom: false;
    activeOfficePromotion: false;
  };
  activeOfficeEvidence: readonly {
    file: string;
    sha256: string;
    importsCandidate: false;
  }[];
}

export interface OfficeFacilityPreflightSource {
  role: "static-front" | "screen-frame-source";
  path: string;
  sha256: string;
  auditManifest: string;
  auditManifestSha256: string;
  extractionMethod: "full-master-component-ownership";
  keyedSource: { file: string; sha256: string };
  ownershipMask: { file: string; sha256: string };
  records: readonly OfficeFacilityPreflightSourceRecord[];
}

export interface OfficeFacilityPreflightSourceRecord {
  frameId: "front" | "a" | "b" | "c" | "d";
  auditRecordId: string;
  sourceBounds: readonly [number, number, number, number];
  selectedComponent: {
    seed: readonly [number, number];
    fullMasterBounds: readonly [number, number, number, number];
    pixelCount: number;
    touchesNominalCellBoundary: boolean;
    touchesMasterBoundary: false;
    sourcePixelsResampled: false;
    authoringCutout: string;
    authoringCutoutSha256: string;
  };
  discardedComponents: readonly {
    fullMasterBounds: readonly [number, number, number, number];
    pixelCount: number;
    ownerFamilyId: string;
    reason: string;
  }[];
}

type RecordValue = Record<string, unknown>;

function record(value: unknown): value is RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sha256(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function box(value: unknown): value is [number, number, number, number] {
  return Array.isArray(value)
    && value.length === 4
    && value.every(Number.isInteger)
    && value[0] < value[2]
    && value[1] < value[3];
}

function point(value: unknown): value is [number, number] {
  return Array.isArray(value)
    && value.length === 2
    && value.every(Number.isInteger);
}

function same(first: unknown, second: unknown) {
  return JSON.stringify(first) === JSON.stringify(second);
}

function add(issues: string[], condition: boolean, message: string) {
  if (!condition) issues.push(message);
}

function validateSource(
  value: unknown,
  expectedRole: string,
  issues: string[],
) {
  add(issues, record(value), `source ${expectedRole} must be an object`);
  if (!record(value)) return;
  add(issues, value.role === expectedRole, `source ${expectedRole} role changed`);
  add(
    issues,
    typeof value.path === "string"
      && value.path.startsWith("assets/art/layout-references/")
      && !value.path.includes("/processed/"),
    `source ${expectedRole} must use an original layout-reference master`,
  );
  add(
    issues,
    sha256(value.sha256) && sha256(value.auditManifestSha256),
    `source ${expectedRole} hashes are invalid`,
  );
  add(
    issues,
    value.auditManifest
      === "assets/game/manifests/office-furniture-master-audit-v1.json"
      && value.extractionMethod === "full-master-component-ownership",
    `source ${expectedRole} must use the audited full-master workflow`,
  );
  for (const evidenceName of ["keyedSource", "ownershipMask"]) {
    const evidence = value[evidenceName];
    add(
      issues,
      record(evidence)
        && typeof evidence.file === "string"
        && evidence.file.startsWith(
          "assets/game/processed/office-facility-family-v1/arcade-machine-g01/",
        )
        && sha256(evidence.sha256),
      `source ${expectedRole} ${evidenceName} evidence is invalid`,
    );
  }
  add(
    issues,
    Array.isArray(value.records) && value.records.length > 0,
    `source ${expectedRole} records are missing`,
  );
  if (!Array.isArray(value.records)) return;
  const frameIds = new Set<string>();
  for (const [index, sourceRecord] of value.records.entries()) {
    add(issues, record(sourceRecord), `${expectedRole} record ${index} is invalid`);
    if (!record(sourceRecord)) continue;
    add(
      issues,
      typeof sourceRecord.frameId === "string"
        && !frameIds.has(sourceRecord.frameId),
      `${expectedRole} frame identifiers must be unique`,
    );
    if (typeof sourceRecord.frameId === "string") {
      frameIds.add(sourceRecord.frameId);
    }
    add(
      issues,
      typeof sourceRecord.auditRecordId === "string"
        && box(sourceRecord.sourceBounds),
      `${expectedRole} record ${index} audit authority is invalid`,
    );
    const selected = sourceRecord.selectedComponent;
    add(
      issues,
      record(selected)
        && point(selected.seed)
        && box(selected.fullMasterBounds)
        && Number.isInteger(selected.pixelCount)
        && (selected.pixelCount as number) > 0
        && selected.touchesMasterBoundary === false
        && selected.sourcePixelsResampled === false
        && typeof selected.authoringCutout === "string"
        && sha256(selected.authoringCutoutSha256),
      `${expectedRole} record ${index} selected component is invalid`,
    );
    add(
      issues,
      Array.isArray(sourceRecord.discardedComponents)
        && sourceRecord.discardedComponents.length > 0
        && sourceRecord.discardedComponents.every((discarded) =>
          record(discarded)
          && box(discarded.fullMasterBounds)
          && Number.isInteger(discarded.pixelCount)
          && (discarded.pixelCount as number) > 0
          && typeof discarded.ownerFamilyId === "string"
          && typeof discarded.reason === "string"
          && discarded.reason.length > 0),
      `${expectedRole} record ${index} must explain discarded neighbor pixels`,
    );
  }
}

export function validateOfficeFacilityVisualPreflightManifest(
  value: unknown,
): string[] {
  if (!record(value)) return ["manifest must be an object"];
  const issues: string[] = [];
  add(
    issues,
    value.schemaVersion === 1
      && value.id === "office.facility.arcade-machine.g01"
      && value.familyId === "machine.game.arcade.modern"
      && value.revision === "g01-preflight-r01",
    "Arcade G01 preflight identity changed",
  );
  add(
    issues,
    value.status === "visual-preflight-owner-review"
      && value.productionStage === "visual-preflight"
      && value.developmentOnly === true
      && value.activeOfficePromotion === false,
    "Arcade G01 must remain an isolated visual preflight",
  );
  add(
    issues,
    value.plannedInteractionMode === "machine-local-controls"
      && value.plannedHeldProp === false,
    "Arcade G01 must use machine-local controls with no held prop",
  );
  const policy = value.sourcePolicy;
  add(issues, record(policy), "sourcePolicy must be an object");
  if (record(policy)) {
    for (const field of [
      "processedCropDirectReuse",
      "activeOfficePixelReuse",
      "legacyOrRejectedPixelReuse",
      "sideOrientationReuse",
      "generativeRepair",
      "missingAssetFallback",
    ]) {
      add(issues, policy[field] === false, `sourcePolicy.${field} must be false`);
    }
    add(
      issues,
      Array.isArray(policy.allowlist)
        && policy.allowlist.length === 2
        && new Set(policy.allowlist).size === 2,
      "sourcePolicy.allowlist must contain exactly two original masters",
    );
  }
  add(
    issues,
    Array.isArray(value.sources) && value.sources.length === 2,
    "Arcade G01 preflight must contain two source authorities",
  );
  if (Array.isArray(value.sources)) {
    validateSource(value.sources[0], "static-front", issues);
    validateSource(value.sources[1], "screen-frame-source", issues);
  }
  const render = value.render;
  add(
    issues,
    record(render)
      && same(render.physicalScale, { width: 2, depth: 2, height: 3, unit: "tile" })
      && same(render.footprint, { width: 2, depth: 2, unit: "tile" })
      && same(render.renderBox, { width: 3, height: 3, unit: "tile" })
      && same(render.authoringCanvas, [384, 384])
      && same(render.runtimeCanvas, [96, 96])
      && render.uniformIntegerDivisor === 4
      && render.nonUniformScaling === false
      && render.anchor === "bottom-center"
      && same(render.requiredOrientations, ["front"])
      && same(render.basePivot, { x: 1, y: 2, unit: "tile" })
      && same(render.sortPivot, { x: 1, y: 2, unit: "tile" }),
    "Arcade G01 preflight geometry changed",
  );
  const interaction = value.interactionPreview;
  add(
    issues,
    record(interaction)
      && interaction.capacity === 1
      && interaction.visualPose === "interact-front"
      && interaction.action === "play-arcade-machine"
      && interaction.frontApproachCells === 1
      && same(interaction.stand, { x: 1, y: 2 })
      && same(interaction.approach, { x: 1, y: 3 })
      && same(interaction.exit, { x: 0, y: 3 })
      && interaction.heldController === false
      && interaction.reservationSimulationBuilt === false
      && interaction.rosterCasesBuilt === 0,
    "Arcade G01 preflight interaction preview changed",
  );
  const assets = value.preflightAssets;
  add(
    issues,
    record(assets)
      && record(assets.runtimeFront)
      && typeof assets.runtimeFront.file === "string"
      && sha256(assets.runtimeFront.sha256)
      && same(assets.runtimeFront.size, [96, 96])
      && box(assets.runtimeAlphaBounds),
    "Arcade G01 runtime preflight asset is invalid",
  );
  add(issues, record(value.gates), "gates must be an object");
  if (record(value.gates)) {
    for (const gate of officeFacilityVisualPreflightGates) {
      const expected = ["F0", "F1", "F2", "F3"].includes(gate)
        ? "passed"
        : "blocked";
      add(
        issues,
        record(value.gates[gate])
          && value.gates[gate].status === expected
          && Array.isArray(value.gates[gate].evidence),
        `gates.${gate} must remain ${expected}`,
      );
    }
  }
  const reviewOutputs = Array.isArray(value.reviewOutputs)
    ? value.reviewOutputs
    : [];
  const reviewEvidence = Array.isArray(value.reviewEvidence)
    ? value.reviewEvidence
    : [];
  add(
    issues,
    reviewOutputs.length === 5
      && reviewEvidence.length === 5
      && reviewEvidence.every((entry, index) =>
        record(entry)
        && entry.path === reviewOutputs[index]
        && sha256(entry.sha256)
        && point(entry.size)),
    "Arcade G01 must contain exactly five hash-locked preflight boards",
  );
  add(issues, value.visualApproval === null, "visualApproval must await the owner");
  const permissions = value.permissions;
  add(
    issues,
    record(permissions)
      && permissions.ownerReview === true
      && permissions.fullSystemBuild === false
      && permissions.furnitureOnlyRoom === false
      && permissions.activeOfficePromotion === false,
    "Arcade G01 preflight permissions changed",
  );
  add(
    issues,
    Array.isArray(value.activeOfficeEvidence)
      && value.activeOfficeEvidence.length > 0
      && value.activeOfficeEvidence.every((entry) =>
        record(entry)
        && typeof entry.file === "string"
        && sha256(entry.sha256)
        && entry.importsCandidate === false),
    "Active Office isolation evidence is missing",
  );
  return issues;
}
