---
name: build-office-v2-engine
description: Build, review, or plan the clean-room Office Engine V2 in this repository. Use for Office V2 world, projection, rendering, maps, placement, simulation, navigation, interactions, characters, furniture, operations UI, asset production, runtime asset admission, or acceptance work.
---

# Build Office V2 Engine

Treat `docs/office-v2/` as executable engineering knowledge, not optional background reading. Keep all Office V2 work inside the boundaries approved by the repository `AGENTS.md`.

## Start every task

1. Read the repository `AGENTS.md`.
2. Read `docs/office-v2/README.md`, `FOUNDATIONS.md`,
   `KNOWLEDGE_COMPLETENESS_AUDIT.md`, and `READINESS_MATRIX.md`.
3. Run `node .agents/skills/build-office-v2-engine/scripts/preflight.mjs` from the repository root.
4. Open [references/routing.md](references/routing.md) and read every document listed for the task category.
5. Identify the owning layer: world, simulation, projection, presentation, operations adapter, or asset pipeline.

Stop if preflight fails. Repair the knowledge pack or report its diagnostic before implementing engine behavior.

## Preserve the clean-room boundary

- Do not inspect or copy V1 Office renderer code, maps, registries, coordinates, tests, visual pixels, other branches, or Git history.
- Do not import from `legacy/`, `assets/references/`, or retired Office paths.
- Do not invent missing runtime assets or silently substitute placeholders. Missing or unapproved material must fail its gate.
- Keep headless engine code inside the four roots approved by Decision 0007 and
  presentation composition inside `apps/web/src/features/office-v2/`. Do not
  add a package root or reverse consumer edge without a superseding decision
  and boundary tests.

## Implement contract first

1. Update the owning decision record when a locked choice changes.
2. Update the canonical schema before changing producers or consumers.
3. Add or update a deterministic fixture that proves the behavior.
4. Implement pure domain behavior before renderer or UI integration.
5. Keep simulation state independent from sprite state and operations snapshots independent from engine state.
6. Validate failure behavior as well as the successful path.

Use the fixed `office-projection-v1`, 10 Hz logical simulation, four-way deterministic navigation, canonical Office JSON world format, and shared `world` depth band unless an accepted decision record explicitly replaces them.

## Admit visual assets

1. Start from `docs/office-v2/templates/asset-family-brief.md`.
2. Produce one versioned family end to end.
3. Record source provenance and a deterministic extraction recipe.
4. Fill `docs/office-v2/templates/asset-family-manifest.json`.
5. Put manifests under `assets/office-v2/manifests/` and PNG outputs under `assets/office-v2/runtime/`.
6. Obtain geometry, visual, and commercial approval.
7. Run `npm run office:v2:assets:check` before any runtime import.

## Finish every change

Run these gates from the repository root:

```text
npm run office:v2:contradictions:check
npm run office:v2:contradictions:test
npm run office:v2:knowledge:check
npm run office:v2:boundaries:check
npm run office:v2:boundaries:test
npm run office:v2:assets:check
npm run office:v2:clean-room:check
npm run check
```

Report which fixture demonstrates the behavior, which schema owns the contract, and what was not visually tested. Commit and push only after the required gates pass, following `AGENTS.md`.
