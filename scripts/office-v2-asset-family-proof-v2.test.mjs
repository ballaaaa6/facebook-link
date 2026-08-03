import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { decodePng } from "./office-v2-asset-admission-png.mjs";
import { buildProofFamily } from "./office-v2-asset-family-proof-v2.mjs";

function tempRoot() { return mkdtempSync(join(tmpdir(), "office-v2-family-v2-")); }

test("builds the 2:1 dimetric workstation proof family and review evidence", () => {
  const root = tempRoot();
  try {
    const result = buildProofFamily({ outputRootA: join(root, "build-a"), outputRootB: join(root, "build-b"), reportRoot: join(root, "reports") });
    assert.deepEqual(result.report.supportedMasks, [0, 2, 8, 10]);
    assert.equal(result.report.taskId, "P5-W6.5-R1");
    assert.equal(result.report.admission, "spec-only");
    assert.equal(result.report.review.state, "pending-owner-review");
    assert.equal(result.report.visualContract.status, "frozen-for-rework");
    assert.deepEqual(result.report.seatedSocket.spritePx, { x: 56, y: 56 });
    assert.deepEqual(result.report.seamComposition, { order: ["mask-2", "mask-10", "mask-8"], translationPx: { x: 64, y: 32 } });
    assert.equal(result.report.factory.twoCleanBuilds, true);
    assert.equal(result.report.factory.byteIdentical, true);
    assert.equal(new Set(result.factory.outputs.filter(({ kind }) => kind === "png").map(({ sha256 }) => sha256)).size, 4);
    for (const frame of result.source.frames) assert.equal(frame.rgba[(56 * 176 + 56) * 4 + 3], 255);
    assert.equal(result.boards.report.boards.length, 20);
    assert.equal(result.registry.registry.admission, "spec-only");
    assert.equal(result.registry.report.runtimeFiles.length, 0);
    assert.equal(result.evidence.filter(({ kind }) => kind === "enlarged-native-scale").length, 4);
    assert.equal(result.evidence.filter(({ kind }) => kind === "enlarged-connectivity").length, 4);
    assert.equal(result.evidence.filter(({ kind }) => kind === "background-preview").length, 8);
    assert.equal(result.evidence.some(({ kind }) => kind === "three-workstation-seam-composition"), true);
    assert.equal(result.evidence.some(({ kind }) => kind === "seated-actor-contact-overlay"), true);
    const native = decodePng(readFileSync(join(root, "reports/review/enlarged-native-scale/mask-0.png")));
    assert.deepEqual({ widthPx: native.widthPx, heightPx: native.heightPx }, { widthPx: 352, heightPx: 192 });
    assert.equal(result.report.candidateManifest.admission, "spec-only");
    assert.equal(result.report.candidateManifest.runtimeManifestPath, null);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("source accent changes alter deterministic V2 output evidence", () => {
  const first = tempRoot();
  const second = tempRoot();
  try {
    const firstResult = buildProofFamily({ outputRootA: join(first, "a"), outputRootB: join(first, "b"), reportRoot: join(first, "reports") });
    const changedSource = JSON.parse(readFileSync("assets/office-v2/sources/workstation-basic/v2/source.json", "utf8"));
    changedSource.frames[0].accent = [64, 96, 192, 255];
    const changedSourcePath = join(second, "source.json");
    writeFileSync(changedSourcePath, JSON.stringify(changedSource));
    const secondResult = buildProofFamily({ sourcePath: changedSourcePath, outputRootA: join(second, "a"), outputRootB: join(second, "b"), reportRoot: join(second, "reports") });
    assert.notEqual(firstResult.factory.reportSha256, secondResult.factory.reportSha256);
    assert.notEqual(firstResult.boards.report.reportSha256, secondResult.boards.report.reportSha256);
    assert.notEqual(firstResult.factory.outputs[0].sha256, secondResult.factory.outputs[0].sha256);
  } finally { rmSync(first, { recursive: true, force: true }); rmSync(second, { recursive: true, force: true }); }
});
