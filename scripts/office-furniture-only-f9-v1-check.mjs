import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  validateOfficeFurnitureOnlyRoomF9Manifest,
  validateOfficeFurnitureOnlyRoomF9Map,
} from "../packages/contracts/src/officeFurnitureOnlyRoomF9.ts";
import {
  pngSize,
  readJson,
  readText,
  recursiveFiles,
  root,
  same,
  sha256,
} from "./office-production-check-utils.mjs";

const manifestPath =
  "assets/game/manifests/office-furniture-only-f9-v1.json";
const mapPath = "assets/game/maps/office-furniture-only-f9-v1.json";
const builderPath = "scripts/build-office-furniture-only-f9-v1.py";
const docsPath = "docs/art/OFFICE_FURNITURE_ONLY_ROOM_F9_V1.md";
const processedRoot =
  "assets/game/processed/office-furniture-only-f9-v1";
const reviewRoot =
  "assets/art/layout-references/office-furniture-only-f9-v1";

const failures = [];
const add = (condition, message) => {
  if (!condition) failures.push(message);
};

function verifyFileEvidence(evidence, label) {
  add(
    evidence
      && typeof evidence.file === "string"
      && typeof evidence.sha256 === "string"
      && existsSync(join(root, evidence.file))
      && sha256(evidence.file) === evidence.sha256,
    `${label} is missing or stale`,
  );
}

function collectFileEvidence(value, results = []) {
  if (Array.isArray(value)) {
    for (const entry of value) collectFileEvidence(entry, results);
    return results;
  }
  if (!value || typeof value !== "object") return results;
  if (
    typeof value.file === "string"
    && typeof value.sha256 === "string"
  ) {
    results.push(value);
  }
  for (const entry of Object.values(value)) {
    collectFileEvidence(entry, results);
  }
  return results;
}

try {
  const manifest = readJson(manifestPath);
  const map = readJson(mapPath);
  for (const issue of validateOfficeFurnitureOnlyRoomF9Manifest(manifest)) {
    failures.push(`F9 manifest contract: ${issue}`);
  }
  for (const issue of validateOfficeFurnitureOnlyRoomF9Map(map)) {
    failures.push(`F9 map contract: ${issue}`);
  }

  add(
    manifest.map?.file === mapPath
      && manifest.map?.sha256 === sha256(mapPath),
    "F9 map hash is stale",
  );
  verifyFileEvidence(manifest.architecture?.background, "F9 background");
  verifyFileEvidence(manifest.architecture?.ownerMarkup, "F9 owner markup");

  for (const authority of manifest.authorityLedger ?? []) {
    verifyFileEvidence(
      {
        file: authority.manifest,
        sha256: authority.sha256,
      },
      `F9 authority ${authority.id}`,
    );
    const source = readJson(authority.manifest);
    add(
      source.id === authority.id
        && source.status === authority.status
        && (
          source.status === "owner-approved"
          || source.status === "owner-approved-p0-p3"
        ),
      `F9 authority approval changed: ${authority.id}`,
    );
  }

  for (const evidence of collectFileEvidence(manifest.assetLedger)) {
    verifyFileEvidence(evidence, `F9 runtime source ${evidence.file}`);
  }

  const processedFiles = [
    ...(manifest.layers ?? []).map((entry) => entry.path),
    manifest.cleanComposite?.file,
    manifest.debugComposite?.file,
  ].filter(Boolean);
  add(
    same(recursiveFiles(processedRoot), [...processedFiles].sort()),
    "F9 processed output set changed",
  );
  for (const entry of manifest.layers ?? []) {
    add(
      existsSync(join(root, entry.path))
        && same(pngSize(entry.path), entry.size)
        && sha256(entry.path) === entry.sha256,
      `F9 layer is stale: ${entry.path}`,
    );
  }
  for (const entry of [
    manifest.cleanComposite,
    manifest.debugComposite,
  ]) {
    add(
      entry
        && existsSync(join(root, entry.file))
        && same(pngSize(entry.file), entry.size)
        && sha256(entry.file) === entry.sha256,
      `F9 composite is stale: ${entry?.file}`,
    );
  }

  const reviewFiles = (manifest.reviewOutputs ?? []).map(
    (entry) => entry.path,
  );
  add(
    reviewFiles.length === 15
      && same(recursiveFiles(reviewRoot), [...reviewFiles].sort()),
    "F9 review output set changed",
  );
  for (const entry of manifest.reviewOutputs ?? []) {
    add(
      existsSync(join(root, entry.path))
        && same(pngSize(entry.path), entry.size)
        && sha256(entry.path) === entry.sha256,
      `F9 review board is stale: ${entry.path}`,
    );
  }

  const sideBank = (map.facilities ?? []).filter(
    (entry) => entry.wallRelationship === "right-edge",
  );
  add(
    map.interiorPlan?.workstationAnchorCell === "C12"
      && map.interiorPlan?.workstationArrangement?.rows === 2
      && map.interiorPlan?.workstationArrangement?.stationsPerRow === 5
      && map.workstations?.length === 10
      && sideBank.length === 3
      && sideBank.every(
        (entry) =>
          entry.visualOrientation === "left"
          && entry.origin?.[0] === 41,
      ),
    "F9 interior layout no longer matches the owner brief",
  );
  add(
    map.routeValidation?.queryCount === 200
      && map.routeValidation?.reachableCount === 200
      && map.routeValidation?.unreachableCount === 0
      && map.reservationStress?.durationSeconds === 300
      && map.reservationStress?.summary?.doubleBookingCount === 0
      && map.reservationStress?.summary?.leakedReservationCount === 0,
    "F9 route or reservation proof changed",
  );
  add(
    map.people?.visible === false
      && map.people?.placements?.length === 0
      && map.people?.spriteReferences?.length === 0
      && manifest.permissions?.activeOfficePromotion === false
      && manifest.gates?.F9?.status === "pending-owner-review"
      && manifest.gates?.F10?.status === "blocked",
    "F9 furniture-only stop gate changed",
  );

  const builder = readText(builderPath);
  add(
    builder.includes('"workstationAnchorCell": "C12"')
      && builder.includes('"right-edge-side-bank"')
      && builder.includes('"activeOfficePromotion": False')
      && !builder.includes("apps/web/src/features/office")
      && !builder.includes("assets/game/maps/office-c-v2.json"),
    "F9 builder boundary changed",
  );
  const docs = readText(docsPath);
  add(
    docs.includes("Status: F9 owner review")
      && docs.includes("C12:S19")
      && docs.includes("10 workstations")
      && docs.includes("200/200")
      && docs.includes("20 reservation slots")
      && docs.includes("F10 remains blocked"),
    "F9 documentation is incomplete",
  );

  const packageJson = readJson("package.json");
  add(
    packageJson.scripts?.["art:office:furniture-only:f9"]
      === "python scripts/build-office-furniture-only-f9-v1.py"
      && packageJson.scripts
        ?.["art:office:furniture-only:f9:rebuild:check"]
        === "python scripts/build-office-furniture-only-f9-v1.py --check"
      && packageJson.scripts?.["art:office:furniture-only:f9:check"]
        === "node scripts/office-furniture-only-f9-v1-check.mjs"
      && packageJson.scripts?.check
        ?.includes("art:office:furniture-only:f9:check"),
    "F9 package scripts are incomplete",
  );
} catch (error) {
  failures.push(error instanceof Error ? error.stack ?? error.message : String(error));
}

if (failures.length > 0) {
  process.stderr.write(`${failures.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    "Office Furniture-only Room F9 v1 OK: C12 two-row work island, "
      + "right-edge side bank, 20 slots, 200 routes, zero people, "
      + "and Active Office isolation verified.\n",
  );
}
