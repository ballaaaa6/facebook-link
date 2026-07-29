export type {
  OfficeFacilityUpsizeAsset,
  OfficeFacilityUpsizeBatchPreflightManifest,
  OfficeFacilityUpsizeGeneratedPreflightManifest,
  OfficeFacilityUpsizeOrientation,
  OfficeFacilityUpsizeView,
} from "./officeFacilityUpsizeGeneratedPreflightTypes.ts";
export {
  officeFacilityUpsizeFamilyGates,
  officeFacilityUpsizeOrientations,
} from "./officeFacilityUpsizeGeneratedPreflightTypes.ts";

import {
  officeFacilityUpsizeFamilyGates,
  officeFacilityUpsizeOrientations,
} from "./officeFacilityUpsizeGeneratedPreflightTypes.ts";

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

const exactGeometry = {
  physicalScale: { width: 2, depth: 2, height: 4, unit: "tile" },
  footprint: { width: 2, depth: 2, unit: "tile" },
  renderBox: { width: 3, height: 4, unit: "tile" },
};
const zeroValidation = {
  visualViewCount: 4,
  sourceCellBoundaryTouchCount: 0,
  unresolvedOwnershipCount: 0,
  transparentCornerFailureCount: 0,
  visibleMagentaFringePixels: 0,
  nonUniformScaleCount: 0,
  pivotMismatchCount: 0,
  productionPoseCaseCount: 0,
  productionOrientationCaseCount: 0,
};

function validAsset(
  value: unknown,
  expectedSize: readonly [number, number],
): boolean {
  return record(value)
    && typeof value.file === "string"
    && sha256(value.sha256)
    && same(value.size, expectedSize);
}

function validOwnership(value: unknown, orientation: string): boolean {
  if (!record(value)) return false;
  const gutters = value.transparentGutters;
  return value.orientation === orientation
    && Array.isArray(value.sourceCell)
    && value.sourceCell.length === 4
    && Array.isArray(value.alphaBoundsInCell)
    && value.alphaBoundsInCell.length === 4
    && Array.isArray(gutters)
    && gutters.length === 4
    && gutters.every(positiveInteger)
    && value.touchesSourceCellBoundary === false
    && positiveInteger(value.selectedComponentCount)
    && positiveInteger(value.selectedPixelCount)
    && Array.isArray(value.components)
    && value.components.length === value.selectedComponentCount;
}

export function validateOfficeFacilityUpsizeGeneratedPreflightManifest(
  value: unknown,
): string[] {
  if (!record(value)) return ["manifest must be an object"];
  const issues: string[] = [];
  add(
    issues,
    value.schemaVersion === 1
      && typeof value.id === "string"
      && typeof value.familyId === "string"
      && value.revision === "generated-2x2x4-visual-preflight-r01"
      && value.status === "visual-preflight-owner-review"
      && value.productionStage === "f0-f3-visual-preflight"
      && value.createdOn === "2026-07-30"
      && value.developmentOnly === true
      && value.activeOfficePromotion === false
      && value.ownerDecision === null,
    "2x2x4 family preflight identity or owner-review stop changed",
  );

  const supersedes = value.supersedesAfterApproval;
  add(
    issues,
    record(supersedes)
      && typeof supersedes.manifest === "string"
      && sha256(supersedes.manifestSha256)
      && typeof supersedes.currentGeometry === "string"
      && supersedes.oldPixelsUsed === false
      && supersedes.slotTransferBeforeF8 === false,
    "2x2x4 family predecessor isolation changed",
  );
  const policy = value.sourcePolicy;
  const generation = value.imageGeneration;
  add(
    issues,
    record(policy)
      && policy.newBuiltInImageGeneration === true
      && policy.previousFamilyPixelReuse === false
      && policy.activeOfficePixelReuse === false
      && policy.processedForeignFamilyReuse === false
      && policy.generativeRepairAfterExtraction === false
      && policy.missingAssetFallback === false
      && record(generation)
      && generation.toolMode === "built-in-imagegen"
      && generation.useCase === "stylized-concept"
      && generation.promptAuthority
        === "docs/art/OFFICE_FACILITY_UPSIZE_2X2X4_PREFLIGHT_V1.md",
    "2x2x4 family fresh ImageGen source policy changed",
  );

  const sources = value.sources;
  add(
    issues,
    record(sources)
      && validAsset(sources.chromaMaster, [1254, 1254])
      && validAsset(sources.alphaMaster, [1254, 1254])
      && record(sources.alphaMaster)
      && sources.alphaMaster.transparentCorners === true
      && sources.alphaMaster.visibleMagentaFringePixels === 0
      && record(sources.cellLayout)
      && sources.cellLayout.columns === 2
      && sources.cellLayout.rows === 2
      && same(sources.cellLayout.cellPixels, [627, 627])
      && same(
        sources.cellLayout.orientationOrder,
        officeFacilityUpsizeOrientations,
      ),
    "2x2x4 family source ownership layout changed",
  );

  const render = value.render;
  add(
    issues,
    record(render)
      && same(render.physicalScale, exactGeometry.physicalScale)
      && same(render.footprint, exactGeometry.footprint)
      && same(render.renderBox, exactGeometry.renderBox)
      && same(render.authoringCanvas, [384, 512])
      && same(render.runtimeCanvas, [96, 128])
      && render.uniformIntegerDivisor === 4
      && render.anchor === "bottom-center"
      && same(render.basePivotAuthoring, [192, 496])
      && same(render.basePivotRuntime, [48, 124])
      && same(render.sortPivotRuntime, [48, 124])
      && same(render.visualOrientations, officeFacilityUpsizeOrientations)
      && render.collisionChangesByOrientation === false,
    "2x2x4 family geometry or four-side render contract changed",
  );

  const views = Array.isArray(value.views) ? value.views : [];
  add(
    issues,
    views.length === 4
      && views.every((view, index) =>
        record(view)
        && view.orientation === officeFacilityUpsizeOrientations[index]
        && validAsset(view.authoring, [384, 512])
        && validAsset(view.runtime, [96, 128])
        && validOwnership(
          view.sourceOwnership,
          officeFacilityUpsizeOrientations[index]!,
        )),
    "2x2x4 family view assets or isolated ownership changed",
  );

  const interaction = value.interactionPreflight;
  add(
    issues,
    record(interaction)
      && interaction.capacityPerInstance === 1
      && typeof interaction.action === "string"
      && typeof interaction.visualPose === "string"
      && interaction.newCoordinateSystem === false
      && same(
        interaction.visualOrientationsCreated,
        officeFacilityUpsizeOrientations,
      )
      && same(interaction.productionEnabledOrientations, [])
      && interaction.sideInteractionRequiresProductionProof === true
      && positiveInteger(interaction.plannedInstanceCount)
      && interaction.reservationSlotContribution === 0
      && positiveInteger(interaction.plannedReservationSlotsAfterF8),
    "2x2x4 family interaction or reservation preflight stop changed",
  );
  const motion = value.modularMotionPlan;
  add(
    issues,
    record(motion)
      && Array.isArray(motion.parts)
      && motion.parts.length >= 4
      && record(motion.declaredLocalRegionsRuntime)
      && motion.shellMustRemainImmutable === true
      && motion.basePivotMustRemainFixed === true
      && motion.sortPivotMustRemainFixed === true
      && motion.footprintMustRemainFixed === true
      && motion.seamLoopFramesBuilt === 0
      && motion.productionCasesBuilt === 0,
    "2x2x4 family modular motion preflight changed",
  );
  add(
    issues,
    record(value.validation) && same(value.validation, zeroValidation),
    "2x2x4 family preflight validation changed",
  );

  const reviews = Array.isArray(value.reviewOutputs)
    ? value.reviewOutputs
    : [];
  add(
    issues,
    reviews.length === 5
      && reviews.every((entry) =>
        record(entry)
        && typeof entry.path === "string"
        && sha256(entry.sha256)
        && same(entry.size, [1600, 1000])),
    "2x2x4 family review evidence changed",
  );
  add(issues, record(value.gates), "2x2x4 family gates are missing");
  if (record(value.gates)) {
    for (const gate of officeFacilityUpsizeFamilyGates) {
      const expected = ["F0", "F1", "F2"].includes(gate)
        ? "passed"
        : gate === "F3" ? "pending-owner-review" : "blocked";
      add(
        issues,
        record(value.gates[gate]) && value.gates[gate].status === expected,
        `2x2x4 family ${gate} must remain ${expected}`,
      );
    }
  }
  const permissions = value.permissions;
  add(
    issues,
    record(permissions)
      && permissions.visualOwnerReview === true
      && permissions.productionBuild === false
      && permissions.reservationSlotTransfer === false
      && permissions.f9Replacement === false
      && permissions.activeOfficePromotion === false,
    "2x2x4 family permission stop changed",
  );
  return issues;
}

export function validateOfficeFacilityUpsizeBatchPreflightManifest(
  value: unknown,
): string[] {
  if (!record(value)) return ["manifest must be an object"];
  const issues: string[] = [];
  add(
    issues,
    value.schemaVersion === 1
      && value.id === "office.facility-upsize.2x2x4.preflight.v1"
      && value.status === "visual-preflight-owner-review"
      && value.productionStage === "f0-f3-batch-visual-preflight"
      && value.developmentOnly === true
      && value.activeOfficePromotion === false
      && value.ownerDecision === null,
    "2x2x4 batch identity or owner-review stop changed",
  );
  add(
    issues,
    record(value.scope)
      && same(value.scope, {
        familyCount: 4,
        visualViewCount: 16,
        physicalScale: "2x2x4",
        floorFootprint: "2x2",
        renderBox: "3x4",
      }),
    "2x2x4 batch scope changed",
  );
  const families = Array.isArray(value.families) ? value.families : [];
  add(
    issues,
    families.length === 4
      && families.every((family) =>
        record(family)
        && typeof family.id === "string"
        && typeof family.manifest === "string"
        && sha256(family.sha256)
        && family.status === "visual-preflight-owner-review"
        && family.visualViewCount === 4
        && positiveInteger(family.plannedInstanceCount)
        && positiveInteger(family.plannedReservationSlotsAfterF8)),
    "2x2x4 batch family index changed",
  );
  const counter = value.counterPolicy;
  const slots = value.slotPolicy;
  add(
    issues,
    record(counter)
      && counter.manifest
        === "assets/game/manifests/office-furniture-counter-bar-a01-r02.json"
      && sha256(counter.manifestSha256)
      && counter.status === "owner-approved-retained"
      && counter.deleteAsset === false
      && counter.removeFromF9BeforeNewFamiliesPassF8 === false
      && counter.plannedF9V2Placement === "retained-not-placed",
    "2x2x4 batch Counter A01-r02 retention changed",
  );
  add(
    issues,
    record(slots)
      && same(slots, {
        facilityV1ReadySlotsCurrent: 20,
        newPreflightSlotContribution: 0,
        plannedTransferredSlotsAfterAllF8: 5,
        doubleCountOldAndNew: false,
      }),
    "2x2x4 batch reservation transfer stop changed",
  );
  const f9 = value.f9Policy;
  add(
    issues,
    record(f9)
      && f9.currentF9Manifest
        === "assets/game/manifests/office-furniture-only-f9-v1.json"
      && sha256(f9.currentF9ManifestSha256)
      && f9.currentF9Changed === false
      && f9.plannedReplacement === "office.furniture-only-room.f9.v2"
      && f9.workstationAnchorToPreserve === "C12"
      && f9.workstationCountToPreserve === 10
      && f9.routeQueriesToRebuild === 200,
    "2x2x4 batch F9 isolation changed",
  );
  add(
    issues,
    record(value.reviewOutput)
      && typeof value.reviewOutput.path === "string"
      && sha256(value.reviewOutput.sha256)
      && same(value.reviewOutput.size, [1600, 1000]),
    "2x2x4 batch review output changed",
  );
  const gates = value.gates;
  const permissions = value.permissions;
  add(
    issues,
    record(gates)
      && record(gates.F3)
      && gates.F3.status === "pending-owner-review"
      && ["F4", "F8", "F9", "F10"].every(
        (gate) => record(gates[gate]) && gates[gate].status === "blocked",
      )
      && record(permissions)
      && permissions.visualOwnerReview === true
      && permissions.productionBuild === false
      && permissions.f9Replacement === false
      && permissions.activeOfficePromotion === false,
    "2x2x4 batch gate or permission stop changed",
  );
  return issues;
}
