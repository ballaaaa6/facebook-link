import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function readJson(path) {
  return JSON.parse(readFileSync(join(root, path), "utf8"));
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(join(root, path))).digest("hex");
}

function add(failures, condition, message) {
  if (!condition) failures.push(message);
}

const camera = readJson("assets/game/manifests/office-camera-scale-bible.json");
const assembly = readJson("assets/game/manifests/office-workstation-assembly-bible-v2.json");
const cameraV3 = readJson("assets/game/manifests/office-camera-scale-bible-v3.json");
const assemblyV3 = readJson("assets/game/manifests/office-workstation-assembly-bible-v3.json");
const bundleV2 = readJson("assets/game/manifests/office-workstation-bundle-v2.json");
const rejectedStep5 = readJson("assets/game/manifests/office-workstation-step5-single-seat-v1.json");
const step5 = readJson("assets/game/manifests/office-workstation-step5-single-seat-v2.json");
const step5R03 = readJson("assets/game/manifests/office-workstation-step5-single-seat-v3.json");
const componentsV3 = readJson("assets/game/manifests/office-workstation-components-v3.json");
const step5R04 = readJson("assets/game/manifests/office-workstation-step5-single-seat-v4.json");
const step5R05 = readJson("assets/game/manifests/office-workstation-step5-r05-calibration.json");
const step5R05Final = readJson("assets/game/manifests/office-workstation-step5-r05-final.json");
const characterScale = readJson("assets/game/manifests/office-character-scale-standard-v1.json");
const candidate = readJson("assets/game/manifests/office-candidate-v1.json");
const review = readJson("assets/game/manifests/office-candidate-review-r01.json");
const historicalBundle = readJson("assets/game/manifests/office-workstation-bundle-v1.json");
const historicalDeployment = readJson("assets/game/manifests/office-workstation-deployment-v1.json");
const historicalMap = readJson("assets/game/maps/office-ten-v1.json");
const failures = [];

add(failures, camera.version === 2, "Camera/Scale Bible must be version 2");
add(failures, camera.workstationRuleVersion === 2, "Camera/Scale Bible must target Workstation Rule v2");
add(failures, camera.status === "accepted", "Camera/Scale Bible must record the approved Step 4 geometry");
add(
  failures,
  camera.canonicalDesk?.physicalScale?.width === 3
    && camera.canonicalDesk?.physicalScale?.depth === 2
    && camera.canonicalDesk?.physicalScale?.height === 2.4,
  "Camera/Scale Bible desk must equal 3 x 2 x 2.4",
);
add(
  failures,
  camera.canonicalDesk?.footprint?.width === 3
    && camera.canonicalDesk?.footprint?.depth === 2,
  "Camera/Scale Bible footprint must equal 3 x 2",
);
add(
  failures,
  camera.canonicalDesk?.supportPlane?.width === 3
    && camera.canonicalDesk?.supportPlane?.depth === 2,
  "Camera/Scale Bible support plane must equal the complete 3 x 2 tabletop",
);
add(failures, camera.canonicalDesk?.employeeEdge === null, "Camera/Scale Bible cannot reserve an employee-edge floor row");

for (const [key, value] of Object.entries(camera.acceptance ?? {})) {
  if (key.endsWith("Authorized") || key === "ownerApproval") {
    const expected = key === "ownerApproval" || key === "artworkGenerationAuthorized";
    add(failures, value === expected, `Camera/Scale Bible acceptance.${key} has the wrong Step 4 permission`);
  }
}

add(failures, assembly.version === 2, "Assembly Bible must be version 2");
add(failures, assembly.status === "desk-artwork-accepted", "Assembly Bible must record accepted Step 4 artwork");
for (const [key, value] of Object.entries(assembly.permissions ?? {})) {
  const expected = key === "ownerApproval" || key === "deskArtworkGeneration";
  add(failures, value === expected, `Assembly Bible permissions.${key} has the wrong Step 4 permission`);
}
add(
  failures,
  assembly.desk?.footprint?.width === 3 && assembly.desk?.footprint?.depth === 2,
  "Assembly Bible desk footprint must equal 3 x 2",
);
add(
  failures,
  assembly.desk?.supportPlane?.width === 3 && assembly.desk?.supportPlane?.depth === 2,
  "Assembly Bible support plane must equal 3 x 2",
);
add(failures, assembly.desk?.employeeEdgeRow === null, "Assembly Bible cannot recreate the rejected employee-edge row");
add(
  failures,
  assembly.desk?.partContract?.length === 4
    && assembly.desk.partContract.every((part) => part.changesFootprint === false && part.artworkStatus === "accepted"),
  "Every Assembly Bible desk part must remain footprint-neutral and accepted",
);
add(failures, assembly.approvalRecord?.step4ArtworkDecision === "accepted",
  "Assembly Bible must retain the owner-approved Step 4 decision");
add(
  failures,
  assembly.equipment?.monitor?.reservation?.width === 3
    && assembly.equipment?.monitor?.reservation?.depth === 1
    && assembly.equipment?.keyboard?.reservation?.width === 3
    && assembly.equipment?.keyboard?.reservation?.depth === 1,
  "Monitor and keyboard must each reserve one 3 x 1 surface band",
);
add(
  failures,
  JSON.stringify(assembly.normalizedTenSeatBlock?.deskOriginsX) === JSON.stringify([4, 7, 10, 13, 16]),
  "Desk origins must be five edge-touching three-tile columns",
);
add(
  failures,
  assembly.normalizedTenSeatBlock?.farDeskOriginY === 6
    && assembly.normalizedTenSeatBlock?.nearDeskOriginY === 8,
  "Two desk rows must touch directly",
);
add(
  failures,
  assembly.normalizedTenSeatBlock?.farChairOriginY === 5
    && assembly.normalizedTenSeatBlock?.nearChairOriginY === 10,
  "Chair rows must remain outside the paired desk block",
);
add(
  failures,
  assembly.legacyDenyList?.deskFamilyIds?.includes("desk.modular.v1")
    && assembly.legacyDenyList?.geometryRules?.includes("5x4-workstation-footprint")
    && assembly.legacyDenyList?.geometryRules?.includes("5x3-workstation-support-plane"),
  "Assembly Bible must deny the rejected v1 family and geometry",
);

add(failures, bundleV2.version === 2, "Workstation Bundle v2 must be version 2");
add(failures, bundleV2.status === "step4-accepted", "Workstation Bundle v2 must record accepted Step 4 artwork");
add(failures, bundleV2.approvalRecord?.decision === "accepted", "Workstation Bundle v2 must retain owner acceptance");
add(failures, bundleV2.permissions?.bareDeskArtwork === true, "Workstation Bundle v2 must authorize the bare desk");
for (const key of ["singleSeatAssembly", "tenSeatSceneAssembly", "rendererImplementation", "activeOfficePromotion"]) {
  add(failures, bundleV2.permissions?.[key] === false, `Workstation Bundle v2 permissions.${key} must remain false`);
}
add(
  failures,
  bundleV2.deskFamily?.footprint?.width === 3
    && bundleV2.deskFamily?.footprint?.depth === 2
    && bundleV2.deskFamily?.supportPlane?.width === 3
    && bundleV2.deskFamily?.supportPlane?.depth === 2,
  "Workstation Bundle v2 desk and full tabletop must equal 3 x 2",
);
add(failures, bundleV2.deskFamily?.normalization?.tabletopHeightRatio >= 0.4,
  "Workstation Bundle v2 must preserve the elevated-camera tabletop ratio");
add(failures, bundleV2.deskFamily?.employeeEdge === null, "Workstation Bundle v2 cannot recreate an employee edge");
add(failures, bundleV2.source?.commercialReviewRequired === true,
  "Workstation Bundle v2 must remain blocked from future commercial use until separately reviewed");
for (const [fileField, hashField] of [["chromaFile", "chromaSha256"], ["alphaFile", "alphaSha256"]]) {
  const path = bundleV2.source?.[fileField];
  add(failures, typeof path === "string" && sha256(path) === bundleV2.source?.[hashField],
    `Workstation Bundle v2 ${fileField} is missing or changed`);
}

const sourcePath = assembly.sourceReference?.file;
const baselinePath = assembly.activeOfficeBaseline?.file;
add(
  failures,
  typeof sourcePath === "string" && sha256(sourcePath) === assembly.sourceReference.sha256,
  "Target composition reference is missing or changed",
);
add(
  failures,
  typeof baselinePath === "string" && sha256(baselinePath) === assembly.activeOfficeBaseline.sha256,
  "Active Office baseline changed during blueprint review",
);

add(failures, rejectedStep5.status === "rejected-visual", "Step 5 v1 must remain rejected visual evidence");
add(failures, rejectedStep5.reviewDecision?.supersededBy === step5.id, "Step 5 v1 must point to the corrected revision");
add(failures, step5.version === 2 && step5.geometrySchemaVersion === 4, "Step 5 r02 must use Geometry v4");
add(failures, step5.status === "rejected-calibration", "Step 5 r02 must remain rejected calibration evidence");
add(failures, step5.approvalRecord?.resultDecision === "rejected"
  && step5.approvalRecord?.supersededBy === step5R03.id, "Step 5 r02 must point to R03");
for (const key of [
  "isolatedLabRenderer", "singleSeatAssembly", "deterministicDerivedAssets",
  "newArtworkGeneration", "rosterWideCalibration", "tenSeatSceneAssembly", "activeOfficePromotion",
]) {
  add(failures, step5.permissions?.[key] === false, `Step 5 permissions.${key} must remain false`);
}
add(failures, step5.lab?.stationCount === 1 && step5.lab?.reviewViewCount === 2,
  "Step 5 r02 must remain one station with two review views");
add(failures, step5.activeOfficeBaseline?.sha256 === assembly.activeOfficeBaseline?.sha256,
  "Step 5 r02 must inherit the exact Active Office baseline hash");
add(failures, characterScale.standard?.floorFootprint?.width === 1
  && characterScale.standard?.floorFootprint?.depth === 1
  && characterScale.standard?.logicalVolume?.height === 3,
"Character scale authority must equal 1 x 1 x 3");
add(failures, characterScale.standard?.sourceFramePixels?.width === 96
  && characterScale.standard?.sourceFramePixels?.height === 104,
"Character scale authority must preserve the current Office 96 x 104 frame at tile 32");
add(failures, step5.station?.equipment?.chair?.footprint?.width === 1
  && step5.station?.equipment?.chair?.logicalVolume?.height === 2,
"Step 5 r02 chair must equal 1 x 1 x 2");
add(failures, step5.orientations?.far?.deskSide === "public-side"
  && step5.orientations?.near?.deskSide === "seat-side", "Step 5 r02 desk sides cannot be reversed");

add(failures, cameraV3.status === "owner-calibration-review", "Camera/Scale Bible v3 must stop at calibration review");
add(failures, cameraV3.world?.tilePixels === 32
  && JSON.stringify(cameraV3.world?.levels) === JSON.stringify({
    floor: 0, chairSeat: 1, deskSupport: 2, personTop: 3,
  }), "Camera/Scale Bible v3 must use 32 px tiles and z levels 0/1/2/3");
add(failures, cameraV3.standards?.desk?.logicalVolume?.height === 2
  && cameraV3.standards?.desk?.requiredSupportPixels?.depth === 64,
"Camera/Scale Bible v3 desk must be 3 x 2 x 2 with a full 64 px support depth");
add(failures, assemblyV3.equipment?.keyboard?.reservation?.width === 1
  && assemblyV3.equipment?.keyboard?.reservation?.depth === 1
  && assemblyV3.equipment?.keyboard?.proposedRenderPixels?.width === 48,
"Assembly Bible v3 keyboard must reserve 1 x 1 with a 48 px visual");
add(failures, assemblyV3.personChair?.pixelAnchors === "unlocked-pending-owner-contact-approval",
  "Assembly Bible v3 must not invent person/chair pixel anchors");
add(failures, step5R03.status === "owner-calibration-review"
  && step5R03.nextScope === "P4-blocked-pending-owner-approval",
"Step 5 R03 must stop after P3 at owner calibration review");
for (const key of [
  "newArtworkGeneration", "rendererImplementation", "singleSeatAssembly",
  "rosterWideCalibration", "tenSeatAssembly", "step6", "activeOfficePromotion",
]) {
  add(failures, step5R03.permissions?.[key] === false, `Step 5 R03 permissions.${key} must remain false`);
}
add(failures, step5R03.activeOfficeBaseline?.sha256 === assembly.activeOfficeBaseline?.sha256,
  "Step 5 R03 must inherit the exact Active Office baseline hash");
add(failures, componentsV3.status === "partially-rejected-physical-composition"
  && componentsV3.geometry?.desk?.renderPixels?.[0] === 96
  && componentsV3.geometry?.desk?.renderPixels?.[1] === 128,
"R04 component history must retain the accepted full-top desk and partial rejection");
add(failures, step5R04.status === "rejected-physical-composition"
  && JSON.stringify(step5R04.completedScope) === JSON.stringify(["P4", "P5", "P6"]),
"Step 5 R04 must retain rejected P4-P6 evidence");
add(failures, step5R04.permissions?.tenSeatAssembly === false
  && step5R04.permissions?.rosterWideCalibration === false
  && step5R04.permissions?.step6 === false
  && step5R04.permissions?.activeOfficePromotion === false,
"Step 5 R04 must keep expansion and Active Office blocked");
add(failures, step5R04.activeOfficeBaseline?.sha256 === assembly.activeOfficeBaseline?.sha256,
  "Step 5 R04 must inherit the exact Active Office baseline hash");
add(failures, step5R05.status === "owner-anchor-proof-approved"
  && JSON.stringify(step5R05.completedScope) === JSON.stringify(["R05-0", "R05-1", "R05-2", "R05-3A"])
  && step5R05.nextScope === "R05-3B-authorized",
"Step 5 R05 must record owner approval and authorize R05-3B");
for (const key of [
  "newArtworkGeneration", "rendererImplementation", "singleSeatAssembly",
  "rosterWideCalibration", "tenSeatAssembly", "step6", "activeOfficePromotion",
]) {
  add(failures, step5R05.permissions?.[key] === false, `Step 5 R05 permissions.${key} must remain false`);
}
add(failures, step5R05.activeOfficeBaseline?.sha256 === assembly.activeOfficeBaseline?.sha256,
  "Step 5 R05 must inherit the exact Active Office baseline hash");
add(failures, step5R05Final.status === "owner-review-ten-seat-candidate"
  && JSON.stringify(step5R05Final.completedScope) === JSON.stringify(["R05-3B", "R05-4", "R05-5"]),
"Step 5 R05 final must stop at consolidated owner review");
add(failures, step5R05Final.ownerDecision?.r05_3a === "approved",
  "Step 5 R05 final must inherit owner approval of the anchor proof");
add(failures, step5R05Final.permissions?.isolatedRenderer === true
  && step5R05Final.permissions?.singleSeatAssembly === true
  && step5R05Final.permissions?.tenSeatAssembly === true
  && step5R05Final.permissions?.newCharacterOrPose === false
  && step5R05Final.permissions?.otherFurniture === false
  && step5R05Final.permissions?.step24 === false
  && step5R05Final.permissions?.activeOfficePromotion === false,
"Step 5 R05 final must allow isolated assembly while blocking Step 24 and Active Office");
add(failures, step5R05Final.activeOfficeBaseline?.sha256 === assembly.activeOfficeBaseline?.sha256,
  "Step 5 R05 final must inherit the exact Active Office baseline hash");
add(failures, step5R05Final.runtimePolicy?.mockupChairAllowed === false
  && step5R05Final.runtimePolicy?.legacyCandidateAllowed === false,
"Step 5 R05 final cannot use the calibration mockup or rejected candidate");

add(failures, candidate.status === "rejected-visual", "Candidate v1 must remain rejected-visual evidence");
add(failures, candidate.review?.status === "changes-requested", "Candidate v1 must retain owner-requested changes");
add(failures, candidate.activeOfficePromotion === false, "Candidate v1 cannot promote Active Office");
add(failures, review.status === "rejected-visual", "Candidate review r01 must remain rejected-visual evidence");
add(failures, review.ownerApproval === false, "Candidate review r01 cannot claim owner approval");
add(failures, historicalBundle.status === "rejected-geometry", "Workstation Bundle v1 must remain rejected-geometry evidence");
add(failures, historicalDeployment.status === "rejected-geometry", "Workstation Deployment v1 must remain rejected-geometry evidence");
add(failures, historicalMap.status === "rejected-geometry", "Office Ten v1 map must remain rejected-geometry evidence");

const activeRegistry = readFileSync(
  join(root, "apps/web/src/features/office/components/officeAssetRegistry.ts"),
  "utf8",
);
add(failures, !activeRegistry.includes("desk.modular.v1"), "Active Office registry cannot import the rejected v1 desk family");
add(failures, !activeRegistry.includes("office-workstation-v3"), "Active Office registry cannot import R04 owner-review assets");

const promptBuilder = readFileSync(join(root, "scripts/office-asset-prompt.mjs"), "utf8");
add(
  failures,
  promptBuilder.includes("workstationGenerationGate")
    && promptBuilder.includes("legacy catalog workstation prompts remain blocked"),
  "Prompt builder must retain the rejected legacy-workstation generation gate",
);

if (failures.length > 0) {
  process.stderr.write(`${failures.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    "Workstation authority OK: R04 physical composition rejected; R05-3A anchor proof approved; isolated R05-3B through R05-5 authorized; Active Office blocked.\n",
  );
}
