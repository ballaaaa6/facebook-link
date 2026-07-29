import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  readJson,
  root,
  same,
  sha256,
} from "./office-production-check-utils.mjs";

export const interactionGifName = "anna-approach-play-release.gif";
export const interactionGifSize = [768, 512];

const spatialAuthorityPath =
  "assets/game/manifests/office-spatial-authority-i01.json";
const actionSocketPath =
  "assets/game/manifests/office-character-action-sockets-i01.json";
const frameCount = 12;
const frameDurationMs = 240;

function gifSize(path) {
  const bytes = readFileSync(join(root, path));
  const header = bytes.subarray(0, 6).toString("ascii");
  if (header !== "GIF87a" && header !== "GIF89a") {
    throw new Error(`Not a GIF: ${path}`);
  }
  return [bytes.readUInt16LE(6), bytes.readUInt16LE(8)];
}

function gifHashMatches(path, expected) {
  return typeof path === "string"
    && existsSync(join(root, path))
    && sha256(path) === expected
    && same(gifSize(path), interactionGifSize);
}

export function checkArcadeG02Interaction(manifest, reviewRoot) {
  const failures = [];
  const spatialAuthority = readJson(spatialAuthorityPath);
  const actionAuthority = readJson(actionSocketPath);
  const anna = actionAuthority.characters?.find(({ id }) => id === "anna");
  const demo = manifest.interactionPreview?.singleActorDemo;
  const expectedPath = `${reviewRoot}/${interactionGifName}`;
  const evidence = manifest.reviewEvidence?.find(({ path }) => path === expectedPath);
  const valid = demo?.developmentOnly === true
    && demo?.countsTowardRosterValidation === false
    && demo?.countsTowardReservationValidation === false
    && demo?.characterAssetsPendingCommercialReview === true
    && demo?.actorId === "anna"
    && demo?.pose === "interact-front"
    && demo?.heldController === false
    && demo?.sourceAuthority?.spatialFile === spatialAuthorityPath
    && demo?.sourceAuthority?.spatialSha256 === sha256(spatialAuthorityPath)
    && spatialAuthority.status === "owner-approved"
    && demo?.sourceAuthority?.actionFile === actionSocketPath
    && demo?.sourceAuthority?.actionSha256 === sha256(actionSocketPath)
    && actionAuthority.status === "owner-approved"
    && actionAuthority.pendingCommercialReview === true
    && anna?.pose === "interact-front"
    && anna?.row === 10
    && anna?.frames?.length === 6
    && demo?.sourceAuthority?.sheetFile === anna?.sheet
    && demo?.sourceAuthority?.sheetSha256 === anna?.sheetSha256
    && sha256(anna?.sheet) === anna?.sheetSha256
    && same(demo?.sourceAuthority?.frameSize, [96, 104])
    && demo?.sourceAuthority?.row === 10
    && same(demo?.sourceAuthority?.movementRows, {
      "walk-right": 1,
      "walk-left": 2,
    })
    && same(demo?.sourceAuthority?.movementRootSocket, [47, 101])
    && demo?.sourceAuthority?.movementRootSource
      === "interact-front.f0-bottom-contact"
    && demo?.placement?.formula === "sceneRoot - frameRootSocket"
    && same(demo?.placement?.sceneRootRuntime, [166, 151])
    && demo?.placement?.integerCoordinatesOnly === true
    && demo?.placement?.magicOffset === false
    && demo?.placement?.fallbackSocket === false
    && demo?.placement?.productionSocketClaim === false
    && demo?.timeline?.length === frameCount
    && same(
      demo?.timeline?.map(({ phase }) => phase),
      [
        "approach", "approach", "approach", "ready",
        "reach", "play", "play", "play", "play",
        "release", "depart", "depart",
      ],
    )
    && same(
      demo?.timeline?.map(({ animation }) => animation),
      [
        "walk-left", "walk-left", "walk-left", "interact-front",
        "interact-front", "interact-front", "interact-front", "interact-front",
        "interact-front", "interact-front", "walk-right", "walk-right",
      ],
    )
    && demo?.gif?.file === expectedPath
    && demo?.gif?.frameCount === frameCount
    && demo?.gif?.durationMs === frameDurationMs
    && gifHashMatches(demo?.gif?.file, demo?.gif?.sha256)
    && evidence?.kind === "gif"
    && evidence?.frameCount === frameCount
    && evidence?.durationMs === frameDurationMs
    && evidence?.sha256 === demo?.gif?.sha256;
  if (!valid) {
    failures.push(
      "Arcade G02 single-actor I01 demo changed or claims production coverage",
    );
  }
  return failures;
}
