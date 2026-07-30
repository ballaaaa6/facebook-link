# Office V2 Dependency Ledger

Observed versions are research snapshots from 2026-07-31. Adoption always pins
an exact version in the lockfile and records a decision.

| Candidate | Observed version | License | Status | Purpose and boundary |
| --- | --- | --- | --- | --- |
| PixiJS | 8.19.0 | MIT | Benchmark in Phase 4 | Presentation only; never owns simulation |
| Canvas 2D | browser platform | platform | Benchmark in Phase 4 | Zero-library renderer baseline |
| Ajv | 8.20.0 | MIT | Accepted for knowledge gates | Draft 2020-12 schema validation |
| ajv-formats | 3.0.1 | MIT | Accepted for knowledge gates | Date-time format validation for snapshots and provenance |
| fast-check | 4.9.0 | MIT | Candidate for Phase 2 | Seeded property and model tests |
| XState | 5.32.5 | MIT | Reference only | No dependency until reducer evidence fails |
| EasyStar.js | 0.4.4 | MIT | Reference only | A* comparison; first planner remains internal |
| Playwright | 1.62.1 | Apache-2.0 | Candidate for Phase 4 | Visual, interaction, and accessibility evidence |
| pixelmatch | 7.2.0 | ISC | Reference only | Use only if Playwright comparison is insufficient |
| Tiled | 1.12.2 | GPL-2.0-or-later application | Optional authoring tool | Converter boundary; no runtime dependency |
| Aseprite | current installed/approved tool | proprietary EULA/source available | Optional authoring tool | Source and deterministic export when licensed |

## Admission checklist

Record the exact version, integrity, license, maintenance activity, browser or
Node support, bundle/runtime cost, alternatives, decision owner, and removal
path. A research link or agent skill is not dependency approval.

## Agent skills

The official PixiJS skill collection may be installed only after PixiJS wins the
renderer decision. The repository skill at
`.agents/skills/build-office-v2-engine` owns project rules and remains the first
authority for any renderer-specific skill.
