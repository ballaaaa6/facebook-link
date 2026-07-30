# Office V2 Assets

This root is reserved for clean-room Office Engine V2 assets. It contains no
runtime art yet.

Create these directories only when the first family reaches its stage:

- `manifests/<family>/<version>.json`: approved versioned admission manifests;
- `runtime/<family>/v<version>/*.png`: deterministic PNG outputs declared by a
  manifest;
- `sources/<family>/v<version>/`: immutable project-owned or licensed sources
  when their format is safe to commit;
- `recipes/<family>/v<version>/`: deterministic extraction instructions or
  scripts whose hashes are declared by the manifest;
- `reports/<family>/v<version>/`: generated validation and contact-sheet
  evidence.

Never copy pixels from `assets/references/`, `legacy/`, another branch, or Git
history. Follow `docs/office-v2/ASSET_PIPELINE_PROVENANCE_VALIDATION.md` and run
`npm run office:v2:assets:check` before a runtime import.
