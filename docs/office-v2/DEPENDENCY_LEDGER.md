# Office V2 Dependency Ledger

Observed versions are research snapshots from 2026-07-31. Adoption always pins
an exact version in the lockfile and records a decision.

| Candidate | Observed version | License | Status | Purpose and boundary |
| --- | --- | --- | --- | --- |
| PixiJS | 8.19.0 | MIT | **Development-only Phase 4 proof; not selected** | Presentation-only comparison candidate; exact package integrity `sha512-pq1O6emA/GFjjeF+8d3Pb5t7knD8FsnfWGqQcRjYjsqFZ7QdzG1XgjLDUu0DFJRbafjV5+g8iNLFBx0b9649lg==`; retained for reproducible audit evidence, absent from the production bundle, and never owns simulation |
| Canvas 2D | browser platform | platform | **Selected for synthetic Phase 4/T4 presentation** | Zero-library renderer baseline and current selected renderer; world and simulation truth remain external |
| Ajv | 8.20.0 | MIT | Accepted for knowledge gates | Draft 2020-12 schema validation |
| ajv-formats | 3.0.1 | MIT | Accepted for knowledge gates | Date-time format validation for snapshots and provenance |
| fast-check | 4.9.0 | MIT | **Admitted for Phase 4 property/model evidence** | Exact integrity `sha512-7ms6T7SybUev/PQITciI0yLM2pOSFy5zpG8Ty7tQofcVaQUvrMXp6CBwqF6fThLCLOrfBtuHAtwq6Yu4XPCllg==`; Node `>=12.17.0` (repository Node `>=24`), 1.43 MB unpacked test-only cost, no browser bundle; Main-owned seeded QA only |
| XState | 5.32.5 | MIT | Reference only | No dependency until reducer evidence fails |
| EasyStar.js | 0.4.4 | MIT | Reference only | A* comparison; first planner remains internal |
| Playwright | 1.62.1 | Apache-2.0 | **Admitted for Phase 4 evidence** | Exact package integrity `sha512-0M+L3LAD8/nm554LOla9Ayx0j0tmFZ0FBcoQ7F1VuVHpM/XpiC8RcDzBQB8W5+hA8L22THxELzeF+2WcUzvcLg==`; browser-only evidence runner, not shipped to production |
| pixelmatch | 7.2.0 | ISC | Reference only | Use only if Playwright comparison is insufficient |
| Tiled | 1.12.2 | GPL-2.0-or-later application | Optional authoring tool | Converter boundary; no runtime dependency |
| Aseprite | current installed/approved tool | proprietary EULA/source available | Optional authoring tool | Source and deterministic export when licensed |

## Admission checklist

Record the exact version, integrity, license, maintenance activity, browser or
Node support, bundle/runtime cost, alternatives, decision owner, and removal
path. A research link or agent skill is not dependency approval.

The `fast-check` profile is now executable for the Phase 4 QA slice. The exact
package was inspected on 2026-08-03: MIT license, repository
`github.com/dubzzz/fast-check`, latest package metadata modified 2026-07-08,
Node `>=12.17.0`, and 1.43 MB unpacked test-time cost. The evaluated
alternative was a handwritten seeded generator; it remains useful for the
independent model implementation, but cannot replace the pinned profile's
shrink-path evidence. Main owns the admission and QA runs. If the Phase 4
renderer decision is reverted or the property harness is retired, remove the
root dev dependency, lockfile entry, and Phase 4 property scripts together;
no production bundle imports it.

## Agent skills

The official PixiJS skill collection may be installed only after PixiJS wins the
renderer decision. The repository skill at
`.agents/skills/build-office-v2-engine` owns project rules and remains the first
authority for any renderer-specific skill.

Phase 4 admission record (2026-08-03): the exact PixiJS, Playwright, and
fast-check package versions above were installed only to execute the frozen
renderer comparison, browser evidence, and seeded property/model evidence.
Decision 0016 records Canvas 2D as the selected renderer. PixiJS remains only
as development-lab proof for auditability and is absent from the production
bundle; Playwright and fast-check remain test/evidence dependencies and are
not shipped. A future cleanup may remove the losing proof candidate and its
dev-only dependency together without changing the accepted Canvas decision.
