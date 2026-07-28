# Development Guide

## Requirements

- Node.js 24 or newer
- npm 11 or newer
- Python 3 with the pinned art dependency from `requirements-art.txt`
- Git

## Setup

```bash
npm install
python -m pip install -r requirements-art.txt
copy .env.example .env
npm run dev
```

The current web preview is `http://127.0.0.1:4173/`.

## Quality gate

```bash
npm run check
```

This verifies repository shape, import boundaries, file-size budgets, duplicate source blocks, the generated code map, TypeScript, tests, and builds across workspaces.
Generated Office image freshness is verified through the portable Node lock,
so CI and Cloudflare do not require Pillow. Install `requirements-art.txt` only
when regenerating or byte-checking art outputs locally.

`npm run art:workstation:v2:check` is also a Node-only CI guard. It validates
the Step 4 source hashes, PNG headers and dimensions, exact processed/review
output set, permissions, and generated-art lock entries. Use
`npm run art:workstation:v2` only on an art workstation with Pillow installed.

`npm run art:workstation:step5:check` verifies the isolated Step 5 manifest,
all 18 locked input hashes, one-station/two-view permissions, five review
images, denied legacy imports, and the byte-identical Active Office baseline.
The lab is development-only at `/?lab=office-workstation-v2-step5`.

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
