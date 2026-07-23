import { createHash } from "node:crypto";
import { readLines, relative, sourceFiles } from "./source-files.mjs";

const chunks = new Map();
const duplicates = [];
const windowSize = 12;
for (const file of await sourceFiles()) {
  if (file.endsWith(".test.ts")) continue;
  const normalized = (await readLines(file))
    .map((line) => line.trim().replace(/\s+/g, " "))
    .filter((line) => line.length > 4 && !line.startsWith("import ") && !line.startsWith("//"));
  for (let index = 0; index <= normalized.length - windowSize; index += windowSize) {
    const chunk = normalized.slice(index, index + windowSize).join("\n");
    const hash = createHash("sha1").update(chunk).digest("hex");
    const prior = chunks.get(hash);
    if (prior && prior.file !== file) duplicates.push(`${prior.location} and ${relative(file)}:${index + 1}`);
    else chunks.set(hash, { file, location: `${relative(file)}:${index + 1}` });
  }
}
if (duplicates.length) {
  console.error(`Substantial duplicate code detected:\n${duplicates.join("\n")}`);
  process.exit(1);
}
console.log("No substantial duplicate source blocks detected.");
