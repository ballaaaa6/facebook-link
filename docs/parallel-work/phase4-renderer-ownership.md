# Phase 4 Renderer Ownership — First Wave

Planning base: recorded after the Phase 4 planning artifacts are committed.

| Worker | Task | Owned implementation files | Forbidden boundary |
| --- | --- | --- | --- |
| 1 | `P4-W5.1` Immutable presentation snapshot, camera, and semantic picking | `apps/web/src/features/office-v2/renderer/presentation-snapshot.ts`; `apps/web/src/features/office-v2/renderer/camera.ts`; `apps/web/src/features/office-v2/renderer/semantic-picking.ts`; `apps/web/test/renderer-presentation.test.ts`; `docs/parallel-work/phase4-session-1-status.md` | Port lifecycle, candidate renderers, package manifests/lockfiles, schemas/generated files, simulation/world/operations producers, assets, backlog/final report |
| 2 | `P4-W5.2` Shared renderer port lifecycle and resource handles | `apps/web/src/features/office-v2/renderer/renderer-port.ts`; `apps/web/src/features/office-v2/renderer/lifecycle.ts`; `apps/web/test/renderer-port.test.ts`; `docs/parallel-work/phase4-session-2-status.md` | Snapshot/camera/picking files, candidate renderers, package manifests/lockfiles, schemas/generated files, simulation/world/operations producers, assets, backlog/final report |

Main-owned shared files:

- `packages/office-v2-contracts/src/index.ts` public generated-type exports;
- workspace manifests/lockfile and dependency ledger;
- renderer directory barrel and Web composition page;
- all planning/backlog/status summary/final report files except each worker’s
  own status file;
- superseding renderer decision, benchmark winner, loser removal, integration,
  final validation, branch publication, and Phase closure.

No worker may edit another worker’s owned file, cherry-pick another worker’s
branch, integrate, push the integration branch, or start a downstream task.
