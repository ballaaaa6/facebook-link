# Asset Pipeline, Provenance, and Validation

## Admission stages

Runtime assets move through versioned stages:

```text
brief -> source -> extraction -> geometry -> review -> validated runtime import
```

Files cannot skip a stage. Source material stays immutable. Derived outputs are
rebuilt by a deterministic recipe into a versioned destination.

## Provenance record

Every family records project identifier, family and version, source identifier,
author or tool, creation time, license status, commercial-review status, source
hash, recipe version, output hashes, and reviewer decision.

Generated or assisted art also records the applicable prompt or creation brief
without secrets. Third-party references never become runtime pixels by accident.

## Geometry metadata

Every runtime sprite or clip declares canvas, frame bounds, footprint, anchor,
sprite origin, ground contact, visual height, render band, sockets, orientations,
and connectivity variants where applicable.

## Automated validation

- required files and hashes;
- filename and identifier uniqueness;
- dimensions, frame bounds, alpha, and edge contamination;
- geometry ranges and socket containment;
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
