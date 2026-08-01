import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateDefinitionBundle } from "@affiliate-ops/office-v2-world";

const repositoryRoot = resolve(import.meta.dirname, "..");
export const defaultDefinitionBundleFixture = join(
  repositoryRoot,
  "docs/office-v2/fixtures/definition-bundle-v2.json",
);

export function evaluateDefinitionBundleFixture(path = defaultDefinitionBundleFixture) {
  const bundle = JSON.parse(readFileSync(path, "utf8"));
  return validateDefinitionBundle(bundle);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const result = evaluateDefinitionBundleFixture(process.argv[2] ?? defaultDefinitionBundleFixture);
  if (!result.ok) {
    console.error(JSON.stringify(result.diagnostics, null, 2));
    process.exitCode = 1;
  } else {
    console.log(`Office V2 definition bundle reference closure OK: ${result.nodes.length} nodes, ${result.edges.length} edges.`);
  }
}
