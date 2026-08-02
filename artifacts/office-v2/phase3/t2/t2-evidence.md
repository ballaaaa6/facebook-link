# Phase 3 T2 integrated one-actor evidence

Scenario count: 9

All scenarios use the reducer-owned integrated runtime, real command pipeline, activity, queue, lifecycle, canonical hashing, and replay/restore APIs.

| Scenario | Checkpoint | Uninterrupted hash | Restored hash | Replay equal | Cleanup |
| --- | --- | --- | --- | --- | --- |
| t2-one-actor-success-mid-route | mid-route @ tick 2 | b4405e657b1cd4dedd0107982b8d4942aca7e5b56c858067902a224b3d372d4a | b4405e657b1cd4dedd0107982b8d4942aca7e5b56c858067902a224b3d372d4a | yes | no active queue, reservation, activity, or prop leaks |
| t2-one-actor-queue-mid-queue | mid-queue @ tick 3 | 82990fae8c94badee6e94020db3074797a4325ccf8f7d614f3a6906ac17e8b82 | 82990fae8c94badee6e94020db3074797a4325ccf8f7d614f3a6906ac17e8b82 | yes | no active queue, reservation, activity, or prop leaks |
| t2-one-actor-interaction-mid-interaction | mid-interaction @ tick 5 | 7b49d487ffc43af429223d23dbb2824542f0f3087e7e33189d064ce66199830f | 7b49d487ffc43af429223d23dbb2824542f0f3087e7e33189d064ce66199830f | yes | no active queue, reservation, activity, or prop leaks |
| t2-one-actor-held-prop | held-prop/resource @ tick 5 | ae654ff62bf3c8052b9c7d1d54762d0c7616f5a10ebbfd901ce96b3dcdeeb928 | ae654ff62bf3c8052b9c7d1d54762d0c7616f5a10ebbfd901ce96b3dcdeeb928 | yes | no active queue, reservation, activity, or prop leaks |
| t2-one-actor-cancel | mid-route @ tick 2 | d4d54a0ddbd7fe742481677d2b260f5e3756e952b6a2b5ed146da4079bac7097 | d4d54a0ddbd7fe742481677d2b260f5e3756e952b6a2b5ed146da4079bac7097 | yes | no active queue, reservation, activity, or prop leaks |
| t2-one-actor-timeout | mid-route @ tick 1 | 58305b5b2e2656dc19517fd7c36db27dda2c953c6cdd0fc9de98cb5c3926be59 | 58305b5b2e2656dc19517fd7c36db27dda2c953c6cdd0fc9de98cb5c3926be59 | yes | no active queue, reservation, activity, or prop leaks |
| t2-one-actor-unreachable | terminal-cleanup @ tick 1 | 5d61bfc92d9c5d287cf404e087fdf7f5a265e74a0ac51c7c66f040ac6bd482f8 | 5d61bfc92d9c5d287cf404e087fdf7f5a265e74a0ac51c7c66f040ac6bd482f8 | yes | no active queue, reservation, activity, or prop leaks |
| t2-one-actor-target-removed | mid-route @ tick 1 | 9f7d75333ae1da082f2b1110a266538fcd2968885b8a402287b74a976077f3af | 9f7d75333ae1da082f2b1110a266538fcd2968885b8a402287b74a976077f3af | yes | no active queue, reservation, activity, or prop leaks |
| t2-one-actor-target-unavailable | terminal-cleanup @ tick 1 | 9c5be3cd359debfc463d7ff6e2e6eede98fd4c712e63ad432d6a48f36c22217a | 9c5be3cd359debfc463d7ff6e2e6eede98fd4c712e63ad432d6a48f36c22217a | yes | no active queue, reservation, activity, or prop leaks |

The uninterrupted and restored final states, event sequences, and SHA-256 hashes are identical for every scenario.
