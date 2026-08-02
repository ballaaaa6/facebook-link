# Phase 3 Wave `P3-W2-01` Frozen Interfaces

This file freezes the shared contracts used by the command-pipeline worker. It
is a coordination reference, not a new contract owner.

## Existing contract versions

- `office-simulation-command-v2`
- `office-simulation-result-v2`
- `office-simulation-event-v2`
- `office-simulation-snapshot-v2`
- `office-simulation-trace-v2`
- `office-v2:world-kernel` hash-domain conventions
- Decision 0005 pure reducer at 10 logical ticks per second

Workers must preserve the existing schemas, generated types, and diagnostic
ownership. No schema version, generated file, or package manifest change is
authorized by this wave.

## Command ordering

Eligible commands are ordered by the frozen total key:

```text
scheduledTick -> sourceRank -> sourceSequence -> commandId
```

The final `commandId` comparison is UTF-16 code-unit order, not locale order.
Commands scheduled before the current tick reject with
`simulation.command-scheduled-in-past`.

## Required pipeline behavior

The worker-owned module must expose a pure, serializable pipeline boundary that
can ingest commands and advance logical ticks. It must:

1. validate command envelope ownership and required identifiers;
2. reject scheduled-past commands before mutation;
3. order same-tick commands deterministically;
4. return an idempotent duplicate for an already accepted command whose command
   version and payload digest match;
5. reject a duplicate command ID with a different version or digest using
   `simulation.command-id-conflict`;
6. reject a stale `expectedWorldRevision` without partial mutation;
7. apply only the command facts in scope for W2.1, leaving facility selection,
   routing, queues, interactions, and replay hashing to later tasks;
8. emit schema-shaped result/event facts with deterministic IDs and sequence;
9. advance only through explicit logical ticks, never wall-clock or display
   frames.

The worker may choose internal type names, but the state and return values must
remain plain serializable data and be suitable for Main to re-export from the
simulation package. A command result is not replay evidence; this wave does
not generate or verify state hashes.

## Boundary rules

- World geometry and placement remain owned by `@affiliate-ops/office-v2-world`.
- Simulation owns command validation/apply, command ledgers, results, events,
  and logical tick state.
- Presentation and operations are never imported or mutated.
- External command payload digests are accepted as contract inputs; implementing
  the W2.2 normalization/PRNG/hash projection is out of scope.
- Main may add the package barrel export and repository-level test wiring only
  after the worker commit passes review.
