import {
  officeFacilityServerRackProductionFrames,
  officeFacilityServerRackProductionGates,
  officeFacilityServerRackProductionOrientations,
} from "./officeFacilityServerRackGeneratedProductionTypes.ts";

export * from "./officeFacilityServerRackGeneratedProductionTypes.ts";

type ValueRecord = Record<string, unknown>;

const record = (value: unknown): value is ValueRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const same = (first: unknown, second: unknown) =>
  JSON.stringify(first) === JSON.stringify(second);
const sha256 = (value: unknown) =>
  typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const point = (value: unknown) =>
  Array.isArray(value)
  && value.length === 2
  && value.every(Number.isInteger);

function add(issues: string[], condition: boolean, message: string) {
  if (!condition) issues.push(message);
}

function asset(value: unknown, size: readonly [number, number]): boolean {
  return record(value)
    && typeof value.file === "string"
    && sha256(value.sha256)
    && same(value.size, size);
}

export function validateOfficeFacilityServerRackGeneratedProductionManifest(
  value: unknown,
): string[] {
  if (!record(value)) return ["manifest must be an object"];
  const issues: string[] = [];
  add(
    issues,
    value.schemaVersion === 1
      && value.id === "office.facility.server-rack.n02.production"
      && value.familyId === "server.rack.generated-modern"
      && value.revision === "n02-production-r01"
      && value.status === "owner-approved"
      && value.productionStage === "f8-owner-approved"
      && value.developmentOnly === true
      && value.activeOfficePromotion === false,
    "Server Rack N02 production identity or F8 stop changed",
  );

  const preflight = value.preflightAuthority;
  add(
    issues,
    record(preflight)
      && preflight.id === "office.facility.server-rack.n02"
      && preflight.revision === "n02-preflight-r01"
      && preflight.status === "visual-preflight-owner-approved"
      && preflight.approvedOn === "2026-07-30"
      && preflight.approvedReviewHashCount === 11
      && preflight.hashMismatchCount === 0
      && typeof preflight.manifest === "string"
      && sha256(preflight.manifestSha256),
    "Server Rack N02 production must lock the approved preflight",
  );
  const policy = value.sourcePolicy;
  add(
    issues,
    record(policy)
      && policy.approvedPreflightPixelsOnly === true
      && [
        "newImageGeneration",
        "serverRackN01PixelReuse",
        "activeOfficePixelReuse",
        "processedForeignFamilyReuse",
        "generativeRepair",
        "missingAssetFallback",
      ].every((field) => policy[field] === false),
    "Server Rack N02 production source isolation changed",
  );

  const render = value.render;
  add(
    issues,
    record(render)
      && same(render.physicalScale, {
        width: 2, depth: 2, height: 4, unit: "tile",
      })
      && same(render.footprint, { width: 2, depth: 2, unit: "tile" })
      && same(render.renderBox, { width: 3, height: 4, unit: "tile" })
      && same(render.authoringCanvas, [384, 512])
      && same(render.runtimeCanvas, [96, 128])
      && render.uniformIntegerDivisor === 4
      && render.anchor === "bottom-center"
      && same(render.basePivotRuntime, [48, 124])
      && same(render.sortPivotRuntime, [48, 124])
      && same(
        render.orientations,
        officeFacilityServerRackProductionOrientations,
      ),
    "Server Rack N02 production geometry or pivots changed",
  );

  const parts = value.parts;
  const shells = record(parts) && Array.isArray(parts.shells)
    ? parts.shells
    : [];
  const statuses = record(parts) && Array.isArray(parts.statusFrames)
    ? parts.statusFrames
    : [];
  const composites = record(parts) && Array.isArray(parts.frontComposites)
    ? parts.frontComposites
    : [];
  add(
    issues,
    shells.length === 4
      && shells.every((entry, index) =>
        record(entry)
        && entry.orientation
          === officeFacilityServerRackProductionOrientations[index]
        && asset(entry.authoring, [384, 512])
        && asset(entry.runtime, [96, 128])
        && sha256(entry.approvedPreflightRuntimeSha256))
      && statuses.length === 4
      && statuses.every((entry, index) =>
        record(entry)
        && entry.frameId === officeFacilityServerRackProductionFrames[index]
        && asset(entry.authoring, [128, 64])
        && asset(entry.runtime, [32, 16]))
      && composites.length === 4
      && composites.every((entry, index) =>
        record(entry)
        && entry.frameId === officeFacilityServerRackProductionFrames[index]
        && asset(entry.runtime, [96, 128])
        && sha256(entry.approvedPreflightCompositeSha256)),
    "Server Rack N02 production part decomposition changed",
  );

  const animation = value.animation;
  add(
    issues,
    record(animation)
      && animation.compositionFormula
        === "immutableShell[front] + statusViewport[n]"
      && animation.animatedOrientation === "front"
      && same(animation.staticOrientations, ["left", "right", "back"])
      && same(animation.frameIds, officeFacilityServerRackProductionFrames)
      && same(animation.transition, ["a", "b", "c", "d", "a"])
      && animation.frameDurationMs === 220
      && animation.cycleDurationMs === 880
      && same(animation.viewportBoundsRuntime, [32, 39, 64, 55])
      && Array.isArray(animation.transitionChangedPixels)
      && animation.transitionChangedPixels.length === 4
      && animation.transitionChangedPixels.every(
        (pixels) => Number.isInteger(pixels) && pixels > 0,
      )
      && animation.shellChangedPixels === 0
      && animation.outsideViewportChangedPixels === 0
      && same(animation.pivotDeltaPixels, [0, 0])
      && animation.closureMismatchPixels === 0,
    "Server Rack N02 production status seam loop changed",
  );

  const spatial = value.spatial;
  const orientations =
    record(spatial) && Array.isArray(spatial.orientations)
      ? spatial.orientations
      : [];
  add(
    issues,
    record(spatial)
      && record(spatial.authority)
      && spatial.authority.status === "owner-approved"
      && sha256(spatial.authority.sha256)
      && spatial.coordinateFormula === "worldRoot - actorFrameRootSocket"
      && spatial.perCharacterOffsets === false
      && spatial.magicOffsets === false
      && spatial.missingSocketFallback === false
      && spatial.fractionalCoordinates === false
      && orientations.length === 4
      && orientations.every((entry, index) =>
        record(entry)
        && entry.orientation
          === officeFacilityServerRackProductionOrientations[index]
        && entry.facing === entry.orientation
        && Array.isArray(entry.footprintCells)
        && entry.footprintCells.length === 4
        && entry.footprintCells.every(point)
        && point(entry.stand)
        && point(entry.approach)
        && point(entry.exit)
        && Array.isArray(entry.route)
        && entry.route.length === 4
        && entry.route.every(point)
        && record(entry.machineLocalSockets)
        && same(entry.machineLocalSockets.base, [48, 124])
        && same(entry.machineLocalSockets.sort, [48, 124])
        && point(entry.machineLocalSockets.inspectTarget)
        && point(entry.machineLocalSockets.interactionRoot)
        && entry.routeCollisionCount === 0),
    "Server Rack N02 production sockets or routes changed",
  );

  const interaction = value.interaction;
  const machineTargets =
    record(interaction) && record(interaction.machineLocalTargetsRuntime)
      ? interaction.machineLocalTargetsRuntime
      : {};
  add(
    issues,
    record(interaction)
      && interaction.semanticAction === "inspect-front"
      && interaction.visualPose === "interact-front"
      && same(
        interaction.instanceIds,
        ["server-rack-01", "server-rack-02"],
      )
      && interaction.familyInstanceCount === 2
      && interaction.capacityPerInstance === 1
      && interaction.independentReservations === true
      && record(interaction.machineLocalTargetsRuntime)
      && officeFacilityServerRackProductionOrientations.every(
        (orientation) => point(machineTargets[orientation]),
      )
      && interaction.heldProp === false
      && interaction.h01Dependency === false
      && interaction.handoff === false
      && interaction.reservationSlotContribution === 2
      && interaction.facilityV1ReadySlotsBeforeServer === 15
      && interaction.facilityV1ReadySlotsAfterApproval === 17,
    "Server Rack N02 interaction or approved slot contribution changed",
  );

  const roster = value.rosterValidation;
  const poseCases = record(roster) && Array.isArray(roster.poseCases)
    ? roster.poseCases
    : [];
  const orientationCases =
    record(roster) && Array.isArray(roster.orientationCases)
      ? roster.orientationCases
      : [];
  add(
    issues,
    record(roster)
      && sha256(roster.authoritySha256)
      && roster.pendingCommercialReview === true
      && roster.characterCount === 18
      && roster.activeFrames === 6
      && roster.poseCaseCount === 108
      && roster.orientationCaseCount === 432
      && [
        "rootAlignmentFailures",
        "pivotDriftFailures",
        "routeFailures",
        "heldPropCases",
        "handoffCases",
      ].every((field) => roster[field] === 0)
      && roster.perCharacterOffsets === false
      && poseCases.length === 108
      && new Set(poseCases.map((entry) =>
        record(entry) ? entry.caseId : null)).size === 108
      && orientationCases.length === 432
      && new Set(orientationCases.map((entry) =>
        record(entry) ? entry.caseId : null)).size === 432
      && orientationCases.every((entry) =>
        record(entry)
        && same(entry.worldRoot, entry.resolvedRoot)
        && same(entry.rootAlignmentDelta, [0, 0])
        && same(entry.pivotDelta, [0, 0])
        && entry.routeValid === true
        && entry.heldProp === false
        && entry.handoff === false),
    "Server Rack N02 must prove 108 empty-hand poses and 432 cases",
  );

  const reservation = value.reservationValidation;
  add(
    issues,
    record(reservation)
      && reservation.durationSeconds === 30
      && reservation.actorCount === 2
      && same(
        reservation.instanceIds,
        ["server-rack-01", "server-rack-02"],
      )
      && reservation.capacityPerInstance === 1
      && reservation.maximumConcurrentReservations === 2
      && reservation.maximumPerInstanceReservations === 1
      && reservation.collisionCount === 0
      && reservation.blockedAttemptCount === 1
      && reservation.failureCount === 1
      && reservation.releaseCount === 3
      && reservation.retrySuccessCount === 1
      && reservation.independentInstanceSuccessCount === 1
      && reservation.releasedAtEnd === true
      && Array.isArray(reservation.events)
      && reservation.events.length === 16
      && Array.isArray(reservation.samples)
      && reservation.samples.length === 31
      && record(reservation.samples[30]?.heldBy)
      && reservation.samples[30].heldBy["server-rack-01"] === null
      && reservation.samples[30].heldBy["server-rack-02"] === null,
    "Server Rack N02 two-instance 30-second reservation proof changed",
  );

  add(issues, record(value.gates), "gates must be an object");
  if (record(value.gates)) {
    for (const gate of officeFacilityServerRackProductionGates) {
      const expected = (
        ["F0", "F1", "F2", "F3", "F4", "F5", "F6", "F7"].includes(gate)
        || gate === "F8"
      )
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

  const outputs = Array.isArray(value.reviewOutputs)
    ? value.reviewOutputs
    : [];
  const evidence = Array.isArray(value.reviewEvidence)
    ? value.reviewEvidence
    : [];
  const permissions = value.permissions;
  add(
    issues,
    outputs.length === 12
      && evidence.length === 12
      && evidence.every((entry, index) =>
        record(entry)
        && entry.path === outputs[index]
        && sha256(entry.sha256)
        && point(entry.size))
      && record(permissions)
      && permissions.familyLab === true
      && permissions.ownerReview === false
      && permissions.reservationSlotActivation === true
      && permissions.furnitureOnlyRoom === false
      && permissions.otherFacilityFamilies === false
      && permissions.activeOfficePromotion === false
      && record(value.ownerDecision)
      && value.ownerDecision.decision === "approved"
      && value.ownerDecision.decidedOn === "2026-07-30"
      && value.ownerDecision.approvedRevision === "n02-production-r01"
      && value.ownerDecision.scope === "exact-review-output-hashes"
      && Array.isArray(value.ownerDecision.approvedReviewHashes)
      && value.ownerDecision.approvedReviewHashes.length === 12
      && value.ownerDecision.approvedReviewHashes.every((entry, index) =>
        record(entry)
        && entry.path === outputs[index]
        && entry.sha256 === evidence[index]?.sha256)
      && typeof value.ownerDecision.notes === "string",
    "Server Rack N02 F8 review set, permission, or owner decision changed",
  );
  return issues;
}
