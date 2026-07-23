# Deployment

## Phase 1: local pilot

- Web runs locally or on Cloudflare Pages.
- SQLite and local content-addressed storage live under `runtime-data/`.
- Google Sheets mirrors operational rows; it is not the source of truth.
- Automation runner runs on the current Windows machine with one profile at a time.
- Secrets and browser profiles remain outside the repository.

## Phase 2: Oracle runner

- Provision Oracle Linux with a non-root service account.
- Install the pinned Node/browser runtime.
- Restore encrypted browser profiles through an approved transfer process.
- Run one profile worker first and validate seven days of recovery/metrics.
- Configure system service, health checks, log rotation, disk monitoring, and backups.

## Cloudflare prerequisites

- Pages/Workers project names
- D1 database ID
- Optional R2 bucket and queue bindings when billing is available
- Authentication choice
- Discord public key and application ID
- Runner-to-control-plane credential

Wrangler files intentionally omit production resource IDs and secrets. Fill them through deployment configuration, never source control.

## Unified web and API Worker

The production `facebook-link` Worker serves the built React SPA from `apps/web/dist` and routes `/health` plus `/v1/*` through `apps/api/src/index.ts`. All other unknown asset paths use the SPA fallback so browser refreshes on `/dashboard` and `/settings` remain valid.

Local deployment checks:

```bash
npm run deploy:dry-run
npm run deploy:cloudflare
```

Cloudflare Workers Builds connects the GitHub `main` branch using root directory `/`, build command `npm run check`, and deploy command `npx --yes wrangler@4.113.0 deploy --config wrangler.jsonc`. Non-production branches use `npx --yes wrangler@4.113.0 versions upload --config wrangler.jsonc` for preview versions. Wrangler stays outside the application dependency graph because it is deployment tooling, not runtime code.

## Release order

Database backup/migration -> API -> Discord worker -> web -> runner. Roll back the runner feature flags first if an external connector misbehaves.
