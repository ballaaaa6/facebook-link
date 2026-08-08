# Completion Gate

Run this gate before reporting a plan or implementation as complete.

## Required checks

- [ ] User objective and deliverable are explicit.
- [ ] Scope, constraints, and authorization boundaries are explicit.
- [ ] Current-state evidence and source-of-truth paths are recorded.
- [ ] Workstreams, owners, dependencies, and critical path are explicit.
- [ ] Alternatives and the recommendation are compared.
- [ ] Feasibility and assumptions are checked.
- [ ] Failure modes have triggers, containment, recovery, fallback, and resume
      evidence.
- [ ] Rollback or cleanup is defined for partial progress.
- [ ] Every implementation task has an exact write scope and verification.
- [ ] Research claims have source and freshness status where applicable.
- [ ] Contrarian and independent red-team review is complete.
- [ ] No placeholders, undefined names, unresolved must-have contradictions,
      or silent scope changes remain.
- [ ] Required tests, reviews, feature flags, and human gates are identified.

## Status rules

### READY

Use only when all required checks pass and remaining uncertainty is non-blocking
and explicitly monitored.

### CONDITIONAL

Use when the plan is sound but depends on a named approval, permission,
credential, external state, or assumption. State the exact unblock action,
fallback, and consequence of non-resolution.

### BLOCKED

Use only after safe direct, fallback, reduced-scope, and approval paths were
examined. Include evidence of the blocker, what remains preserved, and the
smallest recovery request.

## Final report shape

```text
Outcome:
Status: READY | CONDITIONAL | BLOCKED
Recommendation:
What was checked:
Evidence and verification:
Changed artifacts:
Residual risks and unknowns:
Next safe action:
```

Do not write “perfect,” “nothing else can go wrong,” or “everything is known.”
Use “best-supported under the available evidence, tools, permissions, time,
and constraints.”
