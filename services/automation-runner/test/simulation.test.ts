import assert from "node:assert/strict";
import test from "node:test";
import { FakeSheetsConnector, simulatePilotRun } from "../src/index.ts";

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
