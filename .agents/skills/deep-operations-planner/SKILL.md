---
name: deep-operations-planner
description: Coordinate high-confidence planning, investigation, strategy, tracing, audit, comparison, and complex implementation work. Use when the user asks for a detailed plan, deep research, a thorough investigation, a contingency-aware strategy, or work that must be decomposed across agents; route approved implementation work through Superpowers and preserve repository-specific domain skills as owners of their boundaries.
---

# Deep Operations Planner

Act as the mission coordinator for complex work in this repository. Produce a
best-supported, execution-ready plan before reporting it, then route approved
implementation work through Superpowers and the available subagent runtime.
Keep the main agent responsible for the master plan, integration, evidence, and
final completion claim.

This skill is a quality protocol, not a promise of omniscience. State the
evidence boundary, assumptions, residual unknowns, and conditions that would
invalidate the plan. Never call a plan perfect when its claim depends on
changing external state.

## Routing

Use this skill when the request involves any of the following:

- detailed planning, strategy, architecture, or multi-step execution;
- deep research, tracing, investigation, audit, comparison, or due diligence;
- a request to inspect a problem “in detail,” find all relevant cases, or plan
  recovery when the first approach fails;
- work that spans packages, services, connectors, external systems, or more
  than one responsible agent;
- an explicit request for parallel agents, subagents, independent review, or
  a second-pass quality check.

Do not add this process to a one-step read-only lookup unless the user asks
for deep investigation. For Office V2 work, use this skill for cross-cutting
coordination, then let the applicable Office V2 skill own its domain gates.

## Operating modes

Determine the mode from the user's wording:

- **Plan only:** inspect, research, write, validate, and report the plan. Do
  not modify implementation files or start external actions.
- **Plan and execute:** complete the planning and red-team gates, then execute
  only after the user explicitly authorizes implementation.
- **Research only:** run the research protocol and return an evidence-backed
  report; store durable project knowledge only when the user or project
  workflow requires it.
- **Diagnose:** determine the cause and recovery options. Do not implement a
  fix unless the user requests a change.
- **Execute an existing plan:** load and critically review the plan first;
  route implementation through Superpowers and re-plan if the plan is stale or
  contradicted by the current repository state.

If the user asks for a plan and execution in the same request, still complete
the internal quality gates before the first edit. Respect the repository's
human-review, feature-flag, and external-action boundaries.

## Mandatory workflow

### 1. Establish the mission

Write down, internally or in the plan artifact:

- desired outcome and user-visible deliverable;
- in-scope and out-of-scope work;
- constraints, non-negotiables, time sensitivity, and safety boundaries;
- success criteria and how success will be measured;
- irreversible or externally visible actions that require a separate gate.

Resolve ambiguity from repository context when safe. Ask only for information
that materially changes the objective, safety boundary, or recommended option.

### 2. Discover current state

Before proposing a solution:

1. Read the applicable `AGENTS.md` files.
2. Identify source-of-truth documents, contracts, schemas, and owners.
3. Inspect the repository status and preserve unrelated user changes.
4. Trace current producers, consumers, dependencies, and integration edges.
5. Check existing skills, scripts, tests, feature flags, and relevant history
   without copying prohibited material across clean-room boundaries.
6. Record evidence paths and distinguish observed facts from assumptions.

Do not create a plan from stale documentation alone when the current code or
configuration can be inspected safely.

### 3. Decompose and schedule

Break the mission into workstreams with explicit inputs, outputs, owners,
dependencies, critical-path order, and verification gates. Mark each workstream
as one of:

- independent and safe to run in parallel;
- dependent on an earlier deliverable;
- shared-state or conflict-prone and therefore sequential;
- external-action or human-gated.

Do not parallelize two tasks with overlapping write scopes or shared mutable
state. Prefer bounded sidecar tasks that advance the critical path while the
main agent continues non-overlapping work.

### 4. Test feasibility before commitment

For every must-have deliverable, check required files, tools, permissions,
credentials, APIs, data, runtime assumptions, and acceptance evidence.

Classify each dependency as `available`, `conditionally available`,
`missing`, `unsafe`, or `unverified`. For every missing or unsafe dependency,
document a recovery tree:

1. direct path and its blocker;
2. compatible fallback;
3. reduced-scope path;
4. wait, approval, or user action required;
5. abort condition and what remains recoverable.

Never stop at “cannot” when a safe alternative, scope reduction, or recovery
step exists.

### 5. Run the evidence protocol

For research or externally sourced claims, read
[references/research-protocol.md](references/research-protocol.md).

Decompose the question into claims, prefer primary sources, verify load-bearing
claims with independent sources, check dates and versions, perform a
contrarian pass, and record disagreements. Do not treat search snippets,
aggregators, mirrors, or one source's enumeration as independent confirmation.

Stop research only when all requested sub-claims have evidence status, the
contrarian pass is complete, the remaining search paths are saturated, and
residual unknowns are explicit. “No new facts found” is evidence for a bounded
stop, not proof that nothing else exists.

### 6. Compare approaches

Generate the smallest useful set of viable approaches, normally two or three.
Evaluate them against the user's objective, constraints, correctness,
operability, cost, latency, security, reversibility, and maintenance burden.
Recommend one approach and record why the others were rejected or kept as
fallbacks. Do not hide a meaningful tradeoff behind a single confident pick.

### 7. Build the failure and contingency model

Read [references/risk-and-contingency.md](references/risk-and-contingency.md).
For every critical step, identify:

- trigger or leading signal;
- failure impact and blast radius;
- detection method;
- immediate containment;
- primary recovery;
- fallback or reduced-scope route;
- rollback or cleanup;
- owner and next checkpoint;
- evidence required to resume.

The plan is incomplete if its happy path is detailed but its failure path is
only “try again.”

### 8. Create the execution plan

Use [assets/plan-template.md](assets/plan-template.md) as the canonical shape
unless the user or an existing project contract requires another format. Each
task must identify exact files or systems, inputs, outputs, interfaces,
commands, tests, acceptance evidence, and its write scope.

Use `docs/plans/` for durable project plans when the task warrants a committed
artifact. Keep plan, evidence, and implementation state synchronized.

### 9. Run an independent red-team pass

Review the completed plan as if it came from another engineer. Check:

- mission and user intent coverage;
- current-state evidence and stale assumptions;
- dependency and ordering correctness;
- alternative comparison and decision rationale;
- security, privacy, external-action, and clean-room constraints;
- failure modes, contingency paths, rollback, and recovery evidence;
- testability, acceptance criteria, and observability;
- placeholder text, vague verbs, undefined names, contradictions, and scope
  leaks.

Fix findings before reporting. Do not present a plan that still contains an
unresolved must-have issue without marking it `CONDITIONAL` or `BLOCKED`.

### 10. Apply the completion gate

Read [references/completion-gate.md](references/completion-gate.md). Report
exactly one status:

- **READY:** all required objectives have an owner, dependency, verification
  method, failure response, and completion condition;
- **CONDITIONAL:** the plan is executable once named assumptions, approvals,
  permissions, or external state are satisfied;
- **BLOCKED:** safe paths and bounded fallbacks were exhausted, with evidence
  and a concrete recovery request recorded.

Use the phrase “best-supported plan under the available evidence, tools,
permissions, time, and constraints,” not “guaranteed perfect.”

## Superpowers integration

Superpowers is the execution methodology. Do not duplicate its full skill
content here; route to the installed skills as follows:

1. For new behavior, creative work, or unclear requirements, use
   `superpowers:brainstorming` before implementation.
2. After an approved design or complete requirements, use
   `superpowers:writing-plans` to produce bite-sized implementation tasks.
3. For approved multi-task work, prefer
   `superpowers:subagent-driven-development` when subagents are available.
4. Otherwise use `superpowers:executing-plans` with explicit checkpoints.
5. Finish through Superpowers' branch-completion workflow after verification.

The project plan and this skill's gates remain authoritative for repository
constraints. Superpowers may choose task mechanics, but it must not bypass
feature flags, human review, clean-room rules, migration rules, secret rules,
or the repository's required checks.

Read [references/subagent-contract.md](references/subagent-contract.md) before
delegating. The main agent owns the master plan, task routing, integration,
final checks, and completion claim. A worker's “done” message is not evidence
until its diff, tests, and artifacts are inspected.

## Re-planning and reporting

When new evidence invalidates a plan assumption:

1. pause only the affected workstream;
2. preserve completed verified work;
3. record the invalidated assumption and evidence;
4. compare recovery options;
5. update the plan and downstream task packets;
6. resume only after the affected gate passes.

Final reports must include the outcome, status, evidence, changed artifacts,
verification performed, unresolved risks, residual unknowns, and the next safe
action. Never claim completion while a required artifact, test, review, or
external-action gate remains unfinished.
