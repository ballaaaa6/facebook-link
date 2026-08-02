# Office V2 Phase 3 exit gate

- Status: PASSED
- Git HEAD: 4925edf33f8312e84eb0f69e335256da095d421c
- Generated-at policy: omitted; deterministic for a checked-out git HEAD and deterministic evidence

## Evidence

| Area | Path | SHA-256 | Present |
| --- | --- | --- | --- |
| evidence | artifacts/office-v2/phase3/t2/executed-scenarios.json | 2a014947d2b06e3d4f5bba6b46a15dcb71571eb182c2719ae6a25c2c5eff805d | yes |
| evidence | artifacts/office-v2/phase3/t2/t2-evidence.json | 823031dc00d7ad32d12cf62ec0f6a64bacb2d1fd09c42da008591d524be53d2a | yes |
| evidence | artifacts/office-v2/phase3/t2/t2-evidence.md | 8b9d06dc853c4b8fce9a963419404172098de6a92fcb3f0835a416a946c53231 | yes |
| evidence | artifacts/office-v2/phase3/t3/executed-scenarios.json | 70e5e26763b840b94f9be7fbf83e78877d007b92cbc34778ddd6412cad8cfe00 | yes |
| evidence | artifacts/office-v2/phase3/t3/t3-evidence.json | 7a40dc167e62fc08c8d72411cb8ae329d51c2bb13169026f57ed8726d984041f | yes |
| evidence | artifacts/office-v2/phase3/t3/t3-evidence.md | 4000472c47435f44465e78e3f270f0ea3a8998d5e78ea4cda0f7841a2d7b34ab | yes |
| evidence | artifacts/office-v2/phase3/operations/operations-runner-trace.json | 6246f53d9edfd3e089f5e202f855724463c06f9e2e2d1fc9d7dfaa6dc82b81b9 | yes |
| evidence | artifacts/office-v2/phase3/operations/operations-trace.json | b4cff947d02007fe722a414455538b32bffafbe2c25843e1d904de67944c8d19 | yes |
| evidence | artifacts/office-v2/phase3/operations/operations-trace.md | 3a621b7b94d2c09cf36dc6174aa23558503ffe4ba1fec6ac60fdb507364bc834 | yes |

## Validation

- Before commands: passed
- After commands: passed

## Commands

| Check | Command | Result | Exit code |
| --- | --- | --- | ---: |
| gate-unit-tests | `node --test scripts/office-v2-phase3-exit.test.mjs` | passed | 0 |
| t2-t3-simulation-tests | `npm.cmd run test --workspace @affiliate-ops/office-v2-simulation` | passed | 0 |
| operations-tests | `npm.cmd run test --workspace @affiliate-ops/office-v2-operations` | passed | 0 |
| runner-tests | `npm.cmd run test --workspace @affiliate-ops/automation-runner` | passed | 0 |
| simulation-typecheck | `npm.cmd run typecheck --workspace @affiliate-ops/office-v2-simulation` | passed | 0 |
| operations-typecheck | `npm.cmd run typecheck --workspace @affiliate-ops/office-v2-operations` | passed | 0 |
| runner-typecheck | `npm.cmd run typecheck --workspace @affiliate-ops/automation-runner` | passed | 0 |
| workflows-typecheck | `npm.cmd run typecheck --workspace @affiliate-ops/workflows` | passed | 0 |
| office-v2-clean-room | `npm.cmd run office:v2:clean-room:check` | passed | 0 |
| office-v2-boundaries | `npm.cmd run office:v2:boundaries:check` | passed | 0 |
| office-v2-contradictions | `npm.cmd run office:v2:contradictions:check` | passed | 0 |
| office-v2-knowledge | `npm.cmd run office:v2:knowledge:check` | passed | 0 |
| office-v2-assets | `npm.cmd run office:v2:assets:check` | passed | 0 |
| architecture | `npm.cmd run architecture:check` | passed | 0 |
| full-repository-check | `npm.cmd run check` | passed | 0 |

The gate is closed unless both evidence validations and every listed command pass.
