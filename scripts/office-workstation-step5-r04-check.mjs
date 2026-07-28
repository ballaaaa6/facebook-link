import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const componentsPath = "assets/game/manifests/office-workstation-components-v3.json";
const manifestPath = "assets/game/manifests/office-workstation-step5-single-seat-v4.json";
const processedDirectory = "assets/game/processed/office-workstation-v3/step5-r04";
const activeRegistryPath = "apps/web/src/features/office/components/officeAssetRegistry.ts";
const labDirectory = "apps/web/src/features/office/lab/workstation-v3-step5";
const mainPath = "apps/web/src/main.tsx";
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

function pngSize(path) {
  const bytes = readFileSync(join(root, path));
  add(bytes.subarray(1, 4).toString("ascii") === "PNG", `${path} is not a PNG`);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
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

function intersects(a, b) {
  return a.left < b.left + b.width && a.left + a.width > b.left
    && a.top < b.top + b.height && a.top + a.height > b.top;
}

function inside(inner, outer) {
  return inner.left >= outer.left && inner.top >= outer.top
    && inner.left + inner.width <= outer.left + outer.width
    && inner.top + inner.height <= outer.top + outer.height;
}

add(existsSync(join(root, componentsPath)), `Missing ${componentsPath}`);
add(existsSync(join(root, manifestPath)), `Missing ${manifestPath}`);
if (failures.length === 0) {
  const components = readJson(componentsPath);
  const manifest = readJson(manifestPath);
  add(components.version === 3 && components.geometrySchemaVersion === 5, "Components v3 must use Geometry v5");
  add(manifest.version === 4 && manifest.geometrySchemaVersion === 5, "Step 5 R04 must use Geometry v5");
  add(manifest.replaces === "office.workstation.step5.single-seat.v3", "R04 must replace the R03 calibration gate");
  add(manifest.lab?.developmentOnly === true && manifest.lab?.productionReachable === false, "R04 lab must remain development-only");
  add(manifest.lab?.stationCount === 1 && manifest.lab?.orientationCount === 2, "R04 is one station in exactly two directions");
  add(manifest.permissions?.tenSeatAssembly === false, "R04 cannot assemble ten seats");
  add(manifest.permissions?.step6 === false, "R04 cannot begin Step 6");
  add(manifest.permissions?.activeOfficePromotion === false, "R04 cannot modify Active Office");
  add(JSON.stringify(manifest.completedScope) === JSON.stringify(["P4", "P5", "P6"]), "R04 must complete P4-P6 only");
  add(manifest.runtimeScope === "P6-isolated-lab-complete", "R04 P6 browser validation is not complete");
  add(manifest.browserValidation?.animationSeconds === 30 && manifest.browserValidation?.anchorStable === true, "R04 must pass the 30-second anchor gate");
  add(manifest.browserValidation?.consoleErrors === 0 && manifest.browserValidation?.brokenImages === 0, "R04 browser validation must be clean");
  add(manifest.browserValidation?.maximumHorizontalOverflowPixels === 0, "R04 narrow validation must not overflow horizontally");
  add(manifest.componentsAuthority?.sha256 === sha256(componentsPath), "R04 component-authority hash changed");
  add(manifest.activeOfficeBaseline?.sha256 === sha256(manifest.activeOfficeBaseline.file), "Active Office changed during R04");

  add(JSON.stringify(components.geometry.person.logicalVolume) === JSON.stringify([1, 1, 3]), "Person must remain 1 x 1 x 3");
  add(JSON.stringify(components.geometry.chair.logicalVolume) === JSON.stringify([1, 1, 2]), "Chair must remain 1 x 1 x 2");
  add(JSON.stringify(components.geometry.desk.logicalVolume) === JSON.stringify([3, 2, 2]), "Desk must remain 3 x 2 x 2");
  add(JSON.stringify(components.geometry.desk.supportRows) === JSON.stringify([0, 64]), "Desk support must be the full 96 x 64 top");
  add(JSON.stringify(components.geometry.keyboard.reservation) === JSON.stringify([1, 1]), "Keyboard reservation must remain 1 x 1");
  add(JSON.stringify(components.geometry.keyboard.renderPixels) === JSON.stringify([48, 24]), "Keyboard visual envelope must remain 48 x 24");
  add(JSON.stringify(components.geometry.monitor.reservation) === JSON.stringify([3, 1]), "Monitor reservation must remain 3 x 1");

  const expectedComponents = Object.values(components.components).map((component) => component.path).sort();
  add(JSON.stringify(recursiveFiles(processedDirectory)) === JSON.stringify(expectedComponents), "Processed R04 directory must contain exactly the declared component files");
  for (const [id, component] of Object.entries(components.components)) {
    add(existsSync(join(root, component.path)), `Missing component ${id}: ${component.path}`);
    if (!existsSync(join(root, component.path))) continue;
    add(sha256(component.path) === component.sha256, `Changed component pixels: ${id}`);
    const size = pngSize(component.path);
    add(size.width === component.renderPixels.width && size.height === component.renderPixels.height, `Wrong PNG size for ${id}`);
  }

  const expectedLayerOrder = {
    far: ["chair-rear", "chair-seat", "actor", "chair-foreground", "desk-rear", "desk-surface", "monitor-back", "keyboard", "desk-base", "desk-foreground"],
    near: ["desk-rear", "desk-surface", "monitor-front", "keyboard", "desk-base", "desk-foreground", "chair-rear", "chair-seat", "actor", "chair-foreground"],
  };
  for (const orientation of ["far", "near"]) {
    const geometry = manifest.geometry[orientation];
    add(JSON.stringify(manifest.layerOrder[orientation]) === JSON.stringify(expectedLayerOrder[orientation]), `${orientation} layer order changed`);
    add(geometry.seatAnchor.x === geometry.hipAnchor.x && geometry.seatAnchor.y === geometry.hipAnchor.y, `${orientation} hip does not contact chair seat`);
    add(manifest.animation.maximumAnchorDriftPixels === 0, `${orientation} animation permits anchor drift`);
    add(inside(geometry.keyboard, geometry.support), `${orientation} keyboard pixels leave the desk support`);
    add(!intersects(geometry.monitor, geometry.keyboard), `${orientation} monitor pixels overlap keyboard pixels`);
    add(inside(geometry.monitorReservation, geometry.support), `${orientation} monitor reservation leaves the desk support`);
    add(inside(geometry.keyboardReservation, geometry.support), `${orientation} keyboard reservation leaves the desk support`);
  }

  add(manifest.reviewOutputs?.length === 8, "R04 must provide six deterministic boards and two browser captures");
  for (const output of manifest.reviewOutputs ?? []) add(existsSync(join(root, output)), `Missing R04 review output: ${output}`);

  const activeRegistry = readFileSync(join(root, activeRegistryPath), "utf8");
  add(!activeRegistry.includes("office-workstation-v3"), "Active Office registry imports R04 prototype assets");
  const main = readFileSync(join(root, mainPath), "utf8");
  add(main.includes('requestedLab === "office-workstation-v3-step5"'), "R04 dev-lab route is missing");
  add(main.includes("import.meta.env.DEV"), "R04 dev-lab route is not protected by DEV");
  const labSource = recursiveFiles(labDirectory).filter((path) => /\.(css|ts|tsx)$/.test(path))
    .map((path) => readFileSync(join(root, path), "utf8")).join("\n");
  add(labSource.includes("office-workstation-step5-single-seat-v4.json"), "R04 lab does not consume the v4 manifest");
  add(labSource.includes('data-active-office-promotion="false"'), "R04 lab does not expose the no-promotion assertion");
}

if (failures.length > 0) {
  process.stderr.write(`${failures.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write("Step 5 R04 P4-P6 check OK: component scale, two-direction assembly, browser evidence, and Active Office isolation are locked.\n");
}
