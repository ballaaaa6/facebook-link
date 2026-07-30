# Asset Directory

The current `main` branch contains no production Office Engine visual assets.

## Current layout

- `references/`: non-runtime evidence and visual references only
- `AGENTS.md`: asset handling and provenance rules

Future production assets must be introduced through the Office V2 source,
provenance, extraction, geometry, review, and validation gates. They must not be
copied from `references/`, `legacy/`, another branch, or Git history.

Every reference collection needs its own README and manifest. Every future
runtime collection needs an owning versioned manifest and validation report.
