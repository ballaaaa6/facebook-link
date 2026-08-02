import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(import.meta.dirname, "..");
const evidenceRoot = "artifacts/office-v2/phase3";
const t2Ids = Object.freeze([
  "t2-one-actor-success-mid-route", "t2-one-actor-queue-mid-queue",
  "t2-one-actor-interaction-mid-interaction", "t2-one-actor-held-prop",
  "t2-one-actor-cancel", "t2-one-actor-timeout", "t2-one-actor-unreachable",
  "t2-one-actor-target-removed", "t2-one-actor-target-unavailable",
]);
const t3Definitions = Object.freeze([
  { id: "p3-t3-one-actor-baseline", actorCount: 1, synthetic: false, maxTick: 30, checkpoints: [["approaching-narrow-door", 2], ["mid-interaction", 5]] },
  { id: "p3-t3-ten-actor-contention", actorCount: 10, synthetic: false, maxTick: 60, checkpoints: [["approaching-narrow-door", 2], ["shared-queue", 6], ["deadlock-recovery", 6], ["mid-interaction", 9], ["target-removal", 10]] },
  { id: "p3-t3-fifteen-actor-geometric-capacity", actorCount: 15, synthetic: true, maxTick: 75, checkpoints: [["approaching-narrow-door", 2], ["shared-queue", 6], ["deadlock-recovery", 6], ["mid-interaction", 9], ["target-removal", 10]] },
]);
const evidenceFiles = Object.freeze({
  t2: ["artifacts/office-v2/phase3/t2/executed-scenarios.json", "artifacts/office-v2/phase3/t2/t2-evidence.json", "artifacts/office-v2/phase3/t2/t2-evidence.md"],
  t3: ["artifacts/office-v2/phase3/t3/executed-scenarios.json", "artifacts/office-v2/phase3/t3/t3-evidence.json", "artifacts/office-v2/phase3/t3/t3-evidence.md"],
  operations: ["artifacts/office-v2/phase3/operations/operations-runner-trace.json", "artifacts/office-v2/phase3/operations/operations-trace.json", "artifacts/office-v2/phase3/operations/operations-trace.md"],
});
const forbiddenClaimWords = /\b(?:pending|skipped|placeholder)\b/i;
const sha256Pattern = /^[a-f0-9]{64}$/;

function isObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function sameArray(left, right) { return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((value, index) => value === right[index]); }
function sameSet(left, right) { return Array.isArray(left) && Array.isArray(right) && left.length === right.length && new Set(left).size === left.length && new Set(right).size === right.length && [...left].every((value) => right.includes(value)); }
function add(errors, condition, message) { if (!condition) errors.push(message); }
function isRealHash(value) { return typeof value === "string" && sha256Pattern.test(value) && !/^([0-9a-f])\1{63}$/.test(value); }
function validateHash(errors, value, label) { add(errors, isRealHash(value), `${label} must be a non-placeholder SHA-256 hash.`); }
function validateNoPlaceholderClaims(errors, text, label) { add(errors, typeof text === "string" && !forbiddenClaimWords.test(text), `${label} contains a pending, skipped, or placeholder claim.`); }
function idsOf(values) { return Array.isArray(values) ? values.map((value) => value?.scenarioId) : []; }

function readJson(root, path, errors) {
  const absolute = join(root, path);
  if (!existsSync(absolute)) { errors.push(`${path} is missing.`); return null; }
  try { return JSON.parse(readFileSync(absolute, "utf8").replace(/^\uFEFF/, "")); }
  catch (error) { errors.push(`${path} is malformed JSON: ${error.message}`); return null; }
}

function readAuthoritativeRoles(root = repositoryRoot) {
  const config = JSON.parse(readFileSync(join(root, "config/agents.json"), "utf8").replace(/^\uFEFF/, ""));
  const configured = config.agents?.map((agent) => agent.id);
  const source = readFileSync(join(root, "packages/agent-catalog/src/index.ts"), "utf8");
  const catalog = [...source.matchAll(/\{ id: "([^"]+)"/g)].map((match) => match[1]);
  if (!sameArray(configured, catalog) || configured.length !== 10 || new Set(configured).size !== configured.length) {
    throw new Error("config/agents.json and packages/agent-catalog/src/index.ts do not define the same ten unique roles.");
  }
  return configured;
}

function validateT2(documents) {
  const errors = [];
  const { manifest, evidence, markdown } = documents;
  add(errors, isObject(manifest), "T2 executed-scenarios manifest is missing or malformed.");
  add(errors, isObject(evidence), "T2 evidence JSON is missing or malformed.");
  add(errors, typeof markdown === "string", "T2 evidence Markdown is missing.");
  if (!isObject(manifest) || !isObject(evidence) || typeof markdown !== "string") return errors;
  add(errors, manifest.schemaVersion === "office-t2-executed-scenarios-v1", "T2 manifest schema is stale or unexpected.");
  add(errors, manifest.runtimeVersion === "office-integrated-runtime-v1", "T2 manifest runtime version is stale or unexpected.");
  add(errors, evidence.schemaVersion === "office-t2-evidence-v1", "T2 evidence schema is stale or unexpected.");
  add(errors, manifest.scenarioCount === t2Ids.length && evidence.scenarioCount === t2Ids.length, "T2 must contain exactly nine scenarios.");
  add(errors, sameArray(manifest.scenarioIds, t2Ids), "T2 manifest scenario IDs do not match the required one-actor matrix.");
  add(errors, sameArray(idsOf(evidence.scenarios), t2Ids), "T2 evidence scenario IDs do not match its manifest.");
  for (const scenario of evidence.scenarios ?? []) {
    const label = `T2 ${scenario?.scenarioId ?? "scenario"}`;
    add(errors, isObject(scenario), `${label} is malformed.`);
    if (!isObject(scenario)) continue;
    add(errors, scenario.scenarioId.startsWith("t2-one-actor-"), `${label} is not one-actor evidence.`);
    const actorIds = [...(scenario.inputCommands ?? []), ...(scenario.eventSequence ?? [])]
      .map((value) => value?.actorId?.value ?? value?.actorId).filter((value) => value !== undefined);
    add(errors, actorIds.length > 0 && actorIds.every((value) => value === "actor-one"), `${label} contains a non-single actor path.`);
    add(errors, isObject(scenario.checkpoint) && scenario.checkpoint.completeTick === true, `${label} checkpoint is not a completed tick.`);
    validateHash(errors, scenario.checkpoint?.stateHash, `${label} checkpoint state`);
    add(errors, scenario.replayResult?.equal === true && scenario.replayResult?.restoredEventTailEqual === true, `${label} replay equality is not proven.`);
    add(errors, scenario.cleanup?.passed === true && Array.isArray(scenario.cleanup.uninterruptedLeaks) && scenario.cleanup.uninterruptedLeaks.length === 0 && Array.isArray(scenario.cleanup.restoredLeaks) && scenario.cleanup.restoredLeaks.length === 0, `${label} has cleanup leaks or an unproven cleanup claim.`);
    validateHash(errors, scenario.uninterruptedFinalHash, `${label} uninterrupted final`);
    validateHash(errors, scenario.restoredFinalHash, `${label} restored final`);
    add(errors, scenario.uninterruptedFinalHash === scenario.restoredFinalHash && scenario.equality === true, `${label} final state/hash equality is not proven.`);
    add(errors, Array.isArray(scenario.eventSequence) && scenario.eventSequence.length > 0, `${label} has no integrated event sequence.`);
  }
  add(errors, markdown.startsWith("# Phase 3 T2 integrated one-actor evidence"), "T2 Markdown does not identify integrated one-actor evidence.");
  add(errors, markdown.includes("Scenario count: 9") && markdown.includes("reducer-owned integrated runtime") && markdown.includes("replay/restore"), "T2 Markdown is stale or incomplete.");
  for (const scenario of evidence.scenarios ?? []) add(errors, markdown.includes(scenario.scenarioId) && markdown.includes(scenario.uninterruptedFinalHash) && markdown.includes(scenario.restoredFinalHash), `T2 Markdown is inconsistent for ${scenario.scenarioId}.`);
  validateNoPlaceholderClaims(errors, markdown, "T2 Markdown");
  return errors;
}

function validateT3(documents) {
  const errors = [];
  const { manifest, evidence, markdown } = documents;
  add(errors, isObject(manifest), "T3 executed-scenarios manifest is missing or malformed.");
  add(errors, isObject(evidence), "T3 evidence JSON is missing or malformed.");
  add(errors, typeof markdown === "string", "T3 evidence Markdown is missing.");
  if (!isObject(manifest) || !isObject(evidence) || typeof markdown !== "string") return errors;
  add(errors, manifest.schemaVersion === "office-t3-executed-scenarios-v1", "T3 manifest schema is stale or unexpected.");
  add(errors, manifest.runtimeVersion === "office-integrated-crowd-v1", "T3 manifest runtime version is stale or unexpected.");
  add(errors, evidence.schemaVersion === "office-t3-integrated-crowd-evidence-v1", "T3 evidence schema is stale or unexpected.");
  add(errors, evidence.scenarioCount === 3 && manifest.scenarioCount === 3, "T3 must contain exactly three scenarios.");
  add(errors, sameArray(manifest.actorCounts, [1, 10, 15]), "T3 manifest must contain actor counts exactly [1, 10, 15].");
  const expectedIds = t3Definitions.map((definition) => definition.id);
  add(errors, sameArray(manifest.scenarioIds, expectedIds) && sameArray(idsOf(evidence.scenarios), expectedIds), "T3 scenario IDs are missing, duplicated, or stale.");
  for (const definition of t3Definitions) {
    const scenario = (evidence.scenarios ?? []).find((value) => value?.scenarioId === definition.id);
    const label = `T3 ${definition.id}`;
    add(errors, isObject(scenario), `${label} is missing or malformed.`);
    if (!isObject(scenario)) continue;
    add(errors, scenario.actorCount === definition.actorCount && scenario.syntheticCapacityActors === definition.synthetic, `${label} has incorrect actor/capacity semantics.`);
    add(errors, scenario.contentionSetup?.maxTick === definition.maxTick, `${label} max tick is stale or inconsistent.`);
    add(errors, scenario.contentionSetup?.sharedFacility === "shared-review" && scenario.contentionSetup?.narrowDoor === "transit:narrow-door" && scenario.contentionSetup?.limitedResource === "held-prop:review-card" && scenario.contentionSetup?.deadlockPolicy === "office-queue-policy-v1", `${label} contention setup is incomplete.`);
    add(errors, typeof scenario.adapterBoundary === "string" && scenario.adapterBoundary.includes("accepted integrated reducer") && scenario.adapterBoundary.includes("queues.ts"), `${label} is not integrated reducer evidence.`);
    const checkpoints = scenario.checkpoints ?? [];
    add(errors, checkpoints.length === definition.checkpoints.length, `${label} checkpoint count is incomplete.`);
    for (const [index, [kind, tick]] of definition.checkpoints.entries()) {
      const checkpoint = checkpoints[index];
      add(errors, checkpoint?.kind === kind && checkpoint?.tick === tick, `${label} checkpoint ${kind}@${tick} is missing or stale.`);
      validateHash(errors, checkpoint?.stateHash, `${label} ${kind} checkpoint`);
      add(errors, checkpoint?.eventSuffixEqual === true && checkpoint?.finalHashEqual === true, `${label} ${kind} checkpoint equality is not proven.`);
    }
    validateHash(errors, scenario.uninterruptedFinalHash, `${label} uninterrupted final`);
    validateHash(errors, scenario.restoredFinalHash, `${label} restored final`);
    add(errors, scenario.uninterruptedFinalHash === scenario.restoredFinalHash && scenario.equality === true, `${label} final state/hash equality is not proven.`);
    add(errors, scenario.cleanup?.passed === true && scenario.cleanup.uninterruptedLeaks?.length === 0 && scenario.cleanup.restoredLeaks?.length === 0, `${label} has cleanup leaks or an unproven cleanup claim.`);
    add(errors, Array.isArray(scenario.eventSequence?.reducer) && scenario.eventSequence.reducer.length > 0 && Array.isArray(scenario.eventSequence?.crowd) && scenario.eventSequence.crowd.length > 0, `${label} has no integrated event sequence.`);
  }
  add(errors, markdown.startsWith("# Phase 3 T3 integrated crowd evidence"), "T3 Markdown does not identify integrated crowd evidence.");
  add(errors, markdown.includes("exactly 1, 10, and 15") && markdown.includes("synthetic geometric capacity evidence") && markdown.includes("does not claim live adapter employees"), "T3 Markdown lacks the required capacity disclaimer.");
  for (const scenario of evidence.scenarios ?? []) add(errors, markdown.includes(scenario.scenarioId) && markdown.includes(scenario.uninterruptedFinalHash) && markdown.includes(scenario.restoredFinalHash), `T3 Markdown is inconsistent for ${scenario.scenarioId}.`);
  validateNoPlaceholderClaims(errors, markdown, "T3 Markdown");
  return errors;
}

function validateOperations(documents, catalogRoles) {
  const errors = [];
  const { runner, trace, markdown } = documents;
  add(errors, isObject(runner), "Operations runner trace is missing or malformed.");
  add(errors, isObject(trace), "Operations evidence JSON is missing or malformed.");
  add(errors, typeof markdown === "string", "Operations evidence Markdown is missing.");
  if (!isObject(runner) || !isObject(trace) || typeof markdown !== "string") return errors;
  add(errors, runner.schemaVersion === "phase3-operations-runner-trace-v1", "Operations runner trace schema is stale or unexpected.");
  add(errors, trace.schemaVersion === "phase3-operations-evidence-v1", "Operations evidence schema is stale or unexpected.");
  add(errors, runner.scenarioCount === 10 && trace.scenarioCount === 10, "Operations evidence must contain exactly ten roles.");
  add(errors, sameArray(runner.roles, catalogRoles) && sameArray(trace.roles, catalogRoles), "Operations roles do not exactly match the authoritative catalog.");
  const jobRoles = (runner.jobs ?? []).map((job) => job?.payload?.roleId);
  add(errors, sameSet(jobRoles, catalogRoles), "Operations runner jobs do not cover the catalog exactly once.");
  add(errors, (runner.jobs ?? []).length === 10 && (trace.choreography ?? []).length === 10, "Operations choreography is incomplete.");
  add(errors, (runner.jobs ?? []).every((job) => typeof job?.id === "string" && Number.isInteger(job?.attempt) && job.attempt > 0), "Operations runner jobs are malformed.");
  const successfulResults = new Set((runner.results ?? []).filter((result) => result?.status === "succeeded").map((result) => result.jobId));
  add(errors, catalogRoles.every((role) => successfulResults.has((runner.jobs ?? []).find((job) => job?.payload?.roleId === role)?.id)), "Operations does not prove a successful result for every role.");
  add(errors, (runner.results ?? []).some((result) => result?.status === "failed") && (runner.results ?? []).length === 11, "Operations failure/retry trace is missing.");
  add(errors, runner.workflow?.directJoinRejected === true && runner.workflow?.contentJoinOwner === "workflow-coordinator" && runner.workflow?.terminalStage === "measured", "Workflow ownership evidence is incomplete.");
  add(errors, runner.operationsWindow?.events?.length === 15 && sameArray(runner.operationsWindow.events.map((event) => event?.sequence), Array.from({ length: 15 }, (_, index) => index + 1)), "Operations event window is incomplete or out of order.");
  add(errors, isObject(runner.persistence?.first) && isObject(runner.persistence?.second) && JSON.stringify(runner.persistence.first) === JSON.stringify(runner.persistence.second) && runner.persistence.systemJoinAuditCount === 1, "Operations persistence idempotency evidence is incomplete.");
  const choreographyRoles = (trace.choreography ?? []).map((step) => step?.roleId);
  add(errors, sameSet(choreographyRoles, catalogRoles) && sameArray(choreographyRoles, jobRoles) && (trace.choreography ?? []).every((step) => step?.simulationOnly === true && step?.result === "succeeded"), "Operations choreography is inconsistent or not explicitly simulation-only.");
  add(errors, trace.eventOrder?.length === 15 && sameArray(trace.eventOrder.map((event) => event?.sequence), Array.from({ length: 15 }, (_, index) => index + 1)), "Operations evidence event order is inconsistent with the runner trace.");
  add(errors, trace.finalStateEqual === true && trace.authoritative?.status === "succeeded" && trace.projected?.status === "succeeded", "Operations authoritative/projected equality is not proven.");
  add(errors, trace.disabledConnector?.allowed === false && Array.isArray(trace.disabledConnector.connectorActions) && trace.disabledConnector.connectorActions.length === 0, "Operations disabled-connector safety is not proven.");
  const persistenceSummary = (value) => ({
    first: { workflowId: value?.first?.workflowId, jobs: value?.first?.jobs, agentRuns: value?.first?.agentRuns ?? value?.first?.agent_runs, auditEvents: value?.first?.auditEvents ?? value?.first?.audit_events },
    second: { workflowId: value?.second?.workflowId, jobs: value?.second?.jobs, agentRuns: value?.second?.agentRuns ?? value?.second?.agent_runs, auditEvents: value?.second?.auditEvents ?? value?.second?.audit_events },
    counts: { jobs: value?.counts?.jobs, agentRuns: value?.counts?.agentRuns ?? value?.counts?.agent_runs, auditEvents: value?.counts?.auditEvents ?? value?.counts?.audit_events, jobOutbox: value?.counts?.jobOutbox ?? value?.counts?.job_outbox },
    systemJoinAuditCount: value?.systemJoinAuditCount,
  });
  add(errors, JSON.stringify(persistenceSummary(trace.persistence)) === JSON.stringify(persistenceSummary(runner.persistence)), "Operations persistence evidence is inconsistent between traces.");
  add(errors, markdown.startsWith("# P3-EXIT-03 Ten-role operations trace") && markdown.includes("Scenario count: 10") && markdown.includes("Final authoritative equals projected: true") && markdown.includes("Disabled connector actions: 0"), "Operations Markdown is stale or incomplete.");
  for (const role of catalogRoles) add(errors, markdown.includes(role), `Operations Markdown is missing ${role}.`);
  validateNoPlaceholderClaims(errors, markdown, "Operations Markdown");
  validateNoPlaceholderClaims(errors, JSON.stringify(trace), "Operations evidence JSON");
  return errors;
}

export function validateEvidenceDocuments(documents, catalogRoles) {
  const roles = catalogRoles ?? ["market-scout", "product-ranker", "growth-strategist", "performance-analyst", "gemini-copywriter", "flow-visual-producer", "link-attribution", "qa-editor", "publisher", "session-keeper"];
  const t2 = validateT2(documents.t2);
  const t3 = validateT3(documents.t3);
  const operations = validateOperations(documents.operations, roles);
  return { valid: t2.length === 0 && t3.length === 0 && operations.length === 0, t2, t3, operations, diagnostics: [...t2.map((value) => `t2: ${value}`), ...t3.map((value) => `t3: ${value}`), ...operations.map((value) => `operations: ${value}`)] };
}

function readEvidenceDocuments(root = repositoryRoot) {
  const errors = [];
  const readGroup = (paths, kind) => {
    const values = paths.map((path, index) => index < 2 ? readJson(root, path, errors) : existsSync(join(root, path)) ? readFileSync(join(root, path), "utf8") : (errors.push(`${path} is missing.`), null));
    return kind === "operations" ? { runner: values[0], trace: values[1], markdown: values[2] } : { manifest: values[0], evidence: values[1], markdown: values[2] };
  };
  return { documents: { t2: readGroup(evidenceFiles.t2, "simulation"), t3: readGroup(evidenceFiles.t3, "simulation"), operations: readGroup(evidenceFiles.operations, "operations") }, readErrors: errors };
}

function fileMetadata(root, paths) {
  return paths.map((path) => {
    const absolute = join(root, path);
    if (!existsSync(absolute)) return { path, present: false };
    return { path, present: true, sha256: createHash("sha256").update(readFileSync(absolute)).digest("hex") };
  });
}

function npmCommand() { return process.platform === "win32" ? "npm.cmd" : "npm"; }
function formatCommand(executable, args) { return [executable === process.execPath ? "node" : executable, ...args].join(" "); }
function runCommand(root, check) {
  const isWindowsNpm = process.platform === "win32" && check.executable === npmCommand();
  const executable = isWindowsNpm ? (process.env.ComSpec ?? "cmd.exe") : check.executable;
  const args = isWindowsNpm ? ["/d", "/s", "/c", [check.executable, ...check.args].join(" ")] : check.args;
  const result = spawnSync(executable, args, { cwd: root, encoding: "utf8", timeout: 900000, stdio: ["ignore", "pipe", "pipe"] });
  const passed = result.error === undefined && result.status === 0;
  return { id: check.id, command: formatCommand(check.executable, check.args), status: passed ? "passed" : "failed", exitCode: result.status ?? null, signal: result.signal ?? null, error: result.error?.code ?? null };
}

function commandPlan() {
  const npm = npmCommand();
  return [
    { id: "gate-unit-tests", executable: process.execPath, args: ["--test", "scripts/office-v2-phase3-exit.test.mjs"] },
    { id: "t2-t3-simulation-tests", executable: npm, args: ["run", "test", "--workspace", "@affiliate-ops/office-v2-simulation"] },
    { id: "operations-tests", executable: npm, args: ["run", "test", "--workspace", "@affiliate-ops/office-v2-operations"] },
    { id: "runner-tests", executable: npm, args: ["run", "test", "--workspace", "@affiliate-ops/automation-runner"] },
    { id: "simulation-typecheck", executable: npm, args: ["run", "typecheck", "--workspace", "@affiliate-ops/office-v2-simulation"] },
    { id: "operations-typecheck", executable: npm, args: ["run", "typecheck", "--workspace", "@affiliate-ops/office-v2-operations"] },
    { id: "runner-typecheck", executable: npm, args: ["run", "typecheck", "--workspace", "@affiliate-ops/automation-runner"] },
    { id: "workflows-typecheck", executable: npm, args: ["run", "typecheck", "--workspace", "@affiliate-ops/workflows"] },
    { id: "office-v2-clean-room", executable: npm, args: ["run", "office:v2:clean-room:check"] },
    { id: "office-v2-boundaries", executable: npm, args: ["run", "office:v2:boundaries:check"] },
    { id: "office-v2-contradictions", executable: npm, args: ["run", "office:v2:contradictions:check"] },
    { id: "office-v2-knowledge", executable: npm, args: ["run", "office:v2:knowledge:check"] },
    { id: "office-v2-assets", executable: npm, args: ["run", "office:v2:assets:check"] },
    { id: "architecture", executable: npm, args: ["run", "architecture:check"] },
    { id: "full-repository-check", executable: npm, args: ["run", "check"] },
  ];
}

function gitHead(root) {
  const result = spawnSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : "unavailable";
}

function reportMarkdown(report) {
  const lines = ["# Office V2 Phase 3 exit gate", "", `- Status: ${report.status.toUpperCase()}`, `- Git HEAD: ${report.gitHead}`, `- Generated-at policy: ${report.generatedAtPolicy}`, "", "## Evidence", "", "| Area | Path | SHA-256 | Present |", "| --- | --- | --- | --- |"];
  for (const group of Object.values(report.evidence)) for (const file of group) lines.push(`| evidence | ${file.path} | ${file.sha256 ?? "—"} | ${file.present ? "yes" : "no"} |`);
  lines.push("", "## Validation", "", `- Before commands: ${report.validation.before.status}`, `- After commands: ${report.validation.after.status}`);
  for (const diagnostic of [...report.validation.before.diagnostics, ...report.validation.after.diagnostics]) lines.push(`- Diagnostic: ${diagnostic}`);
  lines.push("", "## Commands", "", "| Check | Command | Result | Exit code |", "| --- | --- | --- | ---: |");
  for (const check of report.commands) lines.push(`| ${check.id} | \`${check.command}\` | ${check.status} | ${check.exitCode ?? "—"} |`);
  lines.push("", "The gate is closed unless both evidence validations and every listed command pass.");
  return `${lines.join("\n")}\n`;
}

export function runPhase3ExitGate(root = repositoryRoot) {
  const roles = readAuthoritativeRoles(root);
  const beforeRead = readEvidenceDocuments(root);
  const beforeValidation = validateEvidenceDocuments(beforeRead.documents, roles);
  const commands = commandPlan().map((check) => runCommand(root, check));
  const afterRead = readEvidenceDocuments(root);
  const afterValidation = validateEvidenceDocuments(afterRead.documents, roles);
  const readErrors = [...beforeRead.readErrors, ...afterRead.readErrors];
  const beforeDiagnostics = [...readErrors.map((value) => `read: ${value}`), ...beforeValidation.diagnostics];
  const afterDiagnostics = [...afterRead.readErrors.map((value) => `read: ${value}`), ...afterValidation.diagnostics];
  const passed = beforeDiagnostics.length === 0 && afterDiagnostics.length === 0 && commands.every((check) => check.status === "passed");
  const report = {
    schemaVersion: "office-v2-phase3-exit-gate-v1",
    status: passed ? "passed" : "failed",
    generatedAtPolicy: "omitted; deterministic for a checked-out git HEAD and deterministic evidence",
    gitHead: gitHead(root),
    evidence: {
      t2: fileMetadata(root, evidenceFiles.t2),
      t3: fileMetadata(root, evidenceFiles.t3),
      operations: fileMetadata(root, evidenceFiles.operations),
    },
    validation: {
      before: { status: beforeDiagnostics.length === 0 ? "passed" : "failed", diagnostics: beforeDiagnostics },
      after: { status: afterDiagnostics.length === 0 ? "passed" : "failed", diagnostics: afterDiagnostics },
    },
    commands,
  };
  const outputDirectory = join(root, evidenceRoot);
  mkdirSync(outputDirectory, { recursive: true });
  writeFileSync(join(outputDirectory, "phase3-exit-gate.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  writeFileSync(join(outputDirectory, "phase3-exit-gate.md"), reportMarkdown(report), "utf8");
  return report;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    const report = runPhase3ExitGate();
    if (report.status !== "passed") {
      console.error(`Phase 3 exit gate FAILED: ${report.validation.after.diagnostics.join("; ") || report.commands.filter((check) => check.status !== "passed").map((check) => check.id).join(", ")}`);
      process.exitCode = 1;
    } else console.log("Phase 3 exit gate PASSED.");
  } catch (error) {
    console.error(`Phase 3 exit gate FAILED: ${error.message}`);
    process.exitCode = 1;
  }
}
