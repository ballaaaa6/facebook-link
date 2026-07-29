import {
  officeFacilityArcadeGeneratedGames,
  officeFacilityArcadeGeneratedOrientations,
  officeFacilityArcadeGeneratedPreflightGates,
} from "./officeFacilityArcadeGeneratedPreflightTypes.ts";

export * from "./officeFacilityArcadeGeneratedPreflightTypes.ts";

type RecordValue = Record<string, unknown>;

function record(value: unknown): value is RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sha256(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function point(value: unknown): value is [number, number] {
  return Array.isArray(value)
    && value.length === 2
    && value.every(Number.isInteger);
}

function box(value: unknown): value is [number, number, number, number] {
  return Array.isArray(value)
    && value.length === 4
    && value.every(Number.isInteger)
    && value[0] < value[2]
    && value[1] < value[3];
}

function same(first: unknown, second: unknown) {
  return JSON.stringify(first) === JSON.stringify(second);
}

function add(issues: string[], condition: boolean, message: string) {
  if (!condition) issues.push(message);
}

function validAsset(
  value: unknown,
  expectedSize: readonly [number, number],
): boolean {
  return record(value)
    && typeof value.file === "string"
    && sha256(value.sha256)
    && same(value.size, expectedSize);
}

export function validateOfficeFacilityArcadeGeneratedPreflightManifest(
  value: unknown,
): string[] {
  if (!record(value)) return ["manifest must be an object"];
  const issues: string[] = [];
  add(
    issues,
    value.schemaVersion === 1
      && value.id === "office.facility.arcade-machine.g02"
      && value.familyId === "machine.game.arcade.generated-modern"
      && value.revision === "g02-preflight-r01",
    "Arcade G02 preflight identity changed",
  );
  add(
    issues,
    value.status === "visual-preflight-owner-review"
      && value.productionStage === "visual-preflight"
      && value.developmentOnly === true
      && value.activeOfficePromotion === false,
    "Arcade G02 must remain an isolated visual preflight",
  );
  add(
    issues,
    value.plannedInteractionMode === "machine-local-controls"
      && value.plannedHeldProp === false,
    "Arcade G02 must use machine-local controls with no held prop",
  );

  const policy = value.sourcePolicy;
  add(issues, record(policy), "sourcePolicy must be an object");
  if (record(policy)) {
    add(
      issues,
      policy.freshImageGeneration === true,
      "Arcade G02 must use fresh image generation",
    );
    for (const field of [
      "originalMasterPixelReuse",
      "processedCropDirectReuse",
      "activeOfficePixelReuse",
      "legacyOrRejectedPixelReuse",
      "previousArcadePixelReuse",
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
    "Arcade G02 generation authority is invalid",
  );
  const expectedSourceRoles = [
    "front-anchor",
    "turnaround",
    "cosmic-drift-kit",
    "neon-rally-kit",
    "dungeon-pulse-kit",
  ];
  const sources = record(generation) && Array.isArray(generation.sources)
    ? generation.sources
    : [];
  add(
    issues,
    same(sources.map((source) => record(source) ? source.role : null), expectedSourceRoles),
    "Arcade G02 must contain exactly five generated source roles",
  );
  for (const [index, source] of sources.entries()) {
    const role = expectedSourceRoles[index] ?? String(index);
    add(issues, record(source), `generated source ${role} must be an object`);
    if (!record(source)) continue;
    add(
      issues,
      source.file ===
        `assets/art/layout-references/office-facility-family-v1/arcade-machine-g02/source/${
          ["01-cabinet-front-anchor-chroma.png", "02-cabinet-turnaround-chroma.png",
            "03-cosmic-drift-kit-chroma.png", "04-neon-rally-kit-chroma.png",
            "05-dungeon-pulse-kit-chroma.png"][index]
        }`
        && sha256(source.sha256)
        && point(source.size)
        && source.extractionMethod === "generated-source-chroma-key"
        && typeof source.keyedFile === "string"
        && source.keyedFile.startsWith(
          "assets/game/processed/office-facility-family-v1/arcade-machine-g02/",
        )
        && sha256(source.keyedSha256),
      `generated source ${role} path or hash is invalid`,
    );
    add(
      issues,
      Array.isArray(source.ownership)
        && source.ownership.length > 0
        && source.ownership.every((entry) =>
          record(entry)
          && box(entry.sourceCell)
          && box(entry.ownedBounds)
          && Number.isInteger(entry.visiblePixels)
          && (entry.visiblePixels as number) > 0
          && entry.cellBoundaryContact === false),
      `generated source ${role} ownership is invalid`,
    );
  }

  const render = value.render;
  add(
    issues,
    record(render)
      && same(render.physicalScale, { width: 2, depth: 2, height: 4, unit: "tile" })
      && same(render.footprint, { width: 2, depth: 2, unit: "tile" })
      && same(render.renderBox, { width: 3, height: 4, unit: "tile" })
      && same(render.authoringCanvas, [384, 512])
      && same(render.runtimeCanvas, [96, 128])
      && render.uniformIntegerDivisor === 4
      && render.nonUniformRuntimeScaling === false
      && render.anchor === "bottom-center"
      && same(render.requiredOrientations, officeFacilityArcadeGeneratedOrientations)
      && same(render.basePivot, { x: 1, y: 2, unit: "tile" })
      && same(render.sortPivot, { x: 1, y: 2, unit: "tile" })
      && same(render.renderPivotRuntime, [48, 124]),
    "Arcade G02 2x2x4 geometry or four-orientation contract changed",
  );
  const orientations = record(render) && Array.isArray(render.orientations)
    ? render.orientations
    : [];
  add(
    issues,
    orientations.length === 4
      && orientations.every((entry, index) =>
        record(entry)
        && entry.orientation === officeFacilityArcadeGeneratedOrientations[index]
        && validAsset({
          file: entry.authoringFile,
          sha256: entry.authoringSha256,
          size: entry.authoringSize,
        }, [384, 512])
        && validAsset({
          file: entry.runtimeFile,
          sha256: entry.runtimeSha256,
          size: entry.runtimeSize,
        }, [96, 128])
        && box(entry.runtimeAlphaBounds)),
    "Arcade G02 orientation assets are invalid",
  );

  const screen = value.screenSystem;
  add(
    issues,
    record(screen)
      && same(screen.viewportAuthoring, [120, 108, 264, 252])
      && same(screen.viewportRuntime, [30, 27, 66, 63])
      && same(screen.runtimeSize, [36, 36])
      && same(screen.frameIds, ["a", "b", "c", "d"])
      && same(screen.transition, ["a", "b", "c", "d", "a"])
      && screen.frameDurationMs === 200
      && screen.cycleDurationMs === 800
      && same(screen.backgroundScrollPhases, [0, 9, 18, 27, 36])
      && screen.shellChangedPixelsOutsideViewport === 0
      && screen.controlsChangedPixels === 0
      && same(screen.pivotDeltaPixels, [0, 0]),
    "Arcade G02 screen viewport, timing, shell, or pivot lock changed",
  );
  const games = record(screen) && Array.isArray(screen.games)
    ? screen.games
    : [];
  add(
    issues,
    games.length === 3
      && games.every((game, index) =>
        record(game)
        && game.gameId === officeFacilityArcadeGeneratedGames[index]
        && Array.isArray(game.screenFrames)
        && game.screenFrames.length === 4
        && game.screenFrames.every((frame, frameIndex) =>
          record(frame)
          && frame.frameId === ["a", "b", "c", "d"][frameIndex]
          && validAsset(frame, [36, 36]))
        && Array.isArray(game.compositeFrames)
        && game.compositeFrames.length === 4
        && game.compositeFrames.every((frame, frameIndex) =>
          record(frame)
          && frame.frameId === ["a", "b", "c", "d"][frameIndex]
          && validAsset(frame, [96, 128]))
        && Array.isArray(game.transitionChangedPixels)
        && game.transitionChangedPixels.length === 4
        && game.transitionChangedPixels.every(
          (pixels) => Number.isInteger(pixels) && pixels > 0,
        )
        && game.closureMismatchPixels === 0
        && game.outsideViewportChangedPixels === 0
        && game.controlRegionChangedPixels === 0
        && record(game.gif)
        && validAsset(game.gif, [384, 512])),
    "Arcade G02 must contain three deterministic four-frame seam loops",
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
      && interaction.rosterCasesBuilt === 0
      && interaction.orientationRouteCasesBuilt === 0,
    "Arcade G02 visual-preflight interaction boundary changed",
  );
  add(issues, record(value.gates), "gates must be an object");
  if (record(value.gates)) {
    for (const gate of officeFacilityArcadeGeneratedPreflightGates) {
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
    reviewOutputs.length === 13
      && reviewEvidence.length === 13
      && reviewEvidence.every((entry, index) =>
        record(entry)
        && entry.path === reviewOutputs[index]
        && sha256(entry.sha256)
        && point(entry.size)
        && (entry.kind === "png" || entry.kind === "gif")),
    "Arcade G02 must contain 10 boards and three hash-locked GIFs",
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
    "Arcade G02 visual-preflight permissions changed",
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
    "Arcade G02 Active Office isolation evidence is missing",
  );
  return issues;
}
