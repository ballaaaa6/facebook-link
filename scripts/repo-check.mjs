import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const ignoredDirectories = new Set([".git", "node_modules", "dist", ".wrangler", "runtime-data", "tmp", "coverage"]);
const failures = [];

const requiredPaths = [
  "AGENTS.md",
  ".env.example",
  "apps/web/package.json",
  "apps/web/src/features/office-v2/foundation.ts",
  "apps/api/src/index.ts",
  "apps/discord-bot/src/index.ts",
  "services/automation-runner/src/index.ts",
  "packages/contracts/src/index.ts",
  "packages/workflows/src/index.ts",
  "packages/agent-catalog/src/index.ts",
  "packages/attribution/src/index.ts",
  "packages/database/migrations/0001_initial.sql",
  "config/agents.json",
  "config/attribution.json",
  "docs/ARCHITECTURE.md",
  "docs/README.md",
  "docs/REPOSITORY_LAYOUT.md",
  "docs/office-v2/README.md",
  "docs/SECURITY.md",
  "assets/README.md",
  "assets/references/README.md",
  "assets/references/petdex-candidates/manifest.json",
  "legacy/README.md",
  "scripts/clean-local-artifacts.mjs",
];

for (const path of requiredPaths) {
  if (!existsSync(join(root, path))) failures.push(`Missing required path: ${path}`);
}

function walk(directory) {
  const entries = [];
  for (const name of readdirSync(directory)) {
    if (ignoredDirectories.has(name)) continue;
    if (/\.(?:exe|log|tsbuildinfo)$/i.test(name)) continue;
    const absolute = join(directory, name);
    if (statSync(absolute).isDirectory()) entries.push(...walk(absolute));
    else entries.push(absolute);
  }
  return entries;
}

const files = walk(root);
const secretNamePattern = /(^|[\\/])(?:\.env(?:\..+)?|cookies?(?:\..+)?|credentials?(?:\..+)?|session-archive(?:\..+)?|.*\.pem|.*\.key)$/i;

for (const file of files) {
  const projectPath = relative(root, file).replaceAll("\\", "/");
  if (projectPath === ".env.example") continue;
  if (secretNamePattern.test(projectPath)) failures.push(`Potential secret file must not be committed: ${projectPath}`);
  if (basename(file).startsWith("Screenshot ") && !projectPath.startsWith("assets/references/")) {
    failures.push(`Unorganized screenshot outside assets/references: ${projectPath}`);
  }
  if (/^(?:apps|packages|services)\//.test(projectPath) && /\.(?:js|jsx|mjs|ts|tsx)$/i.test(projectPath)) {
    const content = readFileSync(file, "utf8").replaceAll("\\", "/");
    if (content.includes("assets/references/")) failures.push(`Runtime source imports reference-only assets: ${projectPath}`);
  }
  if (file.endsWith(".json")) {
    try {
      JSON.parse(readFileSync(file, "utf8"));
    } catch (error) {
      failures.push(`Invalid JSON: ${projectPath} (${error.message})`);
    }
  }
}

const agents = JSON.parse(readFileSync(join(root, "config/agents.json"), "utf8").replace(/^\uFEFF/, "")).agents;
if (agents.length !== 10) failures.push(`Expected 10 pilot agents, found ${agents.length}`);
if (new Set(agents.map((agent) => agent.id)).size !== agents.length) failures.push("Agent IDs must be unique");

const attribution = JSON.parse(readFileSync(join(root, "config/attribution.json"), "utf8").replace(/^\uFEFF/, ""));
if (attribution.dimensions.length !== 5) failures.push("Attribution must define exactly five Sub ID dimensions");

const petdexRoot = join(root, "assets/references/petdex-candidates");
const petdexManifestPath = join(petdexRoot, "manifest.json");
if (existsSync(petdexManifestPath)) {
  try {
    const petdexManifest = JSON.parse(readFileSync(petdexManifestPath, "utf8"));
    const petdexScreenshots = readdirSync(petdexRoot).filter((name) => name.toLowerCase().endsWith(".png")).sort();
    const petdexManifestFiles = petdexManifest.items.map((item) => item.file).sort();
    if (petdexManifest.commercialStatus !== "pending-commercial-review" || petdexManifest.runtimeEligible !== false) {
      failures.push("Petdex reference collection must remain non-runtime and pending commercial review");
    }
    if (JSON.stringify(petdexScreenshots) !== JSON.stringify(petdexManifestFiles)) {
      failures.push("Petdex reference manifest does not list every screenshot exactly once");
    }
    if (new Set(petdexManifest.items.map((item) => item.id)).size !== petdexManifest.items.length) {
      failures.push("Petdex reference identifiers must be unique");
    }
    for (const item of petdexManifest.items) {
      const path = join(petdexRoot, item.file);
      if (!existsSync(path)) continue;
      const sha256 = createHash("sha256").update(readFileSync(path)).digest("hex");
      if (sha256 !== item.sha256) failures.push(`Petdex reference hash mismatch: ${item.file}`);
    }
  } catch (error) {
    failures.push(`Cannot validate Petdex reference manifest: ${error.message}`);
  }
}

const validationReports = files.filter((file) => file.endsWith(".report.json"));
let validatedAssets = 0;
for (const file of validationReports) {
  const report = JSON.parse(readFileSync(file, "utf8"));
  validatedAssets += report.summary?.total ?? 0;
  if ((report.summary?.failed ?? 0) > 0) failures.push(`Asset validation failure: ${relative(root, file)}`);
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Repository structure OK: ${files.length} files, ${agents.length} agents, ${validatedAssets} validated assets.`);
}
