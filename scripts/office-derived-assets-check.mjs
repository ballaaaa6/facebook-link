import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { validateOfficeDerivedAssetManifest } from "../packages/contracts/src/officeDerivedAssets.ts";

const root = resolve(import.meta.dirname, "..");
const auditPath = join(root, "assets/game/manifests/office-asset-geometry-audit.json");
const manifestPath = join(root, "assets/game/manifests/office-derived-assets-v1.json");
const registryPath = join(root, "apps/web/src/features/office/components/officeAssetRegistry.ts");
const failures = [];

function hashFile(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

if (!existsSync(manifestPath)) {
  failures.push("Missing office-derived-assets-v1.json");
} else {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const audit = JSON.parse(readFileSync(auditPath, "utf8"));
  failures.push(...validateOfficeDerivedAssetManifest(manifest));

  const expectedIds = new Set(audit.records
    .filter(({ review }) => review.disposition === "derive-composite")
    .map(({ recordId }) => recordId));
  const actualIds = new Set(manifest.records.map(({ recordId }) => recordId));
  if (expectedIds.size !== 77 || actualIds.size !== 77) failures.push("Derivation coverage must contain 77 unique audit records");
  for (const id of expectedIds) {
    if (!actualIds.has(id)) failures.push(`Missing derivation record: ${id}`);
  }

  const waveCounts = Object.fromEntries(["step-13", "step-14", "step-15", "step-16"]
    .map((wave) => [wave, manifest.records.filter((record) => record.wave === wave).length]));
  if (JSON.stringify(waveCounts) !== JSON.stringify({ "step-13": 24, "step-14": 40, "step-15": 6, "step-16": 7 })) {
    failures.push(`Unexpected derivation wave counts: ${JSON.stringify(waveCounts)}`);
  }

  for (const record of manifest.records) {
    const sourcePath = join(root, record.source.file);
    if (!existsSync(sourcePath)) failures.push(`${record.recordId}: missing source ${record.source.file}`);
    else if (hashFile(sourcePath) !== record.source.sha256) failures.push(`${record.recordId}: source hash drift`);
    if (record.metrics.retainedAlphaPixels + record.metrics.removedAlphaPixels !== record.source.alphaPixels) {
      failures.push(`${record.recordId}: alpha pixel accounting is inconsistent`);
    }
    if (record.operation === "verified-noop-cleanup" && record.metrics.removedAlphaPixels !== 0) {
      failures.push(`${record.recordId}: verified no-op removed pixels`);
    }
    if (record.operation === "clean-largest-component-bounds" && record.metrics.removedAlphaPixels <= 0) {
      failures.push(`${record.recordId}: component cleanup did not remove pixels`);
    }
    for (const output of record.outputs) {
      if (!output.file.startsWith("assets/game/processed/office-derived-v1/")) {
        failures.push(`${record.recordId}: output escaped the versioned derived directory`);
        continue;
      }
      const outputPath = join(root, output.file);
      if (!existsSync(outputPath)) failures.push(`${record.recordId}: missing output ${output.file}`);
      else if (hashFile(outputPath) !== output.sha256) failures.push(`${record.recordId}: output hash drift ${output.file}`);
    }
  }

  if (manifest.counts.verifiedNoopCleanup !== 16) {
    failures.push(`Expected 16 review-preserving no-op derivatives, found ${manifest.counts.verifiedNoopCleanup}`);
  }
  for (const qaPath of Object.values(manifest.qa)) {
    if (!existsSync(join(root, qaPath))) failures.push(`Missing QA board: ${qaPath}`);
  }
}

if (readFileSync(registryPath, "utf8").includes("office-derived-v1")) {
  failures.push("Active Office registry must not import staging-derived assets");
}

if (failures.length) {
  console.error(`Office derived asset checks failed:\n${failures.map((failure) => `- ${failure}`).join("\n")}`);
  process.exit(1);
}
console.log("Office derived assets OK: 77 records, four staging-only waves, Active Office isolated.");
