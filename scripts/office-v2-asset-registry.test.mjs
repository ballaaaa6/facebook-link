import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { AssetRegistryError, buildAssetRegistry, compileAssetRegistry } from "./office-v2-asset-registry.mjs";

function base() {
  return {
    schemaVersion: "office-asset-registry-input-v1",
    family: { familyId: "workstation-basic", familyVersion: 1, projectionId: "office-projection-v1", geometryRef: { id: "workstation-geometry", version: 1 }, admission: "spec-only" },
    frames: [
      { frameId: "mask-0", frameVersion: 1, variantId: "isolated", widthPx: 16, heightPx: 16, orientation: "south", runtimePath: "office-v2/runtime/workstation-basic/mask-0.png", sha256: "1".repeat(64), lifecycleGroup: "workstations" },
      { frameId: "mask-2", frameVersion: 1, variantId: "east-end", widthPx: 16, heightPx: 16, orientation: "south", runtimePath: "office-v2/runtime/workstation-basic/mask-2.png", sha256: "2".repeat(64), lifecycleGroup: "workstations" },
    ],
    atlas: { atlasId: "workstation-atlas", atlasVersion: 1, path: "office-v2/atlases/workstation-basic.png", sha256: "3".repeat(64), paddingPx: 1, extrusionPx: 1 },
    catalog: { catalogId: "office-assets", catalogVersion: 1 },
    sceneBundle: { bundleId: "ground-floor", bundleVersion: 1, floorRef: { id: "ground-floor", version: 1 } },
  };
}

function codes(callback) {
  try { callback(); assert.fail("expected AssetRegistryError"); } catch (error) { assert.ok(error instanceof AssetRegistryError); return error.code; }
}

test("compiles schema-shaped atlas, catalog, bundle, and registry closure", () => {
  const result = compileAssetRegistry(base());
  assert.equal(result.documents.atlas.schemaVersion, "office-atlas-v1");
  assert.equal(result.documents.catalog.missingAssetPolicy, "fail-closed");
  assert.equal(result.documents.sceneBundle.contextRecovery.failClosedOnError, true);
  assert.equal(result.registry.schemaVersion, "office-asset-registry-v1");
  assert.equal(result.documents.catalog.entries.length, 2);
  assert.equal(result.documents.sceneBundle.assetRefs.length, 2);
  assert.match(result.registry.registrySha256, /^[a-f0-9]{64}$/u);
});

test("equivalent input reorder is byte-identical and semantic changes alter registry hash", () => {
  const first = base();
  const reordered = base(); reordered.frames.reverse();
  const changed = base(); changed.frames[0].sha256 = "f".repeat(64);
  assert.deepEqual(compileAssetRegistry(first).documents, compileAssetRegistry(reordered).documents);
  assert.equal(compileAssetRegistry(first).registry.registrySha256, compileAssetRegistry(reordered).registry.registrySha256);
  assert.notEqual(compileAssetRegistry(first).registry.registrySha256, compileAssetRegistry(changed).registry.registrySha256);
});

test("runtime-approved closure requires explicit approvals and all non-orphan files", () => {
  const candidate = base();
  candidate.family.admission = "runtime-approved";
  candidate.catalog.admission = "runtime-approved";
  candidate.sceneBundle.admission = "runtime-approved";
  candidate.family.approval = { geometry: "approved", visual: "approved", commercial: "approved" };
  candidate.runtimeFiles = [
    { path: candidate.atlas.path, sha256: candidate.atlas.sha256 },
    ...candidate.frames.map(({ runtimePath, sha256 }) => ({ path: runtimePath, sha256 })),
  ];
  const result = compileAssetRegistry(candidate);
  assert.equal(result.report.runtimeFiles.length, 3);
  const missing = structuredClone(candidate); missing.runtimeFiles.pop();
  assert.equal(codes(() => compileAssetRegistry(missing)), "asset.registry.runtime-missing");
  const orphan = structuredClone(candidate); orphan.runtimeFiles.push({ path: "office-v2/runtime/orphan.png", sha256: "4".repeat(64) });
  assert.equal(codes(() => compileAssetRegistry(orphan)), "asset.registry.runtime-orphan");
});

test("rejects duplicate, latest, path, version, and reference closure failures", () => {
  const duplicate = base(); duplicate.frames[1].runtimePath = duplicate.frames[0].runtimePath;
  assert.equal(codes(() => compileAssetRegistry(duplicate)), "asset.registry.runtime-duplicate");
  const latest = base(); latest.catalog.catalogId = "latest";
  assert.equal(codes(() => compileAssetRegistry(latest)), "asset.registry.catalog-id-invalid");
  const badPath = base(); badPath.frames[0].runtimePath = "assets/workstation.png";
  assert.equal(codes(() => compileAssetRegistry(badPath)), "asset.registry.runtime-path-invalid");
  const badVersion = base(); badVersion.frames[0].frameVersion = 0;
  assert.equal(codes(() => compileAssetRegistry(badVersion)), "asset.registry.frame-version-invalid");
  const badFloor = base(); delete badFloor.sceneBundle.floorRef;
  assert.equal(codes(() => compileAssetRegistry(badFloor)), "asset.registry.floor-invalid");
});

test("rejects approval mismatch, geometry mismatch, altered bytes, and invalid output root", () => {
  const approval = base(); approval.catalog.admission = "runtime-approved";
  assert.equal(codes(() => compileAssetRegistry(approval)), "asset.registry.approval-required");
  const geometry = base(); geometry.frames[0].geometryRef = { id: "other", version: 1 };
  assert.equal(codes(() => compileAssetRegistry(geometry)), "asset.registry.geometry-mismatch");
  const altered = base(); altered.runtimeFiles = [{ path: altered.frames[0].runtimePath, sha256: altered.frames[0].sha256, bytes: [1, 2, 3] }];
  assert.equal(codes(() => compileAssetRegistry(altered)), "asset.registry.runtime-hash-mismatch");
  const output = mkdtempSync(join(tmpdir(), "office-v2-registry-"));
  try {
    buildAssetRegistry({ input: base(), outputRoot: output });
    assert.equal(codes(() => buildAssetRegistry({ input: base(), outputRoot: output })), "asset.registry.overwrite");
  } finally { rmSync(output, { recursive: true, force: true }); }
});
