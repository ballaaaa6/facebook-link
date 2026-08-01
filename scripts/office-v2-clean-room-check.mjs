import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const defaultRepositoryRoot = resolve(import.meta.dirname, "..");
const ignoredDirectories = new Set([
  ".git", "node_modules", "dist", ".wrangler", "runtime-data", "tmp", "coverage",
]);
const retiredRoots = [
  "apps/web/src/features/office",
  "packages/office-read-model",
  "assets/art",
  "assets/game",
  "docs/art",
  "tools/art",
];
export const approvedOfficePackageDirectories = Object.freeze([
  "office-v2-contracts",
  "office-v2-world",
  "office-v2-simulation",
  "office-v2-operations",
]);
export const allowedOfficePaths = Object.freeze([
  ".agents/skills/build-office-v2-engine/",
  "apps/web/src/features/office-v2/",
  "assets/office-v2/",
  "docs/office-v2/",
  "packages/office-v2-contracts/",
  "packages/office-v2-world/",
  "packages/office-v2-simulation/",
  "packages/office-v2-operations/",
  "scripts/office-v2-",
]);
const forbiddenReferences = [
  "@affiliate-ops/office-read-model",
  "features/office/",
  "office.agent.updated",
  "assets/game/",
  "assets/art/",
  "docs/art/",
];

function normalizePath(value) {
  return value.replaceAll("\\", "/").replace(/^\.\//, "");
}

function diagnostic(code, path, message, context = {}) {
  return { code, owner: "architecture", version: 1, path, message, context };
}

export function isAllowedOfficePath(value) {
  const projectPath = normalizePath(value);
  return allowedOfficePaths.some((prefix) => {
    if (!prefix.endsWith("/")) return projectPath.startsWith(prefix);
    const root = prefix.slice(0, -1);
    return projectPath === root || projectPath.startsWith(prefix);
  });
}

export function evaluateOfficeV2CleanRoomInput(input) {
  const diagnostics = [];
  for (const path of input.retiredRootsPresent ?? []) {
    diagnostics.push(diagnostic(
      "architecture.office-v2.retired-root",
      normalizePath(path),
      "Retired Office root is present.",
    ));
  }

  for (const directory of input.officePackageDirectories ?? []) {
    if (
      directory.toLowerCase().startsWith("office-v2-") &&
      !approvedOfficePackageDirectories.includes(directory)
    ) {
      diagnostics.push(diagnostic(
        "architecture.office-v2.unapproved-root",
        `packages/${directory}`,
        "Office package root is not approved by Decision 0007.",
      ));
    }
  }

  for (const file of input.files ?? []) {
    const projectPath = normalizePath(file.path);
    if (projectPath.toLowerCase().includes("office") && !isAllowedOfficePath(projectPath)) {
      diagnostics.push(diagnostic(
        "architecture.office-v2.unapproved-root",
        projectPath,
        "Office file is outside the exact V2 clean-room roots.",
      ));
    }
    if (file.skipContent || typeof file.content !== "string") continue;
    for (const reference of forbiddenReferences) {
      if (file.content.replaceAll("\\", "/").includes(reference)) {
        diagnostics.push(diagnostic(
          "architecture.office-v2.retired-reference",
          projectPath,
          `Retired reference '${reference}' remains.`,
          { reference },
        ));
      }
    }
  }
  return diagnostics;
}

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

export function collectOfficeV2CleanRoomInput(repositoryRoot = defaultRepositoryRoot) {
  const retiredRootsPresent = retiredRoots.filter((path) => existsSync(join(repositoryRoot, path)));
  const packagesRoot = join(repositoryRoot, "packages");
  const officePackageDirectories = existsSync(packagesRoot)
    ? readdirSync(packagesRoot).filter((name) => statSync(join(packagesRoot, name)).isDirectory())
    : [];
  const files = walk(repositoryRoot).map((absolute) => {
    const path = normalizePath(relative(repositoryRoot, absolute));
    const skipContent = path === "scripts/office-v2-clean-room-check.mjs";
    const isText = /\.(?:css|html|js|json|jsx|md|mjs|ts|tsx|txt)$/i.test(path);
    return {
      path,
      skipContent,
      ...(isText && !skipContent ? { content: readFileSync(absolute, "utf8") } : {}),
    };
  });
  return { files, officePackageDirectories, retiredRootsPresent };
}

export function evaluateOfficeV2CleanRoom(repositoryRoot = defaultRepositoryRoot) {
  return evaluateOfficeV2CleanRoomInput(collectOfficeV2CleanRoomInput(repositoryRoot));
}

export function formatOfficeV2CleanRoomDiagnostic(entry) {
  return `[${entry.code}] ${entry.path}: ${entry.message}`;
}

export function runOfficeV2CleanRoomCheck(repositoryRoot) {
  const diagnostics = evaluateOfficeV2CleanRoom(repositoryRoot);
  if (diagnostics.length > 0) {
    throw new Error(diagnostics.map(formatOfficeV2CleanRoomDiagnostic).join("\n"));
  }
  return "Office Engine V2 clean-room boundary OK.";
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    console.log(runOfficeV2CleanRoomCheck());
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
