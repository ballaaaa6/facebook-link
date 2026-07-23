import { openLocalDatabase } from "@affiliate-ops/database";
import { LocalFilesystemStore } from "@affiliate-ops/storage";
import { resolve } from "node:path";
import { simulatePilotRun } from "./pilot.ts";

const root = process.cwd();
const databasePath = resolve(root, "runtime-data/database/affiliate-ops.sqlite");
const migrationsPath = resolve(root, "packages/database/migrations");
const objectRoot = resolve(root, "runtime-data/objects");
const simulation = simulatePilotRun();
const { database, appliedMigrations } = openLocalDatabase(databasePath, migrationsPath);

try {
  const now = new Date().toISOString();
  const firstJob = simulation.jobs[0];
  if (!firstJob) throw new Error("Pilot simulation did not create a workflow.");
  const workflowId = firstJob.workflowId;
  database.prepare(`INSERT OR IGNORE INTO workspaces (id, slug, display_name, status, created_at, updated_at) VALUES (?, ?, ?, 'active', ?, ?)`)
    .run("pilot-workspace", "pilot-workspace", "Pilot Workspace", now, now);
  database.prepare(`INSERT OR IGNORE INTO workflow_runs (id, workspace_id, stage, status, strategy_version, started_at, updated_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(workflowId, "pilot-workspace", "scheduled", "succeeded", "simulation-v1", firstJob.createdAt, now, now);

  const insertJob = database.prepare(`INSERT OR IGNORE INTO jobs (id, workspace_id, workflow_id, stage, connector_id, payload_version, payload_json, idempotency_key, status, attempt, available_at, trace_id, created_at, updated_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const [index, job] of simulation.jobs.entries()) {
    insertJob.run(job.id, job.workspaceId, job.workflowId, job.stage, job.connectorId, job.version, JSON.stringify(job.payload), job.idempotencyKey, "succeeded", job.attempt, job.availableAt, job.traceId, job.createdAt, simulation.results[index]?.completedAt ?? now, simulation.results[index]?.completedAt ?? now);
  }

  const bytes = new TextEncoder().encode(`${JSON.stringify(simulation, null, 2)}\n`);
  const stored = await new LocalFilesystemStore(objectRoot).put({ workspaceId: "pilot-workspace", bytes, contentType: "application/json", extension: "json" });
  database.prepare(`INSERT OR IGNORE INTO stored_objects (key, workspace_id, sha256, byte_length, content_type, storage_provider, created_at) VALUES (?, ?, ?, ?, ?, 'local', ?)`)
    .run(stored.key, stored.workspaceId, stored.sha256, stored.byteLength, stored.contentType, stored.createdAt);
  database.prepare(`INSERT OR REPLACE INTO daily_exports (id, workspace_id, business_date, object_key, schema_version, record_count, checksum, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'ready', ?)`)
    .run("export-2026-07-23-v1", "pilot-workspace", "2026-07-23", stored.key, 1, simulation.sheetRows.length, stored.sha256, now);

  console.log(JSON.stringify({ databasePath, appliedMigrations, workflowId, jobs: simulation.jobs.length, sheetRows: simulation.sheetRows.length, exportObjectKey: stored.key }, null, 2));
} finally {
  database.close();
}
