# Parallel Implementation Plan — M1 Pilot and Read Models

Status: PLANNED  
Planning base commit: `84525d9c946a2f12a520b9fd58c11f1e33ce52f2`  
Planning branch: `main`  
Planning date: 2026-08-02  
Integration target: `codex/integration/m1-pilot-read-models`
Session branches: `codex/task/session-1-sqlite-pilot`,
`codex/task/session-2-shopee-discovery`, and
`codex/task/session-3-dashboard-read-models`

## Repository assessment

The worktree is clean and `main` is aligned with `origin/main`. The required
baseline gate passes with `npm run check`. The latest commits close Office
Engine V2 Phase 1 contract and research controls, but the Office V2 Phase 2
world kernel is a separate authorized workstream and is intentionally not part
of this three-session wave.

The product roadmap and README identify the next product milestone as:

1. persist the simulated affiliate workflow through SQLite;
2. connect the first read-only Shopee discovery worker; and
3. expose API read models and remove dashboard mock values.

The repository evidence supports those priorities:

- `services/automation-runner/src/simulation/persistence.ts` already persists
  pilot jobs, agent runs, audit events, and outbox rows idempotently, but the
  pilot does not persist its product/evidence records into `products` and
  `product_snapshots`.
- `services/automation-runner/src/connectors/index.ts` and
  `src/connectors/registry.ts` define a disabled `shopee-discovery` contract,
  but no connector implementation or browser port exists.
- `apps/api/src/index.ts` exposes health, manifest, and TeamBrain routes only;
  there is no database binding or read-model endpoint.
- `apps/web/src/features/dashboard/DashboardPage.tsx` and
  `metrics.ts` contain hard-coded funnel, health, performance, and metric data.
- The SQLite schema already contains the product, snapshot, workflow, job,
  profile, audit, and outbox tables needed for this slice. No edit to the
  applied `0001_initial.sql` migration is authorized.

## Three-task overview

| Session | Task | Primary boundary | Independent output |
| --- | --- | --- | --- |
| 1 | Complete SQLite pilot persistence | `services/automation-runner/src/simulation/` | A deterministic pilot writes product/evidence plus workflow records atomically and idempotently. |
| 2 | Implement read-only Shopee discovery | `services/automation-runner/src/connectors/shopee-discovery/` | An injected browser port normalizes safe product cards while the feature remains disabled by default. |
| 3 | Add API read models and wire Dashboard | `apps/api/` and `apps/web/src/features/dashboard/` | A D1-compatible read-only dashboard endpoint drives loading, error, empty, and populated UI states. |

The three sessions start from the same base commit and must not depend on an
unpublished sibling commit. They share the endpoint and data-shape assumptions
written below; the Final Integrator verifies the assumptions against the actual
merged schema and connector output.

## Task 1 — Complete SQLite pilot persistence

### Problem and outcome

The pilot simulation currently proves workflow-job idempotency but leaves the
canonical product and evidence tables empty. Extend the existing simulation
fixture and persistence transaction so one complete, schema-valid simulated
workflow has a product candidate, a product snapshot, job history, agent runs,
the system `content_ready` audit event, and outbox records.

### Owned files

- `services/automation-runner/src/simulation/pilot.ts`
- `services/automation-runner/src/simulation/persistence.ts`
- `services/automation-runner/test/simulation.test.ts`
- an additive test or helper under `services/automation-runner/test/` only when
  it is needed for this task
- `docs/parallel-work/session-1-status.md`

### In scope

- Add a deterministic pilot product candidate and evidence payload to the
  existing `PilotSimulation` shape without introducing a new external API.
- Persist `products` and `product_snapshots` in the same transaction as the
  existing workflow, job, agent-run, audit, and outbox rows.
- Derive stable IDs and timestamps from the simulation input; do not use
  database row order or wall-clock values for business ordering.
- Preserve reverse-result-order behavior, exact duplicate no-op behavior, and
  changed-payload conflict detection.
- Prove rollback leaves every affected table empty when validation fails before
  commit, and prove a second identical persistence has no extra rows.
- Use the existing migration shape. Add a numbered migration only if a
  concrete schema defect blocks the acceptance criteria; never edit
  `0001_initial.sql`.

### Out of scope

Live Shopee discovery, ranking, affiliate-link creation, API endpoints, Web
components, Office V2, D1 deployment IDs, and real credentials.

### Acceptance and evidence

- A fresh in-memory database contains one product and at least one linked
  product snapshot plus the existing 8 jobs, 8 agent runs, 9 audit events, and
  8 outbox rows.
- Reversed results and an identical second call produce byte-equivalent
  payloads and unchanged row counts.
- A changed product/evidence or job payload fails with an explicit idempotency
  conflict and does not partially mutate the database.
- `npm run test --workspace @affiliate-ops/automation-runner`, the workspace
  typecheck, and `npm run check` pass.
- The session status file records the exact test commands, changed files, and
  commit hash.

## Task 2 — Read-only Shopee discovery connector

### Problem and outcome

The runner has a `ProductDiscoveryConnector` interface and a registry entry,
but no implementation. Add a browser-connector boundary that can be tested
without a browser or credentials and that cannot call the browser while the
`shopeeDiscovery` feature flag is disabled.

### Owned files

- new files under `services/automation-runner/src/connectors/shopee-discovery/`
- `services/automation-runner/test/shopee-discovery.test.ts`
- `docs/parallel-work/session-2-status.md`

`services/automation-runner/src/index.ts`,
`services/automation-runner/src/connectors/index.ts`,
`services/automation-runner/src/connectors/registry.ts`, and all shared package
contract indexes are Final Integrator files for this wave. The session may
consume the existing connector interface and registry but must not change them.

### In scope

- Define a narrow injected browser port that returns already-extracted product
  cards; the connector must not contain Playwright selectors or credentials.
- Normalize cards into existing `ProductCandidate` values and an additive,
  connector-local evidence/batch result that the Final Integrator can persist.
- Validate workspace/run context, positive bounded limits, HTTPS product URLs,
  required external IDs, supported currency, non-negative money/count fields,
  and duplicate external IDs.
- Generate stable candidate IDs from the provider and external ID, preserve
  explicit source order unless the contract says otherwise, and make repeated
  normalization deterministic.
- Require an explicit enabled flag before invoking the injected browser. A
  disabled call must fail with a stable connector diagnostic and zero browser
  calls.
- Keep the connector read-only and mark no real external side effect as
  enabled. Add deterministic fake-browser tests for valid cards, limit
  enforcement, malformed cards, duplicate IDs, disabled mode, and repeatability.

### Out of scope

Login/session recovery, real browser automation, selector discovery, affiliate
link creation, product ranking or winner selection, database writes, API/Web
changes, feature-flag activation, and any secret or screenshot capture.

### Acceptance and evidence

- The fake browser is never invoked when the feature is disabled.
- Valid cards become schema-compatible candidates with deterministic IDs and
  evidence; invalid or duplicate cards fail closed before a partial batch is
  returned.
- The connector never imports database, storage, React, Office packages, or a
  browser library.
- Focused connector tests, workspace typecheck, and `npm run check` pass.
- The status file records that no live browser or external account was tested.

## Task 3 — API read models and Dashboard integration

### Problem and outcome

The API has no read-model route and the Dashboard displays literal demo values.
Add a read-only D1-compatible query boundary and make the Dashboard render only
validated API data, with explicit loading, unavailable, empty, and populated
states.

### Owned files

- `apps/api/src/read-models.ts` (new)
- `apps/api/src/index.ts`
- `apps/api/test/read-models.test.ts` (new)
- `apps/api/package.json` only to add its focused test script if required
- `apps/web/src/features/dashboard/DashboardPage.tsx`
- `apps/web/src/features/dashboard/metrics.ts`
- `apps/web/src/features/dashboard/model.ts`
- `apps/web/src/shared/components/MetricStrip.tsx`
- `apps/web/src/shared/services/dashboard.ts` (new)
- `apps/web/test/dashboard-model.test.ts` (new)
- `docs/parallel-work/session-3-status.md`

`apps/api/wrangler.jsonc`, the root `wrangler.jsonc`, deployment resource IDs,
and shared package contract indexes are Final Integrator files. Do not invent a
D1 database ID.

### In scope

- Define and validate one endpoint:
  `GET /v1/read-models/dashboard?workspaceId=<id>`.
- Use parameterized D1-compatible queries over the existing schema for product
  counts, workflow/job funnel counts, scheduled work, best-content metrics,
  latest workflow activity, and browser-profile health.
- Return a stable JSON shape with `schemaVersion`, `workspaceId`,
  `generatedAt`, `summary`, `funnel`, `health`, `bestContent`, and `latestRun`.
- Require a bounded non-empty workspace ID and return stable JSON error codes
  for invalid input, missing database binding, and query failure. Never expose
  SQL, filesystem paths, credentials, or provider payloads.
- Keep `/health`, `/v1/system/manifest`, and `/v1/brain/respond` behavior
  compatible.
- Add a Web service that fetches and runtime-validates the response. Replace
  all dashboard literals with data-driven values and explicit UI states; do
  not silently revert to the old demo numbers when the API is unavailable.
- Preserve the existing desktop and 320 px mobile layout and keep UI network
  access behind `apps/web/src/shared/services/`.

### Out of scope

Authentication/authorization, mutating commands, live D1 resource creation,
runner-to-API transport, Office V2, external platform calls, and production
deployment IDs.

### Acceptance and evidence

- API tests cover valid rows, empty workspace, invalid workspace, missing DB,
  query failure, and response shape validation using a fake D1 boundary.
- Web tests cover response validation and metric/funnel mapping; the build
  contains no old hard-coded product/funnel/health values in the Dashboard.
- `npm run typecheck --workspace @affiliate-ops/api`, API tests, Web tests,
  `npm run build --workspace @affiliate-ops/web`, and `npm run check` pass.
- No API or UI test depends on a live Cloudflare resource.

## Shared assumptions and conflict prevention

The endpoint payload is the only cross-session interface introduced by this
plan. Its required top-level fields are:

```text
schemaVersion: 1
workspaceId: string
generatedAt: ISO-8601 string
summary: { productsScanned: number, winnersFound: number,
           postsScheduled: number, sessionHealthPercent: number | null }
funnel: [{ stage: string, label: string, count: number }]
health: [{ id: string, label: string,
           status: "healthy" | "degraded" | "unavailable", detail: string }]
bestContent: [{ productId: string, productTitle: string, destination: string,
                clicks: number, orders: number, revenueMinor: number,
                conversionRatePercent: number | null }]
latestRun: { id: string, stage: string, status: string,
             timeline: [{ stage: string, status: string, detail: string }] } | null
```

Session 1 must persist only existing schema columns and deterministic pilot
values. Session 2 must return candidates/evidence without writing storage.
Session 3 must query the schema by column name and must treat missing records as
empty or unavailable, never as the old mock data. The Final Integrator owns any
shared type extraction or naming adjustment.

## File ownership matrix

| File or directory | Session 1 | Session 2 | Session 3 | Final Integrator |
| --- | --- | --- | --- | --- |
| `services/automation-runner/src/simulation/**` | Owns | Forbidden | Forbidden | Reviews/integrates |
| `services/automation-runner/test/simulation.test.ts` | Owns | Forbidden | Forbidden | Reviews |
| `services/automation-runner/src/connectors/shopee-discovery/**` | Forbidden | Owns | Forbidden | Reviews/integrates |
| `services/automation-runner/test/shopee-discovery.test.ts` | Forbidden | Owns | Forbidden | Reviews |
| `services/automation-runner/src/index.ts` | Forbidden | Forbidden | Forbidden | Owns |
| `services/automation-runner/src/connectors/index.ts` and `registry.ts` | Forbidden | Read-only | Forbidden | Owns |
| `apps/api/src/read-models.ts`, `src/index.ts`, `test/**` | Forbidden | Forbidden | Owns | Reviews/integrates |
| `apps/web/src/features/dashboard/**` | Forbidden | Forbidden | Owns | Reviews/integrates |
| `apps/web/src/shared/components/MetricStrip.tsx` and `shared/services/dashboard.ts` | Forbidden | Forbidden | Owns | Reviews/integrates |
| `packages/contracts/**` | Forbidden | Forbidden | Forbidden | Owns only if a shared type is needed |
| `packages/database/migrations/0001_initial.sql` | Forbidden | Forbidden | Forbidden | Forbidden |
| New numbered database migration | Only with evidence | Forbidden | Forbidden | Reviews |
| `apps/api/wrangler.jsonc`, root `wrangler.jsonc` | Forbidden | Forbidden | Forbidden | Owns, without inventing IDs |
| `README.md`, roadmap, architecture, data model, deployment, changelog | Forbidden | Forbidden | Forbidden | Owns after verification |
| `docs/parallel-work/parallel-plan.md` | Read-only | Read-only | Read-only | Owns after plan approval |
| Own session status file | Owns | Owns | Owns | Marks integrated |
| `docs/parallel-work/final-integration.lock` and final report | Forbidden | Forbidden | Forbidden until elected | Owns |

Normal sessions may create only their owned files and their own status file.
They must not edit generated files by hand, runtime data, secrets, `.env`
files, browser profiles, or screenshots. No new runtime dependency is expected;
any dependency request is an integration blocker, not an automatic install.

## Dependency and integration order

The code tracks can execute concurrently because Session 1 writes local SQLite,
Session 2 is an injected connector with no persistence, and Session 3 uses a
fake D1 boundary and existing column names. Logical integration is ordered:

1. verify all three status files and commits against the common base;
2. integrate Session 1's persisted product/evidence shape;
3. integrate Session 2's connector and expose it through the runner registry;
4. integrate Session 3's API queries and Web consumer against the merged rows;
5. add or extract shared contracts only if the merged interfaces prove that
   local types are insufficient;
6. update deployment binding documentation without inventing resource IDs;
7. run the full gate, update status/report documents, commit, and push.

If Session 3's query assumptions differ from Session 1's stored values, the
Final Integrator changes the query or producer at the owning boundary and adds
an integration test. Do not silently discard either implementation.

## Shared coordination protocol

Use separate worktrees. The primary checkout's absolute path is the shared
`COORDINATION_ROOT`; every task session receives it explicitly and writes only
its own status file there. Status files are coordination metadata, not a place
to edit another task's code. Each session:

1. records `IN_PROGRESS`, worktree, branch, base commit, and start time before
   changing code;
2. works only in its task worktree and commits its implementation;
3. runs focused tests, `npm run check`, and a clean-tree check;
4. records the commit, tests, deviations, known issues, and handoff notes in
   its own shared status file, then sets `COMPLETED`;
5. inspects all three status files and remote task branches before stopping.

The status files must be treated as authoritative even if a branch copy is
stale. If a task is still `NOT_STARTED`, `IN_PROGRESS`, or `BLOCKED`, the
finishing session stops normally and does not integrate.

## Final Integrator election and duties

After setting its own status to `COMPLETED`, a session checks whether the other
two statuses are `COMPLETED` or `INTEGRATED`. If not, it stops. If yes, it
atomically creates `docs/parallel-work/final-integration.lock` in the shared
coordination root with its session number, branch, commit, and UTC timestamp.
If the lock already exists, it is not the Final Integrator.

The lock owner re-reads all three status files after acquiring the lock. It
continues only when all three tasks are complete, creates
`codex/integration/m1-pilot-read-models` from its completed task branch, and merges
or cherry-picks the other two task commits without resetting or overwriting
work. It then:

- reviews every changed file and acceptance criterion;
- verifies Task 1's SQLite rows match Task 3's read-model queries;
- exposes Task 2 through the runner connector boundary while leaving the
  feature flag disabled;
- resolves API/Web payload and error-code differences;
- updates shared documentation and deployment binding notes;
- adds cross-task tests where the interfaces meet;
- runs `npm run check`, focused task tests, and any relevant dry-run build;
- writes `docs/parallel-work/final-integration-report.md` with base commit,
  session commits, files, conflicts, resolutions, checks, acceptance results,
  docs, limitations, final commit, and final Git status;
- marks all session statuses `INTEGRATED`, removes the temporary lock only
  after the report is committed, commits the integrated result, and pushes the
  integration branch.

## Known risks

- The README milestone is broader than the currently implemented pilot slice;
  the persistence task is completion/hardening, not a greenfield database.
- No D1 resource ID is committed. API tests must use a fake binding, and live
  deployment remains pending infrastructure configuration.
- The connector cannot be live-tested without an authenticated browser profile;
  the injected port and deterministic fake are the safe evidence available in
  this wave.
- Session 1 and Session 3 share database column assumptions. The integration
  test is mandatory before either task can be declared fully integrated.
- Office V2 Phase 2 work remains separately gated by its own acceptance record;
  these tasks must not import or activate it.
