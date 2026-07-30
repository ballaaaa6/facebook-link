# Affiliate Operations HQ

An automation control plane for product discovery, affiliate attribution,
browser-assisted content production, publishing, and performance learning. The
Cloudflare control plane coordinates a local or Oracle-hosted automation runner.

## Repository status

- React and TypeScript control panel with Office, Dashboard, and Settings surfaces
- Safe TeamBrain mock with agent routing and confirmation proposals
- Cloudflare API and Discord Worker safety scaffolds
- Shared workflow, agent, attribution, storage, and database packages
- Local SQLite schema and content-addressed filesystem storage
- Office Engine V2 clean-room foundation and isolated development lab
- CI, repository checks, security rules, and agent working context

## Run locally

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:4173/` for the empty Office V2 production mount. The
Dashboard is at `/dashboard` and Settings is at `/settings`. During local
development only, the detailed engine foundation lab is available at
`http://127.0.0.1:4173/?lab=office-engine-v2`.

Run the complete quality gate before committing:

```bash
npm run check
```

Remove disposable build output, local caches, and temporary logs without touching
dependencies, runtime data, references, or legacy tools:

```bash
npm run clean:local
```

## Project map

```text
apps/web/                       Cloudflare-hosted React control panel
apps/api/                       Cloudflare Worker API boundary
apps/discord-bot/               Verified Discord interaction boundary
services/automation-runner/     Browser and API execution plane
packages/contracts/             Shared domain contracts
packages/brain/                 Replaceable TeamBrain provider boundary
packages/workflows/             Workflow state machine
packages/agent-catalog/         Agent responsibilities and handoffs
packages/attribution/           Shopee Sub ID encoder
packages/database/              SQLite migrations and local database opener
packages/storage/               Local and Oracle object storage
config/                         Safe editable runtime examples
infrastructure/                 Cloudflare and Oracle runbooks and templates
assets/references/              Non-runtime design references
docs/office-v2/                 Office Engine V2 source of truth
docs/                           Product and engineering source of truth
prompts/                        Versioned browser prompt artifacts
runtime-data/                   Ignored local pilot state; never cleaned automatically
legacy/                         Preserved pre-monorepo tools
tmp/, dist/, .wrangler/         Ignored disposable local output
```

## Read next

- `AGENTS.md`: fastest context for a coding agent
- `docs/PRODUCT.md`: pilot scope and acceptance gates
- `docs/ARCHITECTURE.md`: Cloudflare, local, and Oracle boundaries
- `docs/REPOSITORY_LAYOUT.md`: current, reference, legacy, runtime, and generated files
- `docs/office-v2/README.md`: clean-room engine boundary
- `docs/office-v2/FOUNDATIONS.md`: required game-system knowledge
- `docs/office-v2/IMPLEMENTATION_PLAN.md`: vertical delivery sequence
- `docs/WORKFLOWS.md`: durable stages and handoffs
- `docs/SECURITY.md`: credential and profile rules
- `docs/ROADMAP.md`: product delivery sequence

## Next engineering milestone

Persist the affiliate simulation through SQLite, connect the first read-only
Shopee discovery worker, and replace dashboard mock values with API read models.
Office Engine work proceeds independently through its own gated vertical slice.
