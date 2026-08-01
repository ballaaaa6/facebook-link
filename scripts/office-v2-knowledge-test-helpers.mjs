import {
  cpSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";

const repositoryRoot = resolve(import.meta.dirname, "..");
export const knowledgeRoot = join(repositoryRoot, "docs", "office-v2");

function collectFiles(directory) {
  return readdirSync(directory).flatMap((name) => {
    const absolute = join(directory, name);
    return statSync(absolute).isDirectory() ? collectFiles(absolute) : [absolute];
  });
}

export function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

export function expectedInventory(root) {
  const knowledgeFiles = collectFiles(root)
    .map((file) => relative(root, file).replaceAll("\\", "/"))
    .filter((file) => file.endsWith(".md") || file.endsWith(".json"));
  return {
    totalFiles: knowledgeFiles.length,
    schemaFiles: knowledgeFiles.filter((file) => file.startsWith("schemas/") && file.endsWith(".schema.json")).length,
    fixtureFiles: knowledgeFiles.filter((file) => file.startsWith("fixtures/") && file.endsWith(".json")).length,
  };
}

export function expectedFixtureCounts(root) {
  const fixtures = collectFiles(join(root, "fixtures"))
    .filter((file) => file.endsWith(".json"))
    .map(readJson);
  return {
    declaredCases: fixtures.reduce((total, fixture) => total + (fixture.cases?.length ?? 0), 0),
    exactDiagnostics: fixtures.filter((fixture) => typeof fixture.expectedFailure === "string").length,
  };
}

export function withKnowledgeCopy(callback) {
  const temporaryRoot = mkdtempSync(join(tmpdir(), "office-v2-knowledge-"));
  const copyRoot = join(temporaryRoot, "office-v2");
  cpSync(knowledgeRoot, copyRoot, { recursive: true });
  try {
    return callback(copyRoot);
  } finally {
    rmSync(temporaryRoot, { force: true, recursive: true });
  }
}

export function hasDiagnostic(report, code) {
  return report.diagnostics.some((diagnostic) => diagnostic.code === code);
}
