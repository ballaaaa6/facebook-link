# Legacy Directory

This directory contains retired tools that predate the current monorepo.

## Preserved tools

- `og-link-builder/`: desktop OG preview-link utility; not part of current builds

Legacy code is historical source, not a shared package. Current applications,
services, and packages must not import it directly. Reuse requires a documented
adapter, sanitized contract, tests, and an architecture review.

Compiled executables are ignored local files. Store distributable binaries in a
release archive outside the source tree rather than committing them to Git.
