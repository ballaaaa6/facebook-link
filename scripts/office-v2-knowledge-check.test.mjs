import assert from "node:assert/strict";
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import test from "node:test";
import {
  evaluateOfficeKnowledge,
  formatKnowledgeReport,
  runKnowledgeCheck,
} from "./office-v2-knowledge-check.mjs";
import { findPath } from "./office-v2-knowledge-probes.mjs";

const repositoryRoot = resolve(import.meta.dirname, "..");
const knowledgeRoot = join(repositoryRoot, "docs", "office-v2");

function collectFiles(directory) {
  return readdirSync(directory).flatMap((name) => {
    const absolute = join(directory, name);
    return statSync(absolute).isDirectory() ? collectFiles(absolute) : [absolute];
  });
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function expectedInventory(root) {
  const knowledgeFiles = collectFiles(root)
    .map((file) => relative(root, file).replaceAll("\\", "/"))
    .filter((file) => file.endsWith(".md") || file.endsWith(".json"));
  return {
    totalFiles: knowledgeFiles.length,
    schemaFiles: knowledgeFiles.filter((file) => file.startsWith("schemas/") && file.endsWith(".schema.json")).length,
    fixtureFiles: knowledgeFiles.filter((file) => file.startsWith("fixtures/") && file.endsWith(".json")).length,
  };
}

function expectedFixtureCounts(root) {
  const fixtureRoot = join(root, "fixtures");
  const fixtures = collectFiles(fixtureRoot)
    .filter((file) => file.endsWith(".json"))
    .map(readJson);
  return {
    declaredCases: fixtures.reduce((total, fixture) => total + (fixture.cases?.length ?? 0), 0),
    exactDiagnostics: fixtures.filter((fixture) => typeof fixture.expectedFailure === "string").length,
  };
}

function withKnowledgeCopy(callback) {
  const temporaryRoot = mkdtempSync(join(tmpdir(), "office-v2-knowledge-"));
  const copyRoot = join(temporaryRoot, "office-v2");
  cpSync(knowledgeRoot, copyRoot, { recursive: true });
  try {
    return callback(copyRoot);
  } finally {
    rmSync(temporaryRoot, { force: true, recursive: true });
  }
}

function hasDiagnostic(report, code) {
  return report.diagnostics.some((diagnostic) => diagnostic.code === code);
}

test("real knowledge root passes with filesystem-derived inventory and complete case coverage", () => {
  const inventory = expectedInventory(knowledgeRoot);
  const fixtureCounts = expectedFixtureCounts(knowledgeRoot);
  const report = evaluateOfficeKnowledge({ knowledgeRoot });

  assert.equal(report.ok, true, JSON.stringify(report.diagnostics, null, 2));
  assert.deepEqual(report.inventory, inventory);
  assert.equal(report.coverage.declaredCases, fixtureCounts.declaredCases);
  assert.equal(report.coverage.executedCases, fixtureCounts.declaredCases);
  assert.deepEqual(report.coverage.executedCaseIds, report.coverage.declaredCaseIds);
  assert.equal(new Set(report.coverage.executedCaseIds).size, report.coverage.executedCases);
  assert.equal(report.coverage.evidencedFixtureFiles, inventory.fixtureFiles);
  assert.equal(new Set(report.coverage.evidencedFixtureIds).size, inventory.fixtureFiles);
  assert.equal(report.evidence.semantic, fixtureCounts.declaredCases);
  assert.equal(report.evidence.exactDiagnostics, fixtureCounts.exactDiagnostics);
  assert.ok(report.evidence.schemaShape > 0);
});

test("a failed evaluation cannot leak state into the next invocation", () => {
  withKnowledgeCopy((copyRoot) => {
    unlinkSync(join(copyRoot, "FOUNDATIONS.md"));

    const rejected = evaluateOfficeKnowledge({ knowledgeRoot: copyRoot });
    const accepted = evaluateOfficeKnowledge({ knowledgeRoot });

    assert.equal(rejected.ok, false);
    assert.ok(rejected.diagnostics.length > 0);
    assert.deepEqual(rejected.inventory, expectedInventory(copyRoot));
    assert.equal(accepted.ok, true, JSON.stringify(accepted.diagnostics, null, 2));
    assert.deepEqual(accepted.inventory, expectedInventory(knowledgeRoot));
  });
});

test("a failed evaluation cannot be formatted as an OK report", () => {
  withKnowledgeCopy((copyRoot) => {
    unlinkSync(join(copyRoot, "FOUNDATIONS.md"));
    const report = evaluateOfficeKnowledge({ knowledgeRoot: copyRoot });
    const formatted = formatKnowledgeReport(report);

    assert.equal(report.ok, false);
    assert.doesNotMatch(formatted, /Office V2 knowledge OK/);
    assert.match(formatted, /Office V2 knowledge FAILED/);
  });
});

for (const [fixtureName, wrongCode] of [
  ["asset-admission.json", "asset.wrong-code"],
  ["connectivity-missing-mask.json", "connectivity.wrong-code"],
  ["world-overlap.json", "world.wrong-code"],
]) {
  test(`${fixtureName} rejects an incorrect expected diagnostic`, () => {
    withKnowledgeCopy((copyRoot) => {
      const fixturePath = join(copyRoot, "fixtures", "invalid", fixtureName);
      const fixture = readJson(fixturePath);
      fixture.expectedFailure = wrongCode;
      writeJson(fixturePath, fixture);

      const report = evaluateOfficeKnowledge({ knowledgeRoot: copyRoot });

      assert.equal(report.ok, false);
      assert.equal(hasDiagnostic(report, "knowledge.expected-diagnostic-mismatch"), true);
    });
  });
}

test("asset rejection fails when an unrelated schema error accompanies the expected reason", () => {
  withKnowledgeCopy((copyRoot) => {
    const fixturePath = join(copyRoot, "fixtures", "invalid", "asset-admission.json");
    const fixture = readJson(fixturePath);
    delete fixture.document.familyId;
    writeJson(fixturePath, fixture);

    const report = evaluateOfficeKnowledge({ knowledgeRoot: copyRoot });

    assert.equal(report.ok, false);
    assert.equal(hasDiagnostic(report, "knowledge.expected-diagnostic-mismatch"), true);
  });
});

test("connectivity rejection disappears when the missing supported mask is supplied", () => {
  withKnowledgeCopy((copyRoot) => {
    const fixturePath = join(copyRoot, "fixtures", "invalid", "connectivity-missing-mask.json");
    const fixture = readJson(fixturePath);
    fixture.document.variants.push({
      mask: 10,
      role: "horizontal-middle",
      variantId: "desk-horizontal-middle",
    });
    writeJson(fixturePath, fixture);

    const report = evaluateOfficeKnowledge({ knowledgeRoot: copyRoot });

    assert.equal(report.ok, false);
    assert.equal(hasDiagnostic(report, "knowledge.expected-diagnostic-mismatch"), true);
  });
});

test("non-blocking entity overlap does not emit world.occupied", () => {
  withKnowledgeCopy((copyRoot) => {
    const fixturePath = join(copyRoot, "fixtures", "invalid", "world-overlap.json");
    const fixture = readJson(fixturePath);
    fixture.definitions[0].blocking = false;
    writeJson(fixturePath, fixture);

    const report = evaluateOfficeKnowledge({ knowledgeRoot: copyRoot });

    assert.equal(report.ok, false);
    assert.equal(hasDiagnostic(report, "knowledge.expected-diagnostic-mismatch"), true);
  });
});

test("a newly declared case without a probe fails closed", () => {
  withKnowledgeCopy((copyRoot) => {
    const fixturePath = join(copyRoot, "fixtures", "navigation-reservations-v2.json");
    const fixture = readJson(fixturePath);
    fixture.cases.push({ name: "unsupported-navigation-case", unsupported: true });
    writeJson(fixturePath, fixture);

    const report = evaluateOfficeKnowledge({ knowledgeRoot: copyRoot });

    assert.equal(report.ok, false);
    assert.equal(report.coverage.declaredCases, expectedFixtureCounts(copyRoot).declaredCases);
    assert.equal(hasDiagnostic(report, "knowledge.unhandled-fixture-case"), true);
  });
});

for (const { label, fixtureName, mutate } of [
  {
    label: "projection",
    fixtureName: "projection-roundtrip.json",
    mutate: (fixture) => { fixture.cases[0].screen.xPx += 1; },
  },
  {
    label: "placement",
    fixtureName: "placement-rotation-clearance.json",
    mutate: (fixture) => { fixture.cases[0].expected = "clearance"; },
  },
  {
    label: "depth ordering",
    fixtureName: "depth-occlusion.json",
    mutate: (fixture) => { fixture.cases[0].expectedBackToFront.reverse(); },
  },
  {
    label: "connectivity",
    fixtureName: "connected-desk.json",
    mutate: (fixture) => { fixture.cases[0].expectedMasks[0] = 1; },
  },
  {
    label: "interaction",
    fixtureName: "interaction-cancel-timeout.json",
    mutate: (fixture) => { fixture.cases[0].expected = "interaction-cancelled"; },
  },
  {
    label: "structure",
    fixtureName: "room-structure-cutaway.json",
    mutate: (fixture) => { fixture.cases[0].expectedTraversable = true; },
  },
  {
    label: "reservation",
    fixtureName: "navigation-reservations-v2.json",
    mutate: (fixture) => {
      fixture.cases.find(({ kind }) => kind === "reservation").expectedOwner = "actor-beta";
    },
  },
]) {
  test(`${label} expectations are executable evidence`, () => {
    withKnowledgeCopy((copyRoot) => {
      const fixturePath = join(copyRoot, "fixtures", fixtureName);
      const fixture = readJson(fixturePath);
      mutate(fixture);
      writeJson(fixturePath, fixture);

      const report = evaluateOfficeKnowledge({ knowledgeRoot: copyRoot });

      assert.equal(report.ok, false);
      assert.equal(hasDiagnostic(report, "knowledge.fixture-mismatch"), true);
    });
  });
}

test("the valid connectivity fixture rejects a missing supported mask", () => {
  withKnowledgeCopy((copyRoot) => {
    const fixturePath = join(copyRoot, "fixtures", "connected-desk.json");
    const fixture = readJson(fixturePath);
    fixture.variants = fixture.variants.filter(({ mask }) => mask !== 10);
    writeJson(fixturePath, fixture);

    const report = evaluateOfficeKnowledge({ knowledgeRoot: copyRoot });

    assert.equal(report.ok, false);
    assert.equal(hasDiagnostic(report, "connectivity.missing-variant"), true);
  });
});

test("the valid connectivity fixture rejects duplicate variant identifiers", () => {
  withKnowledgeCopy((copyRoot) => {
    const fixturePath = join(copyRoot, "fixtures", "connected-desk.json");
    const fixture = readJson(fixturePath);
    fixture.variants[1].variantId = fixture.variants[0].variantId;
    writeJson(fixturePath, fixture);

    const report = evaluateOfficeKnowledge({ knowledgeRoot: copyRoot });

    assert.equal(report.ok, false);
    assert.equal(hasDiagnostic(report, "connectivity.duplicate-variant-id"), true);
  });
});

test("a second path case is executed instead of being skipped", () => {
  withKnowledgeCopy((copyRoot) => {
    const fixturePath = join(copyRoot, "fixtures", "navigation-reservations-v2.json");
    const fixture = readJson(fixturePath);
    fixture.cases.push({
      name: "second-path-must-run",
      kind: "path",
      start: { x: 1, y: 2 },
      goal: { x: 3, y: 2 },
      expectedPath: [{ x: 1, y: 2 }],
      expectedStepCount: 0,
      expectedCost: 0,
    });
    writeJson(fixturePath, fixture);

    const report = evaluateOfficeKnowledge({ knowledgeRoot: copyRoot });

    assert.equal(report.ok, false);
    assert.equal(report.coverage.executedCases, expectedFixtureCounts(copyRoot).declaredCases);
    assert.equal(report.coverage.executedCaseIds.some((id) => id.endsWith("#second-path-must-run")), true);
    assert.equal(hasDiagnostic(report, "knowledge.fixture-mismatch"), true);
  });
});

test("the navigation oracle rejects an undeclared heuristic implementation", () => {
  withKnowledgeCopy((copyRoot) => {
    const fixturePath = join(copyRoot, "fixtures", "navigation-reservations-v2.json");
    const fixture = readJson(fixturePath);
    fixture.costModel.heuristic = "euclidean";
    writeJson(fixturePath, fixture);

    const report = evaluateOfficeKnowledge({ knowledgeRoot: copyRoot });

    assert.equal(report.ok, false);
    assert.equal(hasDiagnostic(report, "knowledge.fixture-probe-error"), true);
  });
});

test("the accepted A-star cost model charges 600 for the six-step detour", () => {
  const fixture = readJson(join(knowledgeRoot, "fixtures", "navigation-reservations-v2.json"));
  const pathCase = fixture.cases.find((entry) => entry.name === "stable-detour");
  assert.ok(pathCase, "stable-detour fixture is required");

  const result = findPath(fixture, pathCase);

  assert.deepEqual(result.path, pathCase.expectedPath);
  assert.equal(result.stepCount, 6);
  assert.equal(result.stepCount, pathCase.expectedStepCount);
  assert.equal(result.stepCost, 100);
  assert.equal(result.heuristicUnit, 100);
  assert.equal(result.totalCost, 600);
  assert.equal(result.totalCost, pathCase.expectedCost);
});

test("reports zero reducer, replay, property, and model evidence explicitly", () => {
  const report = evaluateOfficeKnowledge({ knowledgeRoot });
  assert.equal(report.ok, true, JSON.stringify(report.diagnostics, null, 2));
  assert.equal(report.evidence.reducerReplay, 0);
  assert.equal(report.evidence.propertyModel, 0);

  const formatted = formatKnowledgeReport(report);
  assert.match(formatted, /Office V2 knowledge OK/);
  assert.match(formatted, /reducer\/replay[^0-9]*0/i);
  assert.match(formatted, /property\/model[^0-9]*0/i);

  const messages = [];
  const result = runKnowledgeCheck({ knowledgeRoot, logger: (message) => messages.push(message) });
  assert.equal(result.ok, true);
  assert.deepEqual(messages, [formatted]);
});
