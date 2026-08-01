import assert from "node:assert/strict";
import test from "node:test";
import { resolve } from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { openLocalDatabase } from "@affiliate-ops/database";
import {
  FakeSheetsConnector,
  persistPilotSimulation,
  simulatePilotRun,
  type PilotJobResult,
  type PilotSimulation,
} from "../src/index.ts";

const migrationsPath = resolve(process.cwd(), "../../packages/database/migrations");

function countRows(database: DatabaseSync, table: string, where = "1 = 1"): number {
  return Number(database.prepare(`SELECT COUNT(*) AS count FROM ${table} WHERE ${where}`).get()?.count);
}

function replaceResult(
  simulation: PilotSimulation,
  jobId: string,
  replacement: (result: PilotJobResult) => PilotJobResult,
): PilotSimulation {
  return {
    ...simulation,
    results: simulation.results.map((result) => result.jobId === jobId ? replacement(result) : result),
  };
}

test("simulates independent content branches and mirrors rows idempotently", async () => {
  const simulation = simulatePilotRun();
  assert.equal(simulation.jobs.length, 8);
  assert.equal(new Set(simulation.jobs.map((job) => job.id)).size, simulation.jobs.length);
  assert.equal(new Set(simulation.jobs.map((job) => job.idempotencyKey)).size, simulation.jobs.length);
  assert.equal(simulation.jobs.some((job) => job.stage === "content_ready"), false);
  assert.ok(simulation.results.every((result) => result.status === "succeeded"));

  const contentJobs = simulation.jobs.filter((job) => job.stage === "content_queued");
  assert.equal(contentJobs.length, 2);
  assert.deepEqual(contentJobs.map((job) => job.payload.branch).sort(), ["copy", "visual"]);
  assert.equal(new Set(contentJobs.map((job) => job.payload.contentGroupId)).size, 1);
  assert.equal(new Set(contentJobs.map((job) => job.availableAt)).size, 1);

  for (const job of contentJobs) {
    const { branch, contentGroupId } = job.payload;
    assert.ok(branch);
    assert.ok(contentGroupId);
    assert.equal(job.id, `${job.workflowId}-job-content-${branch}`);
    assert.equal(job.idempotencyKey, [job.workspaceId, job.workflowId, job.stage, contentGroupId, branch].join(":"));
    const result = simulation.results.find((candidate) => candidate.jobId === job.id);
    assert.ok(result);
    const completion = result.result?.contentCompletion;
    assert.ok(completion);
    assert.equal(completion.jobId, job.id);
    assert.equal(completion.contentGroupId, contentGroupId);
    assert.equal(completion.branch, branch);
    assert.equal(completion.attempt, job.attempt);
    assert.equal(completion.artifactVersion, 1);
  }

  assert.equal(simulation.contentReadyEvent.stage, "content_ready");
  assert.equal(simulation.contentReadyEvent.actorType, "system");
  assert.equal(simulation.contentReadyEvent.actorId, "workflow-coordinator");
  assert.equal(simulation.contentReadyEvent.payload.contentGroupId, contentJobs[0]?.payload.contentGroupId);

  const connector = new FakeSheetsConnector();
  const target = { id: "sheet-1", workspaceId: "pilot-workspace", spreadsheetId: "test", enabled: true, timezone: "Asia/Bangkok" as const, createdAt: new Date().toISOString() };
  const first = await connector.upsertRows(target, simulation.sheetRows);
  const second = await connector.upsertRows(target, simulation.sheetRows);
  assert.equal(first.rowsWritten, 3);
  assert.equal(second.rowsWritten, 0);
  assert.equal(connector.workbook.size, 10);
  assert.equal(connector.workbook.get("Products")?.rows.size, 1);
});

test("persists reversed results and one system join idempotently", () => {
  const { database } = openLocalDatabase(":memory:", migrationsPath);
  try {
    const original = simulatePilotRun();
    const simulation = { ...original, results: [...original.results].reverse() };
    const first = persistPilotSimulation(database, simulation);
    const second = persistPilotSimulation(database, simulation);
    assert.deepEqual(first, { workflowId: original.jobs[0]?.workflowId, jobs: 8, agentRuns: 8, auditEvents: 9 });
    assert.deepEqual(second, first);
    assert.equal(countRows(database, "jobs"), 8);
    assert.equal(countRows(database, "agent_runs"), 8);
    assert.equal(countRows(database, "audit_events"), 9);
    assert.equal(countRows(database, "job_outbox"), 8);
    assert.equal(countRows(database, "jobs", "stage = 'content_ready'"), 0);
    assert.equal(countRows(database, "agent_runs", "agent_id = 'workflow-coordinator'"), 0);

    const resultsByJobId = new Map(original.results.map((result) => [result.jobId, result]));
    const persistedJobs = database.prepare("SELECT id, completed_at FROM jobs").all();
    for (const row of persistedJobs) {
      assert.equal(String(row.completed_at), resultsByJobId.get(String(row.id))?.completedAt);
    }

    const contentRuns = database.prepare("SELECT agent_id, input_json FROM agent_runs").all()
      .map((row) => ({ agentId: String(row.agent_id), input: JSON.parse(String(row.input_json)) as { branch?: string } }))
      .filter((row) => row.input.branch);
    assert.deepEqual(
      contentRuns.map((row) => [row.input.branch, row.agentId]).sort(),
      [["copy", "gemini-copywriter"], ["visual", "flow-visual-producer"]],
    );

    const coordinatorAudits = database.prepare("SELECT actor_type, actor_id, payload_json FROM audit_events WHERE event_type = 'workflow.content_ready'").all();
    assert.equal(coordinatorAudits.length, 1);
    const coordinatorAudit = coordinatorAudits[0];
    assert.ok(coordinatorAudit);
    assert.equal(String(coordinatorAudit.actor_type), "system");
    assert.equal(String(coordinatorAudit.actor_id), "workflow-coordinator");
    assert.deepEqual(JSON.parse(String(coordinatorAudit.payload_json)), original.contentReadyEvent.payload);
  } finally {
    database.close();
  }
});

test("rejects invalid result correlation without partial persistence", async (t) => {
  const cases: readonly {
    name: string;
    expected: RegExp;
    mutate: (simulation: PilotSimulation) => PilotSimulation;
  }[] = [
    {
      name: "missing result",
      expected: /Missing pilot result/,
      mutate: (simulation) => ({ ...simulation, results: simulation.results.slice(1) }),
    },
    {
      name: "orphan result",
      expected: /Orphan pilot result/,
      mutate: (simulation) => ({ ...simulation, results: [...simulation.results, { ...simulation.results[0]!, jobId: "orphan-job" }] }),
    },
    {
      name: "duplicate result",
      expected: /Duplicate pilot result/,
      mutate: (simulation) => ({ ...simulation, results: [...simulation.results, simulation.results[0]!] }),
    },
    {
      name: "workspace mismatch",
      expected: /result workspaceId mismatch/,
      mutate: (simulation) => replaceResult(simulation, simulation.results[0]!.jobId, (result) => ({ ...result, workspaceId: "other-workspace" })),
    },
    {
      name: "connector mismatch",
      expected: /result connectorId mismatch/,
      mutate: (simulation) => replaceResult(simulation, simulation.results[0]!.jobId, (result) => ({ ...result, connectorId: "simulation.wrong" })),
    },
    {
      name: "trace mismatch",
      expected: /result traceId mismatch/,
      mutate: (simulation) => replaceResult(simulation, simulation.results[0]!.jobId, (result) => ({ ...result, traceId: "trace-wrong" })),
    },
    {
      name: "content metadata mismatch",
      expected: /completion contentGroupId mismatch/,
      mutate: (simulation) => {
        const result = simulation.results.find((candidate) => candidate.result?.contentCompletion?.branch === "copy");
        assert.ok(result?.result?.contentCompletion);
        return replaceResult(simulation, result.jobId, (current) => ({
          ...current,
          result: {
            ...current.result!,
            contentCompletion: { ...current.result!.contentCompletion!, contentGroupId: "wrong-content-group" },
          },
        }));
      },
    },
    {
      name: "duplicate content completion identity",
      expected: /Duplicate content completion ID/,
      mutate: (simulation) => {
        const copyId = simulation.results.find((candidate) => candidate.result?.contentCompletion?.branch === "copy")
          ?.result?.contentCompletion?.id;
        const visual = simulation.results.find((candidate) => candidate.result?.contentCompletion?.branch === "visual");
        assert.ok(copyId);
        assert.ok(visual?.result?.contentCompletion);
        return replaceResult(simulation, visual.jobId, (current) => ({
          ...current,
          result: {
            ...current.result!,
            contentCompletion: { ...current.result!.contentCompletion!, id: copyId },
          },
        }));
      },
    },
    {
      name: "coordinator identity mismatch",
      expected: /coordinator event does not match/,
      mutate: (simulation) => ({
        ...simulation,
        contentReadyEvent: { ...simulation.contentReadyEvent, id: "wrong-content-ready-event" },
      }),
    },
    {
      name: "coordinator trace mismatch",
      expected: /coordinator traceId mismatch/,
      mutate: (simulation) => ({
        ...simulation,
        contentReadyEvent: { ...simulation.contentReadyEvent, traceId: "trace-wrong" },
      }),
    },
    {
      name: "coordinator branch reference mismatch",
      expected: /coordinator event does not match/,
      mutate: (simulation) => ({
        ...simulation,
        contentReadyEvent: {
          ...simulation.contentReadyEvent,
          payload: {
            ...simulation.contentReadyEvent.payload,
            copy: { ...simulation.contentReadyEvent.payload.copy, artifactVersion: 99 },
          },
        },
      }),
    },
    {
      name: "ambiguous failed result",
      expected: /not an unambiguous success/,
      mutate: (simulation) => replaceResult(simulation, simulation.results[0]!.jobId, (result) => ({
        ...result,
        status: "failed",
        error: { category: "permanent", code: "simulation.failed", message: "failed", retryable: false },
      })),
    },
  ];

  for (const scenario of cases) {
    await t.test(scenario.name, () => {
      const { database } = openLocalDatabase(":memory:", migrationsPath);
      try {
        assert.throws(() => persistPilotSimulation(database, scenario.mutate(simulatePilotRun())), scenario.expected);
        assert.equal(countRows(database, "workspaces"), 0);
        assert.equal(countRows(database, "workflow_runs"), 0);
        assert.equal(countRows(database, "jobs"), 0);
        assert.equal(countRows(database, "agent_runs"), 0);
        assert.equal(countRows(database, "audit_events"), 0);
        assert.equal(countRows(database, "job_outbox"), 0);
      } finally {
        database.close();
      }
    });
  }
});

test("rejects a changed payload behind a persisted stable job identity", () => {
  const { database } = openLocalDatabase(":memory:", migrationsPath);
  try {
    const simulation = simulatePilotRun();
    persistPilotSimulation(database, simulation);
    const firstJob = simulation.jobs[0];
    assert.ok(firstJob);
    const conflicting: PilotSimulation = {
      ...simulation,
      jobs: simulation.jobs.map((job) => job.id === firstJob.id
        ? { ...job, payload: { ...job.payload, conflictingValue: true } }
        : job),
    };

    assert.throws(() => persistPilotSimulation(database, conflicting), /Idempotency conflict for jobs row/);
    assert.equal(countRows(database, "jobs"), 8);
    assert.equal(countRows(database, "agent_runs"), 8);
    assert.equal(countRows(database, "audit_events"), 9);
    assert.equal(countRows(database, "job_outbox"), 8);
    const persistedPayload = JSON.parse(String(database.prepare("SELECT payload_json FROM jobs WHERE id = ?").get(firstJob.id)?.payload_json));
    assert.equal("conflictingValue" in persistedPayload, false);
  } finally {
    database.close();
  }
});
