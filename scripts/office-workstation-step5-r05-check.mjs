import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = "assets/game/manifests/office-workstation-step5-r05-calibration.json";
const measurementsPath = "assets/game/manifests/office-workstation-step5-r05-measurements.json";
const r04Path = "assets/game/manifests/office-workstation-step5-single-seat-v4.json";
const componentsPath = "assets/game/manifests/office-workstation-components-v3.json";
const reviewDirectory = "assets/art/layout-references/office-workstation-v3/step5-r05";
const activeRegistryPath = "apps/web/src/features/office/components/officeAssetRegistry.ts";
const activeHash = "c40db448eb8e6d0f3fea67a41f716c0108aca63a4136cfad15293534273c618d";
const failures = [];

function add(condition, message) {
  if (!condition) failures.push(message);
}

function readJson(path) {
  return JSON.parse(readFileSync(join(root, path), "utf8"));
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(join(root, path))).digest("hex");
}

function recursiveFiles(directory) {
  const absolute = join(root, directory);
  if (!existsSync(absolute)) return [];
  const files = [];
  function visit(path) {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const target = join(path, entry.name);
      if (entry.isDirectory()) visit(target);
      else files.push(relative(root, target).replaceAll("\\", "/"));
    }
  }
  visit(absolute);
  return files.sort();
}

function pngSize(path) {
  const bytes = readFileSync(join(root, path));
  add(bytes.subarray(1, 4).toString("ascii") === "PNG", `${path} is not a PNG`);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

for (const path of [manifestPath, measurementsPath, r04Path, componentsPath]) {
  add(existsSync(join(root, path)), `Missing ${path}`);
}
if (failures.length === 0) {
  const manifest = readJson(manifestPath);
  const measurements = readJson(measurementsPath);
  const r04 = readJson(r04Path);
  const components = readJson(componentsPath);
  add(r04.status === "rejected-physical-composition" && r04.historicalEvidenceOnly === true,
    "R04 must be frozen as rejected physical-composition evidence");
  add(r04.reviewDecision?.supersededBy === manifest.id, "R04 must point to the R05 calibration");
  add(components.status === "partially-rejected-physical-composition"
    && components.componentDecisions?.desk?.decision === "accepted"
    && components.componentDecisions?.chair?.decision === "rejected",
  "R04 component history must retain desk-only acceptance");
  add(manifest.version === 5 && manifest.geometrySchemaVersion === 6,
    "R05 must use manifest v5 and Geometry v6");
  add(manifest.status === "owner-calibration-review", "R05 must stop at owner calibration review");
  add(JSON.stringify(manifest.completedScope) === JSON.stringify(["R05-0", "R05-1", "R05-2"]),
    "R05 must complete R05-0 through R05-2 only");
  add(manifest.nextScope === "R05-3-blocked-pending-owner-approval",
    "R05-3 must remain blocked pending owner approval");
  add(manifest.activeOfficeBaseline?.sha256 === activeHash
    && manifest.activeOfficeBaseline?.sha256 === sha256(manifest.activeOfficeBaseline.file),
  "Active Office baseline changed during R05 calibration");
  add(manifest.measurementEvidence?.file === measurementsPath
    && manifest.measurementEvidence?.sha256 === sha256(measurementsPath),
  "R05 measurement evidence hash changed");

  add(measurements.status === "deterministic-failure-measurement-evidence",
    "R05 measurements must remain failure evidence");
  for (const [id, source] of Object.entries(measurements.sources ?? {})) {
    add(existsSync(join(root, source.path)), `Missing R05 source ${id}: ${source.path}`);
    if (existsSync(join(root, source.path))) {
      add(sha256(source.path) === source.sha256, `R05 source changed: ${id}`);
    }
  }
  const chair = measurements.rejectedR04Chair;
  add(chair.declaredSeatSplitStartLocalY === 48, "R04 declared chair split must remain y=48 evidence");
  add(JSON.stringify(chair.frontLowerUpholsteryBandLocalY) === JSON.stringify([35, 44]),
    "Front chair lower upholstery band measurement changed");
  add(JSON.stringify(chair.backLowerUpholsteryBandLocalY) === JSON.stringify([40, 44]),
    "Back chair lower upholstery band measurement changed");
  add(chair.seatLayerContainsCushion === false
    && chair.seatLayerActualMeaning === "wheel-and-base-region",
  "R04 chair seat-layer semantic failure must stay explicit");
  add(measurements.runtimeCharacter?.pelvisContactPivot === null
    && measurements.runtimeCharacter?.pivotStatus === "unmeasured-r04-declaration-rejected",
  "R05 must not invent a pelvis contact pivot");

  const equipment = measurements.rejectedR04Equipment;
  add(JSON.stringify(equipment.far.monitor.centerErrorPixels) === JSON.stringify({ x: 0, y: 16 })
    && JSON.stringify(equipment.near.monitor.centerErrorPixels) === JSON.stringify({ x: 0, y: 16 }),
  "R04 monitor base-to-center failure must equal 16 px in both orientations");
  add(JSON.stringify(equipment.far.keyboard.centerErrorPixels) === JSON.stringify({ x: 0, y: -4 })
    && JSON.stringify(equipment.near.keyboard.centerErrorPixels) === JSON.stringify({ x: 0, y: 0 }),
  "R04 keyboard orientation asymmetry must remain measured");

  const coordinates = manifest.coordinateContract;
  add(coordinates?.reservationSpace === "top-down-world-grid"
    && coordinates?.worldAnchor === "reservation-center"
    && coordinates?.drawFormula === "drawOrigin = worldReservationCenter - localVisualPivot"
    && coordinates?.orientationSpecificMagicOffsets === "forbidden",
  "R05 reservation/pivot coordinate authority changed");
  add(JSON.stringify(manifest.componentContracts?.chair?.baseAndSeatVolume) === JSON.stringify([1, 1, 1])
    && JSON.stringify(manifest.componentContracts?.chair?.backrestVolume) === JSON.stringify([1, 1, 1]),
  "R05 chair must separate base-seat and backrest 1 x 1 x 1 volumes");
  add(JSON.stringify(manifest.componentContracts?.monitor?.reservation) === JSON.stringify([3, 1])
    && JSON.stringify(manifest.componentContracts?.monitor?.targetVisualWidthPixels) === JSON.stringify([72, 80]),
  "R05 monitor reservation or target visual width changed");
  add(JSON.stringify(manifest.componentContracts?.keyboard?.reservation) === JSON.stringify([1, 1])
    && JSON.stringify(manifest.componentContracts?.keyboard?.targetVisualPixels)
      === JSON.stringify({ width: [44, 48], depth: [18, 20] }),
  "R05 keyboard reservation or clearance envelope changed");

  for (const key of [
    "newArtworkGeneration", "rendererImplementation", "singleSeatAssembly",
    "rosterWideCalibration", "tenSeatAssembly", "step6", "activeOfficePromotion",
  ]) {
    add(manifest.permissions?.[key] === false, `R05 permissions.${key} must remain false`);
  }
  add(manifest.acceptedInputs?.charactersAndPoses?.newCharacterOrPose === false,
    "R05 cannot create a character or pose");

  const expectedBoards = [
    `${reviewDirectory}/01-reservation-vs-visual-pivot.png`,
    `${reviewDirectory}/02-chair-person-contact-measurement.png`,
    `${reviewDirectory}/03-equipment-center-pivot-calibration.png`,
  ];
  add(JSON.stringify(manifest.reviewOutputs) === JSON.stringify(expectedBoards),
    "R05 manifest must list exactly the three calibration boards");
  add(JSON.stringify(recursiveFiles(reviewDirectory)) === JSON.stringify(expectedBoards),
    "R05 review directory must contain exactly three boards");
  for (const path of expectedBoards) {
    add(existsSync(join(root, path)), `Missing R05 board: ${path}`);
    if (existsSync(join(root, path))) {
      const size = pngSize(path);
      add(size.width === 1600 && size.height === 1000, `${path} must be 1600 x 1000`);
    }
  }

  add(!existsSync(join(root, "assets/game/processed/office-workstation-v3/step5-r05")),
    "R05-0..R05-2 cannot create processed R05 component artwork");
  add(!existsSync(join(root, "apps/web/src/features/office/lab/workstation-v3-step5-r05")),
    "R05-0..R05-2 cannot create an R05 runtime lab");
  const activeRegistry = readFileSync(join(root, activeRegistryPath), "utf8");
  add(!activeRegistry.includes("step5-r05"), "Active Office registry imports R05 calibration files");
}

if (failures.length > 0) {
  process.stderr.write(`${failures.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    "Step 5 R05-0..R05-2 check OK: R04 rejected, measured reservation/pivot/contact contracts locked, exactly three owner boards, Active Office unchanged.\n",
  );
}
