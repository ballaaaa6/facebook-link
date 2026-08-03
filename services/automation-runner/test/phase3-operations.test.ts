import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { agentCatalog } from "@affiliate-ops/agent-catalog";
import { runPhase3OperationsTrace, writePhase3OperationsEvidence } from "../src/index.ts";

type Trace = ReturnType<typeof runPhase3OperationsTrace> & { persistence: Record<string, any>; operationsWindow: { events: Record<string, any>[]; eventDigest: string };
  workflow: { retryTrace: Record<string, any>[] } };

test("runner trace uses the repository ten-role catalog and real job/result boundaries", () => {
  const first = runPhase3OperationsTrace() as Trace;
  const second = runPhase3OperationsTrace() as Trace;
  const config = JSON.parse(readFileSync(resolve(import.meta.dirname, "../../../config/agents.json"), "utf8")) as { agents: { id: string }[] };
  const expectedRoles = config.agents.map((agent) => agent.id);
  assert.deepEqual(first, second);
  assert.equal(first.scenarioCount, 10);
  assert.deepEqual(first.roles, expectedRoles);
  assert.deepEqual(first.roles, agentCatalog.map((agent) => agent.id));
  assert.equal(first.jobs.length, 10);
  assert.equal(first.results.length, 11);
  assert.equal(first.results.filter((result) => result.status === "failed").length, 1);
  assert.equal(first.workflow.directJoinRejected, true);
  assert.equal(first.workflow.contentJoinOwner, "workflow-coordinator");
  assert.equal(first.persistence.first.jobs, first.persistence.persistedJobIds.length);
  assert.deepEqual(first.persistence.first, first.persistence.second);
  assert.equal(first.persistence.sourceWorkflowId, first.persistence.persistedWorkflowId);
  assert.equal(first.persistence.sourceWorkflowId, first.jobs[0]?.workflowId);
  assert.ok(first.persistence.sourceJobIds.every((jobId: string) => first.jobs.some((job) => job.id === jobId)));
  assert.ok(first.persistence.persistedJobIds.every((jobId: string) => first.persistence.sourceJobIds.includes(jobId)));
  assert.equal(first.persistence.omittedRoleIds.length, 1);
  assert.equal(first.persistence.systemJoinAuditCount, 1);
  assert.ok(first.operationsWindow.events.every((event) => /^[a-f0-9]{64}$/.test(String(event.payloadDigest))));
  assert.ok(/^[a-f0-9]{64}$/.test(String(first.operationsWindow.eventDigest)));
  assert.ok(first.workflow.retryTrace.every((entry) => /^[a-f0-9]{64}$/.test(String(entry.payloadDigest))));
});

test("runner evidence can be regenerated without wall-clock identifiers", () => {
  const outputDirectory = resolve(import.meta.dirname, "../../../artifacts/office-v2/phase3/operations");
  writePhase3OperationsEvidence(outputDirectory);
  const raw = JSON.parse(readFileSync(resolve(outputDirectory, "operations-runner-trace.json"), "utf8")) as { operationsWindow: { events: { durableEventId: { value: string } }[] } };
  assert.equal(raw.operationsWindow.events.length, 15);
  assert.equal(raw.operationsWindow.events.some((event) => event.durableEventId.value.includes("2026-08-03")), false);
});
