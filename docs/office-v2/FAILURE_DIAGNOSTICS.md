# Failure Diagnostics

## Diagnostic shape

Every rejected command, invalid definition, import failure, migration failure,
asset admission failure, and replay divergence returns a stable code, owner,
version, human message, and structured context. Context uses stable identifiers
and JSON pointers rather than screenshots or component names.

## Required categories

- `world.*`: bounds, surface, occupancy, clearance, structure, and zone errors;
- `projection.*`: invalid coordinate, inverse edge ambiguity, and camera bounds;
- `navigation.*`: unreachable, stale route, reservation, and capacity errors;
- `interaction.*`: precondition, timeout, cancellation, and missing socket;
- `simulation.*`: duplicate, invalid transition, replay, and migration errors;
- `asset.*`: provenance, file, hash, geometry, variant, and review errors;
- `adapter.*`: unknown status, stale, disconnected, and forbidden proposal;
- `presentation.*`: missing texture, unsupported clip, and renderer capability.

## Debug evidence

A bug report can include the validated world definition, initial snapshot,
ordered trace, engine/schema versions, state hashes, diagnostic list, viewport,
and approved screenshot. It must exclude credentials, connector payload secrets,
browser profiles, cookies, and unrelated operational records.

## Failure policy

Development may use labeled geometric placeholders. Production never replaces a
missing approved runtime asset with legacy or unrelated pixels. Unknown
operational state maps to unavailable with a diagnostic, never working or idle.
