import { mkdirSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";

export interface LocalDatabase {
  database: DatabaseSync;
  appliedMigrations: readonly string[];
}

export function openLocalDatabase(databasePath: string, migrationsDirectory: string): LocalDatabase {
  if (databasePath !== ":memory:") mkdirSync(dirname(databasePath), { recursive: true });
  const database = new DatabaseSync(databasePath);
  database.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
  database.exec("CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL);");

  const applied = new Set(
    database.prepare("SELECT name FROM _migrations ORDER BY name").all().map((row) => String(row.name)),
  );
  const migrationFiles = readdirSync(migrationsDirectory).filter((name) => /^\d+.*\.sql$/.test(name)).sort();
  const newlyApplied: string[] = [];

  for (const name of migrationFiles) {
    if (applied.has(name)) continue;
    const sql = readFileSync(join(migrationsDirectory, name), "utf8");
    database.exec("BEGIN IMMEDIATE;");
    try {
      database.exec(sql);
      database.prepare("INSERT INTO _migrations (name, applied_at) VALUES (?, ?)").run(name, new Date().toISOString());
      database.exec("COMMIT;");
      newlyApplied.push(name);
    } catch (error) {
      database.exec("ROLLBACK;");
      database.close();
      throw error;
    }
  }

  return { database, appliedMigrations: newlyApplied };
}
