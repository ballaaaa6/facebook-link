import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  validateDefinitionBundle,
  validateGeometryAgreement,
  validateRenderPartDependencies,
  transformGeometry,
} from "@affiliate-ops/office-v2-world";
import { evaluateOfficeKnowledge } from "./office-v2-knowledge-check.mjs";
import { fixtureRegistry } from "./office-v2-knowledge-manifest.mjs";
import {
  hasDiagnostic,
  knowledgeRoot,
  readJson,
  withKnowledgeCopy,
  writeJson,
} from "./office-v2-knowledge-test-helpers.mjs";

function readBundle() {
  return JSON.parse(readFileSync(new URL("../docs/office-v2/fixtures/definition-bundle-v2.json", import.meta.url), "utf8"));
}

test("the W1.2 expected-diagnostic assertion rejects a wrong code", () => {
  withKnowledgeCopy((copyRoot) => {
    const path = `${copyRoot}/fixtures/invalid/definition-bundle-reference-closure.json`;
    const fixture = readJson(path);
    fixture.expectedFailure = "world.wrong-code";
    writeJson(path, fixture);
    const report = evaluateOfficeKnowledge({ knowledgeRoot: copyRoot });
    assert.equal(report.ok, false);
    assert.equal(hasDiagnostic(report, "knowledge.expected-diagnostic-mismatch"), true);
  });
});

test("restoring an unresolved bundle reference removes the semantic rejection", () => {
  const bundle = readBundle();
  const invalid = structuredClone(bundle);
  invalid.references.assetFamilyRefs = [];
  assert.equal(validateDefinitionBundle(invalid).diagnostics.some(({ code }) => code === "world.reference-missing"), true);
  assert.equal(validateDefinitionBundle(bundle).ok, true);
});

test("removing a fixture runner fails the inventory gate", () => {
  const path = "fixtures/invalid/definition-bundle-reference-closure.json";
  const index = fixtureRegistry.findIndex((entry) => entry.path === path);
  assert.notEqual(index, -1);
  const [removed] = fixtureRegistry.splice(index, 1);
  try {
    const report = evaluateOfficeKnowledge({ knowledgeRoot });
    assert.equal(report.ok, false);
    assert.equal(hasDiagnostic(report, "knowledge.unregistered-fixture"), true);
  } finally {
    if (removed) fixtureRegistry.splice(index, 0, removed);
  }
});

test("reference graph order and geometry agreement remain deterministic", () => {
  const bundle = readBundle();
  const reordered = structuredClone(bundle);
  reordered.geometries.reverse();
  reordered.entityDefinitions.reverse();
  reordered.entityInstances.reverse();
  for (const key of Object.keys(reordered.references)) reordered.references[key].reverse();
  assert.deepEqual(validateDefinitionBundle(reordered), validateDefinitionBundle(bundle));

  const geometry = bundle.geometries[0];
  const transformed = transformGeometry(geometry, "east");
  const conflict = validateGeometryAgreement(geometry, {
    geometry: geometry.geometry,
    orientation: "east",
    footprint: [{ ...transformed.footprint[0], x: 99 }],
  });
  assert.equal(conflict.diagnostics.some(({ code }) => code === "world.geometry-conflict"), true);
});

test("render dependency cycles remain a presentation-owned rejection", () => {
  const result = validateRenderPartDependencies([
    { id: { id: { kind: "render-part", value: "cycle-a" }, version: 1 }, dependencies: [{ id: { kind: "render-part", value: "cycle-b" }, version: 1 }] },
    { id: { id: { kind: "render-part", value: "cycle-b" }, version: 1 }, dependencies: [{ id: { kind: "render-part", value: "cycle-a" }, version: 1 }] },
  ]);
  assert.equal(result.diagnostics.some(({ code }) => code === "world.render-attachment-cycle"), true);
});
