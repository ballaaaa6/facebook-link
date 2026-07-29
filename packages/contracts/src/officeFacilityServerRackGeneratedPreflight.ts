import {
  officeFacilityServerRackGeneratedFrames,
  officeFacilityServerRackGeneratedGates,
  officeFacilityServerRackGeneratedOrientations,
} from "./officeFacilityServerRackGeneratedPreflightTypes.ts";

export * from "./officeFacilityServerRackGeneratedPreflightTypes.ts";

type RecordValue = Record<string, unknown>;

const record = (value: unknown): value is RecordValue =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const same = (first: unknown, second: unknown) =>
  JSON.stringify(first) === JSON.stringify(second);
const sha256 = (value: unknown) =>
  typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const positive = (value: unknown) =>
  Number.isInteger(value) && (value as number) > 0;
const box = (value: unknown) =>
  Array.isArray(value)
  && value.length === 4
  && value.every(Number.isInteger)
  && value[0] < value[2]
  && value[1] < value[3];

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

export function validateOfficeFacilityServerRackGeneratedPreflightManifest(
  value: unknown,
): string[] {
  if (!record(value)) return ["manifest must be an object"];
  const issues: string[] = [];
  add(
    issues,
    value.schemaVersion === 1
      && value.id === "office.facility.server-rack.n02"
      && value.familyId === "server.rack.generated-modern"
      && value.revision === "n02-preflight-r01",
    "Server Rack N02 identity changed",
  );
  add(
    issues,
    value.status === "visual-preflight-owner-approved"
      && value.productionStage === "visual-preflight-approved"
      && value.developmentOnly === true
      && value.activeOfficePromotion === false,
    "Server Rack N02 must remain an isolated visual preflight",
  );
  add(
    issues,
    record(value.supersedes)
      && value.supersedes.id === "office.facility.server-rack.n01"
      && value.supersedes.manifest
        === "assets/game/manifests/office-facility-server-rack-n01.json"
      && sha256(value.supersedes.manifestSha256)
      && typeof value.supersedes.reason === "string"
      && value.supersedes.reason.includes("2x2x4"),
    "Server Rack N02 must preserve the N01 redesign authority",
  );

  const policy = value.sourcePolicy;
  add(issues, record(policy), "sourcePolicy must be an object");
  if (record(policy)) {
    add(
      issues,
      policy.freshImageGeneration === true,
      "sourcePolicy.freshImageGeneration must be true",
    );
    for (const field of [
      "originalMasterPixelReuse",
      "processedCropDirectReuse",
      "activeOfficePixelReuse",
      "legacyOrRejectedPixelReuse",
      "serverRackN01PixelReuse",
      "generativeRepair",
      "missingAssetFallback",
    ]) {
      add(issues, policy[field] === false, `sourcePolicy.${field} must be false`);
    }
  }

  const generation = value.generation;
  add(
    issues,
    record(generation)
      && generation.workflow === "built-in-imagegen"
      && record(generation.promptRecord)
      && typeof generation.promptRecord.file === "string"
      && sha256(generation.promptRecord.sha256),
    "Server Rack N02 generation authority is invalid",
  );
  const sources = record(generation) && Array.isArray(generation.sources)
    ? generation.sources
    : [];
  const roles = ["front-anchor", "turnaround", "status-kit"];
  const sizes = [[1024, 1536], [1774, 887], [1254, 1254]];
  const ownershipCounts = [1, 4, 4];
  add(
    issues,
    same(sources.map((source) => record(source) ? source.role : null), roles),
    "Server Rack N02 generated source order changed",
  );
  for (const [index, source] of sources.entries()) {
    add(
      issues,
      record(source)
        && asset({
          file: source.file,
          sha256: source.sha256,
          size: source.size,
        }, sizes[index] as [number, number])
        && source.inputImageCount === (index === 0 ? 0 : 1)
        && source.identityReference === (index === 0 ? null : "front-anchor")
        && source.extractionMethod === "generated-source-chroma-key"
        && asset(source.keyedAsset, sizes[index] as [number, number])
        && Array.isArray(source.sampledKeyRgb)
        && source.sampledKeyRgb.length === 3
        && record(source.chromaStats)
        && positive(source.chromaStats.visiblePixels)
        && Array.isArray(source.ownership)
        && source.ownership.length === ownershipCounts[index]
        && source.ownership.every((entry) =>
          record(entry)
          && typeof entry.partId === "string"
          && box(entry.sourceCell)
          && box(entry.ownedBounds)
          && positive(entry.visiblePixels)
          && positive(entry.ownedComponentCount)
          && entry.cellBoundaryContact === false),
      `Server Rack N02 generated source ownership is invalid: ${roles[index]}`,
    );
  }

  const render = value.render;
  add(
    issues,
    record(render)
      && same(render.physicalScale, {
        width: 2, depth: 2, height: 4, unit: "tile",
      })
      && same(render.footprint, {
        width: 2, depth: 2, unit: "tile",
      })
      && same(render.renderBox, {
        width: 3, height: 4, unit: "tile",
      })
      && same(render.authoringCanvas, [384, 512])
      && same(render.runtimeCanvas, [96, 128])
      && render.uniformIntegerDivisor === 4
      && render.nonUniformRuntimeScaling === false
      && render.anchor === "bottom-center"
      && same(render.basePivotRuntime, [48, 124])
      && same(render.sortPivotRuntime, [48, 124])
      && same(
        render.requiredOrientations,
        officeFacilityServerRackGeneratedOrientations,
      )
      && render.generatedTurns === false,
    "Server Rack N02 2x2x4 geometry or orientation contract changed",
  );
  const orientations = record(render) && Array.isArray(render.orientations)
    ? render.orientations
    : [];
  add(
    issues,
    orientations.length === 4
      && orientations.every((orientation, index) =>
        record(orientation)
        && orientation.orientation
          === officeFacilityServerRackGeneratedOrientations[index]
        && asset(orientation.authoring, [384, 512])
        && asset(orientation.runtime, [96, 128])
        && box(orientation.runtimeAlphaBounds)),
    "Server Rack N02 orientation assets are invalid",
  );

  const parts = value.parts;
  const statusFrames = record(parts) && Array.isArray(parts.statusFrames)
    ? parts.statusFrames
    : [];
  const turnaroundSources = record(parts) ? parts.turnaroundSources : null;
  const statusKitSources = record(parts) ? parts.statusKitSources : null;
  add(
    issues,
    record(parts)
      && asset(parts.frontAnchorSource)
      && record(turnaroundSources)
      && officeFacilityServerRackGeneratedOrientations.every(
        (name) => asset(turnaroundSources[name]),
      )
      && record(statusKitSources)
      && ["screen-base", "cyan-telemetry", "green-nodes", "amber-alert"]
        .every((name) => asset(statusKitSources[name]))
      && record(parts.shell)
      && asset(parts.shell.authoring, [384, 512])
      && asset(parts.shell.runtime, [96, 128])
      && record(parts.statusRuntimeParts)
      && statusFrames.length === 4
      && statusFrames.every((frame, index) =>
        record(frame)
        && frame.frameId === officeFacilityServerRackGeneratedFrames[index]
        && asset(frame.status, [32, 16])
        && asset(frame.composite, [96, 128])),
    "Server Rack N02 modular parts are invalid",
  );

  const loop = value.statusLoop;
  add(
    issues,
    record(loop)
      && loop.compositionFormula
        === "immutableShell[orientation] + statusViewport[n]"
      && loop.animatedOrientation === "front"
      && same(loop.staticOrientations, ["left", "right", "back"])
      && same(loop.frameIds, officeFacilityServerRackGeneratedFrames)
      && same(loop.transition, ["a", "b", "c", "d", "a"])
      && loop.frameDurationMs === 220
      && loop.cycleDurationMs === 880
      && same(loop.viewportAuthoring, [128, 156, 256, 220])
      && same(loop.viewportRuntime, [32, 39, 64, 55])
      && Array.isArray(loop.transitionChangedPixels)
      && loop.transitionChangedPixels.length === 4
      && loop.transitionChangedPixels.every(positive)
      && loop.shellChangedPixels === 0
      && loop.outsideViewportChangedPixels === 0
      && same(loop.pivotDeltaPixels, [0, 0])
      && loop.closureMismatchPixels === 0
      && asset(loop.gif, [512, 512])
      && record(loop.gif)
      && loop.gif.frameCount === 4
      && loop.gif.durationMs === 220,
    "Server Rack N02 status seam-loop contract changed",
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
      && interaction.heldProp === false
      && interaction.h01Dependency === false
      && interaction.handoff === false
      && same(interaction.machineLocalTargetRuntime, [48, 52])
      && interaction.actorId === "anna"
      && record(interaction.actorAuthority)
      && interaction.actorAuthority.pendingCommercialReview === true
      && record(interaction.placement)
      && interaction.placement.formula === "sceneRoot - actorRootSocket"
      && interaction.placement.perCharacterOffsets === false
      && interaction.placement.magicOffset === false
      && interaction.placement.missingSocketFallback === false
      && timeline.length === 12
      && timeline.every((entry) =>
        record(entry)
        && entry.heldPropVisible === false
        && officeFacilityServerRackGeneratedFrames.includes(
          entry.statusFrame as "a",
        ))
      && interaction.countsTowardRosterValidation === false
      && interaction.countsTowardOrientationValidation === false
      && interaction.countsTowardReservationValidation === false
      && asset(interaction.gif, [768, 512])
      && record(interaction.gif)
      && interaction.gif.frameCount === 12
      && interaction.gif.durationMs === 240,
    "Server Rack N02 empty-hand interaction boundary changed",
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
    "Server Rack N02 two-instance preview changed",
  );
  const targets = value.productionTargets;
  add(
    issues,
    record(targets)
      && targets.characterCount === 18
      && targets.activeFrames === 6
      && targets.basePoseCases === 108
      && targets.orientationCompositeCases === 432
      && targets.builtPoseCases === 0
      && targets.builtOrientationCompositeCases === 0
      && targets.twoInstanceReservationSimulationBuilt === false,
    "Server Rack N02 preflight fabricated production evidence",
  );

  const gates = value.gates;
  add(issues, record(gates), "gates must be an object");
  if (record(gates)) {
    for (const gate of officeFacilityServerRackGeneratedGates) {
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
  const reviewOutputs = Array.isArray(value.reviewOutputs)
    ? value.reviewOutputs
    : [];
  add(
    issues,
    reviewOutputs.length === 11
      && Array.isArray(value.reviewEvidence)
      && value.reviewEvidence.length === 11
      && record(value.permissions)
      && value.permissions.ownerReview === true
      && value.permissions.fullSystemBuild === true
      && value.permissions.furnitureOnlyRoom === false
      && value.permissions.otherFacilityFamilies === false
      && value.permissions.activeOfficePromotion === false
      && record(value.visualApproval)
      && value.visualApproval.status === "owner-approved"
      && value.visualApproval.approvedOn === "2026-07-30"
      && value.visualApproval.approvedRevision === "n02-preflight-r01"
      && value.visualApproval.scope === "exact-review-output-hashes"
      && typeof value.visualApproval.decision === "string"
      && Array.isArray(value.visualApproval.approvedReviewHashes)
      && value.visualApproval.approvedReviewHashes.length === 11
      && value.visualApproval.approvedReviewHashes.every((entry, index) =>
        record(entry)
        && entry.path === reviewOutputs[index]
        && sha256(entry.sha256))
      && same(value.visualApproval.unlocks, ["F4", "F5", "F6", "F7", "F8"])
      && value.ownerDecision === null,
    "Server Rack N02 visual approval, review set, or permissions changed",
  );
  return issues;
}
