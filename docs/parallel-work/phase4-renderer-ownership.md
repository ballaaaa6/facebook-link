# Phase 4 Renderer Ownership — First Wave

Planning base: recorded after the Phase 4 planning artifacts are committed.

| Worker | Task | Owned implementation files | Forbidden boundary |
| --- | --- | --- | --- |
| 1 | `P4-W5.1` Immutable presentation snapshot, camera, and semantic picking | `apps/web/src/features/office-v2/renderer/presentation-snapshot.ts`; `apps/web/src/features/office-v2/renderer/camera.ts`; `apps/web/src/features/office-v2/renderer/semantic-picking.ts`; `apps/web/test/renderer-presentation.test.ts`; `docs/parallel-work/phase4-session-1-status.md` | Port lifecycle, candidate renderers, package manifests/lockfiles, schemas/generated files, simulation/world/operations producers, assets, backlog/final report |
| 2 | `P4-W5.2` Shared renderer port lifecycle and resource handles | `apps/web/src/features/office-v2/renderer/renderer-port.ts`; `apps/web/src/features/office-v2/renderer/lifecycle.ts`; `apps/web/test/renderer-port.test.ts`; `docs/parallel-work/phase4-session-2-status.md` | Snapshot/camera/picking files, candidate renderers, package manifests/lockfiles, schemas/generated files, simulation/world/operations producers, assets, backlog/final report |
| 3 | `P4-W5.3` Canvas 2D candidate | `apps/web/src/features/office-v2/renderer/canvas-renderer.ts`; `apps/web/test/canvas-renderer.test.ts`; `docs/parallel-work/phase4-session-3-status.md` | Pixi candidate, shared scene/camera/port files, package manifests/lockfiles, page composition, benchmark/QA/final reports, schemas/generated files, simulation/world/operations producers, assets |
| 4 | `P4-W5.4` PixiJS 8.19.0 candidate | `apps/web/src/features/office-v2/renderer/pixi-renderer.ts`; `apps/web/test/pixi-renderer.test.ts`; `docs/parallel-work/phase4-session-4-status.md` | Canvas candidate, shared scene/camera/port files, package manifests/lockfiles, page composition, benchmark/QA/final reports, schemas/generated files, simulation/world/operations producers, assets |

Main-owned shared files:

- `packages/office-v2-contracts/src/index.ts` public generated-type exports;
- workspace manifests/lockfile and dependency ledger;
- renderer directory barrel and Web composition page;
- shared synthetic scene and candidate adapter acceptance fixtures;
- all planning/backlog/status summary/final report files except each worker’s
  own status file;
- superseding renderer decision, benchmark winner, loser removal, integration,
  final validation, branch publication, and Phase closure.

No worker may edit another worker’s owned file, cherry-pick another worker’s
branch, integrate, push the integration branch, or start a downstream task.

## First-wave execution record

Main dispatched the two READY leaves in isolated worktrees from the frozen
planning base. The initial sessions were Curie (`019fc52a-65b6-7bb0-8da3-a83e6af43b71`)
for W5.1 and Copernicus (`019fc52a-6687-7031-b8e2-fc41a23eae37`) for W5.2.
Neither session produced a file change or handoff within the bounded wait
window. Main then made one replacement attempt per leaf: Sartre
(`019fc52e-e3a3-7c62-8ecf-e41e57d63a14`) and Carson
(`019fc52e-e423-74f3-9c0e-10f647ebf0ef`). Those sessions also remained
unchanged and were closed. Their clean worktrees and branches are preserved
for audit; no worker commit was accepted or cherry-picked.

Main recovered the exact two owned scopes on the integration branch and
committed `8ab0cf5` (`feat(office-v2): recover Phase 4 renderer boundary`).
The recovery is recorded in both first-wave status files. W5.1 and W5.2 are
now integrated and the next READY frontier is W5.3 Canvas and W5.4 PixiJS
8.19.0. No downstream task was started by a worker.

The candidate wave was then dispatched from `efb0c68` to Leibniz
(`019fc53b-eb97-7823-a35e-fa36dcb2c806`) for W5.3 and Ampere
(`019fc53b-ec1c-72f2-a339-4d150b934205`) for W5.4. After two bounded waits
and a progress request, both worktrees remained unchanged and both sessions
were closed. Main recovered the exact candidate scopes and committed
`ac9d883` (`feat(office-v2): add Phase 4 renderer candidates`). Candidate
status files record the recovery and its limitations. W5.5 benchmark/report
and W5.6 semantic/QA lab are now the next READY leaves; neither has started.
