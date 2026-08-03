import assert from "node:assert/strict";
import test from "node:test";
import { createPixiRendererBackend, PIXI_RENDERER_REVISION } from "../src/features/office-v2/renderer/pixi-renderer.ts";

test("Pixi candidate is pinned to 8.19.0 and teardown is idempotent before mount", () => {
  const backend = createPixiRendererBackend();
  assert.equal(PIXI_RENDERER_REVISION, "pixijs-8.19.0-v1");
  assert.throws(() => backend.captureDeterministic(), /pixi-not-mounted/);
  backend.teardown();
  backend.teardown();
});
