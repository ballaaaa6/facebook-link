import test from "node:test";
import assert from "node:assert/strict";
import { validatePlan } from "./validate-plan.mjs";

const validPlan = `# Mission Plan

Status: READY
Owner: main-agent

## Mission
Deliver the requested outcome.

## Scope and constraints
Keep the change bounded and authorized.

## Current state and evidence
The current repository state was inspected.

## Workstreams and dependencies
One sequential workstream owns the change.

## Alternatives and decision
The recommended option is reversible and testable.

## Feasibility and assumptions
Required tools are available.

## Risks and contingencies
Rollback is defined for partial progress.

## Execution plan
Implement the bounded change.
Verification: npm test
Rollback: restore the previous artifact.

## Verification and acceptance
The acceptance test passes.

## Red-team review
The independent review found no blocking issue.

## Completion status
Status: READY
Residual unknowns: none that affect the acceptance criteria.
`;

test("accepts a complete plan", () => {
  assert.deepEqual(validatePlan(validPlan), []);
});

test("rejects missing required sections and placeholders", () => {
  const incomplete = validPlan.replace("## Red-team review", "TODO");
  const errors = validatePlan(incomplete);
  assert.equal(errors.some((error) => error.includes("Missing required section")), true);
  assert.equal(errors.some((error) => error.includes("placeholder")), true);
});

test("supports validating a template with placeholders explicitly allowed", () => {
  const template = validPlan.replace("Deliver the requested outcome.", "[item]");
  assert.deepEqual(validatePlan(template, { allowPlaceholders: true }), []);
});
