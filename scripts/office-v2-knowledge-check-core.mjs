import {
  checkInventory,
  compareExpectedDiagnostic,
  createContext,
  createOfficeSchemaValidator,
  defaultKnowledgeRoot,
  finalizeFixtureEvidence,
} from "./office-v2-knowledge-evidence.mjs";
import { runFixtureCases, runNegativeDiagnostics } from "./office-v2-knowledge-fixture-adapter.mjs";
import { runSchemaEvidence } from "./office-v2-knowledge-schema-adapter.mjs";

export {
  compareExpectedDiagnostic,
  createOfficeSchemaValidator,
  defaultKnowledgeRoot,
};

export function evaluateOfficeKnowledge({ knowledgeRoot = defaultKnowledgeRoot } = {}) {
  const context = createContext(knowledgeRoot);
  checkInventory(context);
  if (context.diagnostics.length === 0) {
    try {
      const ajv = createOfficeSchemaValidator({ knowledgeRoot });
      runSchemaEvidence(context, ajv);
      runFixtureCases(context, ajv);
      runNegativeDiagnostics(context);
      finalizeFixtureEvidence(context);
    } catch (error) {
      context.add("knowledge.evaluation-failed", "Knowledge evaluation could not complete.", { reason: error.message });
    }
  }
  return {
    ok: context.diagnostics.length === 0,
    diagnostics: context.diagnostics,
    inventory: context.inventory,
    coverage: context.coverage,
    evidence: context.evidence,
  };
}

export function formatKnowledgeReport(report) {
  if (!report.ok) return `Office V2 knowledge FAILED: ${report.diagnostics.length} diagnostic(s).`;
  const { inventory, coverage, evidence } = report;
  return `Office V2 knowledge OK: ${inventory.totalFiles} files inventoried, ${inventory.schemaFiles} schemas loaded, ${coverage.evidencedFixtureFiles}/${inventory.fixtureFiles} fixture files evidenced; ${coverage.executedCases}/${coverage.declaredCases} declared semantic cases executed; evidence: schema-shape ${evidence.schemaShape}, semantic cases ${evidence.semantic}, semantic rules ${evidence.semanticRules}, exact diagnostics ${evidence.exactDiagnostics}, reducer/replay ${evidence.reducerReplay}, property/model ${evidence.propertyModel}. Scope remains bounded probes only; no inverse-picking, crowd-replay, or asset-factory readiness is claimed.`;
}

function formatDiagnostics(diagnostics) {
  return diagnostics.map(({ code, message, context }) => `- [${code}] ${message} (${JSON.stringify(context)})`).join("\n");
}

export function runKnowledgeCheck({ knowledgeRoot = defaultKnowledgeRoot, logger = console.log } = {}) {
  const report = evaluateOfficeKnowledge({ knowledgeRoot });
  if (!report.ok) throw new Error(formatDiagnostics(report.diagnostics));
  const output = formatKnowledgeReport(report);
  if (typeof logger === "function") logger(output);
  else logger.log(output);
  return report;
}
