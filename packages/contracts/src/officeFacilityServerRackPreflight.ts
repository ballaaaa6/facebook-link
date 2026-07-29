import {
  officeFacilityServerRackPreflightGates,
  officeFacilityServerRackStatusFrames,
} from "./officeFacilityServerRackPreflightTypes.ts";

export * from "./officeFacilityServerRackPreflightTypes.ts";

type RecordValue = Record<string, unknown>;

const record = (value: unknown): value is RecordValue =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const same = (first: unknown, second: unknown) =>
  JSON.stringify(first) === JSON.stringify(second);
const sha256 = (value: unknown) =>
  typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const box = (value: unknown) =>
  Array.isArray(value)
  && value.length === 4
  && value.every(Number.isInteger)
  && value[0] < value[2]
  && value[1] < value[3];
const positive = (value: unknown) =>
  Number.isInteger(value) && (value as number) > 0;

function add(issues: string[], condition: boolean, message: string) {
  if (!condition) issues.push(message);
}

function asset(value: unknown, size?: readonly [number, number]): boolean {
  return record(value)
    && typeof value.file === "string"
    && sha256(value.sha256)
    && Array.isArray(value.size)
    && value.size.length === 2
    && value.size.every(positive)
    && (!size || same(value.size, size));
}

export function validateOfficeFacilityServerRackPreflightManifest(
  value: unknown,
): string[] {
  if (!record(value)) return ["manifest must be an object"];
  const issues: string[] = [];
  add(
    issues,
    value.schemaVersion === 1
      && value.id === "office.facility.server-rack.n01"
      && value.familyId === "server.rack.noc"
      && value.revision === "n01-preflight-r01",
    "Server Rack N01 identity changed",
  );
  add(
    issues,
    value.status === "superseded-owner-redesign-requested"
      && value.productionStage === "visual-preflight-superseded"
      && value.developmentOnly === true
      && value.activeOfficePromotion === false,
    "Server Rack N01 must remain an isolated visual preflight",
  );

  const policy = value.sourcePolicy;
  add(issues, record(policy), "sourcePolicy must be an object");
  if (record(policy)) {
    add(
      issues,
      policy.originalMasterPixelsOnly === true,
      "sourcePolicy.originalMasterPixelsOnly must be true",
    );
    for (const field of [
      "processedCropDirectReuse",
      "activeOfficePixelReuse",
      "rejectedSidePixelReuse",
      "newImageGeneration",
      "generativeRepair",
      "missingAssetFallback",
    ]) {
      add(issues, policy[field] === false, `sourcePolicy.${field} must be false`);
    }
  }

  const authority = value.sourceAuthority;
  const front = record(authority) ? authority.front : null;
  const status = record(authority) ? authority.status : null;
  add(
    issues,
    record(authority)
      && record(authority.audit)
      && typeof authority.audit.file === "string"
      && sha256(authority.audit.sha256),
    "Server Rack audit authority is invalid",
  );
  add(
    issues,
    record(front)
      && front.auditRecordId
        === "modern-bright-library-v1:env-04-release-noc:server.rack.noc"
      && front.sourceFile
        === "assets/art/layout-references/release-qa-noc-sheet-modern-bright-v1-source.png"
      && sha256(front.sourceSha256)
      && asset(front.keyedAsset, [1254, 1254])
      && asset(front.ownershipMaskAsset, [1254, 1254])
      && same(front.sourceBounds, [0, 627, 314, 940])
      && box(front.componentBounds)
      && positive(front.componentPixels)
      && front.componentCount === 1
      && front.cellBoundaryContact === false
      && front.auditDecision === "salvage-full-master-and-decompose",
    "Server Rack front ownership authority is invalid",
  );

  const statusFrames = record(status) && Array.isArray(status.frames)
    ? status.frames
    : [];
  add(
    issues,
    record(status)
      && status.sourceFile
        === "assets/art/layout-references/mechanical-loops-sheet-modern-bright-v1-source.png"
      && sha256(status.sourceSha256)
      && asset(status.keyedAsset, [1254, 1254])
      && statusFrames.length === 4
      && statusFrames.every((frame, index) =>
        record(frame)
        && frame.frameId === officeFacilityServerRackStatusFrames[index]
        && typeof frame.auditRecordId === "string"
        && box(frame.sourceBounds)
        && box(frame.fullComponentBounds)
        && positive(frame.fullComponentPixels)
        && frame.fullComponentCrossesNominalTop === true
        && box(frame.selectedViewportSourceBox)
        && frame.selectedViewportTouchesCellBoundary === false
        && positive(frame.selectedViewportAlphaPixels)),
    "Server Rack status source ownership is invalid",
  );
  const rejected = record(authority) && Array.isArray(authority.rejectedSides)
    ? authority.rejectedSides
    : [];
  add(
    issues,
    rejected.length === 2
      && rejected.every((side) =>
        record(side)
        && side.decision === "reject-regenerate-orientation-if-required"
        && side.masterPixelsSalvageable === false
        && side.used === false),
    "Rejected Server Rack side pixels must remain unused",
  );

  const render = value.render;
  add(
    issues,
    record(render)
      && same(render.physicalScale, {
        width: 2, depth: 1, height: 3, unit: "tile",
      })
      && same(render.footprint, {
        width: 2, depth: 1, unit: "tile",
      })
      && same(render.renderBox, {
        width: 2, height: 3, unit: "tile",
      })
      && same(render.authoringCanvas, [256, 384])
      && same(render.runtimeCanvas, [64, 96])
      && render.uniformIntegerDivisor === 4
      && render.anchor === "bottom-center"
      && same(render.basePivotRuntime, [32, 92])
      && same(render.sortPivotRuntime, [32, 92])
      && same(render.authoredOrientations, ["front"])
      && render.generatedTurns === false,
    "Server Rack 2x1x3 geometry or front-only contract changed",
  );

  const parts = value.parts;
  const partFrames = record(parts) && Array.isArray(parts.statusFrames)
    ? parts.statusFrames
    : [];
  add(
    issues,
    record(parts)
      && record(parts.front)
      && asset(parts.front.sourceCutout, [200, 248])
      && asset(parts.front.authoring, [256, 384])
      && asset(parts.front.runtime, [64, 96])
      && record(parts.shell)
      && asset(parts.shell.authoring, [256, 384])
      && asset(parts.shell.runtime, [64, 96])
      && partFrames.length === 4
      && partFrames.every((frame, index) =>
        record(frame)
        && frame.frameId === officeFacilityServerRackStatusFrames[index]
        && asset(frame.source, [136, 196])
        && asset(frame.authoring, [164, 236])
        && asset(frame.runtime, [41, 59])
        && asset(frame.composite, [64, 96])
        && box(frame.sourceBox)),
    "Server Rack part assets are invalid",
  );

  const loop = value.statusLoop;
  add(
    issues,
    record(loop)
      && loop.compositionFormula === "immutableShell + statusViewport[n]"
      && same(loop.frameIds, officeFacilityServerRackStatusFrames)
      && same(loop.transition, ["a", "b", "c", "d", "a"])
      && loop.frameDurationMs === 220
      && loop.cycleDurationMs === 880
      && same(loop.viewportAuthoring, [32, 96, 196, 332])
      && same(loop.viewportRuntime, [8, 24, 49, 83])
      && Array.isArray(loop.transitionChangedPixels)
      && loop.transitionChangedPixels.length === 4
      && loop.transitionChangedPixels.every(positive)
      && loop.shellChangedPixels === 0
      && loop.outsideViewportChangedPixels === 0
      && same(loop.pivotDeltaPixels, [0, 0])
      && loop.closureMismatchPixels === 0
      && asset(loop.gif, [512, 512])
      && record(loop.gif)
      && loop.gif.frameCount === 4,
    "Server Rack modular status loop contract changed",
  );

  const interaction = value.interactionPreview;
  const timeline = record(interaction) && Array.isArray(interaction.timeline)
    ? interaction.timeline
    : [];
  add(
    issues,
    record(interaction)
      && interaction.semanticAction === "inspect-front"
      && interaction.visualPoseAuthority === "interact-front"
      && interaction.actorId === "anna"
      && record(interaction.actorAuthority)
      && interaction.actorAuthority.pendingCommercialReview === true
      && record(interaction.heldProp)
      && interaction.heldProp.id === "held.tablet"
      && interaction.heldProp.actorSocketRule
        === "midpoint-primary-secondary"
      && interaction.heldProp.attachmentMode === "front-overlay"
      && same(interaction.heldProp.heldFrames, [2, 3, 4])
      && timeline.length === 12
      && timeline.every((entry) =>
        record(entry)
        && officeFacilityServerRackStatusFrames.includes(
          entry.statusFrame as "a",
        )
        && (!entry.tabletVisible || same(entry.attachmentDelta, [0, 0])))
      && interaction.perCharacterOffsets === false
      && interaction.missingSocketFallback === false
      && interaction.countsTowardRosterValidation === false
      && interaction.countsTowardReservationValidation === false
      && asset(interaction.gif, [768, 512])
      && record(interaction.gif)
      && interaction.gif.frameCount === 12,
    "Server Rack tablet interaction preview contract changed",
  );

  const instances = value.instancePreview;
  add(
    issues,
    record(instances)
      && instances.familyInstanceCount === 2
      && same(instances.instanceIds, ["server-rack-01", "server-rack-02"])
      && instances.sharedFamilyPixels === true
      && instances.capacityTargetPerInstance === 1
      && instances.independentReservationTargets === true
      && instances.reservationProductionBuilt === false
      && instances.reservationSlotContribution === 0
      && instances.plannedReservationSlotContributionAfterF8 === 2
      && instances.facilityV1ReadySlotsBeforeServer === 15
      && instances.facilityV1ReadySlotsAfterServerF8Target === 17,
    "Server Rack two-instance reservation preview changed",
  );

  const gates = value.gates;
  add(issues, record(gates), "gates must be an object");
  if (record(gates)) {
    for (const gate of officeFacilityServerRackPreflightGates) {
      const expected = ["F0", "F1", "F2", "F3"].includes(gate)
        ? "passed"
        : "blocked";
      add(
        issues,
        record(gates[gate]) && gates[gate].status === expected,
        `gates.${gate} must be ${expected}`,
      );
    }
  }
  add(
    issues,
    record(value.permissions)
      && value.permissions.ownerReview === false
      && value.permissions.fullSystemBuild === false
      && value.permissions.furnitureOnlyRoom === false
      && value.permissions.otherFacilityFamilies === false
      && value.permissions.activeOfficePromotion === false
      && value.visualApproval === null
      && record(value.ownerDecision)
      && value.ownerDecision.decision === "superseded-redesign-requested"
      && value.ownerDecision.decidedOn === "2026-07-30"
      && value.ownerDecision.supersededBy
        === "office.facility.server-rack.n02"
      && same(value.ownerDecision.reasons, [
        "Remove the H01 tablet and all held-prop behavior.",
        "Replace 2x1x3 front-only geometry with 2x2x4.",
        "Create a fresh four-orientation cabinet family.",
      ]),
    "Server Rack preflight permissions or owner decision changed",
  );
  return issues;
}
