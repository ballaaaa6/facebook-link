import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";
import { openLocalDatabase } from "../src/index.ts";

test("applies the initial schema to an in-memory SQLite database", () => {
  const migrations = resolve(import.meta.dirname, "../migrations");
  const { database, appliedMigrations } = openLocalDatabase(":memory:", migrations);
  try {
    const tables = database.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((row) => String(row.name));
    assert.deepEqual(appliedMigrations, ["0001_initial.sql"]);
    assert.ok(tables.includes("workspaces"));
    assert.ok(tables.includes("jobs"));
    assert.ok(tables.includes("sheet_sync_state"));
    assert.ok(tables.includes("brain_messages"));
  } finally {
    database.close();
  }
});
