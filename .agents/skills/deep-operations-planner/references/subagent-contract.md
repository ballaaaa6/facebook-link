# Subagent Contract

Use this contract whenever work is delegated to a subagent or parallel worker.

## Coordinator responsibilities

The main agent must:

- create the master plan and dependency graph;
- choose the smallest useful number of workers;
- assign disjoint write scopes;
- provide complete task packets;
- avoid duplicating delegated work;
- review returned evidence, diffs, and tests;
- resolve conflicts and integrate only verified results;
- own the final status and user-facing report.

## Task packet

Every worker receives:

```text
Mission:
Context and source-of-truth paths:
Required output:
Read scope:
Write scope:
Forbidden paths or actions:
Dependencies:
Acceptance criteria:
Verification commands:
Stop conditions:
Return format:
```

The packet must be self-contained. Do not assume that a worker can see the
conversation, another worker's reasoning, or an unstated project convention.

## Parallelism rules

- Parallelize independent research questions, read-only audits, and disjoint
  implementation slices.
- Keep dependency chains sequential.
- Never assign overlapping file, migration, schema, or shared-state writes to
  parallel workers.
- Use isolated worktrees for independent code changes when the Superpowers
  workflow provides them.
- Keep external actions and irreversible operations in the main-agent or
  human-gated lane.

## Required worker response

```text
Status: complete | conditional | blocked
Summary:
Changed files or artifacts:
Evidence:
Verification commands and results:
Known risks:
Unresolved questions:
Recommended next action:
```

“Complete” means the worker met its acceptance criteria, not merely that it
finished running commands. The main agent must downgrade the status when the
evidence is incomplete.

## Review lanes

Use a fresh review pass for high-risk work. A reviewer should receive the
artifact, diff, requirements, and acceptance criteria, but not the coordinator's
desired verdict. Ask it to find omissions, contradictions, unsafe assumptions,
regressions, and missing evidence. The main agent resolves findings before
marking the parent task ready.
