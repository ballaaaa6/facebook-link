# Office V2 Phase 3 exit gate

- Status: PASSED
- Git HEAD: 8acd2af6ff524eaf2d7b02e5c4bd97d9a03c98af
- Generated-at policy: omitted; deterministic for a checked-out git HEAD and deterministic evidence

## Evidence

| Area | Path | SHA-256 | Present |
| --- | --- | --- | --- |
| evidence | artifacts/office-v2/phase3/t2/executed-scenarios.json | 2a014947d2b06e3d4f5bba6b46a15dcb71571eb182c2719ae6a25c2c5eff805d | yes |
| evidence | artifacts/office-v2/phase3/t2/t2-evidence.json | 76c76e4657ece0f5f40c18cde3006045fb64c5ba3fcc67221da969bf13945438 | yes |
| evidence | artifacts/office-v2/phase3/t2/t2-evidence.md | 8b9d06dc853c4b8fce9a963419404172098de6a92fcb3f0835a416a946c53231 | yes |
| evidence | artifacts/office-v2/phase3/t3/executed-scenarios.json | 70e5e26763b840b94f9be7fbf83e78877d007b92cbc34778ddd6412cad8cfe00 | yes |
| evidence | artifacts/office-v2/phase3/t3/t3-evidence.json | 43ee849a207f7f9ea723d8167155ee09774c03002687abec3a625c6778e57649 | yes |
| evidence | artifacts/office-v2/phase3/t3/t3-evidence.md | 344c2263ead558f0b65779489ae8d17ec1063e5b6cbaf4bf0c4b915abd7aa337 | yes |
| evidence | artifacts/office-v2/phase3/operations/operations-runner-trace.json | 38bacc50cff1272ff71d3e4f767fabfa54126cba25e121213eb13c1460644cce | yes |
| evidence | artifacts/office-v2/phase3/operations/operations-trace.json | 3e26ed01cca9689fbe2c6ae59180907ff34f1cfc43d4f2f25a9498bcac4ddada | yes |
| evidence | artifacts/office-v2/phase3/operations/operations-trace.md | eca9136f15e97a5851f3d24ec7af515061923e2fa1b75e443134631bc68f75ef | yes |

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
