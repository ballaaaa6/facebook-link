# Phase 3 T3 integrated crowd evidence

All three required reducer-backed crowd scenarios execute with exactly 1, 10, and 15 actors. The 15-actor scenario is synthetic geometric capacity evidence; it does not claim live adapter employees.

| Scenario | Actors | Synthetic capacity | Checkpoints | Uninterrupted SHA-256 | Restored SHA-256 | Equality | Cleanup |
| --- | ---: | --- | --- | --- | --- | --- | --- |
| p3-t3-one-actor-baseline | 1 | no | approaching-narrow-door@2, mid-interaction@5 | e7d209d3a78e16f59ed9e01be1bdbbe373da5d636bfde3e24deb9018b74a6767 | e7d209d3a78e16f59ed9e01be1bdbbe373da5d636bfde3e24deb9018b74a6767 | yes | no queue, reservation, resource, approach, waiting-cell, held-prop, lease, target, or actor leaks |
| p3-t3-ten-actor-contention | 10 | no | approaching-narrow-door@2, shared-queue@6, deadlock-recovery@6, mid-interaction@9, target-removal@10 | 3d63edeac433ea013f5ae6b9c925fcb7fd9f9e403a69e8741d6ba8ba0ae67f58 | 3d63edeac433ea013f5ae6b9c925fcb7fd9f9e403a69e8741d6ba8ba0ae67f58 | yes | no queue, reservation, resource, approach, waiting-cell, held-prop, lease, target, or actor leaks |
| p3-t3-fifteen-actor-geometric-capacity | 15 | yes | approaching-narrow-door@2, shared-queue@6, deadlock-recovery@6, mid-interaction@9, target-removal@10 | f21580e0c256579ffb9a0dcd1d5e04615d28e6acc0fe313e013164bdc349ebf5 | f21580e0c256579ffb9a0dcd1d5e04615d28e6acc0fe313e013164bdc349ebf5 | yes | no queue, reservation, resource, approach, waiting-cell, held-prop, lease, target, or actor leaks |

Contention covers the shared review facility and socket, the narrow doorway resource, limited held-prop ownership, target removal while moving/waiting/using, cancellation and timeout under contention, queue fairness, atomic reservation, deterministic deadlock yield/block resolution, and recovery to bounded terminal state.

Adapter boundary: the accepted integrated reducer advances activity phase independently of its queue ticket. The crowd adapter drives the existing queues.ts contention ledger after every advanceIntegratedTick and includes that ledger in canonical hashing and replay/restore.

Every checkpoint restores from a completed real reducer tick through `restoreReplay`; restored event suffixes, canonical final states, and SHA-256 hashes equal the uninterrupted run.
