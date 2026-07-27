import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const lockPath = join(root, "assets/game/manifests/office-generated-art.lock.json");
const auditPath = "assets/game/manifests/office-asset-geometry-audit.json";
const contactDirectory = "assets/game/processed/office-geometry-audit-v1/contact-sheets";
const workstationDirectory = "assets/game/processed/office-workstation-v1";
const workstationSource = "assets/art/layout-references/office-workstation-v1/office-workstation-modular-v1-source.png";

const fixedInputs = [
  "apps/web/src/features/office/components/officeAssetRegistry.ts",
  "assets/game/characters/registry.json",
  "assets/game/manifests/office-asset-geometry-review.json",
  "assets/game/manifests/office-asset-geometry.schema.json",
  "assets/game/manifests/office-assets.json",
  "assets/game/manifests/office-camera-scale-bible.json",
  "assets/game/manifests/office-library-sheets.json",
  "assets/game/manifests/office-planned-assets.json",
  "assets/game/manifests/office-workstation-bundle-v1.json",
  "assets/game/manifests/office-workstation-bundle.schema.json",
  "scripts/audit-office-asset-geometry.py",
  "scripts/build-office-camera-scale-board.py",
  "scripts/build-office-workstation-prototype.py",
  "scripts/office-generated-art-lock.mjs",
  "scripts/office_geometry_audit_inventory.py",
  "scripts/office_geometry_audit_report.py",
  "scripts/office_geometry_audit_visuals.py",
];

const fixedOutputs = [
  auditPath,
  "assets/art/layout-references/office-camera-scale-calibration-v1.png",
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
  return {
    version: 1,
    purpose: "Portable CI freshness gate for generated Office audit, calibration, and workstation artifacts",
    inputs: hashMap([...fixedInputs, ...sourceFiles]),
    outputs: hashMap([...fixedOutputs, ...contacts, ...workstation]),
    exactContactSheets: contacts,
    exactWorkstationOutputs: workstation,
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
