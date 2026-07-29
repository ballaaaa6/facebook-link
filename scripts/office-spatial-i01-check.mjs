import {
  validateOfficeCharacterActionSocketsManifest,
  validateOfficeHeldPropsManifest,
  validateOfficeSpatialAuthorityManifest,
} from "../packages/contracts/src/officeSpatialProduction.ts";
import {
  fileHashMatches,
  readJson,
  readText,
  recursiveFiles,
  same,
  sha256,
} from "./office-production-check-utils.mjs";

const actionPath =
  "assets/game/manifests/office-character-action-sockets-i01.json";
const heldPath = "assets/game/manifests/office-held-props-h01.json";
const authorityPath = "assets/game/manifests/office-spatial-authority-i01.json";
const auditPath = "assets/game/manifests/office-furniture-master-audit-v1.json";
const activePath =
  "apps/web/src/features/office/components/officeAssetRegistry.ts";
const builderPath = "scripts/build-office-spatial-i01.py";
const heldRoot = "assets/game/processed/office-held-props-h01";
const spatialRoot = "assets/game/processed/office-spatial-i01";
const reviewRoot = "assets/art/layout-references/office-spatial-i01";
const failures = [];
const add = (condition, message) => {
  if (!condition) failures.push(message);
};

try {
  const actions = readJson(actionPath);
  const held = readJson(heldPath);
  const authority = readJson(authorityPath);
  const audit = readJson(auditPath);
  for (const [label, issues] of [
    ["character sockets", validateOfficeCharacterActionSocketsManifest(actions)],
    ["held props", validateOfficeHeldPropsManifest(held)],
    ["spatial authority", validateOfficeSpatialAuthorityManifest(authority)],
  ]) {
    for (const issue of issues) failures.push(`${label}: ${issue}`);
  }

  add(
    actions.status === "owner-approved"
      && held.status === "owner-approved"
      && authority.status === "owner-approved"
      && [actions, held, authority].every((manifest) =>
        manifest.ownerDecision?.decision === "approved"
        && manifest.ownerDecision?.decidedOn === "2026-07-29"
        && manifest.gates?.F8?.status === "passed")
      && actions.activeOfficeImported === false
      && held.activeOfficeImported === false
      && authority.activeOfficeImported === false,
    "I01/H01 must retain separate F8 approvals and Active Office isolation",
  );
  add(
    fileHashMatches(
      actions.authoringInput?.file,
      actions.authoringInput?.sha256,
    )
      && fileHashMatches(
        held.authoringInput?.file,
        held.authoringInput?.sha256,
      ),
    "Spatial authoring calibration is missing or stale",
  );
  add(
    actions.coordinateRules?.localUnit === "runtime-pixel-1x"
      && actions.coordinateRules?.integerCoordinatesOnly === true
      && actions.coordinateRules?.normalizedCoordinatesAuthority === false
      && actions.coordinateRules?.missingSocketFallback === false
      && actions.characterCount === 18
      && actions.frameRecordCount === 108
      && actions.foregroundMaskCount === 54
      && same(actions.heldFrames, [2, 3, 4]),
    "Character socket coordinate rules or totals changed",
  );

  const expectedMasks = [];
  const characterIds = new Set();
  let frameCount = 0;
  let maskCount = 0;
  for (const character of actions.characters ?? []) {
    characterIds.add(character.id);
    add(
      character.sheetSha256 === sha256(character.sheet)
        && same(character.frameSize, [96, 104])
        && character.pose === "interact-front"
        && character.row === 10
        && character.frames?.length === 6,
      `${character.id} action socket source changed`,
    );
    for (const [index, frame] of character.frames.entries()) {
      frameCount += 1;
      add(
        frame.frame === index
          && [frame.rootSocket, frame.primaryGripSocket, frame.secondaryGripSocket]
            .every((point) =>
              Array.isArray(point)
              && point.length === 2
              && point.every(Number.isInteger)),
        `${character.id} frame ${index} has an invalid socket`,
      );
      if ([2, 3, 4].includes(index)) {
        maskCount += 1;
        expectedMasks.push(frame.foregroundMask?.file);
        add(
          frame.foregroundMask?.sourcePixelExact === true
            && frame.foregroundMask?.pixelCount > 0
            && fileHashMatches(
              frame.foregroundMask?.file,
              frame.foregroundMask?.sha256,
              [96, 104],
            ),
          `${character.id} frame ${index} hand mask is missing or stale`,
        );
      } else {
        add(
          frame.foregroundMask === null,
          `${character.id} frame ${index} must not have a held-frame mask`,
        );
      }
    }
  }
  add(
    characterIds.size === 18 && frameCount === 108 && maskCount === 54,
    "Character socket roster is incomplete",
  );
  add(
    same(recursiveFiles(spatialRoot), expectedMasks.sort()),
    "Spatial hand-mask directory contains missing or unexpected files",
  );

  const source = held.source;
  add(
    source?.path
      === "assets/art/layout-references/held-props-modern-bright-v1-source.png"
      && source?.sha256 === sha256(source.path)
      && source?.extractionMethod === "fresh-full-master-cell-ownership"
      && held.sourcePolicy?.originalAuditedMasterOnly === true
      && [
        "processedPixelReuse",
        "activeOfficePixelReuse",
        "missingAssetFallback",
        "runtimeScaling",
      ].every((key) => held.sourcePolicy?.[key] === false)
      && fileHashMatches(
        source.keyedMaster?.file,
        source.keyedMaster?.sha256,
        [1254, 1254],
      )
      && fileHashMatches(
        source.ownershipMask?.file,
        source.ownershipMask?.sha256,
        [1254, 1254],
      ),
    "H01 must be a fresh extraction from the audited original master",
  );
  const auditById = new Map(audit.records.map((record) => [record.recordId, record]));
  const propIds = new Set();
  const expectedHeldFiles = [
    source.keyedMaster.file,
    source.ownershipMask.file,
  ];
  for (const prop of held.props ?? []) {
    propIds.add(prop.id);
    expectedHeldFiles.push(
      prop.sourceCutout.file,
      prop.authoringFile,
      prop.runtimeFile,
    );
    const record = auditById.get(prop.auditRecordId);
    const grip = prop.primaryGripSocket;
    const [left, top, right, bottom] = prop.alphaBoundsRuntime;
    const visualCenter = [
      Math.floor((left + right - 1) / 2),
      Math.floor((top + bottom - 1) / 2),
    ];
    add(
      record?.sourcePath === source.path
        && record?.sourceSha256 === source.sha256
        && record?.currentDecision?.decision === "salvage-full-master-overlay"
        && record?.currentDecision?.masterPixelsSalvageable === true
        && fileHashMatches(prop.sourceCutout.file, prop.sourceCutout.sha256)
        && fileHashMatches(prop.authoringFile, prop.authoringSha256, [40, 40])
        && fileHashMatches(prop.runtimeFile, prop.runtimeSha256, [20, 20])
        && same(prop.runtimeCanvas, [20, 20])
        && same(prop.authoringCanvas, [40, 40])
        && prop.runtimeScale === 1
        && prop.attachmentMode === "front-overlay"
        && prop.layerRole === "front-overlay"
        && same(prop.visualCenterSocket, visualCenter)
        && ["primary-hand", "midpoint-primary-secondary"].includes(
          prop.actorSocketRule,
        )
        && Array.isArray(grip)
        && grip[0] >= 0
        && grip[0] < 20
        && grip[1] >= 0
        && grip[1] < 20,
      `${prop.id} source, pixels, or grip contract changed`,
    );
  }
  add(
    propIds.size === 16 && held.count === 16,
    "H01 must contain sixteen unique held props",
  );
  add(
    same(recursiveFiles(heldRoot), expectedHeldFiles.sort()),
    "H01 processed directory contains missing or unexpected files",
  );

  add(
    authority.world?.tilePixels === 32
      && authority.world?.projection?.screenX === "worldX * 32"
      && authority.world?.projection?.screenY === "worldY * 32 - worldZ * 32"
      && authority.local?.unit === "runtime-pixel-1x"
      && authority.local?.integerCoordinatesOnly === true
      && authority.formula?.entityOrigin
        === "project(worldPosition) - rootSocket"
      && authority.formula?.parentSocketWorld
        === "parentOrigin + parentLocalSocket"
      && authority.formula?.childOrigin
        === "parentSocketWorld - childLocalSocket",
    "I01 world/local coordinate transform changed",
  );
  add(
    authority.authorities?.characterActions?.file === actionPath
      && authority.authorities?.characterActions?.sha256 === sha256(actionPath)
      && authority.authorities?.heldProps?.file === heldPath
      && authority.authorities?.heldProps?.sha256 === sha256(heldPath)
      && Object.values(authority.authorities ?? {}).every(
        ({ file, sha256: expected }) => expected === sha256(file),
      ),
    "I01 authority dependency hash changed",
  );
  add(
    Object.values(authority.policies ?? {}).every((value) => value === false)
      && same(authority.matrixValidation, {
        characterCount: 18,
        propCount: 16,
        heldFrameCount: 3,
        visibleCaseCount: 864,
        absentCaseCount: 54,
        exactPrimarySocketCaseCount: 864,
        attachmentDeltaFailures: 0,
        runtimeScaleFailures: 0,
        missingMaskFailures: 0,
        frontOverlayCaseCount: 864,
        foregroundMaskUses: 0,
        visibleAlphaFailures: 0,
      })
      && authority.movementValidation?.worldPositionsTested === 4
      && authority.movementValidation?.frameCasesTested === 3456
      && authority.movementValidation?.maximumAttachmentDeltaPixels === 0
      && authority.movementValidation?.propFollowFailures === 0,
    "I01 matrix, movement, or no-fallback policy changed",
  );

  const reviewSizes = [
    ["01-coordinate-transform-chain.png", [1600, 900]],
    ["02-character-sockets-page-1.png", [1540, 1580]],
    ["02-character-sockets-page-2.png", [1540, 1580]],
    ["02-character-sockets-page-3.png", [1540, 1580]],
    ["03-held-prop-grips.png", [1600, 1180]],
    ["04-source-ownership.png", [1600, 1050]],
    ["05-layer-decomposition.png", [1600, 930]],
    ...Array.from(
      { length: 9 },
      (_, index) => [
        `06-full-matrix-page-${String(index + 1).padStart(2, "0")}.png`,
        [1840, 870],
      ],
    ),
    ["07-world-movement-proof.png", [1600, 930]],
  ].map(([name, size]) => [`${reviewRoot}/${name}`, size]);
  add(
    same(authority.reviewOutputs, reviewSizes.map(([path]) => path)),
    "I01 review output list changed",
  );
  for (const [index, [path, size]] of reviewSizes.entries()) {
    const evidence = authority.reviewEvidence?.[index];
    add(
      evidence?.file === path
        && fileHashMatches(path, evidence?.sha256, size),
      `I01 review evidence is missing or stale: ${path}`,
    );
  }
  add(
    same(recursiveFiles(reviewRoot), reviewSizes.map(([path]) => path).sort()),
    "I01 review directory contains an unexpected file",
  );
  const active = readText(activePath);
  add(
    !active.includes("office-spatial-i01")
      && !active.includes("office-held-props-h01")
      && !active.includes("office-character-action-sockets-i01"),
    "Active Office imported I01 or H01",
  );
  const builder = readText(builderPath);
  add(
    !builder.includes("office-interactions-v1/held-props")
      && !builder.includes("processedEvidence")
      && builder.includes("held-props-modern-bright-v1-source.png")
      && builder.includes("attachmentDeltaFailures"),
    "Spatial builder no longer proves fresh source isolation or exact deltas",
  );
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
}

if (failures.length) {
  process.stderr.write(`${failures.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    "Office Spatial I01/H01 OK: 18 actors, 108 frame sockets, 54 source-exact "
      + "calibration masks, 16 fresh held props, 864 fully visible front overlays, movement "
      + "proof, F8 approved, and Active Office unchanged.\n",
  );
}
