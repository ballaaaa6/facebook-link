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
const bundleV2 = readJson("assets/game/manifests/office-workstation-bundle-v2.json");
const step5 = readJson("assets/game/manifests/office-workstation-step5-single-seat-v1.json");
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

add(failures, step5.status === "owner-review", "Step 5 must stop at owner review");
add(failures, step5.permissions?.singleSeatAssembly === true, "Step 5 must record owner-authorized single-seat assembly");
add(failures, step5.permissions?.isolatedLabRenderer === true, "Step 5 isolated renderer must be authorized");
for (const key of ["newArtworkGeneration", "rosterWideCalibration", "tenSeatSceneAssembly", "activeOfficePromotion"]) {
  add(failures, step5.permissions?.[key] === false, `Step 5 permissions.${key} must remain false`);
}
add(failures, step5.lab?.stationCount === 1 && step5.lab?.reviewViewCount === 2,
  "Step 5 must remain one station with two review views");
add(failures, step5.activeOfficeBaseline?.sha256 === assembly.activeOfficeBaseline?.sha256,
  "Step 5 must inherit the exact Active Office baseline hash");

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
    "Workstation authority OK: accepted 3 x 2 desk, isolated Step 5 owner review, ten-seat and promotion blocked.\n",
  );
}
