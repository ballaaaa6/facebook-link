# Agent Working Guide

Read this file before changing the repository. It is the shortest source of project context for humans and coding agents.

## Objective

Build a measurable affiliate-operations system that discovers Shopee products, selects winners, creates content through the Gemini and Google Flow browser experiences, creates attributed affiliate links, publishes through official social APIs, measures results, and improves strategy over time.

## Runtime boundaries

- `apps/web`: Cloudflare-hosted control panel and dashboards.
- `apps/api`: Cloudflare Worker API and read/write control-plane boundary.
- `apps/discord-bot`: verified Discord commands only.
- `services/automation-runner`: long-running browser/API automation; local Windows during pilot, Oracle Linux after acceptance.
- `packages/*`: shared domain contracts, workflows, agents, attribution, brain, storage, and database code.
- `assets/*`: visual assets, maps, manifests, and references.
- `legacy/*`: preserved tools; do not import them into new code without an adapter and tests.

Cloudflare coordinates work. It does not run Playwright browser sessions. The automation runner owns browser profiles and long-running actions.

## Non-negotiable rules

1. Code, identifiers, filenames, logs, and committed documentation are English.
2. Never commit cookies, passwords, tokens, browser profiles, session archives, `.env` files, or screenshots containing secrets.
3. Gemini and Google Flow use authenticated browser connectors, not paid Gemini APIs.
4. Meta Graph API is the primary Facebook/Instagram publisher. Browser publishing is an explicit fallback.
5. Every external action must be idempotent, auditable, retryable, and attributable to a workflow and agent run.
6. Human review remains available before publishing and before activating a strategy version.
7. Do not edit applied database migrations or generated asset reports. The initial migration may change only before the first durable pilot database is created.
8. Do not regenerate visual assets casually. Follow `docs/art/ASSET_SHEET_PLAN.md` and run asset validation.
9. Petdex assets marked `pending-commercial-review` are prototype-only.
10. No connector may execute real external actions while its feature flag is disabled.
11. After completing a requested change and passing the relevant checks, commit the change and push the current branch to its configured remote so the deployed/source-of-truth view is updated. Skip the push only when the user explicitly requests local-only work or provides a different delivery target.

## Source-of-truth files

- Product scope: `docs/PRODUCT.md`
- System boundaries: `docs/ARCHITECTURE.md`
- Workflow states: `packages/workflows/src/index.ts` and `docs/WORKFLOWS.md`
- Agent responsibilities: `packages/agent-catalog/src/index.ts` and `config/agents.json`
- Data model: `packages/database/migrations/` and `docs/DATA_MODEL.md`
- Attribution: `config/attribution.json` and `docs/ATTRIBUTION.md`
- Security: `docs/SECURITY.md`
- Storage: `docs/STORAGE.md`
- Sheet mirror: `docs/SHEET_SYNC.md`
- TeamBrain: `docs/TEAM_BRAIN.md`
- Code health: `docs/CODE_STANDARDS.md`
- Delivery sequence: `docs/ROADMAP.md`

## Commands

```bash
npm install
npm run dev
npm run check
```

`npm run check` is the required pre-commit gate. Never bypass architecture, file-size, or duplication failures by weakening a rule without documenting the architectural reason.

## Local process lifecycle

- Before starting a local dev server, check whether `http://127.0.0.1:4173` is already responding and reuse it when available.
- Start the web app only with `npm run dev`; do not override its host or port and do not accept an automatically selected fallback port.
- Record the PID of any long-running server started for a task and stop that process tree after local QA unless the user explicitly asks to keep it running.
- Never terminate Codex-owned `mcp/server.mjs`, `node_repl`, or processes under `OpenAI\Codex\runtimes` while cleaning up project servers.
- Before completing a task that used local servers, confirm that it did not leave duplicate Vite, Wrangler, or workerd processes behind.

## Change workflow

1. Identify the owning boundary and source-of-truth document.
2. Add or update contracts before producer/consumer implementations.
3. Keep external connectors behind interfaces and disabled feature flags.
4. Add migration files instead of editing schema history.
5. Update relevant docs when behavior or boundaries change.
6. Run `npm run check` and report what was not tested.
