# Asset Pipeline, Provenance, and Validation

## Admission stages

Runtime assets move through versioned stages:

```text
brief -> source -> extraction -> geometry -> review -> validated runtime import
```

Files cannot skip a stage. Source material stays immutable. Derived outputs are
rebuilt by a deterministic recipe into a versioned destination.

Store immutable sources under `assets/office-v2/sources/`, deterministic recipes
under `assets/office-v2/recipes/`, admitted manifests under
`assets/office-v2/manifests/`, and declared PNG outputs under
`assets/office-v2/runtime/`. Manifest file paths are relative to `assets/` and
must stay within their declared stage root.

## Provenance record

Every family records project identifier, family and version, source identifier,
author or tool, creation time, license status, commercial-review status, source
hash, recipe version, output hashes, and reviewer decision.

Generated or assisted art also records the applicable prompt or creation brief
without secrets. Third-party references never become runtime pixels by accident.

## Geometry metadata

Every runtime sprite or clip references one versioned authoritative world
geometry definition. The asset record owns canvas and frame bounds, sprite
origin, pixel ground/depth contacts, visual height, render band, pixel
attachment contacts, trimming, render-part composition, and visual variants.
It does not author footprint, clearance, orientation transforms, world/sub-cell
sockets, or use-slot geometry.

When an asset carries a generated pixel projection of a geometry socket, the
geometry-agreement linter validates the reference and projection. Presentation
parts and connectivity variants cannot change occupancy or interaction truth.
The V1 asset schema and fixtures remain frozen; W1.2 introduces reference-only
V2 evidence rather than reinterpreting duplicated V1 fields.

## Automated validation

- required source, recipe, output files, and hashes;
- filename and identifier uniqueness;
- dimensions, frame bounds, alpha, and edge contamination;
- geometry reference closure, pixel ranges, contact containment, and agreement;
- complete clip and connectivity tables;
- duplicate-pixel and forbidden-source checks;
- manifest-to-runtime registry agreement;
- explicit license and commercial status.

## Failure policy

Missing, mismatched, unreviewed, or unlicensed material fails the build with the
owning family and version. There is no silent placeholder in production and no
fallback to V1, Git history, rejected candidates, or unrelated asset families.

## Batch policy

Produce one family end to end before expanding. A batch is approved only when
every member passes independently and the contact sheet is generated from the
same validated outputs used by runtime.
