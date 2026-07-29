import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  validateOfficeFacilityServerRackGeneratedProductionManifest,
} from "../packages/contracts/src/officeFacilityServerRackGeneratedProduction.ts";
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
  "assets/game/manifests/office-facility-server-rack-n02-production.json";
const preflightPath =
  "assets/game/manifests/office-facility-server-rack-n02.json";
const processedRoot =
  "assets/game/processed/office-facility-family-v1/server-rack-n02-production";
const reviewRoot =
  "assets/art/layout-references/office-facility-family-v1/server-rack-n02-production";
const builderPath =
  "scripts/build-office-facility-server-rack-n02-production.py";
const docsPath =
  "docs/art/OFFICE_FACILITY_SERVER_RACK_N02_PRODUCTION.md";
const orientations = ["front", "left", "right", "back"];
const frames = ["a", "b", "c", "d"];
const reviewNames = [
  "01-clean-four-orientations.png",
  "02-parts-shell-status.png",
  "03-status-seam-loop.png",
  "04-geometry-footprint-pivots.png",
  "05-inspect-sockets-four-orientations.png",
  "06-routes-four-orientations.png",
  "07-roster-108-cases.png",
  "08-orientation-matrix-432-cases.png",
  "09-empty-hand-interaction-closeups.png",
  "10-two-instance-reservation-30s.png",
  "server-rack-n02-production-inspect.gif",
  "server-rack-n02-production-two-user.gif",
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

function gifSize(path) {
  const bytes = readFileSync(join(root, path));
  const signature = bytes.subarray(0, 6).toString("ascii");
  if (!["GIF87a", "GIF89a"].includes(signature)) {
    throw new Error(`Not a GIF: ${path}`);
  }
  return [bytes.readUInt16LE(6), bytes.readUInt16LE(8)];
}

function allProcessedAssets(manifest) {
  return [
    ...manifest.parts.shells.flatMap(({ authoring, runtime }) => [
      authoring,
      runtime,
    ]),
    ...manifest.parts.statusFrames.flatMap(({ authoring, runtime }) => [
      authoring,
      runtime,
    ]),
    ...manifest.parts.frontComposites.map(({ runtime }) => runtime),
  ];
}

try {
  const manifest = readJson(manifestPath);
  const preflight = readJson(preflightPath);
  for (
    const issue of
      validateOfficeFacilityServerRackGeneratedProductionManifest(manifest)
  ) {
    failures.push(`Server Rack N02 production contract: ${issue}`);
  }

  add(
    manifest.id === "office.facility.server-rack.n02.production"
      && manifest.revision === "n02-production-r01"
      && manifest.status === "production-owner-review"
      && manifest.productionStage === "f4-f7-complete"
      && manifest.developmentOnly === true
      && manifest.activeOfficePromotion === false,
    "Server Rack N02 production identity or F8 stop changed",
  );
  add(
    manifest.preflightAuthority.manifest === preflightPath
      && manifest.preflightAuthority.manifestSha256 === sha256(preflightPath)
      && preflight.status === "visual-preflight-owner-approved"
      && preflight.productionStage === "visual-preflight-approved"
      && preflight.visualApproval.status === "owner-approved"
      && preflight.visualApproval.approvedRevision === "n02-preflight-r01"
      && preflight.visualApproval.approvedReviewHashes.length === 11
      && preflight.visualApproval.approvedReviewHashes.every(
        ({ path, sha256: expected }) =>
          preflight.reviewEvidence.some(
            (record) =>
              record.path === path
              && record.sha256 === expected
              && sha256(path) === expected,
          ),
      )
      && preflight.permissions.fullSystemBuild === true,
    "Production no longer locks the exact approved N02 preflight",
  );
  add(
    manifest.sourcePolicy.approvedPreflightPixelsOnly === true
      && [
        "newImageGeneration",
        "serverRackN01PixelReuse",
        "activeOfficePixelReuse",
        "processedForeignFamilyReuse",
        "generativeRepair",
        "missingAssetFallback",
      ].every((field) => manifest.sourcePolicy[field] === false),
    "Production source isolation or missing-asset failure policy changed",
  );

  const records = allProcessedAssets(manifest);
  add(records.length === 20, "Production must own exactly 20 processed PNGs");
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

  const expectedReviews = reviewNames.map((name) => `${reviewRoot}/${name}`);
  add(
    same(manifest.reviewOutputs, expectedReviews)
      && same(
        recursiveFiles(reviewRoot),
        manifest.reviewEvidence.map(({ path }) => path).sort(),
      ),
    "F8 review set or order changed",
  );
  for (const record of manifest.reviewEvidence) {
    if (record.kind === "png") {
      add(
        fileHashMatches(record.path, record.sha256, record.size),
        `Review board hash or size changed: ${record.path}`,
      );
    } else {
      add(
        existsSync(join(root, record.path))
          && sha256(record.path) === record.sha256
          && same(gifSize(record.path), record.size)
          && record.frameCount > 0
          && record.durationMs > 0,
        `Review GIF hash, size, or timing changed: ${record.path}`,
      );
    }
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
    "Server Rack N02 2x2x4 geometry, orientations, or pivots changed",
  );
  add(
    manifest.parts.shells.length === 4
      && manifest.parts.statusFrames.length === 4
      && manifest.parts.frontComposites.length === 4
      && same(
        manifest.parts.shells.map(({ orientation }) => orientation),
        orientations,
      )
      && same(
        manifest.parts.statusFrames.map(({ frameId }) => frameId),
        frames,
      )
      && manifest.animation.compositionFormula
        === "immutableShell[front] + statusViewport[n]"
      && same(manifest.animation.transition, [...frames, "a"])
      && manifest.animation.transitionChangedPixels.every(
        (pixels) => pixels > 0,
      )
      && [
        "shellChangedPixels",
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
      && manifest.spatial.perCharacterOffsets === false
      && manifest.spatial.magicOffsets === false
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
    same(
      manifest.interaction.instanceIds,
      ["server-rack-01", "server-rack-02"],
    )
      && manifest.interaction.familyInstanceCount === 2
      && manifest.interaction.capacityPerInstance === 1
      && manifest.interaction.independentReservations === true
      && manifest.interaction.semanticAction === "inspect-front"
      && manifest.interaction.visualPose === "interact-front"
      && manifest.interaction.heldProp === false
      && manifest.interaction.h01Dependency === false
      && manifest.interaction.handoff === false
      && manifest.interaction.reservationSlotContributionBeforeF8 === 0
      && manifest.interaction.plannedReservationSlotContributionAfterF8 === 2
      && manifest.interaction.facilityV1ReadySlotsBeforeServer === 15
      && manifest.interaction.facilityV1ReadySlotsAfterServerF8Target === 17,
    "Empty-hand interaction, two instances, or pre-F8 slot stop changed",
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
        "heldPropCases",
        "handoffCases",
      ].every((field) => manifest.rosterValidation[field] === 0)
      && manifest.rosterValidation.perCharacterOffsets === false,
    "I01 roster counts or zero-failure results changed",
  );
  add(
    manifest.reservationValidation.durationSeconds === 30
      && manifest.reservationValidation.capacityPerInstance === 1
      && manifest.reservationValidation.maximumConcurrentReservations === 2
      && manifest.reservationValidation.maximumPerInstanceReservations === 1
      && manifest.reservationValidation.collisionCount === 0
      && manifest.reservationValidation.blockedAttemptCount === 1
      && manifest.reservationValidation.failureCount === 1
      && manifest.reservationValidation.releaseCount === 3
      && manifest.reservationValidation.retrySuccessCount === 1
      && manifest.reservationValidation.independentInstanceSuccessCount === 1
      && manifest.reservationValidation.releasedAtEnd === true
      && manifest.reservationValidation.samples.length === 31
      && Object.values(
        manifest.reservationValidation.samples.at(-1).heldBy,
      ).every((holder) => holder === null),
    "Two-instance reservation, failure, release, or retry proof changed",
  );

  add(
    ["F0", "F1", "F2", "F3", "F4", "F5", "F6", "F7"].every(
      (gate) => manifest.gates[gate].status === "passed",
    )
      && manifest.gates.F8.status === "pending-owner-review"
      && manifest.gates.F9.status === "blocked"
      && manifest.gates.F10.status === "blocked"
      && manifest.permissions.familyLab === true
      && manifest.permissions.ownerReview === true
      && manifest.permissions.reservationSlotActivation === false
      && manifest.permissions.furnitureOnlyRoom === false
      && manifest.permissions.activeOfficePromotion === false
      && manifest.ownerDecision === null,
    "Production must stop at independent F8 owner review",
  );
  add(
    same(
      manifest.activeOfficeEvidence,
      activeOfficeFiles.map((file) => ({ file, imported: false })),
    )
      && activeOfficeFiles.every((file) => {
        const content = readText(file);
        return !content.includes(manifest.id)
          && !content.includes("server-rack-n02-production");
      }),
    "Server Rack N02 production leaked into Active Office",
  );

  const docs = readText(docsPath);
  const packageJson = readJson("package.json");
  add(
    existsSync(join(root, builderPath))
      && docs.includes("Status: F4-F7 passed; awaiting owner review at F8")
      && docs.includes("108")
      && docs.includes("432")
      && docs.includes("15/20")
      && docs.includes("17/20")
      && docs.includes("F9 remains blocked")
      && packageJson.scripts["art:facility:server:n02:production"]
        === `python ${builderPath}`
      && packageJson.scripts[
        "art:facility:server:n02:production:rebuild:check"
      ] === `python ${builderPath} --check`
      && packageJson.scripts["art:facility:server:n02:production:check"]
        === "node scripts/office-facility-server-rack-n02-production-check.mjs"
      && packageJson.scripts.check.includes(
        "npm run art:facility:server:n02:production:check",
      ),
    "Server Rack N02 production docs, builder, or package commands incomplete",
  );
} catch (error) {
  failures.push(error instanceof Error ? error.stack ?? error.message : String(error));
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log(
  "Server Rack N02 production check passed: 20 modular assets, 108 poses, "
    + "432 orientation cases, two capacity-one instances, 30-second proof, "
    + "F4-F7 passed, F8 owner review pending, slot count remains 15/20.",
);
