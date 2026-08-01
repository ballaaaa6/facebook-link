import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "../../../..");
const required = ["AGENTS.md", "docs/office-v2/README.md", "package.json"];

for (const path of required) {
  if (!existsSync(resolve(root, path))) {
    console.error(`Office V2 preflight must run from its owning project skill; missing ${path}`);
    process.exit(1);
  }
}

for (const script of [
  "scripts/office-v2-clean-room-check.mjs",
  "scripts/office-v2-boundary-check.mjs",
  "scripts/office-v2-contradictions-check.mjs",
  "scripts/office-v2-knowledge-check.mjs",
  "scripts/office-v2-asset-check.mjs",
]) {
  const result = spawnSync(process.execPath, [script], { cwd: root, encoding: "utf8" });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log("Office V2 project skill preflight OK.");
