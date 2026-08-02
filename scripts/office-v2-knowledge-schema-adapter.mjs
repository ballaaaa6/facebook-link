import { findAssetAdmissionDiagnostic } from "./office-v2-knowledge-probes.mjs";
import {
  compareExpectedDiagnostic,
  validateSchema,
} from "./office-v2-knowledge-evidence.mjs";
import { evaluateBuildingTopologyFixture } from "./office-v2-building-topology-adapter.mjs";
import { rendererQaSchemaChecks } from "./office-v2-renderer-qa-evidence.mjs";

export function runSchemaEvidence(context, ajv) {
  const read = (path) => context.readJson(path);
  const checks = [
    ["world.schema.json", read("fixtures/minimal-office.json"), "minimal world", "fixtures/minimal-office.json"],
    ["building.schema.json", read("fixtures/building-topology-one-floor.json"), "one-floor topology", "fixtures/building-topology-one-floor.json"],
    ["building.schema.json", read("fixtures/building-topology-two-floors.json"), "two-floor topology", "fixtures/building-topology-two-floors.json"],
    ["building.schema.json", read("fixtures/building-topology-target-floor.json"), "target-floor topology", "fixtures/building-topology-target-floor.json"],
    ["scene-plan.schema.json", read("fixtures/scene-plan-target-floor.json")?.plan, "target-floor scene plan", "fixtures/scene-plan-target-floor.json"],
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
  const simulation = read("fixtures/simulation-contracts-v2.json");
  if (simulation) {
    for (const [index, command] of (simulation.commands ?? []).entries()) {
      checks.push(["simulation-command.schema.json", command, `simulation command ${index}`, "fixtures/simulation-contracts-v2.json"]);
    }
    checks.push(["simulation-result.schema.json", simulation.result, "simulation result", "fixtures/simulation-contracts-v2.json"]);
    checks.push(["simulation-event.schema.json", simulation.event, "simulation event", "fixtures/simulation-contracts-v2.json"]);
    checks.push(["activity-intent.schema.json", simulation.intent, "activity intent", "fixtures/simulation-contracts-v2.json"]);
    checks.push(["facility-slot.schema.json", simulation.facilitySlot, "facility slot", "fixtures/simulation-contracts-v2.json"]);
    checks.push(["queue-ticket.schema.json", simulation.queueTicket, "queue ticket", "fixtures/simulation-contracts-v2.json"]);
    checks.push(["reservation.schema.json", simulation.reservation, "reservation", "fixtures/simulation-contracts-v2.json"]);
    checks.push(["action-queue.schema.json", simulation.actionQueue, "action queue", "fixtures/simulation-contracts-v2.json"]);
    checks.push(["simulation-snapshot-v2.schema.json", simulation.snapshot, "simulation snapshot v2", "fixtures/simulation-contracts-v2.json"]);
    checks.push(["simulation-trace-v2.schema.json", simulation.trace, "simulation trace v2", "fixtures/simulation-contracts-v2.json"]);
  }
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
  for (const path of [
    "fixtures/invalid/simulation-command-id-conflict.json",
    "fixtures/invalid/simulation-command-scheduled-past.json",
    "fixtures/invalid/simulation-duplicate-resource.json",
    "fixtures/invalid/simulation-presentation-state.json",
    "fixtures/invalid/simulation-incomplete-migration.json",
  ]) {
    const rejected = read(path);
    if (rejected) {
      validateSchema(
        context,
        ajv,
        rejected.schema,
        rejected.document,
        `${path} shape`,
        rejected.expectedSchemaValid === true,
        path,
      );
    }
  }
  const unsupportedPath = "fixtures/invalid/proof-workstation-unsupported-mask.json";
  const unsupported = read(unsupportedPath);
  if (unsupported) {
    validateSchema(context, ajv, unsupported.schema, unsupported.document, "unsupported proof workstation mask shape", true, unsupportedPath);
  }

  const rendererQa = read("fixtures/renderer-qa-contracts-v1.json");
  if (rendererQa) {
    for (const [schema, document, label] of rendererQaSchemaChecks(rendererQa)) {
      validateSchema(context, ajv, schema, document, label, true, "fixtures/renderer-qa-contracts-v1.json");
    }
  }
  const rendererBundle = read("fixtures/lab/renderer-benchmark-bundle-v1.json");
  if (rendererBundle) {
    validateSchema(context, ajv, "renderer-benchmark-bundle.schema.json", rendererBundle.document, "synthetic renderer benchmark bundle", true, "fixtures/lab/renderer-benchmark-bundle-v1.json");
  }
  const rendererRejections = read("fixtures/invalid/renderer-qa-rejections.json");
  if (rendererRejections) {
    for (const entry of rendererRejections.cases ?? []) {
      validateSchema(context, ajv, entry.schema, entry.document, `${entry.name} renderer/QA rejection shape`, entry.expectedSchemaValid === true, "fixtures/invalid/renderer-qa-rejections.json");
    }
  }
}
