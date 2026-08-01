import assert from "node:assert/strict";
import { join } from "node:path";
import test from "node:test";
import { evaluateOfficeKnowledge } from "./office-v2-knowledge-check.mjs";
import {
  expectedFixtureCounts,
  hasDiagnostic,
  knowledgeRoot,
  readJson,
  withKnowledgeCopy,
  writeJson,
} from "./office-v2-knowledge-test-helpers.mjs";

test("proof workstation rejects north-south and corner masks exactly", () => {
  const fixture = readJson(join(
    knowledgeRoot,
    "fixtures",
    "invalid",
    "proof-workstation-unsupported-mask.json",
  ));

  assert.deepEqual(fixture.document.supportedMasks, [0, 2, 8, 10]);
  assert.deepEqual(fixture.requestedMasks, [1, 3, 4, 5]);
  const report = evaluateOfficeKnowledge({ knowledgeRoot });
  assert.equal(report.ok, true, JSON.stringify(report.diagnostics, null, 2));
  assert.equal(report.evidence.exactDiagnostics, expectedFixtureCounts(knowledgeRoot).exactDiagnostics);
});

test("proof workstation rejection fails when any requested mask becomes supported", () => {
  withKnowledgeCopy((copyRoot) => {
    const fixturePath = join(copyRoot, "fixtures", "invalid", "proof-workstation-unsupported-mask.json");
    const fixture = readJson(fixturePath);
    fixture.requestedMasks[0] = 0;
    writeJson(fixturePath, fixture);

    const report = evaluateOfficeKnowledge({ knowledgeRoot: copyRoot });

    assert.equal(report.ok, false);
    assert.equal(hasDiagnostic(report, "knowledge.expected-diagnostic-mismatch"), true);
  });
});

test("proof workstation rejection cannot drift from the valid definition", () => {
  withKnowledgeCopy((copyRoot) => {
    const fixturePath = join(copyRoot, "fixtures", "invalid", "proof-workstation-unsupported-mask.json");
    const fixture = readJson(fixturePath);
    fixture.document.familyVersion = 2;
    writeJson(fixturePath, fixture);

    const report = evaluateOfficeKnowledge({ knowledgeRoot: copyRoot });

    assert.equal(report.ok, false);
    assert.equal(hasDiagnostic(report, "knowledge.proof-workstation-definition-mismatch"), true);
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

test("the proof workstation fixture locks the exact east-west mask set", () => {
  withKnowledgeCopy((copyRoot) => {
    const fixturePath = join(copyRoot, "fixtures", "proof-workstation-connectivity-v2.json");
    const fixture = readJson(fixturePath);
    fixture.definition.supportedMasks.push(4);
    fixture.definition.variants.push({
      mask: 4,
      role: "south-neighbor-end",
      variantId: "workstation-south-neighbor-end",
    });
    writeJson(fixturePath, fixture);

    const invalidPath = join(copyRoot, "fixtures", "invalid", "proof-workstation-unsupported-mask.json");
    const invalid = readJson(invalidPath);
    invalid.document = fixture.definition;
    writeJson(invalidPath, invalid);

    const report = evaluateOfficeKnowledge({ knowledgeRoot: copyRoot });

    assert.equal(report.ok, false);
    assert.equal(hasDiagnostic(report, "connectivity.proof-workstation-mask-scope"), true);
    assert.equal(hasDiagnostic(report, "connectivity.proof-workstation-variant-scope"), true);
  });
});

test("the proof workstation fixture rejects missing or extra variants", () => {
  withKnowledgeCopy((copyRoot) => {
    const fixturePath = join(copyRoot, "fixtures", "proof-workstation-connectivity-v2.json");
    const fixture = readJson(fixturePath);
    fixture.definition.variants = fixture.definition.variants.filter(({ mask }) => mask !== 10);
    fixture.definition.variants.push({
      mask: 1,
      role: "north-neighbor-end",
      variantId: "workstation-north-neighbor-end",
    });
    writeJson(fixturePath, fixture);

    const report = evaluateOfficeKnowledge({ knowledgeRoot: copyRoot });

    assert.equal(report.ok, false);
    assert.equal(hasDiagnostic(report, "connectivity.missing-variant"), true);
    assert.equal(hasDiagnostic(report, "connectivity.proof-workstation-variant-scope"), true);
  });
});

test("the proof workstation fixture executes its east-west row", () => {
  const report = evaluateOfficeKnowledge({ knowledgeRoot });
  assert.equal(report.ok, true, JSON.stringify(report.diagnostics, null, 2));
  assert.equal(
    report.coverage.executedCaseIds.includes(
      "fixtures/proof-workstation-connectivity-v2.json#east-west-row",
    ),
    true,
  );
});
