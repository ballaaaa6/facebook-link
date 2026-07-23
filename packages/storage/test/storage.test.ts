import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { LocalFilesystemStore } from "../src/index.ts";

test("stores identical bytes once using a content hash", async () => {
  const root = await mkdtemp(join(tmpdir(), "affiliate-ops-storage-"));
  try {
    const store = new LocalFilesystemStore(root);
    const input = { workspaceId: "local-pilot", bytes: new TextEncoder().encode("asset"), contentType: "text/plain", extension: "txt" };
    const first = await store.put(input);
    const second = await store.put(input);
    assert.equal(first.key, second.key);
    assert.equal(new TextDecoder().decode(await store.read(first.key)), "asset");
    assert.equal((await store.stat(first.key))?.sha256, first.sha256);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects path traversal object keys", async () => {
  const store = new LocalFilesystemStore(tmpdir());
  await assert.rejects(() => store.read("../secret.txt"), /Invalid object key/);
});
