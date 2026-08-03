import assert from "node:assert/strict";
import test from "node:test";
import {
  BENCHMARK_CANDIDATES,
  BENCHMARK_METRICS,
  BENCHMARK_SAMPLES,
  collectBenchmarkEvidence,
  createBenchmarkPlan,
  createBenchmarkRunMatrix,
  percentile,
  summarizeMetric,
} from "../apps/web/src/features/office-v2/renderer/benchmark-harness.ts";

function measurement() {
  return {
    tickMs: 1,
    renderMs: 2,
    drawCalls: 3,
    visibleSprites: 4,
    decodedMemoryEstimate: 5,
    gpuMemoryEstimate: 6,
    bundleContribution: 7,
    loadTime: 8,
    firstInteractive: 9,
    pickLatency: 10,
    inspectorLatency: 11,
    resizeHiddenResume: 12,
    remountCleanup: 13,
    contextRecovery: 14,
  };
}

test("Phase 4 benchmark protocol is frozen and expands to the exact matrix", () => {
  const plan = createBenchmarkPlan();
  assert.deepEqual(plan.candidates, BENCHMARK_CANDIDATES);
  assert.deepEqual(plan.actorProfiles, [1, 10, 15, 25, 50]);
  assert.deepEqual(plan.viewports, [{ width: 1440, height: 900 }, { width: 1024, height: 768 }, { width: 390, height: 844 }]);
  assert.equal(plan.warmupFrames, 120);
  assert.equal(plan.samples, 300);
  assert.equal(plan.repetitions, 5);
  assert.equal(createBenchmarkRunMatrix(plan).length, 300);
  assert.equal(BENCHMARK_METRICS.length, 16);
});
test("metric summaries are deterministic and do not mutate caller samples", () => {
  const values = [4, 1, 3, 2];
  const summary = summarizeMetric(values);
  assert.deepEqual(values, [4, 1, 3, 2]);
  assert.equal(summary.p50, 2.5);
  assert.equal(summary.p95, 3.85);
  assert.equal(percentile(values, 0), 1);
});

test("incomplete runs fail closed and never produce a winner", () => {
  const plan = createBenchmarkPlan();
  const descriptor = createBenchmarkRunMatrix(plan)[0];
  const valid = {
    ...descriptor,
    warmupFrames: 120,
    samples: Array.from({ length: BENCHMARK_SAMPLES }, measurement),
  };
  const evidence = collectBenchmarkEvidence([valid, { ...valid, samples: [] }], plan);
  assert.equal(evidence.validRuns, 1);
  assert.equal(evidence.invalidRuns, 1);
  assert.equal(evidence.winner, null);
  assert.equal(evidence.runs[1]?.diagnostics[0]?.code, "presentation.benchmark-run-incomplete");
});
