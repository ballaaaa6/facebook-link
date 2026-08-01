import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  validateDefinitionBundle,
  validateRenderPartDependencies,
} from "../src/index.ts";
import type { DefinitionBundleDocument } from "@affiliate-ops/office-v2-contracts";

function readBundle(): DefinitionBundleDocument {
  return JSON.parse(readFileSync(new URL("../../../docs/office-v2/fixtures/definition-bundle-v2.json", import.meta.url), "utf8")) as DefinitionBundleDocument;
}

function cloneBundle(): DefinitionBundleDocument {
  return structuredClone(readBundle());
}

test("the definition bundle closes every declared reference family", () => {
  const result = validateDefinitionBundle(readBundle());
  assert.equal(result.ok, true, JSON.stringify(result.diagnostics, null, 2));
  assert.equal(result.diagnostics.length, 0);
  assert.deepEqual(result.nodes.map(({ key }) => key), result.nodes.map(({ key }) => key).slice().sort());
  assert.equal(result.nodes.length, 14);
  assert.equal(result.edges.length, 11);
});

test("reference graph resolution is invariant under input reorder", () => {
  const reordered = cloneBundle();
  reordered.geometries = reordered.geometries.slice().reverse();
  reordered.entityDefinitions = reordered.entityDefinitions.slice().reverse();
  reordered.entityInstances = reordered.entityInstances.slice().reverse();
  for (const key of Object.keys(reordered.references) as Array<keyof typeof reordered.references>) {
    reordered.references[key] = reordered.references[key].slice().reverse();
  }
  assert.deepEqual(validateDefinitionBundle(reordered), validateDefinitionBundle(readBundle()));
});

test("dangling references fail with a stable world diagnostic", () => {
  const bundle = cloneBundle();
  bundle.references.assetFamilyRefs = [];
  const result = validateDefinitionBundle(bundle);
  assert.equal(result.ok, false);
  assert.equal(result.diagnostics.some(({ code }) => code === "world.reference-missing"), true);
});

test("wrong reference kinds fail before graph resolution", () => {
  const bundle = cloneBundle() as unknown as { entityDefinitions: Array<Record<string, any>> };
  bundle.entityDefinitions[0].interactionRefs[0].id.kind = "asset-family";
  const result = validateDefinitionBundle(bundle as DefinitionBundleDocument);
  assert.equal(result.ok, false);
  assert.equal(result.diagnostics.some(({ code }) => code === "world.reference-kind-mismatch"), true);
});

test("missing and mismatched versions fail closed", () => {
  const missing = cloneBundle() as unknown as { entityDefinitions: Array<Record<string, any>> };
  delete missing.entityDefinitions[0].geometry.version;
  const missingResult = validateDefinitionBundle(missing as DefinitionBundleDocument);
  assert.equal(missingResult.diagnostics.some(({ code }) => code === "contract.reference-version-missing"), true);

  const mismatch = cloneBundle() as unknown as { entityDefinitions: Array<Record<string, any>> };
  mismatch.entityDefinitions[0].geometry.version = 2;
  const mismatchResult = validateDefinitionBundle(mismatch as DefinitionBundleDocument);
  assert.equal(mismatchResult.diagnostics.some(({ code }) => code === "world.reference-version-mismatch"), true);
});

test("instances cannot request an unsupported geometry orientation", () => {
  const bundle = cloneBundle() as unknown as { entityInstances: Array<Record<string, any>> };
  bundle.entityInstances[0].orientation = "north-east";
  const result = validateDefinitionBundle(bundle as DefinitionBundleDocument);
  assert.equal(result.ok, false);
  assert.equal(result.diagnostics.some(({ code }) => code === "world.orientation-unsupported"), true);
});

test("render-part dependency cycles fail with the reserved diagnostic", () => {
  const result = validateRenderPartDependencies([
    {
      id: { id: { kind: "render-part", value: "render-a" }, version: 1 },
      dependencies: [{ id: { kind: "render-part", value: "render-b" }, version: 1 }],
    },
    {
      id: { id: { kind: "render-part", value: "render-b" }, version: 1 },
      dependencies: [{ id: { kind: "render-part", value: "render-a" }, version: 1 }],
    },
  ]);
  assert.equal(result.ok, false);
  assert.equal(result.diagnostics.some(({ code }) => code === "world.render-attachment-cycle"), true);
});
