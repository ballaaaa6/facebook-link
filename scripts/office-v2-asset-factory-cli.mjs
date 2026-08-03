import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { AssetFactoryError, fail } from "./office-v2-asset-factory-errors.mjs";
import { prepareAssetExport, reportText } from "./office-v2-asset-factory-build.mjs";
import {
  assertNoOutputPathCollision,
  assertOutputRoot,
  normalizeRelativePath,
  writeOutputs,
} from "./office-v2-asset-factory-paths.mjs";

function parseCli(argv) {
  const positional = [];
  let reportPath = null;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--report" || argument === "--report-path") {
      const next = argv[index + 1];
      if (next === undefined || next.startsWith("--")) {
        fail("asset.factory.cli-usage", "Usage: node scripts/office-v2-asset-factory.mjs <input.json> <clean-output-dir> [--report <relative-report.json>]");
      }
      reportPath = next;
      index += 1;
    } else if (argument.startsWith("--report=")) {
      reportPath = argument.slice("--report=".length);
    } else if (argument === "--help" || argument === "-h") {
      return { help: true };
    } else positional.push(argument);
  }
  if (reportPath === null && positional.length === 3) reportPath = positional.pop();
  if (positional.length !== 2 || (reportPath !== null && typeof reportPath !== "string")) {
    fail("asset.factory.cli-usage", "Usage: node scripts/office-v2-asset-factory.mjs <input.json> <clean-output-dir> [--report <relative-report.json>]");
  }
  return { inputPath: positional[0], outputRoot: positional[1], reportPath };
}

function readInput(inputPath) {
  try {
    return JSON.parse(readFileSync(resolve(inputPath), "utf8"));
  } catch {
    fail("asset.factory.input-json-invalid", "CLI input must be a readable JSON document.");
  }
}

function assertInputObject(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    fail("asset.factory.input-invalid", "CLI input must contain a JSON object.");
  }
  return input;
}

export function runCli(argv = process.argv.slice(2)) {
  try {
    const options = parseCli(argv);
    if (options.help) {
      process.stdout.write("Usage: node scripts/office-v2-asset-factory.mjs <input.json> <clean-output-dir> [--report <relative-report.json>]\n");
      return;
    }
    const input = assertInputObject(readInput(options.inputPath));
    const source = input.source ?? input.sourceSet;
    const recipe = input.recipe ?? input.exportRecipe;
    if (!source || !recipe) fail("asset.factory.input-invalid", "CLI input must declare source and recipe objects.");
    const rootInfo = assertOutputRoot(options.outputRoot);
    const prepared = prepareAssetExport({ source, recipe });
    let outputBytes = prepared.outputBytes;
    if (options.reportPath !== null) {
      const reportPath = normalizeRelativePath(options.reportPath, "cli.reportPath");
      assertNoOutputPathCollision(reportPath, outputBytes);
      outputBytes = [...outputBytes, { path: reportPath, bytes: Buffer.from(reportText(prepared.report), "utf8"), index: "cli.report" }];
    }
    writeOutputs(rootInfo, outputBytes);
    process.stdout.write(`${reportText(prepared.report)}\n`);
  } catch (error) {
    const message = error instanceof AssetFactoryError ? error.message : "[asset.factory.failure] Asset export failed.";
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  }
}
