# Map Authoring and Import

## Canonical format

Versioned Office JSON is the runtime and test source of truth. An editor export
is input to a converter, never a format consumed directly by simulation or
presentation. The accepted decision is recorded in
`decisions/0003-map-authoring.md`.

## Authoring flow

```text
editor or hand-authored source
  -> pinned converter
  -> canonical Office JSON
  -> schema validation
  -> semantic validation
  -> reviewed fixture or runtime world
```

The converter records source path, source hash, tool version, converter version,
output hash, and diagnostics. Conversion is deterministic and never overwrites
the source.

## Tiled boundary

Tiled may later author floors, structural edges, zones, entity instances, and
object references. External tilesets, custom classes, object templates, and
relative file paths are required when that adapter is admitted. Tiled pixel
offsets are not imported as world authority; they must map to declared sprite
origins or be rejected.

## Import failures

Reject unknown classes, duplicate identifiers, unsupported rotation, dangling
object references, non-integral world placement, embedded runtime assets,
unapproved absolute paths, and properties with no canonical schema owner.

## Required evidence

- Reordering editor objects produces byte-identical canonical output.
- Source and output hashes appear in the conversion report.
- Invalid editor input names the source object and rejected property.
- Importing a map never registers or executes an external connector.
