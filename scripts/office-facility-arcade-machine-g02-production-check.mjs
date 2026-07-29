import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  validateOfficeFacilityArcadeProductionManifest,
} from "../packages/contracts/src/officeFacilityArcadeProduction.ts";
import {
  fileHashMatches,
  readJson,
  readText,
  recursiveFiles,
  root,
  same,
  sha256,
} from "./office-production-check-utils.mjs";

const manifestPath =
  "assets/game/manifests/office-facility-arcade-machine-g02-production.json";
const preflightPath =
  "assets/game/manifests/office-facility-arcade-machine-g02.json";
const processedRoot =
  "assets/game/processed/office-facility-family-v1/arcade-machine-g02-production";
const reviewRoot =
  "assets/art/layout-references/office-facility-family-v1/arcade-machine-g02-production";
const builderPath =
  "scripts/build-office-facility-arcade-machine-g02-production.py";
const docsPath =
  "docs/art/OFFICE_FACILITY_ARCADE_MACHINE_G02_PRODUCTION.md";
const orientations = ["front", "right", "back", "left"];
const games = ["cosmic-drift", "neon-rally", "dungeon-pulse"];
const frames = ["a", "b", "c", "d"];
const passedGates = ["F0", "F1", "F2", "F3", "F4", "F5", "F6", "F7"];
const reviewNames = [
  "01-clean-four-orientations.png",
  "02-parts-shell-viewport-controls.png",
  "03-screen-loops-three-games.png",
  "04-geometry-footprint-pivots.png",
  "05-control-sockets-four-orientations.png",
  "06-routes-four-orientations.png",
  "07-roster-108-cases.png",
  "08-orientation-matrix-432-cases.png",
  "09-interaction-closeups.png",
  "10-reservation-timeline-30s.png",
];
const activeOfficeFiles = [
  "apps/web/src/features/office/components/officeAssetRegistry.ts",
  "assets/game/maps/office-c-v2.json",
  "apps/web/src/features/office/components/officeSceneRuntime.ts",
];
const failures = [];
const add = (condition, message) => {
  if (!condition) failures.push(message);
};

function assetRecords(manifest) {
  return [
    ...manifest.parts.shell.flatMap(({ authoring, runtime }) => [
      authoring,
      runtime,
    ]),
    ...manifest.parts.controls.flatMap(({ authoring, runtime }) => [
      authoring,
      runtime,
    ]),
    ...manifest.parts.viewports.flatMap(({ authoring, runtime }) => [
      authoring,
      runtime,
    ]),
    ...manifest.animation.games.flatMap(({ frames: gameFrames }) => gameFrames),
  ];
}

try {
  const manifest = readJson(manifestPath);
  const preflight = readJson(preflightPath);
  for (const issue of validateOfficeFacilityArcadeProductionManifest(manifest)) {
    failures.push(`Arcade G02 production contract: ${issue}`);
  }

  add(
    manifest.id === "office.facility.arcade-machine.g02.production"
      && manifest.revision === "g02-production-r01"
      && manifest.status === "owner-review-f8-pending"
      && manifest.developmentOnly === true
      && manifest.activeOfficePromotion === false,
    "Arcade G02 production identity or F8 stop changed",
  );
  add(
    manifest.preflightAuthority.manifest === preflightPath
      && manifest.preflightAuthority.manifestSha256 === sha256(preflightPath)
      && preflight.status === "visual-preflight-owner-approved"
      && preflight.visualApproval.status === "owner-approved"
      && preflight.visualApproval.approvedRevision === "g02-preflight-r02"
      && preflight.visualApproval.approvedReviewHashes.length === 14
      && preflight.visualApproval.approvedReviewHashes.every(
        ({ path, sha256: expected }) =>
          preflight.reviewEvidence.some(
            (record) => record.path === path && record.sha256 === expected,
          ),
      ),
    "Production no longer locks the exact approved G02 r02 preflight",
  );
  add(
    manifest.sourcePolicy.approvedPreflightPixelsOnly === true
      && [
        "newImageGeneration",
        "previousArcadePixelReuse",
        "activeOfficePixelReuse",
        "processedForeignFamilyReuse",
        "generativeRepair",
        "missingAssetFallback",
      ].every((field) => manifest.sourcePolicy[field] === false),
    "Production source isolation or missing-asset failure policy changed",
  );

  const records = assetRecords(manifest);
  add(records.length === 52, "Production must own exactly 52 processed PNGs");
  for (const record of records) {
    add(
      fileHashMatches(record.file, record.sha256, record.size),
      `Processed asset hash or size changed: ${record.file}`,
    );
  }
  add(
    same(
      recursiveFiles(processedRoot),
      records.map(({ file }) => file).sort(),
    ),
    "Processed output directory contains missing or undeclared files",
  );
  add(
    same(
      manifest.reviewOutputs,
      reviewNames.map((name) => `${reviewRoot}/${name}`),
    )
      && same(
        recursiveFiles(reviewRoot),
        manifest.reviewEvidence.map(({ path }) => path).sort(),
      ),
    "F8 review board set or order changed",
  );
  for (const record of manifest.reviewEvidence) {
    add(
      fileHashMatches(record.path, record.sha256, record.size),
      `Review board hash or size changed: ${record.path}`,
    );
  }

  add(
    same(manifest.render.physicalScale, {
      width: 2, depth: 2, height: 4, unit: "tile",
    })
      && same(manifest.render.footprint, {
        width: 2, depth: 2, unit: "tile",
      })
      && same(manifest.render.renderBox, {
        width: 3, height: 4, unit: "tile",
      })
      && same(manifest.render.orientations, orientations)
      && same(manifest.render.basePivotRuntime, [48, 124])
      && same(manifest.render.sortPivotRuntime, [48, 124]),
    "Arcade G02 2x2x4 geometry, four orientations, or pivots changed",
  );
  add(
    manifest.parts.shell.length === 4
      && manifest.parts.controls.length === 4
      && manifest.parts.viewports.length === 12
      && same(
        manifest.animation.games.map(({ gameId }) => gameId),
        games,
      )
      && same(manifest.animation.frameIds, frames)
      && same(manifest.animation.transition, [...frames, "a"])
      && manifest.animation.compositionFormula
        === "shell + viewport[n] + machineLocalControls"
      && [
        "shellChangedPixels",
        "controlsChangedPixels",
        "outsideViewportChangedPixels",
        "closureMismatchPixels",
      ].every((field) => manifest.animation[field] === 0)
      && same(manifest.animation.pivotDeltaPixels, [0, 0]),
    "Modular parts or A-D-A seam-loop invariants changed",
  );

  add(
    manifest.spatial.authority.status === "owner-approved"
      && manifest.spatial.coordinateFormula
        === "worldRoot - actorFrameRootSocket"
      && manifest.spatial.perSceneOffsets === false
      && manifest.spatial.missingSocketFallback === false
      && manifest.spatial.fractionalCoordinates === false
      && same(
        manifest.spatial.orientations.map(({ orientation }) => orientation),
        orientations,
      )
      && manifest.spatial.orientations.every(
        ({ footprintCells, routeCollisionCount }) =>
          footprintCells.length === 4 && routeCollisionCount === 0,
      ),
    "Four-orientation sockets or routes changed",
  );
  add(
    manifest.interaction.capacity === 1
      && manifest.interaction.visualPose === "interact-front"
      && manifest.interaction.machineLocalControls === true
      && manifest.interaction.heldController === false
      && manifest.interaction.heldPropManifest === null
      && manifest.interaction.reservationSlotContribution === 0
      && manifest.interaction.plannedReservationSlotContributionAfterF8 === 1,
    "Interaction or pre-F8 reservation-slot boundary changed",
  );
  add(
    manifest.rosterValidation.characterCount === 18
      && manifest.rosterValidation.activeFrames === 6
      && manifest.rosterValidation.poseCaseCount === 108
      && manifest.rosterValidation.orientationCaseCount === 432
      && manifest.rosterValidation.poseCases.length === 108
      && manifest.rosterValidation.orientationCases.length === 432
      && [
        "rootAlignmentFailures",
        "pivotDriftFailures",
        "routeFailures",
        "heldControllerCases",
      ].every((field) => manifest.rosterValidation[field] === 0)
      && manifest.rosterValidation.perCharacterOffsets === false,
    "I01 roster counts or zero-failure results changed",
  );
  add(
    manifest.reservationValidation.durationSeconds === 30
      && manifest.reservationValidation.maximumConcurrentReservations === 1
      && manifest.reservationValidation.collisionCount === 0
      && manifest.reservationValidation.blockedAttemptCount === 1
      && manifest.reservationValidation.failureCount === 1
      && manifest.reservationValidation.releaseCount === 2
      && manifest.reservationValidation.retrySuccessCount === 1
      && manifest.reservationValidation.releasedAtEnd === true
      && manifest.reservationValidation.samples.length === 31
      && manifest.reservationValidation.samples.at(-1).heldBy === null,
    "30-second two-user capacity, failure, release, or retry proof changed",
  );

  add(
    passedGates.every((gate) => manifest.gates[gate].status === "passed")
      && manifest.gates.F8.status === "pending-owner-review"
      && manifest.gates.F9.status === "blocked"
      && manifest.gates.F10.status === "blocked"
      && manifest.permissions.familyLab === true
      && manifest.permissions.ownerReview === true
      && manifest.permissions.furnitureOnlyRoom === false
      && manifest.permissions.activeOfficePromotion === false
      && manifest.ownerDecision === null,
    "Production must remain stopped for owner review at F8",
  );
  add(
    same(
      manifest.activeOfficeEvidence,
      activeOfficeFiles.map((file) => ({ file, imported: false })),
    )
      && activeOfficeFiles.every((file) => {
        const text = readText(file);
        return !text.includes(manifest.id)
          && !text.includes("arcade-machine-g02-production");
      }),
    "Arcade G02 production leaked into Active Office",
  );

  const docs = readText(docsPath);
  const packageJson = readJson("package.json");
  add(
    existsSync(join(root, builderPath))
      && docs.includes("Status: owner review pending at F8")
      && docs.includes("108")
      && docs.includes("432")
      && docs.includes("F9 remains blocked")
      && packageJson.scripts["art:facility:arcade:g02:production"]
        === `python ${builderPath}`
      && packageJson.scripts["art:facility:arcade:g02:production:rebuild:check"]
        === `python ${builderPath} --check`
      && packageJson.scripts["art:facility:arcade:g02:production:check"]
        === "node scripts/office-facility-arcade-machine-g02-production-check.mjs",
    "Arcade G02 production docs, builder, or package commands are incomplete",
  );
} catch (error) {
  failures.push(error instanceof Error ? error.stack ?? error.message : String(error));
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log(
  "Arcade G02 production check passed: 52 modular assets, 108 poses, "
    + "432 orientation cases, 30-second capacity-one simulation, F8 pending.",
);
