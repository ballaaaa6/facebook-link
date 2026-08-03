import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { buildProofFamily } from "./office-v2-asset-family-proof.mjs";

function tempRoot() { return mkdtempSync(join(tmpdir(), "office-v2-family-")); }

test("builds the original workstation masks, boards, registry, and pending review evidence", () => {
  const root = tempRoot();
  try {
    const result = buildProofFamily({ outputRootA: join(root, "build-a"), outputRootB: join(root, "build-b"), reportRoot: join(root, "reports") });
    assert.deepEqual(result.report.supportedMasks, [0, 2, 8, 10]);
    assert.equal(result.report.seatedSocket, "seated");
    assert.equal(result.report.admission, "spec-only");
    assert.equal(result.report.review.state, "pending-owner-review");
    assert.equal(result.boards.report.boards.length, 20);
    assert.equal(result.registry.registry.admission, "spec-only");
    assert.deepEqual(result.factory.outputs.map(({ sha256 }) => sha256), result.factory.outputs.map(({ sha256 }) => sha256));
    assert.match(readFileSync(join(root, "reports/family.json"), "utf8"), /pending-owner-review/u);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("source pixel changes alter deterministic output evidence", () => {
  const first = tempRoot();
  const second = tempRoot();
  try {
    const firstResult = buildProofFamily({ outputRootA: join(first, "a"), outputRootB: join(first, "b"), reportRoot: join(first, "reports") });
    const changedSource = JSON.parse(readFileSync("assets/office-v2/sources/workstation-basic/v1/source.json", "utf8"));
    changedSource.frames[0].tint = [64, 96, 192, 255];
    const changedSourcePath = join(second, "source.json");
    writeFileSync(changedSourcePath, JSON.stringify(changedSource));
    const secondResult = buildProofFamily({ sourcePath: changedSourcePath, outputRootA: join(second, "a"), outputRootB: join(second, "b"), reportRoot: join(second, "reports") });
    assert.notEqual(firstResult.factory.reportSha256, secondResult.factory.reportSha256);
    assert.notEqual(firstResult.boards.report.reportSha256, secondResult.boards.report.reportSha256);
    assert.notEqual(firstResult.factory.outputs[0].sha256, secondResult.factory.outputs[0].sha256);
  } finally { rmSync(first, { recursive: true, force: true }); rmSync(second, { recursive: true, force: true }); }
});
