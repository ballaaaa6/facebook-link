#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import process from "node:process";
import { pathToFileURL } from "node:url";

const requiredSections = [
  "## Mission",
  "## Scope and constraints",
  "## Current state and evidence",
  "## Workstreams and dependencies",
  "## Alternatives and decision",
  "## Feasibility and assumptions",
  "## Risks and contingencies",
  "## Execution plan",
  "## Verification and acceptance",
  "## Red-team review",
  "## Completion status",
];

const placeholderPatterns = [
  /\bTODO\b/i,
  /\bTBD\b/i,
  /\[item\]/i,
  /\[name\]/i,
  /\[action\]/i,
  /\[path(?:s)?\]/i,
  /\[owner\]/i,
  /\[claim\]/i,
  /\[fact\]/i,
  /\[YYYY-MM-DD\]/i,
];

function usage() {
  console.error("Usage: node validate-plan.mjs <plan.md> [--allow-placeholders]");
}

export function validatePlan(markdown, { allowPlaceholders = false } = {}) {
  const errors = [];

  if (!/^# .+/m.test(markdown)) {
    errors.push("Plan must start with a level-one title.");
  }

  for (const section of requiredSections) {
    if (!markdown.includes(section)) {
      errors.push(`Missing required section: ${section}`);
    }
  }

  if (!/Status:\s*(READY|CONDITIONAL|BLOCKED)/i.test(markdown)) {
    errors.push("Plan must declare Status: READY, CONDITIONAL, or BLOCKED.");
  }

  if (!/Owner:\s*\S+/i.test(markdown)) {
    errors.push("Plan must declare an owner.");
  }

  if (!/Verification:/i.test(markdown) && !/verification/i.test(markdown)) {
    errors.push("Plan must include verification evidence or commands.");
  }

  if (!/Rollback:/i.test(markdown) && !/rollback/i.test(markdown)) {
    errors.push("Plan must include rollback or cleanup guidance.");
  }

  if (!/Residual unknowns:/i.test(markdown) && !/residual unknown/i.test(markdown)) {
    errors.push("Plan must declare residual unknowns.");
  }

  if (!allowPlaceholders) {
    for (const pattern of placeholderPatterns) {
      if (pattern.test(markdown)) {
        errors.push(`Plan contains an unresolved placeholder matching ${pattern}.`);
      }
    }
  }

  return errors;
}

const invokedDirectly = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (invokedDirectly) {
  const [filePath, ...flags] = process.argv.slice(2);
  if (!filePath) {
    usage();
    process.exitCode = 2;
  } else {
    const allowPlaceholders = flags.includes("--allow-placeholders");
    const markdown = await readFile(filePath, "utf8");
    const errors = validatePlan(markdown, { allowPlaceholders });
    if (errors.length > 0) {
      console.error(`Plan validation failed: ${filePath}`);
      for (const error of errors) console.error(`- ${error}`);
      process.exitCode = 1;
    } else {
      console.log(`Plan validation passed: ${filePath}`);
    }
  }
}
