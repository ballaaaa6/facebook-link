# Worker Session 1 Task Specification

- Session: 1
- Task ID: `P3-W2.2`
- Task name: Simulation normalization, PRNG, and real state hashes
- Parent Phase: Phase 3 — Headless operational vertical slice
- Wave ID: `P3-W2-02`
- Worker branch: `task/session-1-p3-w2-normalization-hash`
- Worker worktree: `C:\Users\WINDOW XI\.codex\worktrees\phase3-w2-normalization-hash`
- Original base commit: `925439a5f6f29580d82767e2177433a35195bc71`
- Planning commit: recorded by Main before launch and supplied in the worker bootstrap
- Status file: `docs/parallel-work/session-1-status.md`

## Objective

Implement the simulation-owned normalization, named PRNG stream, hashable-state
projection, and reducer-ready real state-hash boundary. This is one leaf task
inside Phase 3; it is not the replay runner, migration registry, or entire T2.

## Repository evidence and current behavior

- `packages/office-v2-contracts/src/canonical-json.ts` already rejects duplicate
  keys, malformed UTF-8, lone surrogates, unsafe numbers, and non-JSON values,
  and provides `normalizeDeclaredCollections`.
- `packages/office-v2-contracts/src/canonical-hash.ts` already provides the
  accepted SHA-256 envelope and `canonicalHashHex`.
- `packages/office-v2-simulation/src/command-pipeline.ts` provides the first
  pure fixed-tick command ledger and accepted intent facts.
- Snapshot/trace fixtures still contain placeholder hashes and reducer/replay
  evidence remains zero; no simulation state-hash module exists.

## Required final behavior

1. Provide a pure serializable API in `src/state-hash.ts` that accepts a
   hashable simulation state and returns a normalized projection, canonical
   bytes or equivalent canonical input, and a 64-character SHA-256 digest.
2. Reuse the shared canonical utilities. Do not duplicate canonical JSON,
   UTF-16 ordering, or SHA-256 implementation.
3. Declare and test the exact unordered collections (for example ledger-like
   records keyed by stable IDs) while preserving every declared ordered array.
4. Include a named deterministic PRNG implementation/stream state with a
   versioned algorithm and independent stream derivation. Gameplay draws must
   not consume presentation draws.
5. Use domain `office-v2:simulation` and projection version
   `office-simulation-state-v2`; changing either changes the hash.
6. Exclude presentation-only fields from the hash projection and reject or
   fail closed on invalid hashable JSON input.
7. Add focused tests for shuffled unordered input, preserved ordered arrays,
   Unicode spelling, negative-zero normalization, domain/version changes,
   stream independence, deterministic repeated hashes, and first-field
   divergence.

## In scope

- `packages/office-v2-simulation/src/state-hash.ts`
- `packages/office-v2-simulation/test/state-hash.test.ts`
- A small serializable state/hash/PRNG API in those owned files.

## Out of scope

Replay runner, snapshot migration, command-pipeline edits, public exports,
package manifests, generated contracts, schemas, fixtures, renderer state,
operations state, external actions, new dependencies, and changes to the
shared canonical utility.

## Read-only references and frozen interfaces

Read `interfaces.md`, `SIMULATION_TIME_RANDOMNESS_REPLAY.md`,
`SAVE_SNAPSHOT_MIGRATION.md`, Decision 0011, Decision 0005, the snapshot and
trace generated contracts, canonical JSON/hash utilities, and the W2.1
command-pipeline module. Preserve `office-v2:world-kernel` conventions and all
existing schema versions.

## Validation and acceptance

Run:

- `node --test packages/office-v2-simulation/test/state-hash.test.ts`
- `npm run typecheck --workspace @affiliate-ops/office-v2-simulation`
- `node .agents/skills/build-office-v2-engine/scripts/preflight.mjs`
- `git diff --check`
- `npm run check` when the worktree is dependency-ready

The worker changed only the two implementation/test files and its own status
file. The status file must record the implementation commit, exact files,
commands/results, known limitations, and this handoff statement: “The Main
Orchestration Session must review and integrate this commit.” Commit the task
and stop immediately after handoff; do not integrate or publish.
