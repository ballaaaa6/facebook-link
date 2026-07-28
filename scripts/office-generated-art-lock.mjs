import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const lockPath = join(root, "assets/game/manifests/office-generated-art.lock.json");
const auditPath = "assets/game/manifests/office-asset-geometry-audit.json";
const contactDirectory = "assets/game/processed/office-geometry-audit-v1/contact-sheets";
const workstationDirectory = "assets/game/processed/office-workstation-v1";
const workstationV2Directory = "assets/game/processed/office-workstation-v2";
const workstationV2ReviewDirectory = "assets/art/layout-references/office-workstation-v2/step4";
const derivedDirectory = "assets/game/processed/office-derived-v1";
const workstationSource = "assets/art/layout-references/office-workstation-v1/office-workstation-modular-v1-source.png";

const fixedInputs = [
  "apps/web/src/features/office/components/officeAssetRegistry.ts",
  "assets/game/characters/registry.json",
  "assets/game/manifests/office-asset-geometry-review.json",
  "assets/game/manifests/office-asset-geometry.schema.json",
  "assets/game/manifests/office-assets.json",
  "assets/game/manifests/office-camera-scale-bible.json",
  "assets/game/manifests/office-workstation-assembly-bible-v2.json",
  "assets/game/manifests/office-library-sheets.json",
  "assets/game/manifests/office-planned-assets.json",
  "assets/game/manifests/office-workstation-bundle-v1.json",
  "assets/game/manifests/office-workstation-bundle-v2.json",
  "assets/game/manifests/office-workstation-bundle.schema.json",
  "assets/game/manifests/office-workstation-bundle-v2.schema.json",
  "assets/game/manifests/office-workstation-deployment-v1.json",
  "assets/game/manifests/office-workstation-deployment.schema.json",
  "assets/game/manifests/office-map.schema.json",
  "assets/game/maps/office-ten-v1.json",
  "assets/game/manifests/office-derived-assets.schema.json",
  "packages/contracts/src/officeDerivedAssets.ts",
  "packages/contracts/src/officeWorkstationAssembly.ts",
  "packages/contracts/src/officeWorkstationV2.ts",
  "scripts/audit-office-asset-geometry.py",
  "scripts/build-office-camera-scale-board.py",
  "scripts/build-office-workstation-assembly-bible.py",
  "scripts/build-office-workstation-prototype.py",
  "scripts/build-office-workstation-v2.py",
  "scripts/build-office-derived-assets.py",
  "scripts/office_derived_asset_recipes.py",
  "scripts/office-derived-assets-check.mjs",
  "scripts/office-generated-art-lock.mjs",
  "scripts/office-workstation-authority-check.mjs",
  "scripts/office_geometry_audit_inventory.py",
  "scripts/office_geometry_audit_report.py",
  "scripts/office_geometry_audit_visuals.py",
  "assets/art/layout-references/office-workstation-v2/source/desk-workstation-modern-v2-prompt.md",
  "assets/art/layout-references/office-workstation-v2/source/desk-workstation-modern-v2-turnaround-chroma.png",
  "assets/art/layout-references/office-workstation-v2/source/desk-workstation-modern-v2-turnaround-alpha.png",
];

const fixedOutputs = [
  auditPath,
  "assets/game/manifests/office-derived-assets-v1.json",
  "assets/art/layout-references/office-camera-scale-calibration-v2.png",
  "assets/art/layout-references/office-workstation-v2/00-owner-review-contact-sheet-v2.png",
  "assets/art/layout-references/office-workstation-v2/01-target-decomposition-v2.png",
  "assets/art/layout-references/office-workstation-v2/02-furniture-exploded-parts-v2.png",
  "assets/art/layout-references/office-workstation-v2/03-assembly-and-adjacency-v2.png",
  "docs/art/OFFICE_ASSET_GEOMETRY_AUDIT.md",
];

function toRepoPath(path) {
  return relative(root, path).replaceAll("\\", "/");
}

function hashFile(repoPath) {
  const path = join(root, repoPath);
  if (!existsSync(path)) return null;
  const bytes = readFileSync(path);
  const content = /\.(json|md|mjs|py|ts)$/.test(repoPath)
    ? Buffer.from(bytes.toString("utf8").replaceAll("\r\n", "\n"), "utf8")
    : bytes;
  return createHash("sha256").update(content).digest("hex");
}

function hashMap(paths) {
  return Object.fromEntries(
    [...new Set(paths)].sort().map((path) => [path, hashFile(path)]),
  );
}

function contactSheets() {
  const path = join(root, contactDirectory);
  if (!existsSync(path)) return [];
  return readdirSync(path, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".png"))
    .map((entry) => `${contactDirectory}/${entry.name}`)
    .sort();
}

function workstationOutputs() {
  const path = join(root, workstationDirectory);
  if (!existsSync(path)) return [workstationSource];
  return [
    workstationSource,
    ...readdirSync(path, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => `${workstationDirectory}/${entry.name}`)
      .sort(),
  ];
}

function recursiveFiles(directory) {
  const absolute = join(root, directory);
  if (!existsSync(absolute)) return [];
  const files = [];
  function visit(path) {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const target = join(path, entry.name);
      if (entry.isDirectory()) visit(target);
      else if (entry.isFile()) files.push(toRepoPath(target));
    }
  }
  visit(absolute);
  return files.sort();
}

function buildLock() {
  if (!existsSync(join(root, auditPath))) {
    throw new Error(`Missing generated audit: ${auditPath}`);
  }
  const audit = JSON.parse(readFileSync(join(root, auditPath), "utf8"));
  const sourceFiles = audit.records
    .map((record) => record.sourceFile)
    .filter((path) => typeof path === "string" && path.length > 0);
  const contacts = contactSheets();
  const workstation = workstationOutputs();
  const workstationV2 = recursiveFiles(workstationV2Directory);
  const workstationV2Review = recursiveFiles(workstationV2ReviewDirectory);
  const derived = recursiveFiles(derivedDirectory);
  return {
    version: 1,
    purpose: "Portable CI freshness gate for generated Office audit, calibration, workstation, and derived artifacts",
    inputs: hashMap([...fixedInputs, ...sourceFiles]),
    outputs: hashMap([...fixedOutputs, ...contacts, ...workstation, ...workstationV2, ...workstationV2Review, ...derived]),
    exactContactSheets: contacts,
    exactWorkstationOutputs: workstation,
    exactWorkstationV2Outputs: workstationV2,
    exactWorkstationV2ReviewOutputs: workstationV2Review,
    exactDerivedOutputs: derived,
  };
}

function jsonText(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function validateLock(lock) {
  const failures = [];
  for (const [path, hash] of [...Object.entries(lock.inputs), ...Object.entries(lock.outputs)]) {
    if (hash === null) failures.push(`Missing locked file: ${path}`);
  }
  const audit = JSON.parse(readFileSync(join(root, auditPath), "utf8"));
  if (JSON.stringify(audit.contactSheets) !== JSON.stringify(lock.exactContactSheets)) {
    failures.push("Audit contact-sheet list does not match the exact generated directory contents");
  }
  if (JSON.stringify(workstationOutputs()) !== JSON.stringify(lock.exactWorkstationOutputs)) {
    failures.push("Workstation output list does not match the exact generated directory contents");
  }
  if (JSON.stringify(recursiveFiles(workstationV2Directory)) !== JSON.stringify(lock.exactWorkstationV2Outputs)) {
    failures.push("Workstation v2 output list does not match the exact generated directory contents");
  }
  if (JSON.stringify(recursiveFiles(workstationV2ReviewDirectory)) !== JSON.stringify(lock.exactWorkstationV2ReviewOutputs)) {
    failures.push("Workstation v2 review list does not match the exact generated directory contents");
  }
  if (JSON.stringify(recursiveFiles(derivedDirectory)) !== JSON.stringify(lock.exactDerivedOutputs)) {
    failures.push("Derived output list does not match the exact generated directory contents");
  }
  return failures;
}

function changedPaths(previous, next) {
  const paths = new Set([
    ...Object.keys(previous?.inputs ?? {}),
    ...Object.keys(previous?.outputs ?? {}),
    ...Object.keys(next.inputs),
    ...Object.keys(next.outputs),
  ]);
  return [...paths].filter((path) => {
    const previousHash = previous?.inputs?.[path] ?? previous?.outputs?.[path];
    const nextHash = next.inputs[path] ?? next.outputs[path];
    return previousHash !== nextHash;
  }).sort();
}

const args = process.argv.slice(2);
const nextLock = buildLock();
const failures = validateLock(nextLock);
if (failures.length > 0) {
  process.stderr.write(`${failures.join("\n")}\n`);
  process.exitCode = 1;
} else if (args.includes("--write")) {
  writeFileSync(lockPath, jsonText(nextLock));
  process.stdout.write(
    `Office generated-art lock updated: ${Object.keys(nextLock.inputs).length} inputs, `
      + `${Object.keys(nextLock.outputs).length} outputs.\n`,
  );
} else if (args.includes("--check")) {
  if (!existsSync(lockPath)) {
    process.stderr.write(`Missing generated-art lock: ${toRepoPath(lockPath)}\n`);
    process.exitCode = 1;
  } else if (readFileSync(lockPath, "utf8").replaceAll("\r\n", "\n") !== jsonText(nextLock)) {
    const previousLock = JSON.parse(readFileSync(lockPath, "utf8"));
    const changes = changedPaths(previousLock, nextLock);
    process.stderr.write(
      "Office generated artifacts or their inputs changed. Regenerate the audit and board, "
        + `then run npm run art:geometry:lock. Changed paths: ${changes.slice(0, 12).join(", ")}\n`,
    );
    process.exitCode = 1;
  } else {
    process.stdout.write(
      `Office generated-art lock OK: ${Object.keys(nextLock.inputs).length} inputs, `
        + `${Object.keys(nextLock.outputs).length} outputs.\n`,
    );
  }
} else {
  process.stderr.write("Use --write to update the lock or --check to verify it.\n");
  process.exitCode = 1;
}
