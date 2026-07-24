import { openLocalDatabase } from "@affiliate-ops/database";
import { LocalFilesystemStore } from "@affiliate-ops/storage";
import { resolve } from "node:path";
import { persistPilotSimulation } from "./persistence.ts";
import { simulatePilotRun } from "./pilot.ts";

const root = process.cwd();
const databasePath = resolve(root, "runtime-data/database/affiliate-ops.sqlite");
const migrationsPath = resolve(root, "packages/database/migrations");
const objectRoot = resolve(root, "runtime-data/objects");
const simulation = simulatePilotRun();
const { database, appliedMigrations } = openLocalDatabase(databasePath, migrationsPath);

try {
  const now = new Date().toISOString();
  const persisted = persistPilotSimulation(database, simulation, now);

  const bytes = new TextEncoder().encode(`${JSON.stringify(simulation, null, 2)}\n`);
  const stored = await new LocalFilesystemStore(objectRoot).put({ workspaceId: "pilot-workspace", bytes, contentType: "application/json", extension: "json" });
  database.prepare(`INSERT OR IGNORE INTO stored_objects (key, workspace_id, sha256, byte_length, content_type, storage_provider, created_at) VALUES (?, ?, ?, ?, ?, 'local', ?)`)
    .run(stored.key, stored.workspaceId, stored.sha256, stored.byteLength, stored.contentType, stored.createdAt);
  database.prepare(`INSERT OR REPLACE INTO daily_exports (id, workspace_id, business_date, object_key, schema_version, record_count, checksum, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'ready', ?)`)
    .run("export-2026-07-23-v1", "pilot-workspace", "2026-07-23", stored.key, 1, simulation.sheetRows.length, stored.sha256, now);

  console.log(JSON.stringify({ databasePath, appliedMigrations, ...persisted, sheetRows: simulation.sheetRows.length, exportObjectKey: stored.key }, null, 2));
} finally {
  database.close();
}
