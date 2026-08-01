import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

export const repositoryRoot = resolve(import.meta.dirname, "..");
export const registerPath = "docs/office-v2/registers/p0-resolution-register.json";
export const schemaPath = "docs/office-v2/schemas/p0-resolution-register.schema.json";

export function readJson(root, projectPath) {
  return JSON.parse(readFileSync(join(root, projectPath), "utf8"));
}

export function writeJson(root, projectPath, value) {
  const absolute = join(root, projectPath);
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, `${JSON.stringify(value, null, 2)}\n`);
}

export function mutateRegister(root, mutate) {
  const register = readJson(root, registerPath);
  mutate(register);
  writeJson(root, registerPath, register);
}

export function withRepositoryCopy(callback) {
  const copyRoot = mkdtempSync(join(tmpdir(), "office-v2-contradictions-"));
  try {
    cpSync(join(repositoryRoot, "docs"), join(copyRoot, "docs"), { recursive: true });
    mkdirSync(join(copyRoot, "assets", "office-v2", "manifests"), { recursive: true });
    return callback(copyRoot);
  } finally {
    rmSync(copyRoot, { recursive: true, force: true });
  }
}

export function hasDiagnostic(report, code) {
  return report.diagnostics.some((entry) => entry.code === code);
}
