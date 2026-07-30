import { existsSync, lstatSync, readdirSync, rmSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const protectedRoots = new Set([".git", "assets", "legacy", "node_modules", "runtime-data"]);
const removed = [];
let reclaimedBytes = 0;

function sizeOf(path) {
  if (!existsSync(path)) return 0;
  const stat = lstatSync(path);
  if (!stat.isDirectory() || stat.isSymbolicLink()) return stat.size;
  return readdirSync(path).reduce((total, name) => total + sizeOf(join(path, name)), 0);
}

function removeProjectPath(projectPath) {
  const absolute = resolve(root, projectPath);
  const normalized = relative(root, absolute).replaceAll("\\", "/");
  const firstSegment = normalized.split("/")[0];
  if (!normalized || normalized === "." || normalized.startsWith("../") || protectedRoots.has(firstSegment)) {
    throw new Error(`Refusing to clean protected path: ${projectPath}`);
  }
  if (!existsSync(absolute)) return;
  reclaimedBytes += sizeOf(absolute);
  rmSync(absolute, { recursive: true, force: true });
  removed.push(normalized);
}

for (const path of [".wrangler", "dist", "tmp"]) removeProjectPath(path);

for (const scope of ["apps", "services", "packages"]) {
  const scopeRoot = join(root, scope);
  if (!existsSync(scopeRoot)) continue;
  for (const entry of readdirSync(scopeRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    removeProjectPath(`${scope}/${entry.name}/dist`);
    removeProjectPath(`${scope}/${entry.name}/tsconfig.tsbuildinfo`);
  }
}

for (const name of readdirSync(root)) {
  if (/^\.tmp-.*-vite(?:\.err)?\.log$/i.test(name)) removeProjectPath(name);
}

const reclaimedMiB = (reclaimedBytes / 1024 / 1024).toFixed(2);
if (removed.length === 0) console.log("Local generated artifacts already clean.");
else console.log(`Removed ${removed.length} local artifact paths (${reclaimedMiB} MiB):\n${removed.map((path) => `- ${path}`).join("\n")}`);
