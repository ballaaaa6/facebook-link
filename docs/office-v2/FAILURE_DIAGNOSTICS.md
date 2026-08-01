# Failure Diagnostics

## Diagnostic shape

Every rejected command, invalid definition, import failure, migration failure,
asset admission failure, and replay divergence returns a stable code, owner,
version, human message, and structured context. Context uses stable identifiers
and JSON pointers rather than screenshots or component names.

## Required categories

Each prefix has exactly one originating layer. A consumer may preserve and
display a diagnostic, but it does not recode the same failure under a second
family.

| Prefix | Originating owner | Scope |
| --- | --- | --- |
| `architecture.office-v2.*` | Repository architecture and clean-room gates | Unapproved roots, manifest or package-name errors, dependency direction, forbidden imports, and generated-boundary violations |
| `knowledge.*` | Office knowledge gate | Inventory, schema loading, fixture registration, evidence classification, and gate-harness failures |
| `contract.*` | `@affiliate-ops/office-v2-contracts` and its generator | Cross-layer envelope, reference-version, generated-type, and schema-drift failures |
| `world.*` | `@affiliate-ops/office-v2-world` | Bounds, surfaces, occupancy, clearance, structures, zones, geometry, topology, and reference closure |
| `projection.*` | The pure projection module in `@affiliate-ops/office-v2-world` | Invalid coordinate, transform, inverse-edge, and projection-bound failures |
| `connectivity.*` | `@affiliate-ops/office-v2-world` | Unsupported masks, family/version compatibility, rotation, and missing variants |
| `navigation.*` | The pure navigation module in `@affiliate-ops/office-v2-world` | Route legality, unreachable topology, path cost, and stale world-route inputs |
| `simulation.*` | `@affiliate-ops/office-v2-simulation` | Commands, transitions, ticks, reservations, queues, replay, restore, and simulation migration |
| `interaction.*` | `@affiliate-ops/office-v2-simulation` | Preconditions, facility capacity, use-slot ownership, timeout, cancellation, cleanup, and missing sockets |
| `adapter.*` | `@affiliate-ops/office-v2-operations` | Unknown operational state, freshness, disconnection, mapping, deduplication, and forbidden proposals |
| `presentation.*` | `apps/web/src/features/office-v2` | Missing presentation resources, unsupported clips, browser lifecycle, input, accessibility, and renderer capability |
| `asset.*` | Office asset pipeline | Provenance, files, hashes, pixel/frame geometry, variants, catalogs, bundles, and review |

Decision 0012 reserves `simulation.deadlock-no-yield-cell` for a deterministic
deadlock victim that has no declared legal yield cell. The diagnostic includes
the victim actor ID, intent ID, wait-for participants, world revision, and
evaluated yield-cell IDs. Presentation may display it but cannot recode the
failure or move the actor specially.

The contracts package owns the diagnostic envelope and catalog types but does
not originate a world, simulation, adapter, presentation, or asset failure.
Renderer code cannot reinterpret a missing world or adapter fact as a
presentation success.

## Debug evidence

A bug report can include the validated world definition, initial snapshot,
ordered trace, engine/schema versions, state hashes, diagnostic list, viewport,
and approved screenshot. It must exclude credentials, connector payload secrets,
browser profiles, cookies, and unrelated operational records.

## Failure policy

Development may use labeled geometric placeholders. Production never replaces a
missing approved runtime asset with legacy or unrelated pixels. Unknown
operational state maps to unavailable with a diagnostic, never working or idle.
