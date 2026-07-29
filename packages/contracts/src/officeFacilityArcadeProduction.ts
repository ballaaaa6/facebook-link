import {
  officeFacilityArcadeProductionGames,
  officeFacilityArcadeProductionGates,
  officeFacilityArcadeProductionOrientations,
} from "./officeFacilityArcadeProductionTypes.ts";

export * from "./officeFacilityArcadeProductionTypes.ts";

type ValueRecord = Record<string, unknown>;

function record(value: unknown): value is ValueRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sha256(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function same(first: unknown, second: unknown): boolean {
  return JSON.stringify(first) === JSON.stringify(second);
}

function point(value: unknown): boolean {
  return Array.isArray(value)
    && value.length === 2
    && value.every(Number.isInteger);
}

function asset(value: unknown, size: readonly [number, number]): boolean {
  return record(value)
    && typeof value.file === "string"
    && sha256(value.sha256)
    && same(value.size, size);
}

function add(issues: string[], condition: boolean, message: string) {
  if (!condition) issues.push(message);
}

export function validateOfficeFacilityArcadeProductionManifest(
  value: unknown,
): string[] {
  if (!record(value)) return ["manifest must be an object"];
  const issues: string[] = [];
  add(
    issues,
    value.schemaVersion === 1
      && value.id === "office.facility.arcade-machine.g02.production"
      && value.familyId === "machine.game.arcade.generated-modern"
      && value.revision === "g02-production-r01"
      && value.status === "owner-approved"
      && value.developmentOnly === true
      && value.activeOfficePromotion === false,
    "Arcade G02 production identity or F8 stop changed",
  );

  const preflight = value.preflightAuthority;
  add(
    issues,
    record(preflight)
      && preflight.id === "office.facility.arcade-machine.g02"
      && preflight.revision === "g02-preflight-r02"
      && preflight.status === "visual-preflight-owner-approved"
      && typeof preflight.manifest === "string"
      && sha256(preflight.manifestSha256)
      && preflight.approvedReviewHashCount === 14
      && preflight.hashMismatchCount === 0,
    "Arcade G02 production must lock the exact approved r02 preflight",
  );
  const policy = value.sourcePolicy;
  add(
    issues,
    record(policy)
      && policy.approvedPreflightPixelsOnly === true
      && policy.newImageGeneration === false
      && policy.previousArcadePixelReuse === false
      && policy.activeOfficePixelReuse === false
      && policy.processedForeignFamilyReuse === false
      && policy.generativeRepair === false
      && policy.missingAssetFallback === false,
    "Arcade G02 production source isolation changed",
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
      && same(render.orientations, officeFacilityArcadeProductionOrientations),
    "Arcade G02 production geometry or pivots changed",
  );

  const parts = value.parts;
  const shells = record(parts) && Array.isArray(parts.shell) ? parts.shell : [];
  const controls = record(parts) && Array.isArray(parts.controls)
    ? parts.controls
    : [];
  const viewports = record(parts) && Array.isArray(parts.viewports)
    ? parts.viewports
    : [];
  add(
    issues,
    shells.length === 4
      && shells.every((entry, index) =>
        record(entry)
        && entry.orientation === officeFacilityArcadeProductionOrientations[index]
        && asset(entry.authoring, [384, 512])
        && asset(entry.runtime, [96, 128]))
      && controls.length === 4
      && controls.every((entry, index) =>
        record(entry)
        && entry.orientation === officeFacilityArcadeProductionOrientations[index]
        && asset(entry.authoring, [384, 512])
        && asset(entry.runtime, [96, 128])
        && (entry.boundsRuntime === null
          || (Array.isArray(entry.boundsRuntime)
            && entry.boundsRuntime.length === 4
            && entry.boundsRuntime.every(Number.isInteger))))
      && viewports.length === 12
      && viewports.every((entry) =>
        record(entry)
        && officeFacilityArcadeProductionGames.includes(String(entry.gameId) as never)
        && ["a", "b", "c", "d"].includes(String(entry.frameId))
        && asset(entry.authoring, [144, 144])
        && asset(entry.runtime, [36, 36])),
    "Arcade G02 shell, controls, or viewport decomposition changed",
  );

  const animation = value.animation;
  const games = record(animation) && Array.isArray(animation.games)
    ? animation.games
    : [];
  add(
    issues,
    record(animation)
      && animation.compositionFormula
        === "shell + viewport[n] + machineLocalControls"
      && same(animation.frameIds, ["a", "b", "c", "d"])
      && same(animation.transition, ["a", "b", "c", "d", "a"])
      && animation.frameDurationMs === 200
      && same(animation.viewportBoundsRuntime, [30, 27, 66, 63])
      && animation.shellChangedPixels === 0
      && animation.controlsChangedPixels === 0
      && animation.outsideViewportChangedPixels === 0
      && same(animation.pivotDeltaPixels, [0, 0])
      && animation.closureMismatchPixels === 0
      && games.length === 3
      && games.every((game, index) =>
        record(game)
        && game.gameId === officeFacilityArcadeProductionGames[index]
        && Array.isArray(game.frames)
        && game.frames.length === 4
        && game.frames.every((frame) => asset(frame, [96, 128]))
        && Array.isArray(game.transitionChangedPixels)
        && game.transitionChangedPixels.length === 4
        && game.transitionChangedPixels.every(
          (pixels) => Number.isInteger(pixels) && pixels > 0,
        )),
    "Arcade G02 modular A-D seam-loop contract changed",
  );

  const spatial = value.spatial;
  const spatialOrientations =
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
      && spatial.perSceneOffsets === false
      && spatial.missingSocketFallback === false
      && spatial.fractionalCoordinates === false
      && spatialOrientations.length === 4
      && spatialOrientations.every((entry, index) =>
        record(entry)
        && entry.orientation === officeFacilityArcadeProductionOrientations[index]
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
        && entry.routeCollisionCount === 0),
    "Arcade G02 four-orientation sockets or routes changed",
  );

  const interaction = value.interaction;
  add(
    issues,
    record(interaction)
      && interaction.capacity === 1
      && interaction.action === "play-arcade-machine"
      && interaction.visualPose === "interact-front"
      && interaction.frontApproachCells === 1
      && interaction.machineLocalControls === true
      && interaction.heldController === false
      && interaction.heldPropManifest === null
      && interaction.reservationSlotContribution === 1
      && interaction.facilityV1ReadySlotCountAfterApproval === 15,
    "Arcade G02 interaction or approved slot contribution changed",
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
      && roster.rootAlignmentFailures === 0
      && roster.pivotDriftFailures === 0
      && roster.routeFailures === 0
      && roster.heldControllerCases === 0
      && roster.perCharacterOffsets === false
      && poseCases.length === 108
      && new Set(poseCases.map((entry) =>
        record(entry) ? entry.caseId : null)).size === 108
      && orientationCases.length === 432
      && new Set(orientationCases.map((entry) =>
        record(entry) ? entry.caseId : null)).size === 432
      && orientationCases.every((entry) =>
        record(entry)
        && officeFacilityArcadeProductionOrientations.includes(
          String(entry.orientation) as never,
        )
        && point(entry.actorOrigin)
        && point(entry.worldRoot)
        && same(entry.worldRoot, entry.resolvedRoot)
        && same(entry.rootAlignmentDelta, [0, 0])
        && same(entry.pivotDelta, [0, 0])
        && entry.routeValid === true
        && entry.heldController === false),
    "Arcade G02 must prove 108 poses and 432 orientation cases",
  );

  const reservation = value.reservationValidation;
  add(
    issues,
    record(reservation)
      && reservation.durationSeconds === 30
      && reservation.actorCount === 2
      && reservation.maximumConcurrentReservations === 1
      && reservation.collisionCount === 0
      && reservation.blockedAttemptCount === 1
      && reservation.failureCount === 1
      && reservation.releaseCount === 2
      && reservation.retrySuccessCount === 1
      && reservation.releasedAtEnd === true
      && Array.isArray(reservation.events)
      && reservation.events.length >= 8
      && Array.isArray(reservation.samples)
      && reservation.samples.length === 31
      && reservation.samples[30]?.heldBy === null,
    "Arcade G02 must prove the 30-second two-user failure and retry timeline",
  );

  add(issues, record(value.gates), "gates must be an object");
  if (record(value.gates)) {
    for (const gate of officeFacilityArcadeProductionGates) {
      const expected = [
        "F0", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8",
      ]
        .includes(gate)
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
    reviewOutputs.length === 10
      && reviewEvidence.length === 10
      && reviewEvidence.every((entry, index) =>
        record(entry)
        && entry.path === reviewOutputs[index]
        && sha256(entry.sha256)
        && point(entry.size)),
    "Arcade G02 production must contain 10 hash-locked review boards",
  );
  const permissions = value.permissions;
  add(
    issues,
    record(permissions)
      && permissions.familyLab === true
      && permissions.ownerReview === false
      && permissions.furnitureOnlyRoom === false
      && permissions.otherFacilityFamilies === false
      && permissions.activeOfficePromotion === false
      && record(value.ownerDecision)
      && value.ownerDecision.decision === "approved"
      && value.ownerDecision.decidedOn === "2026-07-30"
      && typeof value.ownerDecision.notes === "string",
    "Arcade G02 production must preserve its F8 owner approval",
  );
  return issues;
}
