# Affiliate Operations HQ

An automation control plane for product discovery, affiliate attribution, browser-assisted content production, publishing, and performance learning. It combines a Cloudflare control plane with a local/Oracle automation runner.

## Repository status

- Git-ready npm monorepo boundaries
- React/TypeScript control panel with Office, Dashboard, and Settings routes
- Safe TeamBrain mock with agent routing and confirmation proposals
- Cloudflare API and Discord Worker safety scaffolds
- Local/Oracle automation-runner contracts
- Shared workflow, agent, attribution, and domain packages
- Local SQLite schema, content-addressed filesystem storage, and deployment documentation
- Google Sheet mirror with 10 operational tabs
- 48 validated environment assets and one animated pilot character
- CI, repository checks, security rules, and AI working context

## Run locally

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:4173/`.

Required quality gate (architecture, size budgets, duplication, code map, types, tests, and builds):

```bash
npm run check
```

## Project map

```text
apps/web/                       Cloudflare-hosted React control panel
apps/api/                       Cloudflare Worker API boundary
apps/discord-bot/               Verified Discord interaction boundary
services/automation-runner/     Browser/API execution plane
packages/contracts/             Shared domain contracts
packages/brain/                 Replaceable TeamBrain provider boundary
packages/workflows/             Workflow state machine
packages/agent-catalog/         Agent responsibilities and handoffs
packages/attribution/           Shopee Sub ID encoder
packages/database/              SQLite migrations and local database opener
packages/storage/               Local/Oracle content-addressed object storage
config/                         Safe editable runtime examples
infrastructure/                 Cloudflare and Oracle runbooks/templates
assets/art/style-concepts/      Approved visual references
assets/game/                    Office maps, manifests, and sprites
assets/references/              Unprocessed design references
docs/                           Product and engineering source of truth
legacy/                         Preserved pre-monorepo tools
tools/art/                      Reproducible asset-processing utilities
```

## Asset processing

Generated sheets use a flat magenta background. Convert and split a sheet with:

```bash
python tools/art/process_asset_sheet.py \
  --input assets/game/processed/core-furniture-c-v1-alpha.png \
  --manifest assets/game/manifests/core-furniture-sheet.json \
  --output-dir assets/game/processed/core-furniture-c-v1 \
  --report assets/game/manifests/core-furniture-c-v1.report.json
```

The processor uses alpha-connected components instead of rigid cell crops, so tall objects can cross visual grid boundaries without contaminating neighboring assets.

## Asset provenance

Generated office art is original project material. The Petdex pilot is marked `pending-commercial-review` and is limited to internal prototype use until its redistribution and commercial-use terms are recorded. Do not remove provenance fields from character manifests.

## Read next

- `AGENTS.md`: fastest context for a coding agent
- `docs/PRODUCT.md`: pilot scope and acceptance gates
- `docs/ARCHITECTURE.md`: Cloudflare/local/Oracle boundaries
- `docs/WORKFLOWS.md`: durable stages and handoffs
- `docs/SECURITY.md`: credential and profile rules
- `docs/STORAGE.md`: SQLite and local/Oracle file layout
- `docs/SHEET_SYNC.md`: Google Sheet mirror contract
- `docs/TEAM_BRAIN.md`: mock-to-Cloudflare provider boundary
- `docs/CODE_STANDARDS.md`: anti-bloat and module rules
- `docs/ROADMAP.md`: implementation sequence

## Next engineering milestone

Persist the simulation through SQLite, connect the first local Shopee read-only discovery worker, and replace dashboard mock values with API read models. Real external actions remain disabled until their explicit pilot gates pass.
