import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const paths = {
  camera: "assets/game/manifests/office-camera-scale-bible-v3.json",
  assembly: "assets/game/manifests/office-workstation-assembly-bible-v3.json",
  r02: "assets/game/manifests/office-workstation-step5-single-seat-v2.json",
  r03: "assets/game/manifests/office-workstation-step5-single-seat-v3.json",
  r04: "assets/game/manifests/office-workstation-step5-single-seat-v4.json",
  measurement: "assets/game/manifests/office-workstation-step5-r03-measurements.json",
};
const readJson = (path) => JSON.parse(readFileSync(join(root, path), "utf8"));
const sha256 = (path) => createHash("sha256").update(readFileSync(join(root, path))).digest("hex");
const camera = readJson(paths.camera);
const assembly = readJson(paths.assembly);
const r02 = readJson(paths.r02);
const r03 = readJson(paths.r03);
const measurement = readJson(paths.measurement);
const failures = [];
const add = (condition, message) => {
  if (!condition) failures.push(message);
};
const exact = (actual, expected) => JSON.stringify(actual) === JSON.stringify(expected);

function pngSize(path) {
  const bytes = readFileSync(join(root, path));
  add(bytes.subarray(1, 4).toString("ascii") === "PNG", `${path}: must be a PNG`);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

add(r02.status === "rejected-calibration", "Step 5 R02 must remain rejected calibration evidence");
add(r02.approvalRecord?.resultDecision === "rejected"
  && r02.approvalRecord?.supersededBy === r03.id, "R02 must point to R03");
for (const key of [
  "isolatedLabRenderer", "singleSeatAssembly", "deterministicDerivedAssets",
  "newArtworkGeneration", "rosterWideCalibration", "tenSeatSceneAssembly", "activeOfficePromotion",
]) {
  add(r02.permissions?.[key] === false, `R02 permission ${key} must be revoked`);
}

add(camera.status === "owner-calibration-review", "Camera/Scale Bible v3 must stop at owner calibration");
add(camera.world?.tilePixels === 32, "R03 must use 32 pixels per tile");
add(exact(camera.world?.levels, { floor: 0, chairSeat: 1, deskSupport: 2, personTop: 3 }),
  "R03 z levels must equal 0/1/2/3");
add(camera.world?.projection?.screenX === "worldX * 32"
  && camera.world?.projection?.screenY === "worldY * 32 - worldZ * 32",
"R03 projection formula changed");
add(exact(camera.standards?.person?.logicalVolume, { width: 1, depth: 1, height: 3 })
  && exact(camera.standards?.person?.currentOfficeFramePixels, { width: 96, height: 104 }),
"R03 person must preserve the current Office 1 x 1 x 3 scale and 96 x 104 pixels");
add(exact(camera.standards?.chair?.logicalVolume, { width: 1, depth: 1, height: 2 })
  && camera.standards?.chair?.sharesFloorCellWithSeatedPerson === true,
"R03 chair must be 1 x 1 x 2 and share the person's floor cell");
add(exact(camera.standards?.desk?.logicalVolume, { width: 3, depth: 2, height: 2 })
  && exact(camera.standards?.desk?.requiredSupportPixels, { width: 96, depth: 64 }),
"R03 desk must be 3 x 2 x 2 with a 96 x 64 support plane");

add(assembly.status === "owner-calibration-review", "Assembly Bible v3 must stop at owner calibration");
add(exact(assembly.equipment?.monitor?.reservation, { width: 3, depth: 1 }),
  "Monitor must reserve the actor-far 3 x 1 row");
add(exact(assembly.equipment?.keyboard?.reservation, { width: 1, depth: 1 })
  && exact(assembly.equipment?.keyboard?.maximumVisualEnvelope, { width: 1.5, depth: 1 })
  && exact(assembly.equipment?.keyboard?.proposedRenderPixels, { width: 48, height: 24 }),
"Keyboard must reserve 1 x 1 with a 48 x 24 proposed visual");
add(assembly.personChair?.pixelAnchors === "unlocked-pending-owner-contact-approval",
  "Person/chair pixel anchors cannot be locked before owner approval");
add(assembly.deskSideGate?.status === "unlocked-pending-phase-4",
  "Desk side pixels cannot be declared authoritative in P0-P3");

add(r03.status === "owner-calibration-review", "Step 5 R03 must stop at owner calibration");
add(exact(r03.completedScope, ["P0", "P1", "P2", "P3"])
  && r03.nextScope === "P4-blocked-pending-owner-approval", "R03 must stop after P3");
for (const key of [
  "newArtworkGeneration", "rendererImplementation", "singleSeatAssembly",
  "rosterWideCalibration", "tenSeatAssembly", "step6", "activeOfficePromotion",
]) {
  add(r03.permissions?.[key] === false, `R03 permission ${key} must remain blocked`);
}
add(r03.lockedInputs?.length === 10, "R03 must lock exactly ten measured sources");
for (const input of r03.lockedInputs ?? []) {
  add(existsSync(join(root, input.path)), `Missing R03 source: ${input.path}`);
  if (existsSync(join(root, input.path))) {
    add(sha256(input.path) === input.sha256, `Changed R03 source: ${input.path}`);
  }
}

add(sha256(paths.measurement) === r03.measurementEvidence?.sha256,
  "R03 measurement evidence hash changed");
add(measurement.measurementPolicy?.creativeRedraw === false,
  "R03 measurement evidence cannot contain a creative redraw");
add(measurement.rejectedR02?.measuredSurfaceDepthPixels === 30
  && measurement.rejectedR02?.requiredSurfaceDepthPixels === 64
  && measurement.rejectedR02?.surfaceDepthDeficitPixels === 34,
"R02 tabletop failure must remain measured as 30 px versus 64 px");
add(exact(measurement.r03ProposedGeometry?.keyboard?.reservation, [1, 1])
  && exact(measurement.r03ProposedGeometry?.keyboard?.targetPixelsPreservingSourceAspect, [48, 24]),
"Measured keyboard proposal must remain 1 x 1 and 48 x 24 px");
add(measurement.r03ProposedGeometry?.chair?.renderPixels === "unlocked",
  "Chair render pixels cannot be invented during P0-P3");

const reviewDirectory = join(root, "assets/art/layout-references/office-workstation-v3/step5-r03");
const exactBoards = readdirSync(reviewDirectory).filter((name) => name.endsWith(".png")).sort();
add(exactBoards.length === 3, "R03 review directory must contain exactly three PNG boards");
add(r03.reviewOutputs?.length === 3, "R03 manifest must list exactly three boards");
for (const output of r03.reviewOutputs ?? []) {
  add(existsSync(join(root, output)), `Missing R03 board: ${output}`);
  if (existsSync(join(root, output))) {
    add(exact(pngSize(output), { width: 1600, height: 1000 }), `${output}: must be 1600 x 1000`);
  }
}

add(sha256(r03.activeOfficeBaseline.file) === r03.activeOfficeBaseline.sha256,
  "Active Office map changed during P0-P3");
const activeRegistry = readFileSync(
  join(root, "apps/web/src/features/office/components/officeAssetRegistry.ts"),
  "utf8",
);
add(!activeRegistry.includes("office-workstation-step5-single-seat-v3")
  && !activeRegistry.includes("office-workstation-v3"),
"Active Office registry cannot import R03 calibration data or outputs");
const processedR04 = existsSync(join(root, "assets/game/processed/office-workstation-v3/step5-r04"));
if (processedR04) {
  add(existsSync(join(root, paths.r04)), "Processed workstation v3 art requires an R04 manifest");
  if (existsSync(join(root, paths.r04))) {
    const r04 = readJson(paths.r04);
    add(exact(r04.completedScope, ["P4", "P5", "P6"]), "Processed workstation v3 art must belong to approved R04 P4-P6");
    add(r04.permissions?.activeOfficePromotion === false, "R04 art cannot promote itself to Active Office");
  }
}

if (failures.length > 0) {
  process.stderr.write(`${failures.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    "Step 5 R03 P0-P3 OK: historical measurements and three boards remain locked; later R04 art stays isolated from Active Office.\n",
  );
}
