import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runPhase3OperationsTrace, writePhase3OperationsEvidence } from "../src/index.ts";

type Trace = ReturnType<typeof runPhase3OperationsTrace> & { persistence: { first: { jobs: number }; second: { jobs: number }; systemJoinAuditCount: number } };

test("runner trace uses the repository ten-role catalog and real job/result boundaries", () => {
  const first = runPhase3OperationsTrace() as Trace;
  const second = runPhase3OperationsTrace() as Trace;
  assert.deepEqual(first, second);
  assert.equal(first.scenarioCount, 10);
  assert.deepEqual(first.roles, ["market-scout", "product-ranker", "growth-strategist", "performance-analyst", "gemini-copywriter", "flow-visual-producer", "link-attribution", "qa-editor", "publisher", "session-keeper"]);
  assert.equal(first.jobs.length, 10);
  assert.equal(first.results.length, 11);
  assert.equal(first.results.filter((result) => result.status === "failed").length, 1);
  assert.equal(first.workflow.directJoinRejected, true);
  assert.equal(first.workflow.contentJoinOwner, "workflow-coordinator");
  assert.equal(first.persistence.first.jobs, 8);
  assert.deepEqual(first.persistence.first, first.persistence.second);
  assert.equal(first.persistence.systemJoinAuditCount, 1);
});

test("runner evidence can be regenerated without wall-clock identifiers", () => {
  const outputDirectory = resolve(import.meta.dirname, "../../../artifacts/office-v2/phase3/operations");
  writePhase3OperationsEvidence(outputDirectory);
  const raw = JSON.parse(readFileSync(resolve(outputDirectory, "operations-runner-trace.json"), "utf8")) as { operationsWindow: { events: { durableEventId: { value: string } }[] } };
  assert.equal(raw.operationsWindow.events.length, 15);
  assert.equal(raw.operationsWindow.events.some((event) => event.durableEventId.value.includes("2026-08-03")), false);
});
