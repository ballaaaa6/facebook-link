import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const auditPath = "assets/game/manifests/office-furniture-master-audit-v1.json";
const audit = JSON.parse(readFileSync(join(root, auditPath), "utf8"));
const failures = [];

const allowedDecisions = new Set([
  "authority-provenance-use-r05-r02-output",
  "reference-effects-only-use-neutral-front-source",
  "reference-regenerate-clean-modular-shell",
  "reject-regenerate-orientation-if-required",
  "reject-superseded-by-review-table-v3",
  "reject-use-r05-r02-authority",
  "salvage-full-master-and-decompose",
  "salvage-full-master-overlay",
  "salvage-full-master-reextract",
  "salvage-master-reextract",
]);
const allowedFamilyActions = new Set([
  "regenerate-clean-shell",
  "salvage-as-child-parts",
  "salvage-new-versioned-extraction",
  "salvage-preferred-master-then-decompose",
  "use-r05-r02-authority-not-master",
  "use-r05-r02-normalized-layers",
]);
const forbiddenSourcePrefixes = [
  "assets/game/processed/core-furniture-c-v1",
  "assets/game/processed/core-furniture-c-v2",
  "assets/game/processed/decor-mechanical-c-v1",
  "assets/game/processed/equipment-c-v1",
];

function hashFile(repoPath) {
  const bytes = readFileSync(join(root, repoPath));
  return createHash("sha256").update(bytes).digest("hex");
}

function checkHash(repoPath, expected, label) {
  if (!repoPath || !existsSync(join(root, repoPath))) {
    failures.push(`Missing ${label}: ${repoPath}`);
    return;
  }
  if (hashFile(repoPath) !== expected) failures.push(`Hash mismatch for ${label}: ${repoPath}`);
}

if (audit.version !== 1) failures.push("Audit version must be 1.");
if (audit.status !== "planning-audit-not-promotion-authority") {
  failures.push("Audit must remain planning-only.");
}
for (const [field, expected] of [
  ["processedCropDirectReuse", false],
  ["activeOfficePixelReuse", false],
  ["legacyOrRejectedPixelReuse", false],
  ["masterSalvageRequiresNewVersionedExtraction", true],
  ["salvageDoesNotWaiveF0ThroughF8", true],
  ["missingAssetFallback", false],
]) {
  if (audit.policy?.[field] !== expected) failures.push(`Invalid policy ${field}.`);
}

const records = audit.records ?? [];
const families = audit.families ?? [];
if (records.length !== audit.scope?.sourceRecordCount) failures.push("Source record count is stale.");
if (families.length !== audit.scope?.familyCount) failures.push("Family count is stale.");
if (audit.summary?.directlyReusableProcessedCrops !== 0) {
  failures.push("Processed crops must never be directly reusable.");
}
if (audit.summary?.roomReadyNonWorkstationFamilies !== 0) {
  failures.push("No non-workstation family may be room-ready after source audit.");
}

const recordIds = new Set();
const familyIds = new Set(families.map((family) => family.familyId));
const recordDecisionCounts = new Map();
let boundaryContactCount = 0;
for (const record of records) {
  if (recordIds.has(record.recordId)) failures.push(`Duplicate record id: ${record.recordId}`);
  recordIds.add(record.recordId);
  if (!familyIds.has(record.familyId)) failures.push(`Missing family plan for ${record.recordId}`);
  if (!record.sourcePath?.startsWith("assets/art/layout-references/")) {
    failures.push(`Source is not an original layout-reference master: ${record.recordId}`);
  }
  if (forbiddenSourcePrefixes.some((prefix) => record.sourcePath?.startsWith(prefix))) {
    failures.push(`Forbidden source path: ${record.recordId}`);
  }
  checkHash(record.sourcePath, record.sourceSha256, `source for ${record.recordId}`);
  const processed = record.processedEvidence;
  checkHash(processed?.path, processed?.sha256, `processed evidence for ${record.recordId}`);
  if (processed?.directReuseAllowed !== false) failures.push(`Direct crop reuse enabled: ${record.recordId}`);
  if (!record.sourcePixelEvidence?.visibleBounds) failures.push(`Missing visible bounds: ${record.recordId}`);
  if (record.sourcePixelEvidence?.nominalCellBoundaryContact) boundaryContactCount += 1;
  const decision = record.currentDecision?.decision;
  if (!allowedDecisions.has(decision)) failures.push(`Unknown decision for ${record.recordId}: ${decision}`);
  recordDecisionCounts.set(decision, (recordDecisionCounts.get(decision) ?? 0) + 1);
  if (record.sourceSheet === "env-12-facility-side-orientations"
    || record.sourceSheet === "env-13-lounge-storage-side-orientations") {
    if (decision !== "reject-regenerate-orientation-if-required") {
      failures.push(`Rejected side orientation became salvageable: ${record.recordId}`);
    }
  }
}

if (boundaryContactCount !== audit.summary?.recordsWithNominalCellBoundaryContact) {
  failures.push("Boundary-contact summary is stale.");
}
for (const [decision, count] of recordDecisionCounts) {
  if (audit.summary?.recordDecisions?.[decision] !== count) {
    failures.push(`Decision count is stale: ${decision}`);
  }
}

const familyActionCounts = new Map();
for (const family of families) {
  if (!allowedFamilyActions.has(family.action)) failures.push(`Unknown family action: ${family.familyId}`);
  familyActionCounts.set(family.action, (familyActionCounts.get(family.action) ?? 0) + 1);
  if (!Array.isArray(family.requiredPartsAndContracts) || family.requiredPartsAndContracts.length === 0) {
    failures.push(`Missing parts/contracts: ${family.familyId}`);
  }
  if (family.placementReadiness === "room-ready") failures.push(`Premature room-ready family: ${family.familyId}`);
  for (const recordId of [
    ...(family.salvageableSourceRecords ?? []),
    ...(family.rejectedOrSupersededSourceRecords ?? []),
  ]) {
    if (!recordIds.has(recordId)) failures.push(`Unknown family source record: ${family.familyId} -> ${recordId}`);
  }
}
for (const [action, count] of familyActionCounts) {
  if (audit.summary?.familyActions?.[action] !== count) failures.push(`Family action count is stale: ${action}`);
}

const authority = audit.approvedAuthority;
checkHash(authority?.manifest, authority?.manifestSha256, "R05-r02 authority manifest");
if (authority?.status !== "owner-approved-p0-p3") failures.push("R05-r02 authority status changed.");
if (!authority?.placementLimit?.includes("no rejected P4-P6 coordinates")) {
  failures.push("R05-r02 placement limit must reject P4-P6 coordinates.");
}
const authorityComponents = Object.entries(authority?.components ?? {});
if (new Set(authorityComponents.map(([name]) => name)).size !== 4) {
  failures.push("R05-r02 authority must contain four component families.");
}
for (const [component, value] of authorityComponents) {
  for (const file of value.files ?? []) checkHash(file.path, file.sha256, `R05-r02 ${component}`);
}

if (failures.length) {
  console.error(`Office furniture master audit failed:\n${failures.map((failure) => `- ${failure}`).join("\n")}`);
  process.exit(1);
}

console.log(
  `Office furniture master audit OK: ${records.length} source records, `
  + `${families.length} families, ${audit.scope.originalSourceFileCount} original masters; `
  + "zero processed crops or non-workstation families are placement-approved.",
);
