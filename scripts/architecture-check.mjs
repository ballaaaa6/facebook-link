import path from "node:path";
import { readFile } from "node:fs/promises";
import { relative, root, sourceFiles } from "./source-files.mjs";

const failures = [];
const importPattern = /(?:from\s+|import\s*\()["']([^"']+)["']/g;

for (const file of await sourceFiles()) {
  const rel = relative(file);
  const text = await readFile(file, "utf8");
  for (const match of text.matchAll(importPattern)) {
    const specifier = match[1];
    if (!specifier?.startsWith(".")) continue;
    const target = relative(path.resolve(path.dirname(file), specifier));
    if (rel.startsWith("packages/") && /^(apps|services)\//.test(target)) {
      failures.push(`${rel}: packages cannot import ${target}`);
    }
    if (rel.startsWith("services/") && target.startsWith("apps/")) {
      failures.push(`${rel}: services cannot import ${target}`);
    }
    const featureMatch = rel.match(/^apps\/web\/src\/features\/([^/]+)\//);
    const targetFeature = target.match(/^apps\/web\/src\/features\/([^/]+)\//);
    if (featureMatch && targetFeature && featureMatch[1] !== targetFeature[1]) {
      failures.push(`${rel}: features must communicate through app/shared contracts, not ${target}`);
    }
  }
}

if (failures.length) {
  console.error(`Architecture boundary violations:\n${failures.join("\n")}`);
  process.exit(1);
}
console.log(`Architecture boundaries OK in ${root}.`);
