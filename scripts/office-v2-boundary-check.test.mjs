import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";
import {
  evaluateOfficeV2Boundaries,
  evaluateOfficeV2BoundaryInput,
  extractModuleSpecifiers,
  generatedTypeHeader,
  officeV2PackageRules,
} from "./office-v2-boundary-check-core.mjs";
import {
  evaluateOfficeV2CleanRoom,
  evaluateOfficeV2CleanRoomInput,
  isAllowedOfficePath,
} from "./office-v2-clean-room-check.mjs";

const repositoryRoot = resolve(import.meta.dirname, "..");

function manifestFor(rule) {
  return {
    name: rule.name,
    version: "0.1.0",
    private: true,
    type: "module",
    exports: "./src/index.ts",
    ...(rule.dependencies.length > 0
      ? { dependencies: Object.fromEntries(rule.dependencies.map((name) => [name, "0.1.0"])) }
      : {}),
  };
}

function baselineInput() {
  const allowedSources = {
    contracts: "export {};",
    world: 'import "@affiliate-ops/office-v2-contracts"; export {};',
    simulation: [
      'import "@affiliate-ops/office-v2-contracts";',
      'import "@affiliate-ops/office-v2-world";',
      "export {};",
    ].join("\n"),
    operations: [
      'import "@affiliate-ops/contracts";',
      'import "@affiliate-ops/office-v2-contracts";',
      "export {};",
    ].join("\n"),
  };
  return {
    presentRoots: officeV2PackageRules.map((rule) => rule.root),
    manifests: Object.fromEntries(
      officeV2PackageRules.map((rule) => [rule.root, { value: manifestFor(rule) }]),
    ),
    files: officeV2PackageRules.map((rule) => ({
      path: `${rule.root}/src/index.ts`,
      content: `${allowedSources[rule.key]}\n`,
    })),
  };
}

function addSource(packageKey, content) {
  const input = baselineInput();
  const rule = officeV2PackageRules.find((entry) => entry.key === packageKey);
  input.files.push({ path: `${rule.root}/src/leak.ts`, content });
  return input;
}

function addDependency(packageKey, section, dependency, version = "0.1.0") {
  const input = baselineInput();
  const rule = officeV2PackageRules.find((entry) => entry.key === packageKey);
  const manifest = input.manifests[rule.root].value;
  manifest[section] = { ...(manifest[section] ?? {}), [dependency]: version };
  return input;
}

function codes(input) {
  return evaluateOfficeV2BoundaryInput(input).map((entry) => entry.code);
}

test("the real repository satisfies Office package and clean-room boundaries", () => {
  assert.deepEqual(evaluateOfficeV2Boundaries(repositoryRoot), []);
  assert.deepEqual(evaluateOfficeV2CleanRoom(repositoryRoot), []);
});

test("the exact synthetic package graph and Web composition imports pass", () => {
  const input = baselineInput();
  input.files.push({
    path: "apps/web/src/features/office-v2/composition.ts",
    content: officeV2PackageRules.map((rule) => `import "${rule.name}";`).join("\n"),
  });
  for (const rule of officeV2PackageRules) {
    const source = input.files.find((file) => file.path === `${rule.root}/src/index.ts`).content;
    assert.deepEqual(extractModuleSpecifiers(source).sort(), [...rule.dependencies].sort());
  }
  assert.deepEqual(
    extractModuleSpecifiers(input.files.at(-1).content).sort(),
    officeV2PackageRules.map((rule) => rule.name).sort(),
  );
  assert.deepEqual(evaluateOfficeV2BoundaryInput(input), []);
});

const forbiddenSourceCases = [
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

for (const entry of forbiddenSourceCases) {
  test(entry.name, () => {
    assert.deepEqual(codes(addSource(entry.packageKey, entry.source)), [entry.expected]);
  });
}

const forbiddenManifestCases = [
  ["contracts manifest cannot depend on world", "contracts", "dependencies", "@affiliate-ops/office-v2-world", "architecture.office-v2.dependency-direction"],
  ["operations manifest cannot depend on simulation", "operations", "dependencies", "@affiliate-ops/office-v2-simulation", "architecture.office-v2.dependency-direction"],
  ["React is forbidden in package manifests", "world", "dependencies", "react", "architecture.office-v2.forbidden-dependency"],
  ["Pixi is forbidden even as a development dependency", "simulation", "devDependencies", "pixi.js", "architecture.office-v2.forbidden-dependency"],
  ["database is forbidden in package manifests", "operations", "optionalDependencies", "@affiliate-ops/database", "architecture.office-v2.forbidden-dependency"],
  ["storage is forbidden in package manifests", "simulation", "devDependencies", "@affiliate-ops/storage", "architecture.office-v2.forbidden-dependency"],
  ["unapproved runtime dependencies fail closed", "world", "dependencies", "lodash", "architecture.office-v2.dependency-not-allowed"],
];

for (const [name, packageKey, section, dependency, expected] of forbiddenManifestCases) {
  test(name, () => {
    assert.deepEqual(codes(addDependency(packageKey, section, dependency)), [expected]);
  });
}

test("required dependency omissions and version drift fail", () => {
  const missing = baselineInput();
  delete missing.manifests["packages/office-v2-world"].value.dependencies;
  assert.deepEqual(codes(missing), ["architecture.office-v2.missing-dependency"]);

  const drift = addDependency(
    "world",
    "dependencies",
    "@affiliate-ops/office-v2-contracts",
    "0.2.0",
  );
  assert.deepEqual(codes(drift), ["architecture.office-v2.dependency-version"]);
});

test("schema duplicates and hand-written generated types fail", () => {
  const duplicate = baselineInput();
  duplicate.files.push({
    path: "packages/office-v2-world/src/world.schema.json",
    content: "{}",
  });
  assert.deepEqual(codes(duplicate), ["architecture.office-v2.schema-duplicate"]);

  const handwritten = baselineInput();
  handwritten.files.push({
    path: "packages/office-v2-contracts/src/generated/common.ts",
    content: "export type Position = number;",
  });
  assert.deepEqual(codes(handwritten), ["architecture.office-v2.handwritten-generated-type"]);

  handwritten.files.at(-1).content = `${generatedTypeHeader}\nexport type Value = string;`;
  assert.deepEqual(codes(handwritten), []);
});

test("connector implementation modules cannot live inside Office packages", () => {
  const input = baselineInput();
  input.files.push({
    path: "packages/office-v2-operations/src/connectors/meta.ts",
    content: "export {};",
  });
  assert.deepEqual(codes(input), ["architecture.office-v2.forbidden-module"]);
});

test("comment-separated and attributed dynamic imports cannot bypass the lexer", () => {
  assert.deepEqual(
    codes(addSource("world", 'import/* gap */ React from "react";')),
    ["architecture.office-v2.forbidden-import"],
  );
  assert.deepEqual(
    codes(addSource("simulation", 'import("pixi.js", { with: { type: "json" } });')),
    ["architecture.office-v2.forbidden-import"],
  );
});

test("comments, strings, templates, and regular expressions do not create false imports", () => {
  const source = [
    '// import React from "react";',
    'const text = \'import("pixi.js")\';',
    'const template = `import React from "react";`;',
    'const pattern = /import\\("react"\\)/;',
  ].join("\n");
  assert.deepEqual(codes(addSource("world", source)), []);
});

test("module loads inside template expressions remain enforceable", () => {
  assert.deepEqual(
    codes(addSource("world", 'const result = `${import("react")}`;')),
    ["architecture.office-v2.forbidden-import"],
  );
});

test("literal dynamic imports allow whitespace after the opening parenthesis", () => {
  assert.deepEqual(
    codes(addSource("world", 'import( "@affiliate-ops/office-v2-contracts");')),
    [],
  );
});

test("backslash module specifiers fail before relative containment", () => {
  assert.deepEqual(
    codes(addSource("simulation", 'import "..\\\\..\\\\office-v2-operations\\\\src\\\\index.ts";')),
    ["architecture.office-v2.noncanonical-specifier"],
  );
});

for (const extension of [".cjs", ".cts", ".mts"]) {
  test(`${extension} package sources are scanned`, () => {
    const input = baselineInput();
    input.files.push({
      path: `packages/office-v2-world/src/leak${extension}`,
      content: 'require("react");',
    });
    assert.deepEqual(codes(input), ["architecture.office-v2.forbidden-import"]);
  });
}

test("fake Office roots fail for both files and empty package directories", () => {
  const fileCodes = evaluateOfficeV2CleanRoomInput({
    files: [{ path: "packages/office-v2-world-copy/src/index.ts", content: "export {};" }],
    officePackageDirectories: [],
    retiredRootsPresent: [],
  }).map((entry) => entry.code);
  assert.ok(fileCodes.includes("architecture.office-v2.unapproved-root"));

  const directoryCodes = evaluateOfficeV2CleanRoomInput({
    files: [],
    officePackageDirectories: ["office-v2-world-copy"],
    retiredRootsPresent: [],
  }).map((entry) => entry.code);
  assert.ok(directoryCodes.includes("architecture.office-v2.unapproved-root"));
});

test("clean-room roots use exact directory boundaries", () => {
  assert.equal(isAllowedOfficePath("packages/office-v2-world/src/index.ts"), true);
  assert.equal(isAllowedOfficePath("packages/office-v2-world-copy/src/index.ts"), false);
  assert.equal(isAllowedOfficePath("apps/web/src/features/office-v2/foundation.ts"), true);
});
