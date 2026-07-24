import assert from "node:assert/strict";
import test from "node:test";
import { resolve } from "node:path";
import { openLocalDatabase } from "@affiliate-ops/database";
import { FakeSheetsConnector, persistPilotSimulation, simulatePilotRun } from "../src/index.ts";

test("simulates an idempotent pilot and mirrors rows", async () => {
  const simulation = simulatePilotRun();
  assert.equal(new Set(simulation.jobs.map((job) => job.idempotencyKey)).size, simulation.jobs.length);
  assert.ok(simulation.results.every((result) => result.status === "succeeded"));

  const connector = new FakeSheetsConnector();
  const target = { id: "sheet-1", workspaceId: "pilot-workspace", spreadsheetId: "test", enabled: true, timezone: "Asia/Bangkok" as const, createdAt: new Date().toISOString() };
  const first = await connector.upsertRows(target, simulation.sheetRows);
  const second = await connector.upsertRows(target, simulation.sheetRows);
  assert.equal(first.rowsWritten, 3);
  assert.equal(second.rowsWritten, 0);
  assert.equal(connector.workbook.size, 10);
  assert.equal(connector.workbook.get("Products")?.rows.size, 1);
});

test("persists agent runs and observable events idempotently", () => {
  const { database } = openLocalDatabase(":memory:", resolve(process.cwd(), "../../packages/database/migrations"));
  try {
    const simulation = simulatePilotRun();
    persistPilotSimulation(database, simulation);
    persistPilotSimulation(database, simulation);
    assert.equal(Number(database.prepare("SELECT COUNT(*) AS count FROM jobs").get()?.count), 8);
    assert.equal(Number(database.prepare("SELECT COUNT(*) AS count FROM agent_runs").get()?.count), 8);
    assert.equal(Number(database.prepare("SELECT COUNT(*) AS count FROM audit_events").get()?.count), 8);
    assert.equal(Number(database.prepare("SELECT COUNT(*) AS count FROM job_outbox").get()?.count), 8);
  } finally {
    database.close();
  }
});
