import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const reportPath = resolve(root, "artifacts/office-v2/phase4/renderer-qa-evidence.json");
const report = JSON.parse(readFileSync(reportPath, "utf8"));
assert.equal(report.schemaVersion, "office-renderer-qa-evidence-v1");
assert.equal(report.allPassed, true);
assert.equal(report.checks.length, 4);
assert.deepEqual([...new Set(report.checks.map((check) => check.candidate))].sort(), ["canvas-2d", "pixijs-8.19.0"]);
for (const check of report.checks) {
  assert.equal(check.initial.optionCount, 15);
  assert.equal(check.final.optionCount, 14);
  assert.equal(check.preferences.optionCount, 15);
  assert.equal(check.initial.rendererCount, 1);
  assert.equal(check.final.rendererCount, 1);
  assert.equal(check.preferences.rendererCount, 1);
  assert.equal(check.initial.horizontalOverflow, false);
  assert.equal(check.final.horizontalOverflow, false);
  assert.equal(check.preferences.horizontalOverflow, false);
  assert.equal(check.keyboardPointerParity, true);
  assert.equal(check.lifecycleRecovery, true);
  assert.equal(check.responsive, true);
  assert.equal(check.preferencesPreserved, true);
}
console.log(JSON.stringify({ reportPath, checks: report.checks.length, allPassed: report.allPassed }));
