# Risk and Contingency Protocol

Use a failure tree, not a generic “retry” note. Every critical task should
have a detectable trigger, containment action, recovery route, and resume
condition.

## Risk record

Record each risk with this shape:

```text
ID:
Risk:
Affected objective or workstream:
Likelihood: low | medium | high | unknown
Impact: low | medium | high | critical
Leading signal or trigger:
Detection method:
Preventive control:
Immediate containment:
Primary recovery:
Fallback or reduced-scope route:
Rollback or cleanup:
Owner:
Resume evidence:
Abort condition:
```

## Scenario branches

For each must-have outcome, create these branches when applicable:

1. **Happy path:** required inputs are available and verification passes.
2. **Degraded path:** a non-critical dependency is missing; preserve the core
   outcome with reduced scope.
3. **Substitution path:** the preferred tool, provider, or implementation is
   unavailable; use a compatible alternative with its tradeoffs recorded.
4. **Recovery path:** an intermediate step fails after partial progress;
   restore a known-good state and resume from the last verified checkpoint.
5. **Stop path:** continuing would be unsafe, irreversible, unauditable, or
   outside authorization; preserve artifacts and request the smallest action
   needed to unblock.

## Re-plan triggers

Re-open the plan when a source-of-truth contract changes, a dependency becomes
unavailable, an acceptance test fails for a new reason, a subagent discovers a
write-scope conflict, an external API changes, or an assumption is disproved.
Do not silently patch downstream tasks while keeping an invalid master plan.

## External-action guard

Anything that publishes, changes credentials, creates an irreversible external
state, or activates a strategy must retain the project's feature-flag and human
review gate. A fallback is not permission to bypass that gate.
