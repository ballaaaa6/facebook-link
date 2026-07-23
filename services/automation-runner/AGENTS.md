# Automation runner instructions

- Connectors implement contracts and return structured job results.
- Every job must be workspace-scoped, versioned, idempotent, retry-aware, and observable.
- Browser automation is a connector fallback; do not mix browser selectors into orchestration code.
- Never silently publish, spend, authenticate, or refresh sensitive sessions without its tool policy.
