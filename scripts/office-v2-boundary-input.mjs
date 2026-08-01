import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

export const officeV2SourceExtensions = new Set([
  ".cjs", ".cts", ".js", ".jsx", ".mjs", ".mts", ".ts", ".tsx",
]);

const workspaceParentRoots = ["apps", "services", "packages"];
const ignoredDirectories = new Set([
  ".git", ".next", ".turbo", ".vite", ".wrangler", "coverage", "dist", "node_modules",
]);

function normalizePath(value) {
  return value.replaceAll("\\", "/").replace(/^\.\//, "");
}

function collectFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).flatMap((name) => {
    if (ignoredDirectories.has(name)) return [];
    const absolute = join(directory, name);
    return statSync(absolute).isDirectory() ? collectFiles(absolute) : [absolute];
  });
}

function collectManifest(root, projectRoot) {
  const manifestPath = join(root, projectRoot, "package.json");
  if (!existsSync(manifestPath)) return null;
  try {
    return { value: JSON.parse(readFileSync(manifestPath, "utf8")) };
  } catch (error) {
    return { parseError: error.message };
  }
}

export function collectOfficeV2WorkspaceInput(root, packageRules) {
  const presentRoots = packageRules
    .filter((rule) => existsSync(join(root, rule.root)))
    .map((rule) => rule.root);
  const manifests = {};
  const files = [];

  for (const parentRoot of workspaceParentRoots) {
    const absoluteRoot = join(root, parentRoot);
    for (const absolute of collectFiles(absoluteRoot)) {
      const projectPath = normalizePath(relative(root, absolute));
      if (
        officeV2SourceExtensions.has(extname(projectPath)) ||
        projectPath.endsWith(".schema.json")
      ) {
        files.push({ path: projectPath, content: readFileSync(absolute, "utf8") });
      }
    }

    if (!existsSync(absoluteRoot)) continue;
    for (const directoryEntry of readdirSync(absoluteRoot, { withFileTypes: true })) {
      if (!directoryEntry.isDirectory()) continue;
      const projectRoot = normalizePath(`${parentRoot}/${directoryEntry.name}`);
      const manifest = collectManifest(root, projectRoot);
      if (manifest) manifests[projectRoot] = manifest;
    }
  }

  return { files, manifests, presentRoots };
}
