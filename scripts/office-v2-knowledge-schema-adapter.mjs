import { findAssetAdmissionDiagnostic } from "./office-v2-knowledge-probes.mjs";
import {
  compareExpectedDiagnostic,
  validateSchema,
} from "./office-v2-knowledge-evidence.mjs";
import { evaluateBuildingTopologyFixture } from "./office-v2-building-topology-adapter.mjs";

export function runSchemaEvidence(context, ajv) {
  const read = (path) => context.readJson(path);
  const checks = [
    ["world.schema.json", read("fixtures/minimal-office.json"), "minimal world", "fixtures/minimal-office.json"],
    ["building.schema.json", read("fixtures/building-topology-one-floor.json"), "one-floor topology", "fixtures/building-topology-one-floor.json"],
    ["building.schema.json", read("fixtures/building-topology-two-floors.json"), "two-floor topology", "fixtures/building-topology-two-floors.json"],
    ["connectivity.schema.json", read("fixtures/connected-desk.json"), "connected desk", "fixtures/connected-desk.json"],
    ["connectivity.schema.json", read("fixtures/proof-workstation-connectivity-v2.json")?.definition, "proof workstation", "fixtures/proof-workstation-connectivity-v2.json"],
    ["entity-definition.schema.json", read("fixtures/placement-rotation-clearance.json")?.definition, "placement definition", "fixtures/placement-rotation-clearance.json"],
    ["interaction.schema.json", read("fixtures/interaction-cancel-timeout.json")?.definition, "interaction definition", "fixtures/interaction-cancel-timeout.json"],
    ["simulation-trace.schema.json", read("fixtures/deterministic-replay.json"), "replay trace shape", "fixtures/deterministic-replay.json"],
    ["asset.schema.json", read("fixtures/asset-family-valid.json"), "valid asset family", "fixtures/asset-family-valid.json"],
    ["definition-bundle.schema.json", read("fixtures/definition-bundle-v2.json"), "valid definition bundle", "fixtures/definition-bundle-v2.json"],
    ["room-template.schema.json", read("fixtures/room-template-ground-floor.json"), "valid ground-floor room template", "fixtures/room-template-ground-floor.json"],
    ["asset.schema.json", read("templates/asset-family-manifest.json"), "asset template"],
    ["interaction.schema.json", read("templates/interaction-definition.json"), "interaction template"],
  ];
  const structures = read("fixtures/room-structure-cutaway.json")?.definitions ?? [];
  for (const definition of structures) checks.push(["surface-structure.schema.json", definition, `structure ${definition.definitionId}`, "fixtures/room-structure-cutaway.json"]);
  const snapshots = read("fixtures/operations-states.json")?.snapshots ?? [];
  for (const snapshot of snapshots) checks.push(["operations-snapshot.schema.json", snapshot, `operations ${snapshot.snapshotId}`, "fixtures/operations-states.json"]);
  for (const fixturePath of [
    "fixtures/invalid/building-topology-direction-mismatch.json",
    "fixtures/invalid/building-topology-duplicate-floor.json",
    "fixtures/invalid/building-topology-duplicate-portal.json",
    "fixtures/invalid/building-topology-elevation-floor.json",
    "fixtures/invalid/building-topology-exterior-overlap.json",
    "fixtures/invalid/building-topology-incomplete-migration.json",
    "fixtures/invalid/building-topology-missing-endpoint.json",
    "fixtures/invalid/building-topology-missing-landing.json",
  ]) {
    const evaluation = evaluateBuildingTopologyFixture({ knowledgeRoot: context.knowledgeRoot, fixturePath });
    checks.push(["building.schema.json", evaluation.document, `${fixturePath} topology shape`, fixturePath]);
  }
  for (const [schema, document, label, fixturePath] of checks) {
    if (document) validateSchema(context, ajv, schema, document, label, true, fixturePath);
  }

  const rejectedAssetPath = "fixtures/invalid/asset-admission.json";
  const rejectedAsset = read(rejectedAssetPath);
  if (rejectedAsset) {
    const result = validateSchema(context, ajv, rejectedAsset.schema, rejectedAsset.document, "rejected asset", false, rejectedAssetPath);
    compareExpectedDiagnostic(context, rejectedAssetPath, rejectedAsset.expectedFailure, findAssetAdmissionDiagnostic(result.errors));
  }
  for (const path of ["fixtures/invalid/connectivity-missing-mask.json", "fixtures/invalid/world-overlap.json"]) {
    const rejected = read(path);
    if (rejected) validateSchema(context, ajv, rejected.schema, rejected.document, `${path} shape`, true, path);
  }
  const unsupportedPath = "fixtures/invalid/proof-workstation-unsupported-mask.json";
  const unsupported = read(unsupportedPath);
  if (unsupported) {
    validateSchema(context, ajv, unsupported.schema, unsupported.document, "unsupported proof workstation mask shape", true, unsupportedPath);
  }
}
