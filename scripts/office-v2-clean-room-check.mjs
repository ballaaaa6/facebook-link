import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const ignoredDirectories = new Set([".git", "node_modules", "dist", ".wrangler", "coverage"]);
const retiredRoots = [
  "apps/web/src/features/office",
  "packages/office-read-model",
  "assets/art",
  "assets/game",
  "docs/art",
  "tools/art",
];
const allowedOfficePaths = [
  "apps/web/src/features/office-v2/",
  "docs/office-v2/",
  "scripts/office-v2-clean-room-check.mjs",
];
const forbiddenReferences = [
  "@affiliate-ops/office-read-model",
  "features/office/",
  "office.agent.updated",
  "assets/game/",
  "assets/art/",
  "docs/art/",
];
const failures = [];

function walk(directory) {
  const files = [];
  for (const name of readdirSync(directory)) {
    if (ignoredDirectories.has(name)) continue;
    const absolute = join(directory, name);
    if (statSync(absolute).isDirectory()) files.push(...walk(absolute));
    else files.push(absolute);
  }
  return files;
}

for (const path of retiredRoots) {
  if (existsSync(join(root, path))) failures.push(`Retired root is present: ${path}`);
}

for (const file of walk(root)) {
  const projectPath = relative(root, file).replaceAll("\\", "/");
  const lowerPath = projectPath.toLowerCase();
  if (lowerPath.includes("office") && !allowedOfficePaths.some((path) => projectPath.startsWith(path))) {
    failures.push(`Office file is outside the V2 clean-room roots: ${projectPath}`);
  }
  if (projectPath === "scripts/office-v2-clean-room-check.mjs") continue;
  if (!/\.(?:css|html|js|json|jsx|md|mjs|ts|tsx|txt)$/i.test(projectPath)) continue;
  const content = readFileSync(file, "utf8").replaceAll("\\", "/");
  for (const reference of forbiddenReferences) {
    if (content.includes(reference)) failures.push(`Retired reference '${reference}' remains in ${projectPath}`);
  }
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log("Office Engine V2 clean-room boundary OK.");
}
