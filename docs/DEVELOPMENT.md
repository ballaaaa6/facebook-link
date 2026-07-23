# Development Guide

## Requirements

- Node.js 24 or newer
- npm 11 or newer
- Python 3 with Pillow, NumPy, and SciPy for art processing
- Git

## Setup

```bash
npm install
copy .env.example .env
npm run dev
```

The current web preview is `http://127.0.0.1:4173/`.

## Quality gate

```bash
npm run check
```

This verifies repository shape, import boundaries, file-size budgets, duplicate source blocks, the generated code map, TypeScript, tests, and builds across workspaces.

Run a single guard while iterating:

```bash
npm run architecture:check
npm run code:health
npm run duplicate:check
npm run code:map
```

## Adding a connector

1. Implement an interface from `services/automation-runner/src/connectors`.
2. Add explicit runtime configuration and a disabled feature flag.
3. Add a fake connector for deterministic tests.
4. Define idempotency and reconciliation behavior.
5. Document secrets and external side effects.
6. Enable only after a human-reviewed pilot test.

## Adding an agent

Update the agent catalog, `config/agents.json`, workflow ownership documentation, office map, and UI. An agent is not just a character: it must have defined inputs, outputs, failure behavior, and audit events.
