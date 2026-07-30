import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("../../..", import.meta.url));

function runGate(script: string) {
  return spawnSync(process.execPath, [script], {
    cwd: root,
    encoding: "utf8",
  });
}

test("Office V2 knowledge contracts and behavior fixtures pass", () => {
  const result = runGate("scripts/office-v2-knowledge-check.mjs");
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Office V2 knowledge OK/);
});

test("Office V2 runtime asset admission gate passes", () => {
  const result = runGate("scripts/office-v2-asset-check.mjs");
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Office V2 assets OK/);
});
