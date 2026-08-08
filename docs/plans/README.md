# Durable Plans

Store plans that need to survive the current task, support review, or guide
multi-agent execution in this directory.

Use the template at
`.agents/skills/deep-operations-planner/assets/plan-template.md`, name files
`YYYY-MM-DD-<short-slug>.md`, and validate them with:

```text
npm run planning:validate -- docs/plans/<plan-file>.md
```

Every durable plan must declare `READY`, `CONDITIONAL`, or `BLOCKED`, include
evidence and verification, and record residual unknowns. Never include secrets,
cookies, tokens, browser profiles, or private session archives.
