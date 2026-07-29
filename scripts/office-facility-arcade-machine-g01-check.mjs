import {
  validateOfficeFacilityVisualPreflightManifest,
} from "../packages/contracts/src/officeFacilityVisualPreflight.ts";
import {
  fileHashMatches,
  readJson,
  readText,
  recursiveFiles as files,
  same,
  sha256,
} from "./office-production-check-utils.mjs";

const manifestPath =
  "assets/game/manifests/office-facility-arcade-machine-g01.json";
const auditPath =
  "assets/game/manifests/office-furniture-master-audit-v1.json";
const builderPath =
  "scripts/build-office-facility-arcade-machine-g01.py";
const docsPath =
  "docs/art/OFFICE_FACILITY_ARCADE_MACHINE_G01.md";
const frontSource =
  "assets/art/layout-references/facility-lounge-sheet-modern-bright-v1-source.png";
const loopSource =
  "assets/art/layout-references/mechanical-loops-sheet-modern-bright-v1-source.png";
const processedRoot =
  "assets/game/processed/office-facility-family-v1/arcade-machine-g01";
const reviewRoot =
  "assets/art/layout-references/office-facility-family-v1/arcade-machine-g01";
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

try {
  const manifest = readJson(manifestPath);
  const audit = readJson(auditPath);
  const auditById = new Map(
    audit.records.map((record) => [record.recordId, record]),
  );
  for (const issue of validateOfficeFacilityVisualPreflightManifest(manifest)) {
    failures.push(`Arcade visual-preflight contract: ${issue}`);
  }

  add(
    manifest.schemaVersion === 1
      && manifest.id === "office.facility.arcade-machine.g01"
      && manifest.familyId === "machine.game.arcade.modern"
      && manifest.revision === "g01-preflight-r01"
      && manifest.status === "visual-preflight-owner-review"
      && manifest.productionStage === "visual-preflight"
      && manifest.visualApproval === null,
    "Arcade G01 preflight identity or visual stop state changed",
  );
  add(
    manifest.plannedInteractionMode === "machine-local-controls"
      && manifest.plannedHeldProp === false
      && manifest.interactionPreview?.heldController === false
      && manifest.interactionPreview?.reservationSimulationBuilt === false
      && manifest.interactionPreview?.rosterCasesBuilt === 0
      && manifest.permissions?.fullSystemBuild === false,
    "Arcade G01 must not fabricate a held controller or full system",
  );
  add(
    [
      "processedCropDirectReuse",
      "activeOfficePixelReuse",
      "legacyOrRejectedPixelReuse",
      "sideOrientationReuse",
      "generativeRepair",
      "missingAssetFallback",
    ].every((field) => manifest.sourcePolicy?.[field] === false)
      && same(manifest.sourcePolicy?.allowlist, [frontSource, loopSource]),
    "Arcade G01 source policy or original-master allowlist changed",
  );

  const expectedSources = [
    {
      role: "static-front",
      path: frontSource,
      keyed: `${processedRoot}/authoring/source/facility-lounge-master.keyed.png`,
      mask:
        `${processedRoot}/authoring/source/arcade-front.full-master-ownership-mask.png`,
      frames: {
        front: {
          record:
            "modern-bright-library-v1:env-05-facility-lounge:"
            + "machine.game.arcade.modern",
          source: [314, 627, 627, 940],
          seed: [430, 800],
          bounds: [356, 638, 523, 926],
          pixels: 42762,
          owner: "locker.bank.personal-15",
          cutout: `${processedRoot}/authoring/source/arcade-front.source.png`,
        },
      },
    },
    {
      role: "screen-frame-source",
      path: loopSource,
      keyed: `${processedRoot}/authoring/source/mechanical-loops-master.keyed.png`,
      mask:
        `${processedRoot}/authoring/source/arcade-loops.full-master-ownership-mask.png`,
      frames: {
        a: {
          record:
            "modern-bright-library-v1:env-07-animated-mechanical:"
            + "machine.arcade.loop.a",
          source: [0, 314, 314, 627],
          seed: [170, 500],
          bounds: [68, 362, 278, 627],
          pixels: 51259,
        },
        b: {
          record:
            "modern-bright-library-v1:env-07-animated-mechanical:"
            + "machine.arcade.loop.b",
          source: [314, 314, 627, 627],
          seed: [470, 500],
          bounds: [368, 362, 579, 627],
          pixels: 51096,
        },
        c: {
          record:
            "modern-bright-library-v1:env-07-animated-mechanical:"
            + "machine.arcade.loop.c",
          source: [627, 314, 940, 627],
          seed: [780, 500],
          bounds: [670, 362, 882, 627],
          pixels: 51590,
        },
        d: {
          record:
            "modern-bright-library-v1:env-07-animated-mechanical:"
            + "machine.arcade.loop.d",
          source: [940, 314, 1254, 627],
          seed: [1080, 500],
          bounds: [972, 362, 1184, 627],
          pixels: 51355,
        },
      },
    },
  ];
  add(
    manifest.sources?.length === 2
      && manifest.sources?.every(
        (source, index) =>
          source.role === expectedSources[index].role
          && source.path === expectedSources[index].path
          && source.sha256 === sha256(source.path)
          && source.auditManifest === auditPath
          && source.auditManifestSha256 === sha256(auditPath)
          && source.extractionMethod === "full-master-component-ownership"
          && fileHashMatches(
            source.keyedSource?.file,
            source.keyedSource?.sha256,
            [1254, 1254],
          )
          && source.keyedSource?.file === expectedSources[index].keyed
          && fileHashMatches(
            source.ownershipMask?.file,
            source.ownershipMask?.sha256,
            [1254, 1254],
          )
          && source.ownershipMask?.file === expectedSources[index].mask,
      ),
    "Arcade G01 source authority, keyed master, or ownership mask changed",
  );
  for (const [sourceIndex, source] of (manifest.sources ?? []).entries()) {
    const expectedSource = expectedSources[sourceIndex];
    const expectedFrames = expectedSource?.frames ?? {};
    add(
      same(
        source.records?.map(({ frameId }) => frameId),
        Object.keys(expectedFrames),
      ),
      `${source.role} frame identifiers changed`,
    );
    for (const record of source.records ?? []) {
      const expected = expectedFrames[record.frameId];
      const auditRecord = auditById.get(record.auditRecordId);
      const expectedCutout = expected?.cutout
        ?? `${processedRoot}/authoring/source/arcade-screen-source-${record.frameId}.png`;
      add(
        Boolean(expected)
          && record.auditRecordId === expected.record
          && same(record.sourceBounds, expected.source)
          && same(record.selectedComponent?.seed, expected.seed)
          && same(
            record.selectedComponent?.fullMasterBounds,
            expected.bounds,
          )
          && record.selectedComponent?.pixelCount === expected.pixels
          && record.selectedComponent?.touchesMasterBoundary === false
          && record.selectedComponent?.sourcePixelsResampled === false
          && record.selectedComponent?.authoringCutout === expectedCutout
          && fileHashMatches(
            record.selectedComponent?.authoringCutout,
            record.selectedComponent?.authoringCutoutSha256,
            [384, 384],
          )
          && record.discardedComponents?.length > 0
          && record.discardedComponents?.every(
            (component) =>
              component.ownerFamilyId
                === (expected.owner ?? "vending.machine.modern")
              && component.pixelCount > 0
              && component.reason.length > 0,
          )
          && auditRecord?.currentDecision?.decision
            === "salvage-full-master-and-decompose"
          && auditRecord?.currentDecision?.masterPixelsSalvageable === true
          && auditRecord?.orientation === "front",
        `Ownership evidence changed for Arcade frame ${record.frameId}`,
      );
    }
  }

  const sideIds = [
    "modern-bright-library-v1:env-12-facility-side-orientations:"
      + "machine.game.arcade.modern.side-left",
    "modern-bright-library-v1:env-12-facility-side-orientations:"
      + "machine.game.arcade.modern.side-right",
  ];
  add(
    sideIds.every((recordId) => {
      const decision = auditById.get(recordId)?.currentDecision;
      return decision?.decision === "reject-regenerate-orientation-if-required"
        && decision?.masterPixelsSalvageable === false;
    }),
    "Rejected Arcade side orientations are no longer blocked",
  );

  add(
    same(manifest.render?.physicalScale, {
      width: 2, depth: 2, height: 3, unit: "tile",
    })
      && same(manifest.render?.footprint, {
        width: 2, depth: 2, unit: "tile",
      })
      && same(manifest.render?.renderBox, {
        width: 3, height: 3, unit: "tile",
      })
      && same(manifest.render?.authoringCanvas, [384, 384])
      && same(manifest.render?.runtimeCanvas, [96, 96])
      && manifest.render?.uniformIntegerDivisor === 4
      && manifest.render?.nonUniformScaling === false
      && same(manifest.render?.requiredOrientations, ["front"])
      && same(manifest.render?.basePivot, { x: 1, y: 2, unit: "tile" })
      && same(manifest.render?.sortPivot, { x: 1, y: 2, unit: "tile" }),
    "Arcade G01 2x2x3 geometry or 3x3 render envelope changed",
  );
  add(
    same(manifest.interactionPreview?.stand, { x: 1, y: 2 })
      && same(manifest.interactionPreview?.approach, { x: 1, y: 3 })
      && same(manifest.interactionPreview?.exit, { x: 0, y: 3 })
      && manifest.interactionPreview?.capacity === 1
      && manifest.interactionPreview?.frontApproachCells === 1
      && manifest.interactionPreview?.visualPose === "interact-front",
    "Arcade G01 standing or front-approach preview changed",
  );
  add(
    manifest.preflightAssets?.runtimeFront?.file
      === `${processedRoot}/runtime/preflight/arcade-front.png`
      && fileHashMatches(
        manifest.preflightAssets?.runtimeFront?.file,
        manifest.preflightAssets?.runtimeFront?.sha256,
        [96, 96],
      )
      && same(manifest.preflightAssets?.runtimeFront?.size, [96, 96])
      && same(manifest.preflightAssets?.runtimeAlphaBounds, [27, 16, 69, 88]),
    "Arcade G01 1x clean-front preview changed",
  );

  for (const gate of ["F0", "F1", "F2", "F3"]) {
    add(manifest.gates?.[gate]?.status === "passed", `${gate} must pass`);
  }
  for (const gate of ["F4", "F5", "F6", "F7", "F8", "F9", "F10"]) {
    add(manifest.gates?.[gate]?.status === "blocked", `${gate} must stay blocked`);
  }
  const expectedReviews = [
    ["01-source-ownership.png", [1800, 1100]],
    ["02-clean-front-alpha.png", [1600, 1000]],
    ["03-scale-actor-1x1x3.png", [1500, 950]],
    ["04-footprint-render-box.png", [1400, 950]],
    ["05-floor-approach-preview.png", [1600, 950]],
  ].map(([name, size]) => [`${reviewRoot}/${name}`, size]);
  add(
    same(manifest.reviewOutputs, expectedReviews.map(([path]) => path)),
    "Arcade G01 must expose exactly the five preflight boards",
  );
  for (const [index, [path, size]] of expectedReviews.entries()) {
    const evidence = manifest.reviewEvidence?.[index];
    add(
      evidence?.path === path
        && same(evidence?.size, size)
        && fileHashMatches(path, evidence?.sha256, size),
      `Arcade G01 review evidence is missing or stale: ${path}`,
    );
  }

  const expectedProcessed = [
    ...manifest.sources.flatMap((source) => [
      source.keyedSource.file,
      source.ownershipMask.file,
      ...source.records.map(
        ({ selectedComponent }) => selectedComponent.authoringCutout,
      ),
    ]),
    manifest.preflightAssets.runtimeFront.file,
  ].sort();
  add(
    same(files(processedRoot), expectedProcessed),
    "Arcade G01 processed directory contains an unexpected file",
  );
  add(
    same(files(reviewRoot), expectedReviews.map(([path]) => path).sort()),
    "Arcade G01 review directory contains an unexpected file",
  );

  for (const evidence of manifest.activeOfficeEvidence ?? []) {
    const content = readText(evidence.file);
    add(
      evidence.sha256 === activeOfficeBaseline.get(evidence.file)
        && evidence.importsCandidate === false
        && !content.includes("arcade-machine-g01")
        && !content.includes(
          "office-facility-family-v1/arcade-machine-g01",
        ),
      `Active Office imported Arcade G01: ${evidence.file}`,
    );
  }
  add(
    same(
      manifest.activeOfficeEvidence?.map(({ file }) => file),
      [...activeOfficeBaseline.keys()],
    ),
    "Arcade G01 Active Office baseline files changed",
  );
  const builder = readText(builderPath);
  add(
    !builder.includes("processed/office-library-modern-bright-v1")
      && !builder.includes("facility-side-orientations-sheet")
      && !builder.includes("office-held-props-h01")
      && !builder.includes('"outputHandoff"')
      && builder.includes("full production is locked"),
    "Arcade G01 builder source isolation or full-build lock changed",
  );
  const docs = readText(docsPath);
  add(
    docs.includes("Status: visual preflight pending owner review")
      && docs.includes("F4-F10 remain blocked")
      && docs.includes("No held controller"),
    "Arcade G01 documentation does not preserve the preflight stop",
  );
  const packageJson = readJson("package.json");
  add(
    packageJson.scripts?.["art:facility:arcade:g01"]
      === "python scripts/build-office-facility-arcade-machine-g01.py"
      && packageJson.scripts?.["art:facility:arcade:g01:rebuild:check"]
      === "python scripts/build-office-facility-arcade-machine-g01.py --check"
      && packageJson.scripts?.["art:facility:arcade:g01:check"]
      === "node scripts/office-facility-arcade-machine-g01-check.mjs",
    "Arcade G01 package scripts are missing",
  );
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
}

if (failures.length) {
  process.stderr.write(`${failures.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    "Arcade G01 visual preflight OK: original-master ownership, clean 2x2x3 "
      + "front, five review boards, no held controller, and F4-F10 blocked.\n",
  );
}
