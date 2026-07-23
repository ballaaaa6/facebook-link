# Legacy OG Link Builder

Preserved pre-monorepo desktop utility for adding preview metadata/images to links. It is not part of the current build and may have behavior or dependencies that do not meet the new architecture rules.

Compiled `.exe` files remain available locally but are ignored by Git. Rebuild or archive release binaries outside the source repository.

Before reusing it:

1. Document the exact input/output contract.
2. Separate pure link transformation from the desktop UI.
3. Add tests with sanitized URLs.
4. Move reusable logic behind a new adapter; do not import this folder directly.
