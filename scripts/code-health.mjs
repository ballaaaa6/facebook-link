import path from "node:path";
import { readLines, relative, sourceFiles } from "./source-files.mjs";

const limits = new Map([[".tsx", 360], [".ts", 420], [".css", 500], [".mjs", 420]]);
const failures = [];
for (const file of await sourceFiles()) {
  const limit = limits.get(path.extname(file));
  if (!limit) continue;
  const lineCount = (await readLines(file)).length;
  if (lineCount > limit) failures.push(`${relative(file)} has ${lineCount} lines (limit ${limit})`);
}
if (failures.length) {
  console.error(`Code health budgets exceeded:\n${failures.join("\n")}`);
  process.exit(1);
}
console.log("Code health budgets OK.");
