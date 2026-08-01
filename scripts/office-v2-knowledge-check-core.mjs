import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import {
  evaluateConnectivityDefinition,
  evaluateUnsupportedProofWorkstationFixture,
  proofWorkstationFixturePath,
  rejectedProofWorkstationFixturePath,
} from "./office-v2-proof-workstation-evidence.mjs";
import { expectedKnowledge, fixtureRegistry } from "./office-v2-knowledge-manifest.mjs";
import {
  connectivityFailures,
  evaluateConnectivity,
  evaluateDepth,
  evaluateInteraction,
  evaluatePlacement,
  evaluateProjection,
  evaluateReservation,
  evaluateStructure,
  findAssetAdmissionDiagnostic,
  findPath,
  findWorldOverlap,
  same,
} from "./office-v2-knowledge-probes.mjs";
import { evaluateCommonV2Case } from "./office-v2-common-v2-evidence.mjs";
const repositoryRoot = resolve(import.meta.dirname, "..");
export const defaultKnowledgeRoot = join(repositoryRoot, "docs", "office-v2");
function collectFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).flatMap((name) => {
    const absolute = join(directory, name);
    return statSync(absolute).isDirectory() ? collectFiles(absolute) : [absolute];
  });
}

function createContext(knowledgeRoot) {
  const diagnostics = [];
  return {
    knowledgeRoot,
    diagnostics,
    inventory: { totalFiles: 0, schemaFiles: 0, fixtureFiles: 0 },
    coverage: {
      declaredCases: 0,
      executedCases: 0,
      declaredCaseIds: [],
      executedCaseIds: [],
      evidencedFixtureFiles: 0,
      evidencedFixtureIds: [],
    },
    evidence: { schemaShape: 0, semantic: 0, semanticRules: 0, reducerReplay: 0, propertyModel: 0, exactDiagnostics: 0 },
    evidencedFixtures: new Set(),
    add(code, message, context = {}, owner = "knowledge") {
      diagnostics.push({ code, owner, version: 1, message, context });
    },
    readJson(path) {
      try {
        return JSON.parse(readFileSync(join(knowledgeRoot, path), "utf8"));
      } catch (error) {
        this.add("knowledge.invalid-json", `Invalid JSON: ${path}`, { path, reason: error.message });
        return null;
      }
    },
  };
}

export function createOfficeSchemaValidator({ knowledgeRoot = defaultKnowledgeRoot } = {}) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const schemaDirectory = join(knowledgeRoot, "schemas");
  for (const file of readdirSync(schemaDirectory).filter((name) => name.endsWith(".schema.json")).sort()) {
    ajv.addSchema(JSON.parse(readFileSync(join(schemaDirectory, file), "utf8")));
  }
  return ajv;
}

function checkInventory(context) {
  const expected = Object.values(expectedKnowledge).flat().toSorted();
  const actual = collectFiles(context.knowledgeRoot)
    .map((file) => relative(context.knowledgeRoot, file).replaceAll("\\", "/"))
    .filter((path) => path.endsWith(".md") || path.endsWith(".json"))
    .toSorted();
  context.inventory = {
    totalFiles: actual.length,
    schemaFiles: actual.filter((path) => path.startsWith("schemas/") && path.endsWith(".schema.json")).length,
    fixtureFiles: actual.filter((path) => path.startsWith("fixtures/") && path.endsWith(".json")).length,
  };
  for (const path of expected) {
    const absolute = join(context.knowledgeRoot, path);
    if (!existsSync(absolute)) context.add("knowledge.missing-file", `Missing knowledge file: ${path}`, { path });
    else if (readFileSync(absolute).length === 0) context.add("knowledge.empty-file", `Empty knowledge file: ${path}`, { path });
  }
  for (const path of actual.filter((path) => !expected.includes(path))) {
    context.add("knowledge.unregistered-file", `Unregistered knowledge file: ${path}`, { path });
  }
  for (const path of expected.filter((path) => !actual.includes(path))) {
    context.add("knowledge.inventory-path-missing", `Inventory path not found: ${path}`, { path });
  }
  for (const path of actual.filter((path) => path.endsWith(".json"))) context.readJson(path);

  const registered = fixtureRegistry.map(({ path }) => path).toSorted();
  const expectedFixtures = expectedKnowledge.fixtures.toSorted();
  for (const path of expectedFixtures.filter((path) => !registered.includes(path))) {
    context.add("knowledge.unregistered-fixture", `Fixture has no execution registry entry: ${path}`, { path });
  }
  for (const path of registered.filter((path) => !expectedFixtures.includes(path))) {
    context.add("knowledge.unknown-fixture-registration", `Fixture registry entry is not inventoried: ${path}`, { path });
  }
}

function validateSchema(context, ajv, schemaName, document, label, shouldPass = true, fixturePath = null) {
  context.evidence.schemaShape += 1;
  if (fixturePath) context.evidencedFixtures.add(fixturePath);
  const schemaId = `https://affiliate-operations.example/schemas/office-v2/${schemaName}`;
  const validate = ajv.getSchema(schemaId);
  if (!validate) {
    context.add("knowledge.schema-not-registered", `${label}: schema not registered`, { schemaName });
    return { valid: false, errors: [] };
  }
  const valid = validate(document);
  const errors = structuredClone(validate.errors ?? []);
  if (valid !== shouldPass) {
    context.add(
      "knowledge.schema-expectation-mismatch",
      `${label}: expected schema validation to ${shouldPass ? "pass" : "reject"}`,
      { schemaName, errors },
    );
  }
  return { valid, errors };
}

function compareExpectedDiagnostic(context, fixturePath, expectedCode, actual) {
  context.evidencedFixtures.add(fixturePath);
  if (actual?.code === expectedCode) {
    context.evidence.exactDiagnostics += 1;
    return;
  }
  context.add(
    "knowledge.expected-diagnostic-mismatch",
    `${fixturePath}: expected diagnostic ${expectedCode}, received ${actual?.code ?? "none"}`,
    { fixture: fixturePath, expectedCode, actualDiagnostic: actual ?? null },
  );
}

function runSchemaEvidence(context, ajv) {
  const read = (path) => context.readJson(path);
  const checks = [
    ["world.schema.json", read("fixtures/minimal-office.json"), "minimal world", "fixtures/minimal-office.json"],
    ["connectivity.schema.json", read("fixtures/connected-desk.json"), "connected desk", "fixtures/connected-desk.json"],
    ["connectivity.schema.json", read("fixtures/proof-workstation-connectivity-v2.json")?.definition, "proof workstation", "fixtures/proof-workstation-connectivity-v2.json"],
    ["entity-definition.schema.json", read("fixtures/placement-rotation-clearance.json")?.definition, "placement definition", "fixtures/placement-rotation-clearance.json"],
    ["interaction.schema.json", read("fixtures/interaction-cancel-timeout.json")?.definition, "interaction definition", "fixtures/interaction-cancel-timeout.json"],
    ["simulation-trace.schema.json", read("fixtures/deterministic-replay.json"), "replay trace shape", "fixtures/deterministic-replay.json"],
    ["asset.schema.json", read("fixtures/asset-family-valid.json"), "valid asset family", "fixtures/asset-family-valid.json"],
    ["asset.schema.json", read("templates/asset-family-manifest.json"), "asset template"],
    ["interaction.schema.json", read("templates/interaction-definition.json"), "interaction template"],
  ];
  const structures = read("fixtures/room-structure-cutaway.json")?.definitions ?? [];
  for (const definition of structures) checks.push(["surface-structure.schema.json", definition, `structure ${definition.definitionId}`, "fixtures/room-structure-cutaway.json"]);
  const snapshots = read("fixtures/operations-states.json")?.snapshots ?? [];
  for (const snapshot of snapshots) checks.push(["operations-snapshot.schema.json", snapshot, `operations ${snapshot.snapshotId}`, "fixtures/operations-states.json"]);
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

function mismatch(context, fixture, entry, subject, actual, expected) {
  if (same(actual, expected)) return;
  context.add(
    "knowledge.fixture-mismatch",
    `${fixture} (${entry.name}): ${subject} mismatch`,
    { fixture, caseName: entry.name, subject, actual, expected },
  );
}

function caseKind(entry) {
  if (entry.kind) return entry.kind;
  if (entry.start && entry.goal && entry.expectedPath) return "path";
  if (entry.requests && entry.expectedOwner && entry.expectedWaiting) return "reservation";
  return null;
}

function executeCase(context, registration, fixture, entry, ajv) {
  const { path, caseRunner } = registration;
  const handled = (
    (caseRunner === "projection" && entry.world && entry.screen)
    || (caseRunner === "placement" && entry.anchor && entry.orientation && entry.expected)
    || (caseRunner === "depth" && entry.entities && entry.expectedBackToFront)
    || (caseRunner === "connectivity" && entry.cells && entry.expectedMasks)
    || (caseRunner === "interaction" && entry.events && entry.expected)
    || (caseRunner === "structure" && typeof entry.state === "string" && typeof entry.expectedTraversable === "boolean")
    || (caseRunner === "common-v2" && (typeof entry.definition === "string" || typeof entry.semantic === "string"))
    || (caseRunner === "navigation" && ["path", "reservation"].includes(caseKind(entry)))
  );
  if (!handled) {
    context.add("knowledge.unhandled-fixture-case", `${path}: unhandled fixture case ${entry?.name ?? "<unnamed>"}`, { fixture: path, case: entry });
    return;
  }
  context.coverage.executedCases += 1;
  context.coverage.executedCaseIds.push(`${path}#${entry.name}`);
  context.evidencedFixtures.add(path);
  context.evidence.semantic += 1;
  try {
    if (caseRunner === "projection") {
      const result = evaluateProjection(fixture, entry);
      mismatch(context, path, entry, "forward projection", result.projected, entry.screen);
      mismatch(context, path, entry, "algebraic center-point inverse", result.inverse, entry.world);
    } else if (caseRunner === "placement") {
      const result = evaluatePlacement(fixture, entry);
      mismatch(context, path, entry, "placement result", result.result, entry.expected);
      if (entry.expectedCells) mismatch(context, path, entry, "rotated footprint", result.footprint, entry.expectedCells);
    } else if (caseRunner === "depth") {
      mismatch(context, path, entry, "depth order", evaluateDepth(entry), entry.expectedBackToFront);
    } else if (caseRunner === "connectivity") {
      mismatch(context, path, entry, "connectivity masks", evaluateConnectivity(entry), entry.expectedMasks);
    } else if (caseRunner === "interaction") {
      const result = evaluateInteraction(fixture, entry);
      mismatch(context, path, entry, "interaction terminal result", result.result, entry.expected);
      if (entry.expectedReservationReleased !== undefined) {
        mismatch(context, path, entry, "reservation release", result.reservationReleased, entry.expectedReservationReleased);
      }
    } else if (caseRunner === "structure") {
      mismatch(context, path, entry, "structure traversability", evaluateStructure(fixture, entry).traversable, entry.expectedTraversable);
    } else if (caseRunner === "common-v2") {
      const result = evaluateCommonV2Case(ajv, entry);
      const expectedValid = entry.expectedValid === true;
      mismatch(context, path, entry, "common V2 schema validity", result.valid, expectedValid);
      if (!expectedValid) compareExpectedDiagnostic(context, path, entry.expectedFailure, result.diagnostic);
    } else if (caseKind(entry) === "path") {
      const result = findPath(fixture, entry);
      mismatch(context, path, entry, "navigation path", result.path, entry.expectedPath);
      if (entry.expectedStepCount !== undefined) mismatch(context, path, entry, "navigation step count", result.stepCount, entry.expectedStepCount);
      if (entry.expectedCost !== undefined) mismatch(context, path, entry, "navigation cost", result.totalCost, entry.expectedCost);
      if (fixture.costModel?.cardinalStepCost !== undefined) mismatch(context, path, entry, "navigation step cost unit", result.stepCost, fixture.costModel.cardinalStepCost);
      if (fixture.costModel?.heuristicUnit !== undefined) mismatch(context, path, entry, "navigation heuristic unit", result.heuristicUnit, fixture.costModel.heuristicUnit);
    } else {
      const result = evaluateReservation(entry);
      mismatch(context, path, entry, "reservation owner", result.owner, entry.expectedOwner);
      mismatch(context, path, entry, "reservation wait order", result.waiting, entry.expectedWaiting);
    }
  } catch (error) {
    context.add("knowledge.fixture-probe-error", `${path} (${entry.name}): probe failed`, { fixture: path, caseName: entry.name, reason: error.message });
  }
}

function runFixtureCases(context, ajv) {
  for (const registration of fixtureRegistry) {
    const fixture = context.readJson(registration.path);
    if (!fixture) continue;
    if (registration.caseRunner === "connectivity") {
      const definition = fixture.definition ?? fixture;
      const evaluation = evaluateConnectivityDefinition(registration.path, definition);
      context.evidence.semanticRules += evaluation.semanticRules;
      for (const diagnostic of evaluation.diagnostics) {
        context.add(diagnostic.code, diagnostic.message, diagnostic.context, diagnostic.owner);
      }
    }
    const cases = Array.isArray(fixture.cases) ? fixture.cases : [];
    context.coverage.declaredCases += cases.length;
    const names = new Set();
    for (const [index, entry] of cases.entries()) {
      context.coverage.declaredCaseIds.push(`${registration.path}#${entry?.name ?? `<index:${index}>`}`);
      if (!entry || typeof entry.name !== "string" || names.has(entry.name)) {
        context.add("knowledge.duplicate-fixture-case", `${registration.path}: case names must be present and unique`, { fixture: registration.path, caseName: entry?.name ?? null });
      } else names.add(entry.name);
      if (!registration.caseRunner) {
        context.add("knowledge.unhandled-fixture-case", `${registration.path}: fixture declares cases without a runner`, { fixture: registration.path, case: entry });
      } else executeCase(context, registration, fixture, entry, ajv);
    }
  }
}

function runNegativeDiagnostics(context) {
  const connectivityPath = "fixtures/invalid/connectivity-missing-mask.json";
  const connectivity = context.readJson(connectivityPath);
  if (connectivity) {
    const missingMasks = connectivityFailures(connectivity.document);
    const actual = missingMasks.length ? {
      code: "connectivity.missing-variant",
      owner: "connectivity",
      version: 1,
      message: "A supported connectivity mask has no variant.",
      context: { missingMasks },
    } : null;
    compareExpectedDiagnostic(context, connectivityPath, connectivity.expectedFailure, actual);
  }
  const unsupportedPath = rejectedProofWorkstationFixturePath;
  const unsupported = context.readJson(unsupportedPath);
  if (unsupported) {
    const proof = context.readJson(proofWorkstationFixturePath);
    const evaluation = evaluateUnsupportedProofWorkstationFixture(unsupported, proof?.definition);
    if (!evaluation.definitionMatches) {
      context.add(
        "knowledge.proof-workstation-definition-mismatch",
        "Unsupported-mask fixture must use the proof workstation definition unchanged.",
        { fixture: unsupportedPath },
      );
    }
    compareExpectedDiagnostic(context, unsupportedPath, unsupported.expectedFailure, evaluation.diagnostic);
  }
  const worldPath = "fixtures/invalid/world-overlap.json";
  const world = context.readJson(worldPath);
  if (world) {
    const overlap = findWorldOverlap(world);
    const actual = overlap ? {
      code: "world.occupied",
      owner: "world",
      version: 1,
      message: "Two blocking entities occupy the same world cell.",
      context: overlap,
    } : null;
    compareExpectedDiagnostic(context, worldPath, world.expectedFailure, actual);
  }
}

function finalizeFixtureEvidence(context) {
  const evidenced = [...context.evidencedFixtures].toSorted();
  context.coverage.evidencedFixtureIds = evidenced;
  context.coverage.evidencedFixtureFiles = evidenced.length;
  for (const { path } of fixtureRegistry.filter(({ path }) => !context.evidencedFixtures.has(path))) {
    context.add("knowledge.fixture-without-evidence", `${path}: registered fixture produced no evidence`, { fixture: path });
  }
}

export function evaluateOfficeKnowledge({ knowledgeRoot = defaultKnowledgeRoot } = {}) {
  const context = createContext(knowledgeRoot);
  checkInventory(context);
  if (context.diagnostics.length === 0) {
    try {
      const ajv = createOfficeSchemaValidator({ knowledgeRoot });
      runSchemaEvidence(context, ajv);
      runFixtureCases(context, ajv);
      runNegativeDiagnostics(context);
      finalizeFixtureEvidence(context);
    } catch (error) {
      context.add("knowledge.evaluation-failed", "Knowledge evaluation could not complete.", { reason: error.message });
    }
  }
  return {
    ok: context.diagnostics.length === 0,
    diagnostics: context.diagnostics,
    inventory: context.inventory,
    coverage: context.coverage,
    evidence: context.evidence,
  };
}

export function formatKnowledgeReport(report) {
  if (!report.ok) return `Office V2 knowledge FAILED: ${report.diagnostics.length} diagnostic(s).`;
  const { inventory, coverage, evidence } = report;
  return `Office V2 knowledge OK: ${inventory.totalFiles} files inventoried, ${inventory.schemaFiles} schemas loaded, ${coverage.evidencedFixtureFiles}/${inventory.fixtureFiles} fixture files evidenced; ${coverage.executedCases}/${coverage.declaredCases} declared semantic cases executed; evidence: schema-shape ${evidence.schemaShape}, semantic cases ${evidence.semantic}, semantic rules ${evidence.semanticRules}, exact diagnostics ${evidence.exactDiagnostics}, reducer/replay ${evidence.reducerReplay}, property/model ${evidence.propertyModel}. Scope remains bounded probes only; no inverse-picking, crowd-replay, or asset-factory readiness is claimed.`;
}

function formatDiagnostics(diagnostics) {
  return diagnostics.map(({ code, message, context }) => `- [${code}] ${message} (${JSON.stringify(context)})`).join("\n");
}

export function runKnowledgeCheck({ knowledgeRoot = defaultKnowledgeRoot, logger = console.log } = {}) {
  const report = evaluateOfficeKnowledge({ knowledgeRoot });
  if (!report.ok) throw new Error(formatDiagnostics(report.diagnostics));
  const output = formatKnowledgeReport(report);
  if (typeof logger === "function") logger(output);
  else logger.log(output);
  return report;
}
