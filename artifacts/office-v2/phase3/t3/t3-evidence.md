# Phase 3 T3 integrated crowd evidence

All three required reducer-backed crowd scenarios execute with exactly 1, 10, and 15 actors. The 15-actor scenario is synthetic geometric capacity evidence; it does not claim live adapter employees.

| Scenario | Actors | Synthetic capacity | Checkpoints | Uninterrupted SHA-256 | Restored SHA-256 | Equality | Cleanup |
| --- | ---: | --- | --- | --- | --- | --- | --- |
| p3-t3-one-actor-baseline | 1 | no | approaching-narrow-door@2, mid-interaction@5 | af320b87ac7a6d731f46f9558ab7a008d8fdc42c1f6fdfc5baa1e13095b678ee | af320b87ac7a6d731f46f9558ab7a008d8fdc42c1f6fdfc5baa1e13095b678ee | yes | no queue, reservation, resource, approach, waiting-cell, held-prop, lease, target, or actor leaks |
| p3-t3-ten-actor-contention | 10 | no | approaching-narrow-door@2, shared-queue@6, deadlock-recovery@6, mid-interaction@9, target-removal@10 | 9b8a1ff424b307e5cb97750187a43e88826323a1c687cacf90348faf3059a308 | 9b8a1ff424b307e5cb97750187a43e88826323a1c687cacf90348faf3059a308 | yes | no queue, reservation, resource, approach, waiting-cell, held-prop, lease, target, or actor leaks |
| p3-t3-fifteen-actor-geometric-capacity | 15 | yes | approaching-narrow-door@2, shared-queue@6, deadlock-recovery@6, mid-interaction@9, target-removal@10 | 57ee9af17cf19046ee60d7cb22d4e1d09896d3cb5e012222d758b2287a24af67 | 57ee9af17cf19046ee60d7cb22d4e1d09896d3cb5e012222d758b2287a24af67 | yes | no queue, reservation, resource, approach, waiting-cell, held-prop, lease, target, or actor leaks |

Contention covers the shared review facility and socket, the narrow doorway resource, limited held-prop ownership, target removal while moving/waiting/using, cancellation and timeout under contention, queue fairness, atomic reservation, deterministic deadlock yield/block resolution, and recovery to bounded terminal state.

Adapter boundary: the accepted integrated reducer advances activity phase independently of its queue ticket. The crowd adapter drives the existing queues.ts contention ledger after every advanceIntegratedTick and includes that ledger in canonical hashing and replay/restore.

Every checkpoint restores from a completed real reducer tick through `restoreReplay`; restored event suffixes, canonical final states, and SHA-256 hashes equal the uninterrupted run.
