import {
  officeFacilityRefrigeratorProductionGates,
} from "./officeFacilityRefrigeratorProductionTypes.ts";

export * from "./officeFacilityRefrigeratorProductionTypes.ts";

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
    && same(value.size, size)
    && sha256(value.approvedPreflightSha256);
}

export function validateOfficeFacilityRefrigeratorProductionManifest(
  value: unknown,
): string[] {
  if (!record(value)) return ["manifest must be an object"];
  const issues: string[] = [];

  add(
    issues,
    value.schemaVersion === 1
      && value.id === "office.facility.refrigerator.r01.production"
      && value.familyId === "refrigerator.modern"
      && value.revision === "r01-production-r01"
      && value.status === "owner-approved"
      && value.productionStage === "f8-owner-approved"
      && value.developmentOnly === true
      && value.activeOfficePromotion === false,
    "Refrigerator R01 production identity or F8 stop changed",
  );

  const preflight = value.preflightAuthority;
  add(
    issues,
    record(preflight)
      && preflight.id === "office.facility.refrigerator.r01"
      && preflight.revision === "r01-generated-motion-preflight-r01"
      && preflight.status === "visual-motion-preflight-owner-approved"
      && preflight.approvedOn === "2026-07-30"
      && preflight.approvedReviewHashCount === 10
      && preflight.hashMismatchCount === 0
      && typeof preflight.manifest === "string"
      && sha256(preflight.manifestSha256),
    "Refrigerator R01 production must lock the approved preflight",
  );

  const policy = value.sourcePolicy;
  add(
    issues,
    record(policy)
      && policy.approvedPreflightPixelsOnly === true
      && [
        "newImageGeneration",
        "originalMasterPixelReuse",
        "processedForeignFamilyReuse",
        "activeOfficePixelReuse",
        "generativeRepair",
        "missingAssetFallback",
      ].every((field) => policy[field] === false),
    "Refrigerator R01 production source isolation changed",
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
      && same(render.requiredOrientations, ["front"])
      && same(render.doorSwingRegionRuntime, [14, 38, 89, 124])
      && render.collisionChangesDuringMotion === false
      && render.footprintChangesDuringMotion === false,
    "Refrigerator R01 production geometry changed",
  );

  const parts = value.parts;
  const states = value.states;
  add(
    issues,
    record(parts)
      && ["shell", "door-closed", "door-half", "door-open"].every(
        (role) =>
          record(parts[role])
          && asset((parts[role] as ValueRecord).authoring, [384, 512])
          && asset((parts[role] as ValueRecord).runtime, [96, 128]),
      )
      && record(states)
      && ["closed", "half", "open"].every(
        (state) => asset(states[state], [96, 128]),
      ),
    "Refrigerator R01 production part decomposition changed",
  );

  const motion = value.finiteAnimation;
  add(
    issues,
    record(motion)
      && motion.kind === "reversible-finite-state"
      && motion.repeatingAmbientLoop === false
      && motion.compositionFormula
        === "immutableShell + lowerDoor[state]"
      && same(motion.states, ["closed", "half", "open"])
      && same(motion.forwardPath, ["closed", "half", "open"])
      && same(motion.reversePath, ["open", "half", "closed"])
      && same(
        motion.productionTransition,
        ["closed", "half", "open", "half", "closed"],
      )
      && Array.isArray(motion.transitionChangedPixels)
      && motion.transitionChangedPixels.length === 4
      && motion.transitionChangedPixels.every(
        (count) => Number.isInteger(count) && count > 0,
      )
      && same(motion.changedPixelsOutsideDoorSwingRegion, [0, 0, 0, 0])
      && motion.shellChangedPixels === 0
      && same(motion.pivotDeltaPixels, [0, 0])
      && same(motion.footprintDeltaTiles, [0, 0])
      && motion.closedEndpointMismatchPixels === 0
      && record(motion.interruptionBeforePickup)
      && Object.values(motion.interruptionBeforePickup).every(
        (entry, index) => entry === (index !== 2),
      )
      && record(motion.interruptionAfterPickup)
      && Object.values(motion.interruptionAfterPickup).every(Boolean),
    "Refrigerator R01 production finite animation changed",
  );

  const spatial = value.spatial;
  add(
    issues,
    record(spatial)
      && record(spatial.authority)
      && spatial.authority.status === "owner-approved"
      && sha256(spatial.authority.sha256)
      && spatial.coordinateFormula
        === "worldRoot - actorFrameRootSocket"
      && spatial.perCharacterOffsets === false
      && spatial.magicOffsets === false
      && spatial.missingSocketFallback === false
      && spatial.fractionalCoordinates === false
      && Array.isArray(spatial.footprintCells)
      && spatial.footprintCells.length === 4
      && spatial.footprintCells.every(point)
      && same(spatial.stand, [1, 2])
      && same(spatial.approach, [1, 3])
      && same(spatial.exit, [2, 3])
      && Array.isArray(spatial.route)
      && spatial.route.length === 3
      && spatial.route.every(point)
      && spatial.routeCollisionCount === 0
      && record(spatial.machineLocalSockets)
      && same(spatial.machineLocalSockets.base, [48, 124])
      && same(spatial.machineLocalSockets.sort, [48, 124])
      && same(spatial.machineLocalSockets.interactionRoot, [48, 124])
      && same(spatial.machineLocalSockets.outputPrimary, [49, 76]),
    "Refrigerator R01 production routes or sockets changed",
  );

  const interaction = value.interaction;
  add(
    issues,
    record(interaction)
      && interaction.semanticAction === "interact-use"
      && interaction.visualPose === "interact-front"
      && same(interaction.instanceIds, ["refrigerator-01"])
      && interaction.familyInstanceCount === 1
      && interaction.capacityPerInstance === 1
      && interaction.independentReservations === true
      && same(
        interaction.propPool,
        ["held.water-bottle", "held.yogurt-box"],
      )
      && interaction.selectionAlgorithm
        === "(stable-hash(actorId|slotId) + visitIndex) % pool.length"
      && interaction.selectedOncePerVisit === true
      && interaction.frameStableSelection === true
      && same(
        interaction.handoffParents,
        [
          "facility.output.primary",
          "actor.hand.primary.grip",
          "none",
        ],
      )
      && same(interaction.attachmentDelta, [0, 0])
      && interaction.foregroundMaskUses === 0
      && interaction.newCoordinateSystem === false
      && interaction.reservationSlotContribution === 1
      && interaction.plannedReservationSlotContributionAfterF8 === 1
      && interaction.facilityV1ReadySlotsBeforeRefrigeratorF8 === 17
      && interaction.facilityV1ReadySlotsAfterRefrigeratorF8Target === 18
      && interaction.facilityV1ReadySlotsCurrent === 18,
    "Refrigerator R01 production interaction or approved slot changed",
  );

  const roster = value.rosterValidation;
  const poseCases = record(roster) && Array.isArray(roster.poseCases)
    ? roster.poseCases
    : [];
  add(
    issues,
    record(roster)
      && sha256(roster.authoritySha256)
      && roster.pendingCommercialReview === true
      && roster.characterCount === 18
      && roster.activeFrames === 6
      && roster.poseCaseCount === 108
      && roster.rootAlignmentFailures === 0
      && roster.pivotDriftFailures === 0
      && roster.routeFailures === 0
      && roster.perCharacterOffsets === false
      && poseCases.length === 108
      && new Set(
        poseCases.map((entry) => record(entry) ? entry.caseId : null),
      ).size === 108
      && poseCases.every((entry) =>
        record(entry)
        && same(entry.worldRoot, entry.resolvedRoot)
        && same(entry.rootAlignmentDelta, [0, 0])
        && same(entry.pivotDelta, [0, 0])
        && entry.routeValid === true
        && entry.perCharacterOffset === false),
    "Refrigerator R01 production must prove 108 base poses",
  );

  const overlays = value.propOverlayValidation;
  const propCases = record(overlays) && Array.isArray(overlays.cases)
    ? overlays.cases
    : [];
  const selections =
    record(overlays) && Array.isArray(overlays.selectionCases)
      ? overlays.selectionCases
      : [];
  add(
    issues,
    record(overlays)
      && sha256(overlays.authoritySha256)
      && same(
        overlays.propIds,
        ["held.water-bottle", "held.yogurt-box"],
      )
      && same(overlays.visibleFrames, [2, 3, 4])
      && overlays.caseCount === 108
      && overlays.attachmentFailures === 0
      && overlays.foregroundMaskUses === 0
      && overlays.clippedPropCases === 0
      && overlays.magicOffsetCases === 0
      && overlays.fallbackSocketCases === 0
      && propCases.length === 108
      && new Set(
        propCases.map((entry) => record(entry) ? entry.caseId : null),
      ).size === 108
      && propCases.every((entry) =>
        record(entry)
        && entry.attachmentParent === "actor.hand.primary.grip"
        && entry.attachmentMode === "front-overlay"
        && same(entry.handSocketWorld, entry.resolvedVisualCenter)
        && same(entry.attachmentDelta, [0, 0])
        && entry.foregroundMaskUsed === false
        && entry.fullPropAlphaVisible === true
        && entry.magicOffset === false
        && entry.fallbackSocket === false)
      && selections.length === 72
      && selections.every((entry) =>
        record(entry)
        && entry.instanceId === "refrigerator-01"
        && entry.selectedOnce === true
        && entry.frameStable === true),
    "Refrigerator R01 production must prove 108 H01 overlays",
  );

  const reservation = value.reservationValidation;
  add(
    issues,
    record(reservation)
      && reservation.durationSeconds === 30
      && reservation.actorCount === 2
      && same(reservation.instanceIds, ["refrigerator-01"])
      && reservation.capacityPerInstance === 1
      && reservation.maximumConcurrentReservations === 1
      && reservation.collisionCount === 0
      && reservation.blockedAttemptCount === 1
      && reservation.failureCount === 1
      && reservation.releaseCount === 3
      && reservation.retrySuccessCount === 1
      && reservation.beforePickupInterruptionCount === 1
      && reservation.afterPickupInterruptionCount === 1
      && reservation.handoffCount === 2
      && reservation.releasedAtEnd === true
      && reservation.propAttachedAtEnd === false
      && Array.isArray(reservation.events)
      && reservation.events.length === 22
      && Array.isArray(reservation.samples)
      && reservation.samples.length === 31
      && reservation.samples.every((entry) =>
        record(entry)
        && Number.isInteger(entry.second)
        && [0, 1].includes(entry.concurrentReservations as number)
        && entry.collisionCount === 0)
      && reservation.samples[30]?.heldBy === null
      && reservation.samples[30]?.attachmentParent === null
      && reservation.samples[30]?.propId === null,
    "Refrigerator R01 capacity-one reservation proof changed",
  );

  add(issues, record(value.gates), "gates must be an object");
  if (record(value.gates)) {
    for (const gate of officeFacilityRefrigeratorProductionGates) {
      const expected = ["F0", "F1", "F2", "F3", "F4", "F5", "F6", "F7"]
          .includes(gate)
        || gate === "F8"
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
  const decision = value.ownerDecision;
  add(
    issues,
    outputs.length === 15
      && evidence.length === 15
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
      && record(decision)
      && decision.decision === "approved"
      && decision.decidedOn === "2026-07-30"
      && decision.approvedRevision === "r01-production-r01"
      && decision.scope === "exact-review-output-hashes"
      && Array.isArray(decision.approvedReviewHashes)
      && decision.approvedReviewHashes.length === 15
      && decision.approvedReviewHashes.every((entry, index) =>
        record(entry)
        && entry.path === outputs[index]
        && entry.sha256 === (evidence[index] as ValueRecord | undefined)
          ?.sha256)
      && typeof decision.notes === "string"
      && Array.isArray(value.activeOfficeEvidence)
      && value.activeOfficeEvidence.every(
        (entry) => record(entry) && entry.imported === false,
      ),
    "Refrigerator R01 F8 approval set or permission stop changed",
  );
  return issues;
}
