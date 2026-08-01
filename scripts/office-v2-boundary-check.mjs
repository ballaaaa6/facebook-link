import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  evaluateOfficeV2Boundaries,
  formatOfficeV2BoundaryDiagnostic,
} from "./office-v2-boundary-check-core.mjs";

export { evaluateOfficeV2Boundaries, formatOfficeV2BoundaryDiagnostic };

export function runOfficeV2BoundaryCheck(repositoryRoot) {
  const diagnostics = evaluateOfficeV2Boundaries(repositoryRoot);
  if (diagnostics.length > 0) {
    throw new Error(diagnostics.map(formatOfficeV2BoundaryDiagnostic).join("\n"));
  }
  return "Office V2 package boundaries OK.";
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    console.log(runOfficeV2BoundaryCheck());
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
