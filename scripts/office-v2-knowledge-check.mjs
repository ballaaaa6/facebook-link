import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createOfficeSchemaValidator,
  evaluateOfficeKnowledge,
  formatKnowledgeReport,
  runKnowledgeCheck,
} from "./office-v2-knowledge-check-core.mjs";

export {
  createOfficeSchemaValidator,
  evaluateOfficeKnowledge,
  formatKnowledgeReport,
  runKnowledgeCheck,
};

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    runKnowledgeCheck();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
