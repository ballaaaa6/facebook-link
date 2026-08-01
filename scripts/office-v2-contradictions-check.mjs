import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  evaluateOfficeV2Contradictions,
  formatOfficeV2ContradictionReport,
} from "./office-v2-contradictions-check-core.mjs";

export {
  evaluateOfficeV2Contradictions,
  formatOfficeV2ContradictionDiagnostic,
  formatOfficeV2ContradictionReport,
} from "./office-v2-contradictions-check-core.mjs";

export function runOfficeV2ContradictionsCheck(options = {}) {
  const report = evaluateOfficeV2Contradictions(options);
  const message = formatOfficeV2ContradictionReport(report);
  if (!report.ok) throw new Error(message);
  return message;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    console.log(runOfficeV2ContradictionsCheck());
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
