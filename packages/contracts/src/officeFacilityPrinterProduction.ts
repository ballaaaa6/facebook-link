import {
  officeFacilityPrinterProductionGates,
} from "./officeFacilityPrinterProductionTypes.ts";

export * from "./officeFacilityPrinterProductionTypes.ts";

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
const add = (issues: string[], condition: boolean, message: string) => {
  if (!condition) issues.push(message);
};

export function validateOfficeFacilityPrinterProductionManifest(
  value: unknown,
): string[] {
  if (!record(value)) return ["manifest must be an object"];
  const issues: string[] = [];
  add(
    issues,
    value.schemaVersion === 1
      && value.id === "office.facility.printer.p01.production"
      && value.familyId === "printer.multifunction.floor"
      && value.revision === "p01-production-r01"
      && value.status === "production-owner-review"
      && value.productionStage === "f7-complete-f8-owner-review"
      && value.developmentOnly === true
      && value.activeOfficePromotion === false,
    "Printer P01 production identity or F8 stop changed",
  );

  const authority = value.preflightAuthority;
  add(
    issues,
    record(authority)
      && authority.manifest
        === "assets/game/manifests/office-facility-printer-p01.json"
      && sha256(authority.manifestSha256)
      && authority.revision === "p01-generated-motion-preflight-r02"
      && authority.approvedOn === "2026-07-30"
      && authority.approvedReviewHashCount === 12
      && authority.hashMismatchCount === 0,
    "Printer P01 approved preflight authority changed",
  );

  const source = value.sourcePolicy;
  add(
    issues,
    record(source)
      && source.approvedPreflightPixelsOnly === true
      && source.newImageGeneration === false
      && source.originalMasterPixelReuse === false
      && source.processedForeignFamilyReuse === false
      && source.activeOfficePixelReuse === false
      && source.generativeRepair === false
      && source.missingAssetFallback === false,
    "Printer P01 production source isolation changed",
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
      && same(render.runtimeCanvas, [96, 128])
      && same(render.basePivotRuntime, [48, 124])
      && same(render.sortPivotRuntime, [48, 124])
      && same(render.requiredOrientations, ["front"])
      && render.collisionChangesDuringMotion === false
      && render.footprintChangesDuringMotion === false,
    "Printer P01 production 2x2x4 geometry changed",
  );

  const parts = value.parts;
  const states = value.states;
  add(
    issues,
    record(parts)
      && Object.keys(parts).length === 12
      && Object.values(parts).every((entry) =>
        record(entry)
        && sha256(entry.sha256)
        && sha256(entry.approvedPreflightSha256)
        && same(entry.size, [96, 128]))
      && record(states)
      && Object.keys(states).length === 12
      && Object.values(states).every((entry) =>
        record(entry)
        && sha256(entry.sha256)
        && same(entry.size, [96, 128])
        && Array.isArray(entry.sourcePartSha256)
        && entry.sourcePartSha256.length === 4
        && entry.sourcePartSha256.every(sha256)),
    "Printer P01 production parts or states changed",
  );

  const animation = value.animation;
  add(
    issues,
    record(animation)
      && animation.compositionFormula
        === "immutableShell + statusViewport[frame] + scannerLight[frame] + outputTray[state] + outputChild[state]"
      && same(animation.processingLoop, ["A", "B", "C", "D", "A"])
      && Array.isArray(animation.processingChangedPixels)
      && animation.processingChangedPixels.length === 4
      && animation.processingChangedPixels.every(
        (count) => typeof count === "number" && count > 0,
      )
      && same(
        animation.processingChangedPixelsOutsideLocalRegions,
        [0, 0, 0, 0],
      )
      && same(
        animation.finiteTrayPath,
        ["closed", "half", "open", "half", "closed"],
      )
      && Array.isArray(animation.trayChangedPixels)
      && animation.trayChangedPixels.length === 4
      && animation.trayChangedPixels.every(
        (count) => typeof count === "number" && count > 0,
      )
      && same(animation.trayChangedPixelsOutsideTrayRegion, [0, 0, 0, 0])
      && animation.shellChangedPixels === 0
      && same(animation.pivotDeltaPixels, [0, 0])
      && same(animation.footprintDeltaTiles, [0, 0])
      && animation.processingEndpointMismatchPixels === 0
      && animation.trayEndpointMismatchPixels === 0
      && record(animation.interruptionBeforePickup)
      && Object.values(animation.interruptionBeforePickup).every(
        (entry) => entry === true || entry === false,
      )
      && animation.interruptionBeforePickup.outputRemoved === true
      && animation.interruptionBeforePickup.heldPropCreated === false
      && record(animation.interruptionAfterPickup)
      && animation.interruptionAfterPickup.closeBeforeRelease === true
      && animation.interruptionAfterPickup
        .heldPropRemovedBeforeDeparture === true,
    "Printer P01 modular motion or interruption safety changed",
  );

  const spatial = value.spatial;
  const instances = record(spatial) ? spatial.instances : undefined;
  add(
    issues,
    record(spatial)
      && spatial.coordinateFormula === "worldRoot - actorFrameRootSocket"
      && record(instances)
      && Object.keys(instances).length === 2
      && ["printer-01", "printer-02"].every((id) => {
        const route = instances[id];
        return record(route)
          && Array.isArray(route.footprintCells)
          && route.footprintCells.length === 4
          && route.footprintCells.every(point)
          && point(route.stand)
          && point(route.approach)
          && point(route.exit)
          && Array.isArray(route.route)
          && route.route.every(point);
      })
      && spatial.routeCollisionCount === 0
      && spatial.perCharacterOffsets === false
      && spatial.magicOffsets === false
      && spatial.missingSocketFallback === false,
    "Printer P01 two-instance spatial proof changed",
  );

  const interaction = value.interaction;
  add(
    issues,
    record(interaction)
      && interaction.semanticAction === "interact-use"
      && interaction.visualPose === "interact-front"
      && same(interaction.instanceIds, ["printer-01", "printer-02"])
      && interaction.familyInstanceCount === 2
      && interaction.capacityPerInstance === 1
      && interaction.independentReservations === true
      && same(interaction.jobOutputMap, {
        "print-document": "held.paper-sheet",
        "prepare-mail": "held.envelope",
      })
      && interaction.outputSelectionRule === "job-driven-once-per-visit"
      && same(interaction.handoffParents, [
        "facility.output.primary",
        "actor.hand.primary.grip",
        "none",
      ])
      && interaction.propSocketRule === "primary-grip-to-primary-grip"
      && same(interaction.attachmentDelta, [0, 0])
      && interaction.newCoordinateSystem === false
      && interaction.reservationSlotContribution === 0
      && interaction.plannedReservationSlotContributionAfterF8 === 2
      && interaction.facilityV1ReadySlotsBeforePrinterF8 === 18
      && interaction.facilityV1ReadySlotsAfterPrinterF8Target === 20
      && interaction.facilityV1ReadySlotsCurrent === 18,
    "Printer P01 interaction or F8 slot stop changed",
  );

  const roster = value.rosterValidation;
  const poses = record(roster) && Array.isArray(roster.poseCases)
    ? roster.poseCases
    : [];
  add(
    issues,
    record(roster)
      && roster.characterCount === 18
      && roster.activeFrames === 6
      && roster.poseCaseCount === 108
      && poses.length === 108
      && poses.every((entry) =>
        record(entry)
        && same(entry.resolvedRoot, entry.worldRoot)
        && same(entry.rootAlignmentDelta, [0, 0])
        && same(entry.pivotDelta, [0, 0])
        && entry.routeValid === true
        && entry.perCharacterOffset === false)
      && roster.rootAlignmentFailures === 0
      && roster.pivotDriftFailures === 0
      && roster.routeFailures === 0
      && roster.perCharacterOffsets === false,
    "Printer P01 108-case roster proof changed",
  );

  const overlay = value.propOverlayValidation;
  const gripCases = record(overlay) && Array.isArray(overlay.cases)
    ? overlay.cases
    : [];
  add(
    issues,
    record(overlay)
      && same(overlay.propIds, ["held.paper-sheet", "held.envelope"])
      && same(overlay.visibleFrames, [2, 3, 4])
      && overlay.caseCount === 108
      && gripCases.length === 108
      && gripCases.every((entry) =>
        record(entry)
        && entry.attachmentParent === "actor.hand.primary.grip"
        && same(
          entry.resolvedPropPrimaryGrip,
          entry.actorPrimaryGripSocket,
        )
        && same(entry.primaryGripDelta, [0, 0])
        && typeof entry.actorAlphaContactDistance === "number"
        && entry.actorAlphaContactDistance >= 0
        && entry.actorAlphaContactDistance <= 3
        && entry.propAlphaContactDistance === 0
        && entry.fullPropAlphaVisible === true
        && entry.foregroundMaskUsed === false
        && entry.midpointPlacementUsed === false
        && entry.magicOffset === false
        && entry.fallbackSocket === false)
      && overlay.attachmentFailures === 0
      && overlay.actorAlphaContactRadiusPixels === 3
      && typeof overlay.maximumActorAlphaDistance === "number"
      && overlay.maximumActorAlphaDistance <= 3
      && overlay.maximumPropAlphaDistance === 0
      && overlay.alphaContactFailures === 0
      && overlay.clippedPropCases === 0
      && overlay.foregroundMaskUses === 0
      && overlay.midpointPlacementUses === 0
      && overlay.magicOffsetCases === 0
      && overlay.fallbackSocketCases === 0,
    "Printer P01 108-case exact primary-grip proof changed",
  );

  const reservation = value.reservationValidation;
  add(
    issues,
    record(reservation)
      && reservation.durationSeconds === 30
      && reservation.actorCount === 3
      && same(reservation.instanceIds, ["printer-01", "printer-02"])
      && reservation.capacityPerInstance === 1
      && reservation.maximumConcurrentReservations === 2
      && reservation.maximumPerInstanceReservations === 1
      && reservation.collisionCount === 0
      && reservation.blockedAttemptCount === 1
      && reservation.failureCount === 1
      && reservation.releaseCount === 3
      && reservation.retrySuccessCount === 1
      && reservation.beforePickupInterruptionCount === 1
      && reservation.afterPickupInterruptionCount === 1
      && reservation.handoffCount === 2
      && reservation.releasedAtEnd === true
      && reservation.orphanPropCountAtEnd === 0
      && Array.isArray(reservation.events)
      && Array.isArray(reservation.samples)
      && reservation.samples.length === 31,
    "Printer P01 30-second three-user reservation proof changed",
  );

  add(issues, record(value.gates), "Printer P01 production gates missing");
  if (record(value.gates)) {
    for (const gate of officeFacilityPrinterProductionGates) {
      const expected = ["F0", "F1", "F2", "F3", "F4", "F5", "F6", "F7"]
        .includes(gate)
        ? "passed"
        : gate === "F8"
        ? "pending-owner-review"
        : "blocked";
      add(
        issues,
        record(value.gates[gate])
          && value.gates[gate].status === expected
          && Array.isArray(value.gates[gate].evidence),
        `Printer P01 production ${gate} must remain ${expected}`,
      );
    }
  }

  const outputs = Array.isArray(value.reviewOutputs) ? value.reviewOutputs : [];
  const evidence = Array.isArray(value.reviewEvidence)
    ? value.reviewEvidence
    : [];
  const permissions = value.permissions;
  add(
    issues,
    outputs.length === 17
      && evidence.length === 17
      && evidence.every((entry, index) =>
        record(entry)
        && entry.path === outputs[index]
        && sha256(entry.sha256)
        && point(entry.size))
      && record(permissions)
      && permissions.familyLab === true
      && permissions.ownerReview === true
      && permissions.reservationSlotActivation === false
      && permissions.furnitureOnlyRoom === false
      && permissions.otherFacilityFamilies === false
      && permissions.activeOfficePromotion === false
      && Array.isArray(value.activeOfficeEvidence)
      && value.activeOfficeEvidence.every(
        (entry) => record(entry) && entry.imported === false,
      )
      && value.ownerDecision === null,
    "Printer P01 F8 evidence or permission stop changed",
  );
  return issues;
}
