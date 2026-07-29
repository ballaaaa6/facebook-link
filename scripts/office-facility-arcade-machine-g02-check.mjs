import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  validateOfficeFacilityArcadeGeneratedPreflightManifest,
} from "../packages/contracts/src/officeFacilityArcadeGeneratedPreflight.ts";
import {
  fileHashMatches,
  readJson,
  readText,
  recursiveFiles as files,
  root,
  same,
  sha256,
} from "./office-production-check-utils.mjs";

const manifestPath =
  "assets/game/manifests/office-facility-arcade-machine-g02.json";
const builderPath =
  "scripts/build-office-facility-arcade-machine-g02.py";
const docsPath =
  "docs/art/OFFICE_FACILITY_ARCADE_MACHINE_G02.md";
const processedRoot =
  "assets/game/processed/office-facility-family-v1/arcade-machine-g02";
const reviewRoot =
  "assets/art/layout-references/office-facility-family-v1/arcade-machine-g02";
const sourceRoot = `${reviewRoot}/source`;
const promptPath = `${sourceRoot}/IMAGEGEN_PROMPTS.md`;
const sourceFiles = [
  `${sourceRoot}/01-cabinet-front-anchor-chroma.png`,
  `${sourceRoot}/02-cabinet-turnaround-chroma.png`,
  `${sourceRoot}/03-cosmic-drift-kit-chroma.png`,
  `${sourceRoot}/04-neon-rally-kit-chroma.png`,
  `${sourceRoot}/05-dungeon-pulse-kit-chroma.png`,
];
const sourceRoles = [
  "front-anchor",
  "turnaround",
  "cosmic-drift-kit",
  "neon-rally-kit",
  "dungeon-pulse-kit",
];
const sourceSizes = [
  [1024, 1536],
  [1774, 887],
  [1254, 1254],
  [1254, 1254],
  [1254, 1254],
];
const orientations = ["front", "left", "right", "back"];
const games = ["cosmic-drift", "neon-rally", "dungeon-pulse"];
const frames = ["a", "b", "c", "d"];
const boardSpecs = [
  ["01-cabinet-turnaround-4-sides.png", [1800, 1000]],
  ["02-alpha-and-source-ownership.png", [1800, 1100]],
  ["03-scale-2x2x4-vs-actor.png", [1500, 950]],
  ["04-footprint-and-render-box-3x4.png", [1500, 980]],
  ["05-screen-viewport-and-machine-controls.png", [1600, 980]],
  ["06-cosmic-drift-a-b-c-d-a.png", [1800, 950]],
  ["07-neon-rally-a-b-c-d-a.png", [1800, 950]],
  ["08-dungeon-pulse-a-b-c-d-a.png", [1800, 950]],
  ["09-shell-diff-and-pivot-lock.png", [1600, 980]],
  ["10-four-orientation-floor-preview.png", [1800, 1050]],
];
const gifNames = [
  "cosmic-drift-loop.gif",
  "neon-rally-loop.gif",
  "dungeon-pulse-loop.gif",
];
const activeOfficeBaseline = new Map([
  [
    "apps/web/src/features/office/components/officeAssetRegistry.ts",
    "1c8752653d8818e57564f28f61870ae3eddbdabc8e46229e1364c546ec7607ef",
  ],
  [
    "assets/game/maps/office-c-v2.json",
    "c40db448eb8e6d0f3fea67a41f716c0108aca63a4136cfad15293534273c618d",
  ],
  [
    "apps/web/src/features/office/components/officeSceneRuntime.ts",
    "87ba6dc8dfc9235ad3d7424d7321dcbd657576afb01fb1edbbc2a424c6c6ed93",
  ],
]);

const failures = [];
const add = (condition, message) => {
  if (!condition) failures.push(message);
};

function gifSize(path) {
  const bytes = readFileSync(join(root, path));
  const header = bytes.subarray(0, 6).toString("ascii");
  if (header !== "GIF87a" && header !== "GIF89a") {
    throw new Error(`Not a GIF: ${path}`);
  }
  return [bytes.readUInt16LE(6), bytes.readUInt16LE(8)];
}

function gifHashMatches(path, expected, size) {
  return typeof path === "string"
    && existsSync(join(root, path))
    && sha256(path) === expected
    && same(gifSize(path), size);
}

try {
  const manifest = readJson(manifestPath);
  for (const issue of validateOfficeFacilityArcadeGeneratedPreflightManifest(
    manifest,
  )) {
    failures.push(`Arcade G02 generated-preflight contract: ${issue}`);
  }

  add(
    manifest.schemaVersion === 1
      && manifest.id === "office.facility.arcade-machine.g02"
      && manifest.familyId === "machine.game.arcade.generated-modern"
      && manifest.revision === "g02-preflight-r01"
      && manifest.status === "visual-preflight-owner-review"
      && manifest.productionStage === "visual-preflight"
      && manifest.visualApproval === null,
    "Arcade G02 identity or visual stop state changed",
  );
  add(
    [
      "originalMasterPixelReuse",
      "processedCropDirectReuse",
      "activeOfficePixelReuse",
      "legacyOrRejectedPixelReuse",
      "previousArcadePixelReuse",
      "generativeRepair",
      "missingAssetFallback",
    ].every((field) => manifest.sourcePolicy?.[field] === false)
      && manifest.sourcePolicy?.freshImageGeneration === true,
    "Arcade G02 must use only fresh generated pixels",
  );

  add(
    manifest.generation?.workflow === "built-in-imagegen"
      && manifest.generation?.promptRecord?.file === promptPath
      && manifest.generation?.promptRecord?.sha256 === sha256(promptPath)
      && same(
        manifest.generation?.sources?.map(({ role }) => role),
        sourceRoles,
      ),
    "Arcade G02 ImageGen workflow, prompt record, or source order changed",
  );
  for (const [index, source] of manifest.generation?.sources?.entries() ?? []) {
    add(
      source.file === sourceFiles[index]
        && source.sha256 === sha256(source.file)
        && same(source.size, sourceSizes[index])
        && source.inputImageCount === (index === 1 ? 1 : 0)
        && source.extractionMethod === "generated-source-chroma-key"
        && source.keyedFile
          === `${processedRoot}/authoring/source/${sourceRoles[index]}.keyed.png`
        && fileHashMatches(source.keyedFile, source.keyedSha256, sourceSizes[index])
        && Array.isArray(source.sampledKeyRgb)
        && source.sampledKeyRgb.length === 3
        && source.chromaStats?.transparentPixels > 0
        && source.chromaStats?.visiblePixels > 0
        && source.ownership?.length > 0
        && source.ownership.every(
          (record) =>
            record.cellBoundaryContact === false
            && record.visiblePixels > 0
            && record.ownedBounds[0] > record.sourceCell[0]
            && record.ownedBounds[1] > record.sourceCell[1]
            && record.ownedBounds[2] < record.sourceCell[2]
            && record.ownedBounds[3] < record.sourceCell[3],
        ),
      `Generated source ownership or alpha evidence changed: ${source.role}`,
    );
  }

  add(
    same(manifest.render?.physicalScale, {
      width: 2, depth: 2, height: 4, unit: "tile",
    })
      && same(manifest.render?.footprint, {
        width: 2, depth: 2, unit: "tile",
      })
      && same(manifest.render?.renderBox, {
        width: 3, height: 4, unit: "tile",
      })
      && same(manifest.render?.authoringCanvas, [384, 512])
      && same(manifest.render?.runtimeCanvas, [96, 128])
      && manifest.render?.uniformIntegerDivisor === 4
      && manifest.render?.nonUniformRuntimeScaling === false
      && same(manifest.render?.requiredOrientations, orientations)
      && same(manifest.render?.basePivot, { x: 1, y: 2, unit: "tile" })
      && same(manifest.render?.sortPivot, { x: 1, y: 2, unit: "tile" })
      && same(manifest.render?.renderPivotRuntime, [48, 124]),
    "Arcade G02 2x2x4 geometry, 3x4 render box, or pivot changed",
  );
  for (const [index, asset] of manifest.render?.orientations?.entries() ?? []) {
    const orientation = orientations[index];
    add(
      asset.orientation === orientation
        && asset.authoringFile
          === `${processedRoot}/authoring/orientations/${orientation}.png`
        && fileHashMatches(
          asset.authoringFile,
          asset.authoringSha256,
          [384, 512],
        )
        && asset.runtimeFile
          === `${processedRoot}/runtime/orientations/${orientation}.png`
        && fileHashMatches(
          asset.runtimeFile,
          asset.runtimeSha256,
          [96, 128],
        )
        && asset.runtimeAlphaBounds[0] > 0
        && asset.runtimeAlphaBounds[1] > 0
        && asset.runtimeAlphaBounds[2] < 96
        && asset.runtimeAlphaBounds[3] < 128,
      `Arcade G02 orientation asset changed: ${orientation}`,
    );
  }

  add(
    same(manifest.screenSystem?.viewportAuthoring, [120, 108, 264, 252])
      && same(manifest.screenSystem?.viewportRuntime, [30, 27, 66, 63])
      && same(manifest.screenSystem?.runtimeSize, [36, 36])
      && same(manifest.screenSystem?.frameIds, frames)
      && same(manifest.screenSystem?.transition, [...frames, "a"])
      && manifest.screenSystem?.frameDurationMs === 200
      && manifest.screenSystem?.cycleDurationMs === 800
      && same(manifest.screenSystem?.backgroundScrollPhases, [0, 9, 18, 27, 36])
      && manifest.screenSystem?.shellChangedPixelsOutsideViewport === 0
      && manifest.screenSystem?.controlsChangedPixels === 0
      && same(manifest.screenSystem?.pivotDeltaPixels, [0, 0]),
    "Arcade G02 screen viewport, seam timing, shell, controls, or pivot changed",
  );
  for (const [gameIndex, game] of manifest.screenSystem?.games?.entries() ?? []) {
    add(
      game.gameId === games[gameIndex]
        && same(game.screenFrames.map(({ frameId }) => frameId), frames)
        && same(game.compositeFrames.map(({ frameId }) => frameId), frames)
        && game.transitionChangedPixels.length === 4
        && game.transitionChangedPixels.every((pixels) => pixels > 0)
        && game.closureMismatchPixels === 0
        && game.outsideViewportChangedPixels === 0
        && game.controlRegionChangedPixels === 0,
      `Arcade G02 loop metrics changed: ${games[gameIndex]}`,
    );
    for (const [frameIndex, frame] of game.screenFrames.entries()) {
      add(
        frame.file
          === `${processedRoot}/runtime/screen-loops/${game.gameId}.${frames[frameIndex]}.png`
          && fileHashMatches(frame.file, frame.sha256, [36, 36]),
        `Arcade G02 screen frame changed: ${game.gameId}.${frames[frameIndex]}`,
      );
    }
    for (const [frameIndex, frame] of game.compositeFrames.entries()) {
      add(
        frame.file
          === `${processedRoot}/runtime/composites/${game.gameId}.${frames[frameIndex]}.png`
          && fileHashMatches(frame.file, frame.sha256, [96, 128]),
        `Arcade G02 composite frame changed: ${game.gameId}.${frames[frameIndex]}`,
      );
    }
    add(
      game.gif?.file === `${reviewRoot}/${gifNames[gameIndex]}`
        && gifHashMatches(game.gif?.file, game.gif?.sha256, [384, 512]),
      `Arcade G02 animated seam-loop GIF changed: ${game.gameId}`,
    );
  }

  add(
    manifest.plannedInteractionMode === "machine-local-controls"
      && manifest.plannedHeldProp === false
      && manifest.interactionPreview?.capacity === 1
      && manifest.interactionPreview?.visualPose === "interact-front"
      && manifest.interactionPreview?.heldController === false
      && manifest.interactionPreview?.reservationSimulationBuilt === false
      && manifest.interactionPreview?.rosterCasesBuilt === 0
      && manifest.interactionPreview?.orientationRouteCasesBuilt === 0
      && manifest.permissions?.fullSystemBuild === false,
    "Arcade G02 must not fabricate a held controller or full production system",
  );
  for (const gate of ["F0", "F1", "F2", "F3"]) {
    add(manifest.gates?.[gate]?.status === "passed", `${gate} must pass`);
  }
  for (const gate of ["F4", "F5", "F6", "F7", "F8", "F9", "F10"]) {
    add(manifest.gates?.[gate]?.status === "blocked", `${gate} must stay blocked`);
  }

  const expectedReviews = [
    ...boardSpecs.map(([name]) => `${reviewRoot}/${name}`),
    ...gifNames.map((name) => `${reviewRoot}/${name}`),
  ];
  add(
    same(manifest.reviewOutputs, expectedReviews)
      && same(
        manifest.reviewEvidence?.map(({ path }) => path),
        expectedReviews,
      ),
    "Arcade G02 review output order changed",
  );
  for (const [index, [name, size]] of boardSpecs.entries()) {
    const path = `${reviewRoot}/${name}`;
    const evidence = manifest.reviewEvidence[index];
    add(
      evidence.kind === "png"
        && same(evidence.size, size)
        && fileHashMatches(path, evidence.sha256, size),
      `Arcade G02 review board is missing or stale: ${path}`,
    );
  }
  for (const [index, name] of gifNames.entries()) {
    const evidence = manifest.reviewEvidence[boardSpecs.length + index];
    const path = `${reviewRoot}/${name}`;
    add(
      evidence.kind === "gif"
        && evidence.frameCount === 4
        && evidence.durationMs === 200
        && gifHashMatches(path, evidence.sha256, [384, 512]),
      `Arcade G02 review GIF is missing or stale: ${path}`,
    );
  }

  const expectedProcessed = [
    ...sourceRoles.map(
      (role) => `${processedRoot}/authoring/source/${role}.keyed.png`,
    ),
    ...orientations.flatMap((orientation) => [
      `${processedRoot}/authoring/orientations/${orientation}.png`,
      `${processedRoot}/runtime/orientations/${orientation}.png`,
    ]),
    ...games.flatMap((game) => [
      ...["background", "player", "obstacle", "effect"].map(
        (part) => `${processedRoot}/authoring/game-kits/${game}.${part}.png`,
      ),
      ...frames.map(
        (frame) => `${processedRoot}/runtime/screen-loops/${game}.${frame}.png`,
      ),
      ...frames.map(
        (frame) => `${processedRoot}/runtime/composites/${game}.${frame}.png`,
      ),
    ]),
  ].sort();
  add(
    same(files(processedRoot), expectedProcessed),
    "Arcade G02 processed directory contains an unexpected file",
  );
  const expectedReviewFiles = [
    promptPath,
    ...sourceFiles,
    ...expectedReviews,
  ].sort();
  add(
    same(files(reviewRoot), expectedReviewFiles),
    "Arcade G02 review directory contains an unexpected file",
  );

  for (const evidence of manifest.activeOfficeEvidence ?? []) {
    const content = readText(evidence.file);
    add(
      evidence.sha256 === activeOfficeBaseline.get(evidence.file)
        && evidence.importsCandidate === false
        && !content.includes("arcade-machine-g02")
        && !content.includes(
          "office-facility-family-v1/arcade-machine-g02",
        ),
      `Active Office imported Arcade G02: ${evidence.file}`,
    );
  }
  add(
    same(
      manifest.activeOfficeEvidence?.map(({ file }) => file),
      [...activeOfficeBaseline.keys()],
    ),
    "Arcade G02 Active Office baseline list changed",
  );

  const builder = readText(builderPath);
  add(
    !builder.includes("arcade-machine-g01")
      && !builder.includes("facility-lounge-sheet")
      && !builder.includes("mechanical-loops-sheet")
      && !builder.includes("office-held-props-h01")
      && builder.includes("full production is locked"),
    "Arcade G02 builder source isolation or full-build lock changed",
  );
  const docs = readText(docsPath);
  add(
    docs.includes("Status: visual preflight pending owner review")
      && docs.includes("Physical scale | `2 x 2 x 4`")
      && docs.includes("F4-F10 remain blocked")
      && docs.includes("No held controller"),
    "Arcade G02 documentation does not preserve the visual-preflight stop",
  );
  const packageJson = readJson("package.json");
  add(
    packageJson.scripts?.["art:facility:arcade:g02"]
      === "python scripts/build-office-facility-arcade-machine-g02.py"
      && packageJson.scripts?.["art:facility:arcade:g02:rebuild:check"]
      === "python scripts/build-office-facility-arcade-machine-g02.py --check"
      && packageJson.scripts?.["art:facility:arcade:g02:check"]
      === "node scripts/office-facility-arcade-machine-g02-check.mjs",
    "Arcade G02 package scripts are missing",
  );
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
}

if (failures.length) {
  process.stderr.write(`${failures.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    "Arcade G02 visual preflight OK: fresh 2x2x4 four-side cabinet, three "
      + "A-D seam loops, shell/pivot lock, 10 boards, three GIFs, no held "
      + "controller, and F4-F10 blocked.\n",
  );
}
