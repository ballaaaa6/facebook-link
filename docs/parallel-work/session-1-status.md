# Session 1 Status — `P3-W3.3`

- Task: Fan-out/join and failure choreography
- Phase: Phase 3 — Headless operational vertical slice
- Wave: `P3-W3-03`
- Status: **PLANNED — awaiting worker launch**
- Worker branch: `task/session-1-p3-w3-03-choreography`
- Worker worktree: `C:\Users\WINDOW XI\.codex\worktrees\phase3-p3-w3-03-choreography`
- Original base commit: `799248b6a7612ca5c45ae06f94a86b4203765ed8`
- Planning/base commit: `6072a118d5b051756c30b7b5f839d43fc1a3fa11`
- Worker session ID: to be recorded after dispatch
- Implementation commit: pending

## Owned files

- `packages/office-v2-operations/src/choreography.ts`
- `packages/office-v2-operations/test/choreography.test.ts`
- `packages/office-v2-operations/test/fixtures/p3-w3-3-choreography.json`
- this status file

## Validation

Pending worker execution:

- `node .agents/skills/build-office-v2-engine/scripts/preflight.mjs`
- `npm run --workspace @affiliate-ops/office-v2-operations typecheck`
- `npm run --workspace @affiliate-ops/office-v2-operations test`
- `git diff --check`

## Acceptance checklist

- [ ] semantic Snapshot V2 projection preserves operational truth and failure
      visibility;
- [ ] copy/visual fan-out and join are order-independent and join once;
- [ ] duplicate, conflict, stale, retry, late, and reconnect paths are safe;
- [ ] failure/recovery intents are deterministic and presentation-only;
- [ ] inputs remain unchanged and no external action executes;
- [ ] no forbidden file changes or generated-contract edits;
- [ ] handoff names the worker commit and known limitations.

No visual test is expected; this is a headless operations boundary.
