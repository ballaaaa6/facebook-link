export type {
  OfficeFacilityUpsizeBatchProductionManifest,
  OfficeFacilityUpsizeGeneratedProductionManifest,
  OfficeFacilityUpsizeProductionAsset,
  OfficeFacilityUpsizeProductionOrientation,
} from "./officeFacilityUpsizeGeneratedProductionTypes.ts";
export {
  officeFacilityUpsizeProductionGates,
  officeFacilityUpsizeProductionOrientations,
} from "./officeFacilityUpsizeGeneratedProductionTypes.ts";

import {
  officeFacilityUpsizeProductionGates,
  officeFacilityUpsizeProductionOrientations,
} from "./officeFacilityUpsizeGeneratedProductionTypes.ts";

type ValueRecord = Record<string, unknown>;
const record = (value: unknown): value is ValueRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const same = (first: unknown, second: unknown) =>
  JSON.stringify(first) === JSON.stringify(second);
const sha256 = (value: unknown) =>
  typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const positiveInteger = (value: unknown) =>
  Number.isInteger(value) && (value as number) > 0;
const add = (issues: string[], condition: boolean, message: string) => {
  if (!condition) issues.push(message);
};
const geometry = {
  physicalScale: { width: 2, depth: 2, height: 4, unit: "tile" },
  footprint: { width: 2, depth: 2, unit: "tile" },
  renderBox: { width: 3, height: 4, unit: "tile" },
};

function asset(value: unknown, size: readonly [number, number]): boolean {
  return record(value)
    && typeof value.file === "string"
    && sha256(value.sha256)
    && same(value.size, size);
}

export function validateOfficeFacilityUpsizeGeneratedProductionManifest(
  value: unknown,
): string[] {
  if (!record(value)) return ["manifest must be an object"];
  const issues: string[] = [];
  add(
    issues,
    value.schemaVersion === 1
      && typeof value.id === "string"
      && typeof value.familyId === "string"
      && value.revision === "upsize-production-r01"
      && value.status === "production-owner-review"
      && value.productionStage === "f4-f7-complete"
      && value.createdOn === "2026-07-30"
      && value.developmentOnly === true
      && value.activeOfficePromotion === false
      && value.ownerDecision === null,
    "2x2x4 production identity or F8 review stop changed",
  );
  const authority = value.preflightAuthority;
  add(
    issues,
    record(authority)
      && typeof authority.manifest === "string"
      && sha256(authority.manifestSha256)
      && authority.revision === "generated-2x2x4-visual-preflight-r01"
      && authority.status === "visual-preflight-owner-approved"
      && authority.approvedOn === "2026-07-30"
      && authority.approvedReviewHashCount === 5
      && authority.hashMismatchCount === 0,
    "2x2x4 production preflight authority changed",
  );
  const policy = value.sourcePolicy;
  add(
    issues,
    record(policy)
      && policy.approvedPreflightPixelsOnly === true
      && policy.newImageGeneration === false
      && policy.predecessorProductionPixelReuse === false
      && policy.activeOfficePixelReuse === false
      && policy.processedForeignFamilyReuse === false
      && policy.generativeRepair === false
      && policy.missingAssetFallback === false,
    "2x2x4 production source isolation changed",
  );
  const render = value.render;
  add(
    issues,
    record(render)
      && same(render.physicalScale, geometry.physicalScale)
      && same(render.footprint, geometry.footprint)
      && same(render.renderBox, geometry.renderBox)
      && same(render.authoringCanvas, [384, 512])
      && same(render.runtimeCanvas, [96, 128])
      && render.uniformIntegerDivisor === 4
      && render.anchor === "bottom-center"
      && same(render.basePivotRuntime, [48, 124])
      && same(render.sortPivotRuntime, [48, 124])
      && same(
        render.visualOrientations,
        officeFacilityUpsizeProductionOrientations,
      )
      && Array.isArray(render.interactionOrientations)
      && render.interactionOrientations.length >= 1
      && render.collisionChangesByOrientation === false,
    "2x2x4 production render contract changed",
  );
  const parts = value.parts;
  const shells = record(parts) && Array.isArray(parts.shells)
    ? parts.shells
    : [];
  add(
    issues,
    record(parts)
      && shells.length === 4
      && shells.every(
        (shell, index) =>
          record(shell)
          && shell.orientation
            === officeFacilityUpsizeProductionOrientations[index]
          && asset(shell.authoring, [384, 512])
          && asset(shell.runtime, [96, 128])
          && sha256(shell.approvedPreflightRuntimeSha256),
      )
      && record(parts.localBaseFront)
      && asset(parts.localBaseFront.authoring, [384, 512])
      && asset(parts.localBaseFront.runtime, [96, 128]),
    "2x2x4 production immutable shell assets changed",
  );
  const animation = value.animation;
  const seamLoop = record(animation) && record(animation.seamLoop)
    ? animation.seamLoop
    : {};
  const finiteUse = record(animation) && record(animation.finiteUse)
    ? animation.finiteUse
    : {};
  add(
    issues,
    record(animation)
      && animation.compositionFormula
        === "immutableShell[orientation] + machineLocalChild[state]"
      && seamLoop.kind === "deterministic-seam-loop"
      && same(seamLoop.frameIds, ["a", "b", "c", "d"])
      && same(seamLoop.transition, ["a", "b", "c", "d", "a"])
      && Array.isArray(seamLoop.frames)
      && seamLoop.frames.length === 4
      && finiteUse.kind === "invoked-finite-return-to-idle"
      && Array.isArray(finiteUse.sequence)
      && finiteUse.sequence.length === 6
      && Array.isArray(finiteUse.states)
      && finiteUse.states.length === 6
      && finiteUse.outputSelectionRandomPerFrame === false
      && record(animation.declaredLocalRegionsRuntime)
      && animation.shellMoves === false
      && same(animation.basePivotDeltaPixels, [0, 0])
      && same(animation.sortPivotDeltaPixels, [0, 0])
      && same(animation.footprintDeltaTiles, [0, 0])
      && animation.changedPixelsOutsideDeclaredRegions === 0
      && animation.staticRecompositionPixelExact === true,
    "2x2x4 production modular animation changed",
  );
  const spatial = value.spatial;
  add(
    issues,
    record(spatial)
      && sha256(spatial.i01ManifestSha256)
      && sha256(spatial.spatialManifestSha256)
      && spatial.coordinateFormula
        === "worldRoot - actorFrameRootSocket"
      && spatial.integerCoordinatesOnly === true
      && spatial.newCoordinateSystem === false
      && spatial.perCharacterOffsets === false
      && spatial.magicOffsets === false
      && spatial.missingSocketFallback === false
      && spatial.orientationCaseCount === 432
      && spatial.orientationRouteCollisionCount === 0
      && Array.isArray(spatial.orientationCases)
      && spatial.orientationCases.length === 432,
    "2x2x4 production spatial or orientation proof changed",
  );
  const interaction = value.interaction;
  add(
    issues,
    record(interaction)
      && typeof interaction.action === "string"
      && typeof interaction.visualPose === "string"
      && interaction.capacityPerInstance === 1
      && Array.isArray(interaction.plannedInstanceIds)
      && positiveInteger(interaction.plannedInstanceCount)
      && interaction.plannedInstanceIds.length
        === interaction.plannedInstanceCount
      && interaction.independentReservations === true
      && Array.isArray(interaction.heldPropIds)
      && interaction.reservationSlotContribution === 0
      && positiveInteger(interaction.plannedReservationSlotsAfterF8)
      && interaction.slotTransferBeforeF8 === false,
    "2x2x4 production interaction or slot stop changed",
  );
  const roster = value.rosterValidation;
  add(
    issues,
    record(roster)
      && roster.characterCount === 18
      && roster.activeFrames === 6
      && roster.poseCaseCount === 108
      && roster.orientationCaseCount === 432
      && roster.attachmentDeltaFailures === 0
      && roster.seatForegroundFailures === 0
      && roster.perCharacterFacilityScaling === false
      && roster.perCharacterOffsets === false
      && roster.magicOffsetCases === 0
      && roster.fallbackSocketCases === 0
      && Array.isArray(roster.poseCases)
      && roster.poseCases.length === 108
      && Array.isArray(roster.primaryGripCases)
      && roster.primaryGripCases.length === roster.primaryGripCaseCount,
    "2x2x4 production roster or socket proof changed",
  );
  const reservation = value.reservationValidation;
  add(
    issues,
    record(reservation)
      && reservation.durationSeconds === 30
      && positiveInteger(reservation.instanceCount)
      && reservation.capacityPerInstance === 1
      && reservation.maximumConcurrentReservations
        === reservation.instanceCount
      && reservation.blockedAttemptCount === 1
      && reservation.failureCount === 1
      && reservation.retrySuccessCount === 1
      && reservation.collisionCount === 0
      && reservation.releasedAtEnd === true
      && Array.isArray(reservation.samples)
      && reservation.samples.length === 31,
    "2x2x4 production reservation proof changed",
  );
  const validation = value.validation;
  add(
    issues,
    record(validation)
      && Object.entries(validation).every(
        ([key, entry]) =>
          !key.endsWith("FailureCount")
          && !key.endsWith("Failures")
          || entry === 0,
      )
      && validation.approvedPreflightHashMismatchCount === 0
      && validation.visualOrientationCount === 4
      && validation.seamLoopFrameCount === 4
      && validation.changedPixelsOutsideDeclaredRegions === 0
      && validation.pivotMismatchCount === 0
      && validation.footprintMismatchCount === 0,
    "2x2x4 production validation failures changed",
  );
  add(issues, record(value.gates), "2x2x4 production gates are missing");
  if (record(value.gates)) {
    for (const gate of officeFacilityUpsizeProductionGates) {
      const expected = [
        "F0", "F1", "F2", "F3", "F4", "F5", "F6", "F7",
      ].includes(gate)
        ? "passed"
        : gate === "F8" ? "pending-owner-review" : "blocked";
      add(
        issues,
        record(value.gates[gate]) && value.gates[gate].status === expected,
        `2x2x4 production ${gate} must remain ${expected}`,
      );
    }
  }
  const evidence = Array.isArray(value.reviewEvidence)
    ? value.reviewEvidence
    : [];
  const outputs = Array.isArray(value.reviewOutputs)
    ? value.reviewOutputs
    : [];
  const permissions = value.permissions;
  add(
    issues,
    outputs.length === 12
      && evidence.length === 12
      && evidence.every(
        (entry, index) =>
          record(entry)
          && entry.path === outputs[index]
          && sha256(entry.sha256),
      )
      && record(permissions)
      && permissions.familyLab === true
      && permissions.ownerReview === true
      && permissions.reservationSlotActivation === false
      && permissions.furnitureOnlyRoom === false
      && permissions.activeOfficePromotion === false,
    "2x2x4 production review evidence or permission stop changed",
  );
  return issues;
}

export function validateOfficeFacilityUpsizeBatchProductionManifest(
  value: unknown,
): string[] {
  if (!record(value)) return ["manifest must be an object"];
  const issues: string[] = [];
  add(
    issues,
    value.schemaVersion === 1
      && value.id === "office.facility-upsize.2x2x4.production.v1"
      && value.revision === "upsize-production-batch-r01"
      && value.status === "production-owner-review"
      && value.productionStage === "f4-f7-complete"
      && value.developmentOnly === true
      && value.activeOfficePromotion === false
      && value.ownerDecision === null,
    "2x2x4 production batch identity or F8 stop changed",
  );
  const families = Array.isArray(value.families) ? value.families : [];
  add(
    issues,
    families.length === 4
      && families.every(
        (family) =>
          record(family)
          && typeof family.manifest === "string"
          && sha256(family.sha256)
          && family.status === "production-owner-review"
          && family.poseCaseCount === 108
          && family.orientationCaseCount === 432
          && positiveInteger(family.plannedInstanceCount)
          && positiveInteger(family.plannedReservationSlotsAfterF8),
      ),
    "2x2x4 production batch family index changed",
  );
  add(
    issues,
    record(value.validation)
      && same(value.validation, {
        familyCount: 4,
        visualOrientationCount: 16,
        rosterPoseCaseCount: 432,
        orientationCaseCount: 1728,
        seamLoopFrameCount: 16,
        reservationSimulationSecondsPerFamily: 30,
        shellOrPivotFailureCount: 0,
        routeFailureCount: 0,
        attachmentFailureCount: 0,
        reservationFailureCount: 0,
      }),
    "2x2x4 production batch validation changed",
  );
  add(
    issues,
    record(value.slotTransferPolicy)
      && same(value.slotTransferPolicy, {
        facilityV1ReadySlotsCurrent: 20,
        candidateActiveSlotContribution: 0,
        plannedPredecessorSlotsToTransferAfterAllF8: 5,
        facilityV1ReadySlotsAfterTransferTarget: 20,
        doubleCountOldAndNew: false,
        atomicPerFamily: true,
      }),
    "2x2x4 production batch slot transfer stop changed",
  );
  const counter = value.counterPolicy;
  const f9 = value.f9Policy;
  add(
    issues,
    record(counter)
      && sha256(counter.manifestSha256)
      && counter.status === "owner-approved-retained"
      && counter.deleteAsset === false
      && counter.plannedF9V2Placement === "retained-not-placed"
      && record(f9)
      && sha256(f9.currentF9ManifestSha256)
      && f9.currentF9Changed === false
      && f9.workstationAnchorToPreserve === "C12"
      && f9.workstationCountToPreserve === 10
      && f9.routeQueriesToRebuild === 200,
    "2x2x4 production batch Counter or F9 isolation changed",
  );
  const gates = value.gates;
  const permissions = value.permissions;
  add(
    issues,
    record(gates)
      && ["F4", "F5", "F6", "F7"].every(
        (gate) => record(gates[gate]) && gates[gate].status === "passed",
      )
      && record(gates.F8)
      && gates.F8.status === "pending-owner-review"
      && ["F9", "F10"].every(
        (gate) => record(gates[gate]) && gates[gate].status === "blocked",
      )
      && record(permissions)
      && permissions.ownerReview === true
      && permissions.reservationSlotActivation === false
      && permissions.f9Replacement === false
      && permissions.activeOfficePromotion === false,
    "2x2x4 production batch gate or permission stop changed",
  );
  return issues;
}
