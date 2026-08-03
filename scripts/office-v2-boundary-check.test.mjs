import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";
import {
  collectOfficeV2BoundaryInput,
  evaluateOfficeV2Boundaries,
  evaluateOfficeV2BoundaryInput,
  extractModuleSpecifiers,
  generatedTypeHeader,
  officeV2PackageRules,
} from "./office-v2-boundary-check-core.mjs";
import {
  forbiddenConsumerManifestCases,
  forbiddenConsumerSourceCases,
  forbiddenPackageManifestCases,
  forbiddenPackageSourceCases,
} from "./office-v2-boundary-check-cases.mjs";
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

function addConsumerSource(path, content) {
  const input = baselineInput();
  input.files.push({ path, content });
  return input;
}

function addConsumerDependency(
  projectRoot,
  packageName,
  section,
  dependency,
  version = "0.1.0",
) {
  const input = baselineInput();
  input.manifests[projectRoot] = {
    value: {
      name: packageName,
      version: "0.1.0",
      private: true,
      [section]: { [dependency]: version },
    },
  };
  return input;
}

function codes(input) {
  return evaluateOfficeV2BoundaryInput(input).map((entry) => entry.code);
}

test("the real repository satisfies Office package and clean-room boundaries", () => {
  assert.deepEqual(evaluateOfficeV2Boundaries(repositoryRoot), []);
  assert.deepEqual(evaluateOfficeV2CleanRoom(repositoryRoot), []);
});

test("the collector scans source and manifests across package, service, API, and Web roots", () => {
  const input = collectOfficeV2BoundaryInput(repositoryRoot);
  const consumerRoots = [
    "packages/workflows",
    "apps/api",
    "services/automation-runner",
    "apps/web",
  ];
  for (const projectRoot of consumerRoots) {
    assert.ok(input.files.some((file) => file.path.startsWith(`${projectRoot}/`)));
    assert.ok(input.manifests[projectRoot]);
  }
});

test("the exact synthetic package graph and Web composition imports pass", () => {
  const input = baselineInput();
  input.manifests["apps/web"] = {
    value: {
      name: "@affiliate-ops/web",
      version: "0.1.0",
      private: true,
      dependencies: Object.fromEntries(
        officeV2PackageRules.map((rule) => [rule.name, "0.1.0"]),
      ),
    },
  };
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

for (const entry of forbiddenPackageSourceCases) {
  test(entry.name, () => {
    assert.deepEqual(codes(addSource(entry.packageKey, entry.source)), [entry.expected]);
  });
}

for (const entry of forbiddenConsumerSourceCases) {
  test(entry.name, () => {
    assert.deepEqual(codes(addConsumerSource(entry.path, entry.source)), [entry.expected]);
  });
}

test("computed dynamic imports outside Office packages are not blanket-banned", () => {
  assert.deepEqual(
    codes(addConsumerSource(
      "apps/api/src/computed-import.ts",
      "const moduleName = selectModule(); import(moduleName);",
    )),
    [],
  );
});

for (const entry of forbiddenPackageManifestCases) {
  test(entry.name, () => {
    assert.deepEqual(
      codes(addDependency(entry.packageKey, entry.section, entry.dependency)),
      [entry.expected],
    );
  });
}

for (const entry of forbiddenConsumerManifestCases) {
  test(entry.name, () => {
    const input = addConsumerDependency(
      entry.projectRoot,
      entry.packageName,
      entry.section,
      "@affiliate-ops/office-v2-contracts",
    );
    assert.deepEqual(codes(input), ["architecture.office-v2.dependency-direction"]);
  });
}

test("the Web manifest cannot declare an Office package subpath", () => {
  const input = addConsumerDependency(
    "apps/web",
    "@affiliate-ops/web",
    "dependencies",
    "@affiliate-ops/office-v2-world/src/index.ts",
  );
  assert.deepEqual(codes(input), ["architecture.office-v2.public-entrypoint"]);
});

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
  assert.equal(isAllowedOfficePath(".agents/skills/author-office-v2-asset-family/SKILL.md"), true);
  assert.equal(isAllowedOfficePath(".agents/skills/compose-office-v2-room/SKILL.md"), true);
  assert.equal(isAllowedOfficePath(".agents/skills/review-office-v2-visuals/SKILL.md"), true);
  assert.equal(isAllowedOfficePath(".agents/skills/author-office-v2-asset-family-copy/SKILL.md"), false);
});
