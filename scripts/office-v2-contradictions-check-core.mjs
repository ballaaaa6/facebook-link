import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import {
  expectedClosureEvidence,
  historicalEvidenceBaseline,
  p0ResolutionBaseline,
} from "./office-v2-contradictions-baseline.mjs";

export const defaultRepositoryRoot = resolve(import.meta.dirname, "..");
export const p0RegisterPath = "docs/office-v2/registers/p0-resolution-register.json";
export const p0RegisterSchemaPath = "docs/office-v2/schemas/p0-resolution-register.schema.json";

function diagnostic(code, message, context = {}) {
  return { code, owner: "knowledge", version: 1, message, context };
}

function isNonBlank(value) {
  return typeof value === "string" && value.trim() !== "";
}

function projectFile(repositoryRoot, projectPath) {
  if (!isNonBlank(projectPath)) return null;
  const absolute = resolve(repositoryRoot, projectPath);
  const within = relative(repositoryRoot, absolute);
  return within.startsWith("..") || isAbsolute(within) ? null : absolute;
}

function readJson(repositoryRoot, projectPath, diagnostics) {
  const absolute = projectFile(repositoryRoot, projectPath);
  if (!absolute || !existsSync(absolute)) {
    diagnostics.push(diagnostic(
      "knowledge.p0-document-missing",
      `Required P0 document is missing: ${projectPath}`,
      { path: projectPath },
    ));
    return null;
  }
  try {
    return JSON.parse(readFileSync(absolute, "utf8"));
  } catch (error) {
    diagnostics.push(diagnostic(
      "knowledge.invalid-json",
      `Invalid JSON: ${projectPath}`,
      { path: projectPath, reason: error.message },
    ));
    return null;
  }
}

function readText(repositoryRoot, projectPath, diagnostics) {
  const absolute = projectFile(repositoryRoot, projectPath);
  if (!absolute || !existsSync(absolute)) {
    diagnostics.push(diagnostic(
      "knowledge.p0-document-missing",
      `Required P0 document is missing: ${projectPath}`,
      { path: projectPath },
    ));
    return null;
  }
  return readFileSync(absolute, "utf8");
}

function compileRegisterSchema(schema, diagnostics) {
  if (!schema) return null;
  try {
    const ajv = new Ajv2020({ allErrors: true, strict: true });
    addFormats(ajv);
    return ajv.compile(schema);
  } catch (error) {
    diagnostics.push(diagnostic(
      "knowledge.invalid-schema",
      "The P0 resolution register schema is invalid.",
      { path: p0RegisterSchemaPath, reason: error.message },
    ));
    return null;
  }
}

function validateRegisterShape(register, validate, diagnostics) {
  if (!register || !validate) return;
  if (!validate(register)) {
    diagnostics.push(diagnostic(
      "knowledge.p0-register-schema-invalid",
      "The P0 resolution register does not satisfy its schema.",
      { errors: validate.errors ?? [] },
    ));
  }
}

function sameStrings(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right)) return false;
  return isDeepStrictEqual([...left].sort(), [...right].sort());
}

function validateDecision(repositoryRoot, decisionPath, diagnostics) {
  const content = readText(repositoryRoot, decisionPath, diagnostics);
  if (content === null) return;
  if (!/^\s*(?:-\s*)?Status:\s*\**accepted\**\s*$/im.test(content)) {
    diagnostics.push(diagnostic(
      "knowledge.p0-decision-not-accepted",
      `P0 decision is not accepted: ${decisionPath}`,
      { path: decisionPath },
    ));
  }
}

function validateResolutionFields(repositoryRoot, auditContent, resolution, expected, diagnostics) {
  if (resolution.auditHeading !== expected.auditHeading) {
    diagnostics.push(diagnostic(
      "knowledge.p0-heading-mismatch",
      `P0 heading does not match ${expected.id}.`,
      { actual: resolution.auditHeading, expected: expected.auditHeading, id: expected.id },
    ));
  }
  if (!auditContent.includes(`### ${expected.auditHeading}`)) {
    diagnostics.push(diagnostic(
      "knowledge.p0-audit-heading-missing",
      `Audit heading is missing for ${expected.id}.`,
      { heading: expected.auditHeading, id: expected.id },
    ));
  }
  if (!auditContent.includes(`| \`${expected.id}\` | ${expected.auditHeading} |`)) {
    diagnostics.push(diagnostic(
      "knowledge.p0-audit-mapping-missing",
      `Audit mapping is missing for ${expected.id}.`,
      { heading: expected.auditHeading, id: expected.id },
    ));
  }
  if (resolution.resolutionOwner !== expected.resolutionOwner || !isNonBlank(resolution.resolutionOwner)) {
    diagnostics.push(diagnostic(
      "knowledge.p0-resolution-owner-invalid",
      `Resolution owner is invalid for ${expected.id}.`,
      { actual: resolution.resolutionOwner, expected: expected.resolutionOwner, id: expected.id },
    ));
  }
  if (!sameStrings(resolution.acceptedDecisions, expected.acceptedDecisions)) {
    diagnostics.push(diagnostic(
      "knowledge.p0-decision-set-mismatch",
      `Accepted decision set is incorrect for ${expected.id}.`,
      { actual: resolution.acceptedDecisions, expected: expected.acceptedDecisions, id: expected.id },
    ));
  }
  if (resolution.implementationGate !== expected.implementationGate) {
    diagnostics.push(diagnostic(
      "knowledge.p0-implementation-gate-mismatch",
      `Implementation gate is incorrect for ${expected.id}.`,
      { actual: resolution.implementationGate, expected: expected.implementationGate, id: expected.id },
    ));
  }
  if (resolution.status !== expected.status) {
    diagnostics.push(diagnostic(
      "knowledge.p0-status-mismatch",
      `Resolution status is incorrect for ${expected.id}.`,
      { actual: resolution.status, expected: expected.status, id: expected.id },
    ));
  }
  for (const decisionPath of resolution.acceptedDecisions ?? []) {
    validateDecision(repositoryRoot, decisionPath, diagnostics);
  }
  for (const documentPath of resolution.canonicalDocuments ?? []) {
    readText(repositoryRoot, documentPath, diagnostics);
  }
  if (!(resolution.intendedContractVersions ?? []).every(isNonBlank)) {
    diagnostics.push(diagnostic(
      "knowledge.p0-contract-version-invalid",
      `Intended contract versions are incomplete for ${expected.id}.`,
      { id: expected.id },
    ));
  }
  if (!(resolution.testPackages ?? []).every(isNonBlank) || !isNonBlank(resolution.testOwner)) {
    diagnostics.push(diagnostic(
      "knowledge.p0-test-owner-invalid",
      `Test ownership is incomplete for ${expected.id}.`,
      { id: expected.id },
    ));
  }
  const effect = resolution.migrationOrRejectionEffect;
  if (!effect || !isNonBlank(effect.kind) || !isNonBlank(effect.description)) {
    diagnostics.push(diagnostic(
      "knowledge.p0-migration-effect-invalid",
      `Migration or rejection effect is incomplete for ${expected.id}.`,
      { id: expected.id },
    ));
  }
}

function validateResolutions(repositoryRoot, register, diagnostics) {
  const resolutions = Array.isArray(register?.resolutions) ? register.resolutions : [];
  const auditContent = readText(
    repositoryRoot,
    register?.auditDocument ?? "docs/office-v2/KNOWLEDGE_COMPLETENESS_AUDIT.md",
    diagnostics,
  ) ?? "";
  const counts = new Map();
  for (const resolution of resolutions) {
    const id = resolution?.id;
    counts.set(id, (counts.get(id) ?? 0) + 1);
    if (!p0ResolutionBaseline.some((entry) => entry.id === id)) {
      diagnostics.push(diagnostic(
        "knowledge.p0-resolution-unknown",
        `Unknown P0 resolution ID: ${String(id)}`,
        { id },
      ));
    }
  }
  for (const expected of p0ResolutionBaseline) {
    const count = counts.get(expected.id) ?? 0;
    if (count === 0) {
      diagnostics.push(diagnostic(
        "knowledge.p0-resolution-missing",
        `Missing P0 resolution: ${expected.id}`,
        { id: expected.id },
      ));
      continue;
    }
    if (count > 1) {
      diagnostics.push(diagnostic(
        "knowledge.p0-resolution-duplicate",
        `Duplicate P0 resolution: ${expected.id}`,
        { count, id: expected.id },
      ));
      continue;
    }
    const resolution = resolutions.find((entry) => entry?.id === expected.id);
    validateResolutionFields(repositoryRoot, auditContent, resolution, expected, diagnostics);
  }
  return resolutions.length;
}

function validateClosureEvidence(register, diagnostics) {
  const actual = register?.closureEvidence ?? {};
  for (const [field, expected] of Object.entries(expectedClosureEvidence)) {
    if (!isDeepStrictEqual(actual[field], expected)) {
      diagnostics.push(diagnostic(
        "knowledge.p0-evidence-overclaim",
        `W0.3 closure evidence must keep ${field} at its approved value.`,
        { actual: actual[field], expected, field },
      ));
    }
  }
}

function sha256(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

function validateHistoricalEvidence(repositoryRoot, register, diagnostics) {
  const entries = Array.isArray(register?.historicalEvidence) ? register.historicalEvidence : [];
  const counts = new Map();
  for (const entry of entries) counts.set(entry?.path, (counts.get(entry?.path) ?? 0) + 1);
  for (const [path, count] of counts) {
    if (count > 1) {
      diagnostics.push(diagnostic(
        "knowledge.p0-historical-duplicate",
        `Historical evidence path appears more than once: ${String(path)}`,
        { count, path },
      ));
    }
    if (!historicalEvidenceBaseline.some((expected) => expected.path === path)) {
      diagnostics.push(diagnostic(
        "knowledge.p0-historical-unregistered",
        `Historical evidence path is not in the W0.3 baseline: ${String(path)}`,
        { path },
      ));
    }
  }
  for (const expected of historicalEvidenceBaseline) {
    const entry = entries.find((candidate) => candidate?.path === expected.path);
    if (!entry) {
      diagnostics.push(diagnostic(
        "knowledge.p0-historical-entry-missing",
        `Historical evidence entry is missing: ${expected.path}`,
        { path: expected.path },
      ));
    } else if (entry.sha256 !== expected.sha256) {
      diagnostics.push(diagnostic(
        "knowledge.p0-historical-register-hash-mismatch",
        `Registered historical hash changed: ${expected.path}`,
        { actual: entry.sha256, expected: expected.sha256, path: expected.path },
      ));
    }
    const absolute = projectFile(repositoryRoot, expected.path);
    if (!absolute || !existsSync(absolute)) {
      diagnostics.push(diagnostic(
        "knowledge.p0-historical-file-missing",
        `Historical evidence file is missing: ${expected.path}`,
        { path: expected.path },
      ));
    } else {
      const actualHash = sha256(absolute);
      if (actualHash !== expected.sha256) {
        diagnostics.push(diagnostic(
          "knowledge.p0-historical-file-changed",
          `Historical evidence bytes changed: ${expected.path}`,
          { actual: actualHash, expected: expected.sha256, path: expected.path },
        ));
      }
    }
  }
  return entries.length;
}

function countJsonFiles(directory) {
  if (!existsSync(directory)) return 0;
  return readdirSync(directory).reduce((count, name) => {
    const absolute = join(directory, name);
    return count + (statSync(absolute).isDirectory()
      ? countJsonFiles(absolute)
      : name.endsWith(".json") ? 1 : 0);
  }, 0);
}

function validateRuntimeAssetClaim(repositoryRoot, diagnostics) {
  const count = countJsonFiles(join(repositoryRoot, "assets", "office-v2", "manifests"));
  if (count !== expectedClosureEvidence.runtimeAssetManifests) {
    diagnostics.push(diagnostic(
      "knowledge.p0-evidence-overclaim",
      "Runtime asset manifest evidence exceeds the W0.3 closure claim.",
      { actual: count, expected: expectedClosureEvidence.runtimeAssetManifests, field: "runtimeAssetManifests" },
    ));
  }
}

export function evaluateOfficeV2Contradictions({ repositoryRoot = defaultRepositoryRoot } = {}) {
  const diagnostics = [];
  const schema = readJson(repositoryRoot, p0RegisterSchemaPath, diagnostics);
  const register = readJson(repositoryRoot, p0RegisterPath, diagnostics);
  const validate = compileRegisterSchema(schema, diagnostics);
  validateRegisterShape(register, validate, diagnostics);
  const resolutions = validateResolutions(repositoryRoot, register, diagnostics);
  validateClosureEvidence(register, diagnostics);
  const historicalEvidence = validateHistoricalEvidence(repositoryRoot, register, diagnostics);
  validateRuntimeAssetClaim(repositoryRoot, diagnostics);
  return {
    ok: diagnostics.length === 0,
    diagnostics,
    evidence: {
      resolutions,
      expectedResolutions: p0ResolutionBaseline.length,
      historicalEvidence,
      expectedHistoricalEvidence: historicalEvidenceBaseline.length,
      closureEvidence: register?.closureEvidence ?? null,
    },
  };
}

export function formatOfficeV2ContradictionDiagnostic(entry) {
  return `[${entry.code}] ${entry.message}`;
}

export function formatOfficeV2ContradictionReport(report) {
  if (!report.ok) {
    return report.diagnostics.map(formatOfficeV2ContradictionDiagnostic).join("\n");
  }
  return [
    `Office V2 contradictions OK: ${report.evidence.resolutions}/${report.evidence.expectedResolutions} P0 resolutions`,
    `${report.evidence.historicalEvidence}/${report.evidence.expectedHistoricalEvidence} historical files hash-locked`,
    "reducer/replay 0, property/model 0, asset admission basic-only, renderer admission none",
    "W0.3 historical handoff target W1.1 remains hash-locked; current bounded T1 semantic foundation passes; W1.6 cross-track Phase 1 specification closure is integrated; executable T2-T6 gates remain deferred.",
  ].join("; ");
}
