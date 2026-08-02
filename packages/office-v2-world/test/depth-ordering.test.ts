import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  orderDepthRecords,
  sortDepthRecords,
  depthSortKey,
  type DepthStructuralRecord,
} from "../src/depth-ordering.ts";

interface DepthFixture {
  readonly cases: readonly {
    readonly name: string;
    readonly entities: readonly { readonly id: string; readonly band: "world" | "upper"; readonly groundY: number; readonly elevation: number }[];
    readonly expectedBackToFront: readonly string[];
  }[];
}

function fixture(): DepthFixture {
  return JSON.parse(readFileSync(new URL("../../../docs/office-v2/fixtures/depth-occlusion.json", import.meta.url), "utf8")) as DepthFixture;
}

function records(values: readonly { readonly id: string; readonly band: "world" | "upper"; readonly groundY: number; readonly elevation: number }[]): DepthStructuralRecord[] {
  return values.map((entry) => ({ id: entry.id, band: entry.band, elevation: entry.elevation, groundContact: { xPx: 0, yPx: entry.groundY } }));
}

function permutations<T>(values: readonly T[]): T[][] {
  if (values.length < 2) return [values.slice()];
  return values.flatMap((value, index) => permutations([...values.slice(0, index), ...values.slice(index + 1)]).map((rest) => [value, ...rest]));
}

test("matches both bounded depth-occlusion fixture cases", () => {
  for (const entry of fixture().cases) {
    const result = orderDepthRecords(records(entry.entities));
    assert.equal(result.ok, true, JSON.stringify(result.diagnostics));
    assert.deepEqual(result.ordered.map(({ id }) => id), entry.expectedBackToFront);
  }
});

test("equal and adjacent projected contacts are insertion-order independent", () => {
  const values: DepthStructuralRecord[] = [
    { id: "beta", band: "world", elevation: 0, groundContact: { xPx: 0, yPx: 80 } },
    { id: "alpha", band: "world", elevation: 0, groundContact: { xPx: 0, yPx: 80 } },
    { id: "adjacent-right", band: "world", elevation: 0, groundContact: { xPx: 1, yPx: 80 } },
    { id: "higher", band: "world", elevation: 1, groundContact: { xPx: 1, yPx: 80 } },
    { id: "rotated-contact", band: "world", elevation: 0, groundContact: { xPx: -1, yPx: 80 } },
    { id: "overlap", band: "upper", elevation: 0, groundContact: { xPx: 0, yPx: 80 } },
  ];
  const expected = orderDepthRecords(values);
  assert.equal(expected.ok, true);
  for (const permutation of permutations(values)) assert.deepEqual(orderDepthRecords(permutation).ordered.map(({ id }) => id), expected.ordered.map(({ id }) => id));
  assert.deepEqual(expected.ordered.map(({ id }) => id), ["rotated-contact", "alpha", "beta", "adjacent-right", "higher", "overlap"]);
  assert.deepEqual(depthSortKey(expected.ordered[0]!), { groundY: 80, groundX: -1, elevation: 0, bandRank: 2, band: "world", semanticOwnerId: "rotated-contact", id: "rotated-contact" });
});

test("multipart dependencies are ordered, retain one owner, and fail closed on missing or cyclic edges", () => {
  const accepted = orderDepthRecords([
    { id: "part-top", semanticOwnerId: "cabinet", band: "upper", elevation: 0, groundContact: { xPx: 0, yPx: 96 }, dependencies: ["part-base"] },
    { id: "part-base", semanticOwnerId: "cabinet", band: "world", elevation: 0, groundContact: { xPx: 0, yPx: 96 } },
  ]);
  assert.equal(accepted.ok, true, JSON.stringify(accepted.diagnostics));
  assert.deepEqual(accepted.ordered.map(({ id }) => id), ["part-base", "part-top"]);
  const missing = orderDepthRecords([{ id: "part", band: "world", elevation: 0, groundContact: { xPx: 0, yPx: 0 }, dependencies: ["missing"] }]);
  assert.equal(missing.ok, false);
  assert.equal(missing.diagnostics.some(({ code }) => code === "world.depth-dependency-missing"), true);
  const ownerMismatch = orderDepthRecords([
    { id: "one", semanticOwnerId: "owner-one", band: "world", elevation: 0, groundContact: { xPx: 0, yPx: 0 }, dependencies: ["two"] },
    { id: "two", semanticOwnerId: "owner-two", band: "world", elevation: 0, groundContact: { xPx: 0, yPx: 0 } },
  ]);
  assert.equal(ownerMismatch.diagnostics.some(({ code }) => code === "world.depth-owner-mismatch"), true);
  const cycle = orderDepthRecords([
    { id: "a", band: "world", elevation: 0, groundContact: { xPx: 0, yPx: 0 }, dependencies: ["b"] },
    { id: "b", band: "world", elevation: 0, groundContact: { xPx: 0, yPx: 0 }, dependencies: ["a"] },
  ]);
  assert.equal(cycle.ok, false);
  assert.equal(cycle.diagnostics.some(({ code }) => code === "world.render-attachment-cycle"), true);
  assert.deepEqual(sortDepthRecords(cycle.ordered), []);
});

test("duplicate and invalid depth records fail without partial order", () => {
  const result = orderDepthRecords([
    { id: "same", band: "world", elevation: 0, groundContact: { xPx: 0, yPx: 0 } },
    { id: "same", band: "world", elevation: 0, groundContact: { xPx: 0, yPx: 0 } },
    { id: "invalid", band: "world", elevation: -1, groundContact: { xPx: 0, yPx: 0 } },
  ]);
  assert.equal(result.ok, false);
  assert.deepEqual(result.ordered, []);
  assert.deepEqual(sortDepthRecords(result.ordered), []);
});
