# Code standards

## Dependency direction

Applications and services may depend on packages. Packages never depend on applications or services. Web features communicate through `app` or `shared` contracts and do not import one another directly.

## Anti-bloat guardrails

- TypeScript and TSX files have enforced line budgets.
- A duplicate-block check rejects substantial copied source.
- Business rules live in small packages and are tested once.
- `App.tsx` composes routes; connectors own provider details; orchestration owns handoffs.
- `npm run code:map` regenerates `docs/generated/CODEMAP.md` so agents can find ownership without scanning the repository.

Do not weaken a guard because a file grew. Extract a coherent unit. Change a budget only when the larger unit is demonstrably easier to understand and the reason is recorded in an ADR.
