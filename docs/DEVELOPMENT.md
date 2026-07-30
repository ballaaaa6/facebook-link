# Development Guide

## Requirements

- Node.js 24 or newer
- npm 11 or newer
- Git

## Setup

```bash
npm install
copy .env.example .env
npm run dev
```

The web preview is `http://127.0.0.1:4173/`.

## Quality gate

```bash
npm run check
```

This verifies repository shape, the Office Engine V2 clean-room boundary,
import boundaries, file-size budgets, source duplication, the generated code
map, TypeScript, tests, and builds across workspaces.

Run a focused guard while iterating:

```bash
npm run office:v2:clean-room:check
npm run architecture:check
npm run code:health
npm run duplicate:check
npm run code:map
```

## Office Engine development

The development-only foundation lab is
`http://127.0.0.1:4173/?lab=office-engine-v2`. It deliberately contains no map,
renderer dependency, runtime asset registry, or compatibility adapter. Follow
`docs/office-v2/IMPLEMENTATION_PLAN.md`; do not skip directly to scene art.

## Adding a connector

1. Implement an interface from `services/automation-runner/src/connectors`.
2. Add explicit runtime configuration and a disabled feature flag.
3. Add a fake connector for deterministic tests.
4. Define idempotency and reconciliation behavior.
5. Document secrets and external side effects.
6. Enable only after a human-reviewed pilot test.

## Adding an agent

Update the agent catalog, `config/agents.json`, workflow ownership documentation,
and audit events. Visual representation is a separate consumer and must not
become the source of truth for an agent's operational state.
