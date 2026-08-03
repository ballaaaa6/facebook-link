export const BENCHMARK_PROTOCOL_VERSION = "office-renderer-benchmark-v1" as const;
export const BENCHMARK_CANDIDATES = ["canvas-2d", "pixijs-8.19.0"] as const;
export const BENCHMARK_ACTOR_PROFILES = [1, 10, 15, 25, 50] as const;
export const BENCHMARK_VIEWPORTS = Object.freeze([
  Object.freeze({ width: 1440, height: 900 }),
  Object.freeze({ width: 1024, height: 768 }),
  Object.freeze({ width: 390, height: 844 }),
]);
export const BENCHMARK_WARMUP_FRAMES = 120 as const;
export const BENCHMARK_SAMPLES = 300 as const;
export const BENCHMARK_REPETITIONS = 5 as const;
export const BENCHMARK_RUN_KINDS = ["cold", "warm"] as const;

export const BENCHMARK_METRICS = [
  "tick-p50",
  "tick-p95",
  "render-p50",
  "render-p95",
  "draw-calls",
  "visible-sprites",
  "decoded-memory-estimate",
  "gpu-memory-estimate",
  "bundle-contribution",
  "load-time",
  "first-interactive",
  "pick-latency",
  "inspector-latency",
  "resize-hidden-resume",
  "remount-cleanup",
  "context-recovery",
] as const;

export type BenchmarkCandidate = (typeof BENCHMARK_CANDIDATES)[number];
export type BenchmarkActorCount = (typeof BENCHMARK_ACTOR_PROFILES)[number];
export type BenchmarkRunKind = (typeof BENCHMARK_RUN_KINDS)[number];
export type BenchmarkMetric = (typeof BENCHMARK_METRICS)[number];
export type BenchmarkViewport = (typeof BENCHMARK_VIEWPORTS)[number];

export interface BenchmarkPlan {
  readonly protocolVersion: typeof BENCHMARK_PROTOCOL_VERSION;
  readonly candidates: readonly BenchmarkCandidate[];
  readonly actorProfiles: readonly BenchmarkActorCount[];
  readonly viewports: readonly BenchmarkViewport[];
  readonly warmupFrames: typeof BENCHMARK_WARMUP_FRAMES;
  readonly samples: typeof BENCHMARK_SAMPLES;
  readonly repetitions: typeof BENCHMARK_REPETITIONS;
  readonly runKinds: readonly BenchmarkRunKind[];
  readonly variancePolicy: "report-and-exclude-invalid-runs";
  readonly winnerRule: "deferred-until-valid-numeric-lifecycle-and-semantic-evidence";
}

export interface BenchmarkMeasurement {
  readonly tickMs: number;
  readonly renderMs: number;
  readonly drawCalls: number;
  readonly visibleSprites: number;
  readonly decodedMemoryEstimate: number;
  readonly gpuMemoryEstimate: number;
  readonly bundleContribution: number;
  readonly loadTime: number;
  readonly firstInteractive: number;
  readonly pickLatency: number;
  readonly inspectorLatency: number;
  readonly resizeHiddenResume: number;
  readonly remountCleanup: number;
  readonly contextRecovery: number;
}

export interface BenchmarkRunDescriptor {
  readonly candidate: BenchmarkCandidate;
  readonly actorCount: BenchmarkActorCount;
  readonly viewport: BenchmarkViewport;
  readonly runKind: BenchmarkRunKind;
  readonly repetition: number;
}

export interface BenchmarkRunResult extends BenchmarkRunDescriptor {
  readonly warmupFrames: number;
  readonly samples: readonly BenchmarkMeasurement[];
  readonly diagnostics?: readonly BenchmarkDiagnostic[];
}

export type BenchmarkDiagnosticCode =
  | "presentation.benchmark-protocol-invalid"
  | "presentation.benchmark-run-incomplete"
  | "presentation.benchmark-sample-invalid"
  | "presentation.benchmark-page-unavailable";

export interface BenchmarkDiagnostic {
  readonly code: BenchmarkDiagnosticCode;
  readonly message: string;
  readonly context: Readonly<Record<string, unknown>>;
}

export interface MetricSummary {
  readonly count: number;
  readonly p50: number;
  readonly p95: number;
  readonly mean: number;
  readonly variance: number;
  readonly min: number;
  readonly max: number;
}

export interface BenchmarkRunEvidence {
  readonly descriptor: BenchmarkRunDescriptor;
  readonly valid: boolean;
  readonly diagnostics: readonly BenchmarkDiagnostic[];
  readonly metrics: Readonly<Partial<Record<BenchmarkMetric, MetricSummary>>>;
}

export interface BenchmarkEvidence {
  readonly protocol: BenchmarkPlan;
  readonly totalRuns: number;
  readonly validRuns: number;
  readonly invalidRuns: number;
  readonly winner: null;
  readonly runs: readonly BenchmarkRunEvidence[];
}

const REQUIRED_MEASUREMENT_KEYS: readonly (keyof BenchmarkMeasurement)[] = [
  "tickMs",
  "renderMs",
  "drawCalls",
  "visibleSprites",
  "decodedMemoryEstimate",
  "gpuMemoryEstimate",
  "bundleContribution",
  "loadTime",
  "firstInteractive",
  "pickLatency",
  "inspectorLatency",
  "resizeHiddenResume",
  "remountCleanup",
  "contextRecovery",
];

function freezeViewport(viewport: BenchmarkViewport): BenchmarkViewport {
  return Object.freeze({ width: viewport.width, height: viewport.height }) as BenchmarkViewport;
}

function stableNumber(value: number): number {
  return Number.isFinite(value) ? Number(value.toFixed(6)) : value;
}

function diagnostic(code: BenchmarkDiagnosticCode, message: string, context: Readonly<Record<string, unknown>>): BenchmarkDiagnostic {
  return Object.freeze({ code, message, context: Object.freeze({ ...context }) });
}

function isCandidate(value: unknown): value is BenchmarkCandidate {
  return typeof value === "string" && (BENCHMARK_CANDIDATES as readonly string[]).includes(value);
}

function isActorCount(value: unknown): value is BenchmarkActorCount {
  return typeof value === "number" && (BENCHMARK_ACTOR_PROFILES as readonly number[]).includes(value);
}

function isRunKind(value: unknown): value is BenchmarkRunKind {
  return typeof value === "string" && (BENCHMARK_RUN_KINDS as readonly string[]).includes(value);
}

function isViewport(value: unknown): value is BenchmarkViewport {
  return typeof value === "object" && value !== null
    && "width" in value && "height" in value
    && BENCHMARK_VIEWPORTS.some((candidate) => candidate.width === value.width && candidate.height === value.height);
}

function metricValues(samples: readonly BenchmarkMeasurement[], key: keyof BenchmarkMeasurement): number[] {
  return samples.map((sample) => sample[key]);
}

export function createBenchmarkPlan(): BenchmarkPlan {
  return Object.freeze({
    protocolVersion: BENCHMARK_PROTOCOL_VERSION,
    candidates: Object.freeze([...BENCHMARK_CANDIDATES]),
    actorProfiles: Object.freeze([...BENCHMARK_ACTOR_PROFILES]),
    viewports: Object.freeze(BENCHMARK_VIEWPORTS.map(freezeViewport)),
    warmupFrames: BENCHMARK_WARMUP_FRAMES,
    samples: BENCHMARK_SAMPLES,
    repetitions: BENCHMARK_REPETITIONS,
    runKinds: Object.freeze([...BENCHMARK_RUN_KINDS]),
    variancePolicy: "report-and-exclude-invalid-runs",
    winnerRule: "deferred-until-valid-numeric-lifecycle-and-semantic-evidence",
  });
}

export function createBenchmarkRunMatrix(plan = createBenchmarkPlan()): readonly BenchmarkRunDescriptor[] {
  const matrix: BenchmarkRunDescriptor[] = [];
  for (const candidate of plan.candidates) {
    for (const actorCount of plan.actorProfiles) {
      for (const viewport of plan.viewports) {
        for (const runKind of plan.runKinds) {
          for (let repetition = 1; repetition <= plan.repetitions; repetition += 1) {
            matrix.push(Object.freeze({ candidate, actorCount, viewport: freezeViewport(viewport), runKind, repetition }));
          }
        }
      }
    }
  }
  return Object.freeze(matrix);
}

export function percentile(values: readonly number[], fraction: number): number {
  if (values.length === 0) throw new RangeError("presentation.benchmark-sample-invalid: percentile requires samples");
  if (!Number.isFinite(fraction) || fraction < 0 || fraction > 1) throw new RangeError("presentation.benchmark-sample-invalid: percentile fraction is outside [0,1]");
  const ordered = values.slice().sort((left, right) => left - right);
  const position = (ordered.length - 1) * fraction;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return stableNumber(ordered[lower]!);
  const weight = position - lower;
  return stableNumber(ordered[lower]! + (ordered[upper]! - ordered[lower]!) * weight);
}

export function summarizeMetric(values: readonly number[]): MetricSummary {
  if (values.length === 0 || values.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new RangeError("presentation.benchmark-sample-invalid: metric samples must be finite and non-negative");
  }
  const mean = values.reduce((total, value) => total + value, 0) / values.length;
  const variance = values.reduce((total, value) => total + ((value - mean) ** 2), 0) / values.length;
  return Object.freeze({
    count: values.length,
    p50: percentile(values, 0.5),
    p95: percentile(values, 0.95),
    mean: stableNumber(mean),
    variance: stableNumber(variance),
    min: stableNumber(Math.min(...values)),
    max: stableNumber(Math.max(...values)),
  });
}

export function validateBenchmarkRun(run: BenchmarkRunResult, plan = createBenchmarkPlan()): readonly BenchmarkDiagnostic[] {
  const diagnostics: BenchmarkDiagnostic[] = [];
  if (!isCandidate(run.candidate) || !plan.candidates.includes(run.candidate)) diagnostics.push(diagnostic("presentation.benchmark-protocol-invalid", "candidate is not admitted by the frozen protocol", { candidate: run.candidate }));
  if (!isActorCount(run.actorCount) || !plan.actorProfiles.includes(run.actorCount)) diagnostics.push(diagnostic("presentation.benchmark-protocol-invalid", "actor profile is not admitted by the frozen protocol", { actorCount: run.actorCount }));
  if (!isViewport(run.viewport) || !plan.viewports.some((candidate) => candidate.width === run.viewport.width && candidate.height === run.viewport.height)) diagnostics.push(diagnostic("presentation.benchmark-protocol-invalid", "viewport is not admitted by the frozen protocol", { viewport: run.viewport }));
  if (!isRunKind(run.runKind) || !plan.runKinds.includes(run.runKind)) diagnostics.push(diagnostic("presentation.benchmark-protocol-invalid", "run kind is not admitted by the frozen protocol", { runKind: run.runKind }));
  if (!Number.isInteger(run.repetition) || run.repetition < 1 || run.repetition > plan.repetitions) diagnostics.push(diagnostic("presentation.benchmark-protocol-invalid", "repetition is outside the frozen protocol", { repetition: run.repetition }));
  if (run.warmupFrames !== plan.warmupFrames) diagnostics.push(diagnostic("presentation.benchmark-run-incomplete", "warmup frame count does not match the frozen protocol", { expected: plan.warmupFrames, actual: run.warmupFrames }));
  if (!Array.isArray(run.samples) || run.samples.length !== plan.samples) diagnostics.push(diagnostic("presentation.benchmark-run-incomplete", "measured sample count does not match the frozen protocol", { expected: plan.samples, actual: run.samples?.length ?? 0 }));
  for (const [index, sample] of (run.samples ?? []).entries()) {
    for (const key of REQUIRED_MEASUREMENT_KEYS) {
      if (typeof sample[key] !== "number" || !Number.isFinite(sample[key]) || sample[key] < 0) diagnostics.push(diagnostic("presentation.benchmark-sample-invalid", "sample metric is not finite and non-negative", { index, key, value: sample[key] }));
    }
  }
  return Object.freeze(diagnostics);
}

const METRIC_TO_SAMPLE_KEY: Readonly<Record<BenchmarkMetric, keyof BenchmarkMeasurement | undefined>> = Object.freeze({
  "tick-p50": "tickMs",
  "tick-p95": "tickMs",
  "render-p50": "renderMs",
  "render-p95": "renderMs",
  "draw-calls": "drawCalls",
  "visible-sprites": "visibleSprites",
  "decoded-memory-estimate": "decodedMemoryEstimate",
  "gpu-memory-estimate": "gpuMemoryEstimate",
  "bundle-contribution": "bundleContribution",
  "load-time": "loadTime",
  "first-interactive": "firstInteractive",
  "pick-latency": "pickLatency",
  "inspector-latency": "inspectorLatency",
  "resize-hidden-resume": "resizeHiddenResume",
  "remount-cleanup": "remountCleanup",
  "context-recovery": "contextRecovery",
});

export function summarizeRun(run: BenchmarkRunResult, plan = createBenchmarkPlan()): BenchmarkRunEvidence {
  const diagnostics = validateBenchmarkRun(run, plan);
  if (diagnostics.length > 0) return Object.freeze({ descriptor: Object.freeze({ candidate: run.candidate, actorCount: run.actorCount, viewport: freezeViewport(run.viewport), runKind: run.runKind, repetition: run.repetition }), valid: false, diagnostics, metrics: Object.freeze({}) });
  const metrics: Partial<Record<BenchmarkMetric, MetricSummary>> = {};
  for (const metric of BENCHMARK_METRICS) {
    const key = METRIC_TO_SAMPLE_KEY[metric];
    if (!key) continue;
    metrics[metric] = summarizeMetric(metric.endsWith("-p50") || metric.endsWith("-p95") ? metricValues(run.samples, key) : metricValues(run.samples, key));
  }
  return Object.freeze({ descriptor: Object.freeze({ candidate: run.candidate, actorCount: run.actorCount, viewport: freezeViewport(run.viewport), runKind: run.runKind, repetition: run.repetition }), valid: true, diagnostics: Object.freeze([]), metrics: Object.freeze(metrics) });
}

export function collectBenchmarkEvidence(runs: readonly BenchmarkRunResult[], plan = createBenchmarkPlan()): BenchmarkEvidence {
  const evidenceRuns = runs.map((run) => summarizeRun(run, plan));
  return Object.freeze({ protocol: plan, totalRuns: evidenceRuns.length, validRuns: evidenceRuns.filter((run) => run.valid).length, invalidRuns: evidenceRuns.filter((run) => !run.valid).length, winner: null, runs: Object.freeze(evidenceRuns) });
}
