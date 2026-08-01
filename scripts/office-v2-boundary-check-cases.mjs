export const forbiddenPackageSourceCases = [
  {
    name: "contracts cannot import world through a bare specifier",
    packageKey: "contracts",
    source: 'import "@affiliate-ops/office-v2-world";',
    expected: "architecture.office-v2.import-direction",
  },
  {
    name: "operations cannot import simulation",
    packageKey: "operations",
    source: 'export { value } from "@affiliate-ops/office-v2-simulation";',
    expected: "architecture.office-v2.import-direction",
  },
  {
    name: "Office package subpaths cannot bypass the public entrypoint",
    packageKey: "simulation",
    source: 'import type { Value } from "@affiliate-ops/office-v2-world/src/value";',
    expected: "architecture.office-v2.public-entrypoint",
  },
  {
    name: "React is forbidden in Office packages",
    packageKey: "world",
    source: 'import React from "react";',
    expected: "architecture.office-v2.forbidden-import",
  },
  {
    name: "Pixi is forbidden even through a dynamic import",
    packageKey: "simulation",
    source: 'const pixi = import("pixi.js");',
    expected: "architecture.office-v2.forbidden-import",
  },
  {
    name: "Pixi scoped packages are forbidden",
    packageKey: "contracts",
    source: 'import "@pixi/core";',
    expected: "architecture.office-v2.forbidden-import",
  },
  {
    name: "database implementations are forbidden",
    packageKey: "world",
    source: 'import "@affiliate-ops/database";',
    expected: "architecture.office-v2.forbidden-import",
  },
  {
    name: "the automation runner is forbidden",
    packageKey: "operations",
    source: 'const runner = require("@affiliate-ops/automation-runner");',
    expected: "architecture.office-v2.forbidden-import",
  },
  {
    name: "provider implementations are forbidden",
    packageKey: "operations",
    source: 'import "@affiliate-ops/brain";',
    expected: "architecture.office-v2.forbidden-import",
  },
  {
    name: "connector implementations are forbidden",
    packageKey: "operations",
    source: 'import "@affiliate-ops/connectors-meta";',
    expected: "architecture.office-v2.forbidden-import",
  },
  {
    name: "packages cannot import the Web application",
    packageKey: "contracts",
    source: 'import "@affiliate-ops/web";',
    expected: "architecture.office-v2.forbidden-import",
  },
  {
    name: "cross-package relative imports are forbidden",
    packageKey: "simulation",
    source: 'import "../../office-v2-operations/src/index.ts";',
    expected: "architecture.office-v2.relative-boundary",
  },
  {
    name: "relative imports cannot escape into services",
    packageKey: "world",
    source: 'import "../../../services/automation-runner/src/index.ts";',
    expected: "architecture.office-v2.relative-boundary",
  },
  {
    name: "package-local provider implementations are forbidden",
    packageKey: "operations",
    source: 'import "./providers/local.ts";',
    expected: "architecture.office-v2.forbidden-import",
  },
  {
    name: "nonliteral dynamic imports fail closed",
    packageKey: "world",
    source: "const moduleName = getModuleName(); import(moduleName);",
    expected: "architecture.office-v2.nonliteral-module-load",
  },
  {
    name: "unapproved external runtime imports fail closed",
    packageKey: "world",
    source: 'import "lodash";',
    expected: "architecture.office-v2.import-not-allowed",
  },
];

export const forbiddenConsumerSourceCases = [
  {
    name: "workflows cannot import an Office package through its bare root",
    path: "packages/workflows/src/office-leak.ts",
    source: 'import "@affiliate-ops/office-v2-contracts";',
    expected: "architecture.office-v2.import-direction",
  },
  {
    name: "the API cannot type-import an Office package",
    path: "apps/api/src/office-leak.ts",
    source: 'import type { World } from "@affiliate-ops/office-v2-world";',
    expected: "architecture.office-v2.import-direction",
  },
  {
    name: "the automation runner cannot require an Office package",
    path: "services/automation-runner/src/office-leak.ts",
    source: 'const simulation = require("@affiliate-ops/office-v2-simulation");',
    expected: "architecture.office-v2.import-direction",
  },
  {
    name: "literal dynamic Office imports are rejected outside the Web composition feature",
    path: "services/automation-runner/src/dynamic-office-leak.ts",
    source: 'const operations = import("@affiliate-ops/office-v2-operations");',
    expected: "architecture.office-v2.import-direction",
  },
  {
    name: "non-Office Web features cannot re-export Office packages",
    path: "apps/web/src/features/dashboard/office-leak.ts",
    source: 'export type { Contract } from "@affiliate-ops/office-v2-contracts";',
    expected: "architecture.office-v2.import-direction",
  },
  {
    name: "consumer packages cannot access Office packages through relative imports",
    path: "packages/workflows/src/relative-office-leak.ts",
    source: 'export * from "../../office-v2-world/src/index.ts";',
    expected: "architecture.office-v2.relative-boundary",
  },
  {
    name: "Web composition cannot bypass an Office public entrypoint",
    path: "apps/web/src/features/office-v2/subpath-leak.ts",
    source: 'import "@affiliate-ops/office-v2-world/src/index.ts";',
    expected: "architecture.office-v2.public-entrypoint",
  },
  {
    name: "Web composition cannot access Office packages through relative imports",
    path: "apps/web/src/features/office-v2/relative-leak.ts",
    source: 'import "../../../../../packages/office-v2-world/src/index.ts";',
    expected: "architecture.office-v2.relative-boundary",
  },
];

export const forbiddenPackageManifestCases = [
  {
    name: "contracts manifest cannot depend on world",
    packageKey: "contracts",
    section: "dependencies",
    dependency: "@affiliate-ops/office-v2-world",
    expected: "architecture.office-v2.dependency-direction",
  },
  {
    name: "operations manifest cannot depend on simulation",
    packageKey: "operations",
    section: "dependencies",
    dependency: "@affiliate-ops/office-v2-simulation",
    expected: "architecture.office-v2.dependency-direction",
  },
  {
    name: "React is forbidden in package manifests",
    packageKey: "world",
    section: "dependencies",
    dependency: "react",
    expected: "architecture.office-v2.forbidden-dependency",
  },
  {
    name: "Pixi is forbidden even as a development dependency",
    packageKey: "simulation",
    section: "devDependencies",
    dependency: "pixi.js",
    expected: "architecture.office-v2.forbidden-dependency",
  },
  {
    name: "database is forbidden in package manifests",
    packageKey: "operations",
    section: "optionalDependencies",
    dependency: "@affiliate-ops/database",
    expected: "architecture.office-v2.forbidden-dependency",
  },
  {
    name: "storage is forbidden in package manifests",
    packageKey: "simulation",
    section: "devDependencies",
    dependency: "@affiliate-ops/storage",
    expected: "architecture.office-v2.forbidden-dependency",
  },
  {
    name: "unapproved runtime dependencies fail closed",
    packageKey: "world",
    section: "dependencies",
    dependency: "lodash",
    expected: "architecture.office-v2.dependency-not-allowed",
  },
];

export const forbiddenConsumerManifestCases = [
  {
    name: "workflows cannot declare an Office dependency",
    projectRoot: "packages/workflows",
    packageName: "@affiliate-ops/workflows",
    section: "dependencies",
  },
  {
    name: "the API cannot declare an Office development dependency",
    projectRoot: "apps/api",
    packageName: "@affiliate-ops/api",
    section: "devDependencies",
  },
  {
    name: "the automation runner cannot declare an optional Office dependency",
    projectRoot: "services/automation-runner",
    packageName: "@affiliate-ops/automation-runner",
    section: "optionalDependencies",
  },
];
