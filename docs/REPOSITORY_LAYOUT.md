# Repository Layout and File Status

This document defines where files belong and whether they are current source,
reference material, archived code, local runtime state, or generated output.

## Status categories

### Current source

Committed files used by the current product belong in these roots:

- `apps/`: deployable web, API, and Discord applications;
- `services/`: long-running automation processes;
- `packages/`: shared contracts and domain implementations;
- `config/`: safe committed configuration and schemas;
- `prompts/`: versioned prompt product artifacts;
- `infrastructure/`: deployment examples and runbooks;
- `scripts/`: repository validation and maintenance tools;
- `docs/`: current product and engineering authority.

Office code on `main` is V2-only. It lives under
`apps/web/src/features/office-v2/` and `docs/office-v2/`.

### Reference-only material

`assets/references/` contains evidence or inspiration that cannot be imported by
runtime. Each collection requires a README and manifest describing provenance,
license or commercial status, and file hashes.

Reference files do not become current assets by being present in the repository.
Production assets require the V2 admission pipeline and a separate versioned
runtime location.

### Legacy source

`legacy/` contains retired, pre-monorepo tools. It is preserved for historical
use only and is never imported directly by current applications, services, or
packages. A legacy tool must pass through a new adapter and tests before reuse.

Compiled legacy binaries are local convenience files. They are ignored by Git
and should be distributed through a release archive, not committed as source.

### Local runtime state

`runtime-data/` contains the pilot database, content-addressed objects, profiles,
exports, and logs. Only its README is committed. The data is current local state,
not old source and not disposable build output. Repository cleanup must never
delete it.

### Generated and disposable output

The following locations are recreated by development tools and are not source:

- `dist/` and workspace `dist/` directories;
- `.wrangler/`;
- `tmp/`;
- `*.tsbuildinfo`;
- local `*.log` files;
- package `node_modules/` directories.

Use `npm run clean:local` to remove generated output except `node_modules/`.
Dependency installation remains explicit through `npm install`.

`docs/generated/` is the one committed generated-document location. Its files
are updated only by their owning script and must not be hand-edited.

## Version history

- `main`: current product and Office Engine V2.
- `codex/office-v1-archive`: exact final Office V1 working tree.
- `office-v1-final-2026-07-30`: immutable V1 recovery tag.

Do not create an `office-v1/`, `old-office/`, or copied archive directory on
`main`. Git already owns that history. Copying it into the current tree would
break the clean-room boundary and make old and current files ambiguous.

## Placement checklist

Before adding a file, answer:

1. Which runtime or documentation boundary owns it?
2. Is it authoritative source, a reference, legacy, runtime state, or generated?
3. Does it contain secrets, sessions, private artifacts, or unreviewed pixels?
4. What manifest, schema, test, or cleanup rule keeps it from drifting?

If ownership is unclear, do not place the file at the repository root.
