import assert from "node:assert/strict";
import {
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  evaluateOfficeV2Contradictions,
  formatOfficeV2ContradictionReport,
} from "./office-v2-contradictions-check-core.mjs";
import {
  hasDiagnostic,
  mutateRegister,
  readJson,
  registerPath,
  repositoryRoot,
  schemaPath,
  withRepositoryCopy,
  writeJson,
} from "./office-v2-contradictions-test-helpers.mjs";

test("the real W0.3 register closes all P0 contradictions without overstating evidence", () => {
  const report = evaluateOfficeV2Contradictions({ repositoryRoot });
  assert.equal(report.ok, true, JSON.stringify(report.diagnostics, null, 2));
  assert.equal(report.evidence.resolutions, 12);
  assert.equal(report.evidence.historicalEvidence, 27);
  assert.match(formatOfficeV2ContradictionReport(report), /W0\.3 complete; W1\.1 next; T1 remains blocked/);
});

for (const scenario of [
  {
    name: "missing P0 IDs fail",
    code: "knowledge.p0-resolution-missing",
    mutate: (register) => { register.resolutions.pop(); },
  },
  {
    name: "duplicate P0 IDs fail",
    code: "knowledge.p0-resolution-duplicate",
    mutate: (register) => { register.resolutions[1] = structuredClone(register.resolutions[0]); },
  },
  {
    name: "unknown P0 IDs fail",
    code: "knowledge.p0-resolution-unknown",
    mutate: (register) => { register.resolutions[0].id = "p0-99-unknown"; },
  },
  {
    name: "a blank resolution owner fails",
    code: "knowledge.p0-resolution-owner-invalid",
    mutate: (register) => { register.resolutions[0].resolutionOwner = " "; },
  },
  {
    name: "a blank migration effect fails",
    code: "knowledge.p0-migration-effect-invalid",
    mutate: (register) => { register.resolutions[0].migrationOrRejectionEffect.description = ""; },
  },
  {
    name: "an inexact audit heading fails",
    code: "knowledge.p0-heading-mismatch",
    mutate: (register) => { register.resolutions[0].auditHeading += " changed"; },
  },
]) {
  test(scenario.name, () => {
    withRepositoryCopy((copyRoot) => {
      mutateRegister(copyRoot, scenario.mutate);
      const report = evaluateOfficeV2Contradictions({ repositoryRoot: copyRoot });
      assert.equal(report.ok, false);
      assert.equal(hasDiagnostic(report, scenario.code), true, JSON.stringify(report.diagnostics, null, 2));
    });
  });
}

test("a proposed decision fails", () => {
  withRepositoryCopy((copyRoot) => {
    const path = join(copyRoot, "docs/office-v2/decisions/0009-geometry-authority.md");
    const content = readFileSync(path, "utf8").replace("- Status: accepted", "- Status: proposed");
    writeFileSync(path, content);
    const report = evaluateOfficeV2Contradictions({ repositoryRoot: copyRoot });
    assert.equal(hasDiagnostic(report, "knowledge.p0-decision-not-accepted"), true);
  });
});

test("a missing accepted decision fails", () => {
  withRepositoryCopy((copyRoot) => {
    rmSync(join(copyRoot, "docs/office-v2/decisions/0009-geometry-authority.md"));
    const report = evaluateOfficeV2Contradictions({ repositoryRoot: copyRoot });
    assert.equal(hasDiagnostic(report, "knowledge.p0-document-missing"), true);
  });
});

test("an accepted but incorrect decision cannot replace the registered authority", () => {
  withRepositoryCopy((copyRoot) => {
    mutateRegister(copyRoot, (register) => {
      register.resolutions[0].acceptedDecisions = [
        "docs/office-v2/decisions/0008-coordinate-and-facing-semantics.md",
      ];
    });
    const report = evaluateOfficeV2Contradictions({ repositoryRoot: copyRoot });
    assert.equal(hasDiagnostic(report, "knowledge.p0-decision-set-mismatch"), true);
  });
});

test("removing the audit ID-to-heading mapping fails", () => {
  withRepositoryCopy((copyRoot) => {
    const path = join(copyRoot, "docs/office-v2/KNOWLEDGE_COMPLETENESS_AUDIT.md");
    const content = readFileSync(path, "utf8").replace(
      "| `p0-01-geometry-authority` | One fact currently has several possible owners |",
      "| `removed-p0-id` | One fact currently has several possible owners |",
    );
    writeFileSync(path, content);
    const report = evaluateOfficeV2Contradictions({ repositoryRoot: copyRoot });
    assert.equal(hasDiagnostic(report, "knowledge.p0-audit-mapping-missing"), true);
  });
});

for (const [field, value] of [
  ["reducerReplay", 1],
  ["propertyModel", 1],
  ["assetAdmission", "production"],
  ["rendererAdmission", "canvas-2d"],
  ["runtimeAssetManifests", 1],
  ["newDependencyAdmissions", ["pixi.js"]],
  ["t1Status", "passed"],
  ["nextWorkPackage", "W2.1"],
]) {
  test(`closure evidence overclaim for ${field} fails`, () => {
    withRepositoryCopy((copyRoot) => {
      mutateRegister(copyRoot, (register) => { register.closureEvidence[field] = value; });
      const report = evaluateOfficeV2Contradictions({ repositoryRoot: copyRoot });
      assert.equal(hasDiagnostic(report, "knowledge.p0-evidence-overclaim"), true);
    });
  });
}

test("changed historical bytes fail", () => {
  withRepositoryCopy((copyRoot) => {
    const path = join(copyRoot, "docs/office-v2/fixtures/connected-desk.json");
    writeFileSync(path, `${readFileSync(path, "utf8")}\n`);
    const report = evaluateOfficeV2Contradictions({ repositoryRoot: copyRoot });
    assert.equal(hasDiagnostic(report, "knowledge.p0-historical-file-changed"), true);
  });
});

test("a missing historical file fails", () => {
  withRepositoryCopy((copyRoot) => {
    rmSync(join(copyRoot, "docs/office-v2/fixtures/connected-desk.json"));
    const report = evaluateOfficeV2Contradictions({ repositoryRoot: copyRoot });
    assert.equal(hasDiagnostic(report, "knowledge.p0-historical-file-missing"), true);
  });
});

test("an unregistered historical path fails", () => {
  withRepositoryCopy((copyRoot) => {
    mutateRegister(copyRoot, (register) => {
      register.historicalEvidence[0].path = "docs/office-v2/fixtures/unregistered-v1.json";
    });
    const report = evaluateOfficeV2Contradictions({ repositoryRoot: copyRoot });
    assert.equal(hasDiagnostic(report, "knowledge.p0-historical-unregistered"), true);
    assert.equal(hasDiagnostic(report, "knowledge.p0-historical-entry-missing"), true);
  });
});

test("a changed registered historical hash fails independently of current bytes", () => {
  withRepositoryCopy((copyRoot) => {
    mutateRegister(copyRoot, (register) => { register.historicalEvidence[0].sha256 = "0".repeat(64); });
    const report = evaluateOfficeV2Contradictions({ repositoryRoot: copyRoot });
    assert.equal(hasDiagnostic(report, "knowledge.p0-historical-register-hash-mismatch"), true);
  });
});

test("an actual runtime asset manifest invalidates the zero-admission claim", () => {
  withRepositoryCopy((copyRoot) => {
    writeFileSync(join(copyRoot, "assets/office-v2/manifests/unadmitted.json"), "{}\n");
    const report = evaluateOfficeV2Contradictions({ repositoryRoot: copyRoot });
    assert.equal(hasDiagnostic(report, "knowledge.p0-evidence-overclaim"), true);
  });
});

test("invalid register JSON fails with a stable knowledge diagnostic", () => {
  withRepositoryCopy((copyRoot) => {
    writeFileSync(join(copyRoot, registerPath), "{ not-json");
    const report = evaluateOfficeV2Contradictions({ repositoryRoot: copyRoot });
    assert.equal(hasDiagnostic(report, "knowledge.invalid-json"), true);
  });
});

test("an invalid register schema fails with a stable knowledge diagnostic", () => {
  withRepositoryCopy((copyRoot) => {
    writeJson(copyRoot, schemaPath, {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $id: "https://affiliate-operations.example/schemas/office-v2/broken.json",
      type: "not-a-json-schema-type",
    });
    const report = evaluateOfficeV2Contradictions({ repositoryRoot: copyRoot });
    assert.equal(hasDiagnostic(report, "knowledge.invalid-schema"), true);
  });
});

test("a failed evaluation cannot leak state into the next invocation", () => {
  withRepositoryCopy((copyRoot) => {
    const register = readJson(copyRoot, registerPath);
    register.resolutions.pop();
    writeJson(copyRoot, registerPath, register);
    assert.equal(evaluateOfficeV2Contradictions({ repositoryRoot: copyRoot }).ok, false);
  });
  const clean = evaluateOfficeV2Contradictions({ repositoryRoot });
  assert.equal(clean.ok, true, JSON.stringify(clean.diagnostics, null, 2));
});
