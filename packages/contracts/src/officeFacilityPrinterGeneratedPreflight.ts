export type {
  OfficeFacilityPrinterGeneratedPreflightManifest,
  OfficeFacilityPrinterPreflightGate,
} from "./officeFacilityPrinterGeneratedPreflightTypes.ts";

export const officeFacilityPrinterPreflightGates = [
  "F0", "F1", "F2", "F3", "F4", "F5",
  "F6", "F7", "F8", "F9", "F10",
] as const;

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

export function validateOfficeFacilityPrinterGeneratedPreflightManifest(
  value: unknown,
): string[] {
  if (!record(value)) return ["manifest must be an object"];
  const issues: string[] = [];
  add(
    issues,
    value.schemaVersion === 1
      && value.id === "office.facility.printer.p01"
      && value.familyId === "printer.multifunction.floor"
      && value.revision === "p01-generated-motion-preflight-r02"
      && value.status === "visual-motion-preflight-owner-approved"
      && value.productionStage === "f3-owner-approved-production-authorized"
      && value.developmentOnly === true
      && value.activeOfficePromotion === false,
    "Printer P01 preflight identity or F3 approval changed",
  );

  const policy = value.sourcePolicy;
  add(
    issues,
    record(policy)
      && policy.freshImageGeneration === true
      && policy.identityAnchorTextOnly === true
      && Array.isArray(policy.motionAtlasReferenceInputs)
      && policy.motionAtlasReferenceInputs.length === 1
      && policy.originalMasterPixelReuse === false
      && policy.processedPrinterPixelReuse === false
      && policy.foreignFamilyPixelReuse === false
      && policy.activeOfficePixelReuse === false
      && policy.missingAssetFallback === false
      && Array.isArray(policy.sourceFiles)
      && policy.sourceFiles.length === 2
      && policy.sourceFiles.every(
        (entry) => record(entry) && sha256(entry.sha256),
      )
      && record(policy.promptRecord)
      && policy.promptRecord.tool === "built-in image_gen"
      && sha256(policy.promptRecord.sha256)
      && policy.chromaKey === "#ff00ff"
      && policy.localAlphaExtraction === true,
    "Printer P01 fresh source policy changed",
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
      && render.anchor === "bottom-center"
      && same(render.basePivotRuntime, [48, 124])
      && same(render.sortPivotRuntime, [48, 124])
      && same(render.requiredOrientations, ["front"])
      && render.collisionChangesDuringMotion === false
      && render.footprintChangesDuringMotion === false,
    "Printer P01 2x2x4 render geometry changed",
  );

  const assets = value.assets;
  add(
    issues,
    record(assets)
      && Object.keys(assets).length === 20
      && Object.values(assets).every(
        (entry) =>
          record(entry)
          && typeof entry.file === "string"
          && sha256(entry.sha256)
          && same(entry.size, [96, 128]),
      ),
    "Printer P01 modular asset set changed",
  );

  const animation = value.animation;
  add(
    issues,
    record(animation)
      && animation.compositionFormula
        === "immutableShell + statusViewport[frame] + scannerLight[frame] + outputTray[state] + outputChild[state]"
      && same(animation.processingLoop, ["A", "B", "C", "D", "A"])
      && animation.processingLoopKind === "invoked-seam-loop"
      && same(animation.finiteOutputSequence, [
        "idle", "wake", "processing", "tray-half", "tray-open",
        "output-ready", "pickup", "tray-half", "tray-closed", "idle",
      ])
      && same(animation.screenRectRuntime, [31, 22, 65, 42])
      && same(animation.scannerRectRuntime, [18, 15, 78, 20])
      && same(animation.trayRectRuntime, [22, 48, 74, 79])
      && animation.shellMoves === false
      && same(animation.pivotDeltaPixels, [0, 0])
      && same(animation.footprintDeltaTiles, [0, 0])
      && animation.outputSelectionRandomPerFrame === false,
    "Printer P01 modular animation formula changed",
  );

  const spatial = value.spatial;
  add(
    issues,
    record(spatial)
      && sha256(spatial.authoritySha256)
      && spatial.coordinateFormula === "worldRoot - actorFrameRootSocket"
      && Array.isArray(spatial.footprintCells)
      && spatial.footprintCells.length === 4
      && spatial.footprintCells.every(point)
      && same(spatial.stand, [0, 2])
      && same(spatial.approach, [0, 3])
      && same(spatial.exit, [1, 3])
      && Array.isArray(spatial.route)
      && spatial.route.every(point)
      && spatial.routeCollisionCount === 0
      && record(spatial.machineLocalSockets)
      && same(spatial.machineLocalSockets.base, [48, 124])
      && same(spatial.machineLocalSockets.outputPrimary, [48, 66])
      && spatial.perCharacterOffsets === false
      && spatial.magicOffsets === false
      && spatial.missingSocketFallback === false,
    "Printer P01 spatial contract changed",
  );

  const interaction = value.interaction;
  add(
    issues,
    record(interaction)
      && interaction.semanticAction === "interact-use"
      && interaction.visualPose === "interact-front"
      && same(interaction.plannedInstanceIds, ["printer-01", "printer-02"])
      && interaction.plannedFamilyInstanceCount === 2
      && interaction.capacityPerInstance === 1
      && interaction.independentReservations === true
      && same(interaction.jobOutputMap, {
        "print-document": "held.paper-sheet",
        "prepare-mail": "held.envelope",
      })
      && interaction.outputSelectionRule === "job-driven-once-per-visit"
      && interaction.propSocketRule === "primary-grip-to-primary-grip"
      && same(interaction.attachmentDelta, [0, 0])
      && interaction.newCoordinateSystem === false
      && interaction.reservationSlotContribution === 0
      && interaction.plannedReservationSlotContributionAfterF8 === 2
      && interaction.facilityV1ReadySlotsBeforePrinterF8 === 18
      && interaction.facilityV1ReadySlotsAfterPrinterF8Target === 20,
    "Printer P01 interaction or slot preflight stop changed",
  );

  const preview = value.preflightValidation;
  const gripCases = record(preview) && Array.isArray(preview.primaryGripCases)
    ? preview.primaryGripCases
    : [];
  add(
    issues,
    record(preview)
      && preview.characterPreview === "anna"
      && same(preview.propIds, ["held.paper-sheet", "held.envelope"])
      && preview.attachmentRule === "primary-grip-to-primary-grip"
      && preview.attachmentFailures === 0
      && preview.primaryGripCaseCount === 6
      && preview.midpointPlacementUses === 0
      && preview.secondaryGripSocketRetainedForReview === true
      && gripCases.length === 6
      && gripCases.every((entry) =>
        record(entry)
        && entry.actorId === "anna"
        && [2, 3, 4].includes(entry.frame as number)
        && (
          entry.propId === "held.paper-sheet"
          || entry.propId === "held.envelope"
        )
        && point(entry.actorPrimaryGripSocket)
        && point(entry.actorSecondaryGripSocket)
        && point(entry.propPrimaryGripSocket)
        && point(entry.propOrigin)
        && same(
          entry.resolvedPropPrimaryGrip,
          entry.actorPrimaryGripSocket,
        )
        && same(entry.primaryGripDelta, [0, 0])
        && entry.attachmentParent === "actor.hand.primary.grip"
        && entry.magicOffset === false
        && entry.fallbackSocket === false)
      && preview.foregroundMaskUses === 0
      && preview.magicOffsetCases === 0
      && preview.fallbackSocketCases === 0
      && preview.productionRosterCasesBuilt === 0
      && preview.reservationSimulationSecondsBuilt === 0,
    "Printer P01 fabricated production validation",
  );

  add(issues, record(value.gates), "Printer P01 gates are missing");
  if (record(value.gates)) {
    for (const gate of officeFacilityPrinterPreflightGates) {
      const expected = ["F0", "F1", "F2", "F3"].includes(gate)
        ? "passed"
        : "blocked";
      add(
        issues,
        record(value.gates[gate])
          && value.gates[gate].status === expected
          && Array.isArray(value.gates[gate].evidence),
        `Printer P01 ${gate} must remain ${expected}`,
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
    outputs.length === 12
      && evidence.length === 12
      && evidence.every(
        (entry, index) =>
          record(entry)
          && entry.path === outputs[index]
          && sha256(entry.sha256)
          && point(entry.size),
      )
      && record(permissions)
      && permissions.visualMotionPreflight === true
      && permissions.ownerReview === false
      && permissions.fullSystemBuild === true
      && permissions.reservationSlotActivation === false
      && permissions.furnitureOnlyRoom === false
      && permissions.activeOfficePromotion === false
      && record(decision)
      && decision.decision === "approved"
      && decision.decidedOn === "2026-07-30"
      && decision.approvedRevision === "p01-generated-motion-preflight-r02"
      && decision.scope === "exact-review-output-hashes"
      && Array.isArray(decision.approvedReviewHashes)
      && decision.approvedReviewHashes.length === 12
      && decision.approvedReviewHashes.every((entry, index) =>
        record(entry)
        && record(evidence[index])
        && entry.path === evidence[index].path
        && entry.sha256 === evidence[index].sha256)
      && same(decision.unlocks, ["F4", "F5", "F6", "F7", "F8"])
      && Array.isArray(value.activeOfficeEvidence)
      && value.activeOfficeEvidence.every(
        (entry) => record(entry) && entry.imported === false,
      ),
    "Printer P01 F3 approval set or permission stop changed",
  );
  return issues;
}
