import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { expectedKnowledge, fixtureRegistry } from "./office-v2-knowledge-manifest.mjs";
import { same } from "./office-v2-knowledge-probes.mjs";

const repositoryRoot = resolve(import.meta.dirname, "..");
export const defaultKnowledgeRoot = join(repositoryRoot, "docs", "office-v2");

function collectFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).flatMap((name) => {
    const absolute = join(directory, name);
    return statSync(absolute).isDirectory() ? collectFiles(absolute) : [absolute];
  });
}

export function createContext(knowledgeRoot) {
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

export function checkInventory(context) {
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

export function validateSchema(context, ajv, schemaName, document, label, shouldPass = true, fixturePath = null) {
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

export function compareExpectedDiagnostic(context, fixturePath, expectedCode, actual) {
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

export function mismatch(context, fixture, entry, subject, actual, expected) {
  if (same(actual, expected)) return;
  context.add(
    "knowledge.fixture-mismatch",
    `${fixture} (${entry.name}): ${subject} mismatch`,
    { fixture, caseName: entry.name, subject, actual, expected },
  );
}

export function caseKind(entry) {
  if (entry.kind) return entry.kind;
  if (entry.start && entry.goal && entry.expectedPath) return "path";
  if (entry.requests && entry.expectedOwner && entry.expectedWaiting) return "reservation";
  return null;
}

export function finalizeFixtureEvidence(context) {
  const evidenced = [...context.evidencedFixtures].toSorted();
  context.coverage.evidencedFixtureIds = evidenced;
  context.coverage.evidencedFixtureFiles = evidenced.length;
  for (const { path } of fixtureRegistry.filter(({ path }) => !context.evidencedFixtures.has(path))) {
    context.add("knowledge.fixture-without-evidence", `${path}: registered fixture produced no evidence`, { fixture: path });
  }
}
