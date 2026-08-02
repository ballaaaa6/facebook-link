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

Decision 0013 reserves `connectivity.unsupported-mask` for an arrangement the
versioned family deliberately does not admit. Its context names family and
version, requested mask, instance or fixture case, and compatible neighbors.
It is distinct from `connectivity.missing-variant`, which means a family claims
to support a mask but omits its required variant.

The contracts package owns the diagnostic envelope and catalog types but does
not originate a world, simulation, adapter, presentation, or asset failure.
Renderer code cannot reinterpret a missing world or adapter fact as a
presentation success.

W1.1 contract diagnostics include coordinate-space, safe-range, typed-identity,
versioned-reference, generic-position, and generated-drift failures. W1.2 adds
the fail-closed migration codes `contract.migration-context-missing` and
`contract.migration-reference-conflict`. Their stable `contract.*` codes are
defined in `DEFINITION_INSTANCE_RUNTIME_STATE.md`; schema adapters preserve
JSON pointers and structured context but do not leak validator-specific
wording.

W1.2 world/reference diagnostics are intentionally narrow and stable:

| Code | Originating rule |
| --- | --- |
| `world.reference-duplicate` | One `${kind}:${value}@${version}` graph key is declared twice |
| `world.reference-missing` | A bundle edge has no target record |
| `world.reference-kind-mismatch` | The target ID namespace does not match the edge family |
| `world.reference-version-mismatch` | A consumer and target disagree on positive version |
| `world.geometry-conflict` | A permitted derived projection disagrees after rotation |
| `world.geometry-authority-violation` | A non-geometry record authors an owned spatial field |
| `world.orientation-unsupported` | A requested orientation is not declared by geometry |
| `world.geometry-rotation-invalid` | A cardinal transform is not an integral quarter-turn |
| `world.socket-duplicate` | A geometry record repeats a socket key |
| `world.use-slot-duplicate` | A geometry record repeats a use-slot key |
| `world.render-attachment-cycle` | Render-part parent/dependency graph is cyclic |
| `world.asset-occupancy-forbidden` | Asset/presentation data attempts to change occupancy |

The world linter reports one primary code with stable JSON pointers and typed
reference context. It does not downgrade a missing target to a presentation
warning or recode an ownership failure as a contract schema error.

W1.3 topology diagnostics extend the same `world.*` and `contract.*` ownership
boundary:

| Code | Originating rule |
| --- | --- |
| `world.floor-duplicate` | A building repeats a floor or floor-local world identity. |
| `world.portal-duplicate` | A building repeats a portal identity. |
| `world.portal-endpoint-duplicate` | Endpoint identity is repeated across portals. |
| `world.portal-endpoint-missing` | A portal has no owner-side endpoint. |
| `world.portal-landing-missing` | A portal has no opposite-side landing. |
| `world.portal-direction-mismatch` | Portal kind, direction, or endpoint ownership disagrees. |
| `world.portal-floor-missing` | A floor endpoint does not resolve to a declared floor. |
| `world.portal-floor-mismatch` | An endpoint coordinate or owner floor disagrees. |
| `world.portal-endpoint-out-of-bounds` | A floor endpoint is outside floor-local bounds. |
| `world.portal-site-mismatch` | A site endpoint does not resolve to the building site. |
| `world.exterior-interior-overlap` | Presentation-only context overlaps an interior envelope. |
| `world.elevation-floor-inference` | Elevation is used as floor identity. |

`contract.migration-context-missing` and
`contract.migration-reference-conflict` remain contract-owned because they
reject incomplete or contradictory V1 migration context before a V2 topology
record is materialized.

W1.6 simulation contract diagnostics are stable and simulation-owned:

| Code | Originating rule |
| --- | --- |
| `simulation.command-id-conflict` | A duplicate command ID has a different version or payload digest. |
| `simulation.command-scheduled-in-past` | A command arrives with a scheduled tick before the current tick. |
| `simulation.resource-duplicate` | An atomic resource request repeats a stable resource key. |
| `simulation.snapshot-presentation-state` | A simulation snapshot contains renderer or presentation state. |
| `simulation.lifecycle-catch-up-capped` | Presentation lag exceeds the five-tick-per-pump catch-up cap. |
| `simulation.deadlock-no-yield-cell` | A deterministic deadlock victim has no declared legal yield cell. |

The W1.6 gate checks these codes through bounded contract fixtures. It does not
claim that a reducer, queue engine, browser lifecycle, or replay runner has
emitted them in production execution; those remain T2/T3 evidence.

Closure C adapter diagnostics are stable and adapter-owned:

| Code | Originating rule |
| --- | --- |
| `adapter.stale`, `adapter.reconnecting`, `adapter.unavailable` | Snapshot freshness is visible and is never rewritten as idle. |
| `adapter.unknown-operational-state` | An unknown status fails closed as unavailable. |
| `adapter.reason-missing`, `adapter.reason-state-mismatch` | Structured waiting, review, blocked, and failure reasons agree with status. |
| `adapter.sequence-gap`, `adapter.stream-epoch-changed`, `adapter.cursor-too-old`, `adapter.stream-mismatch` | The durable event window cannot be applied without ordered, current stream truth. |
| `adapter.event-digest-conflict`, `adapter.late-event` | A duplicate durable event ID changes payload or a new event arrives behind the high-water cursor. |
| `adapter.agent-instance-duplicate`, `adapter.role-unknown`, `adapter.routing-role-duplicate` | Roster and routing identity is not unique or resolvable. |
| `adapter.role-facility-incompatible`, `adapter.roster-binding-missing`, `adapter.role-disabled-active` | Role, facility capability, and live agent binding do not agree. |
| `adapter.feature-disabled`, `adapter.feature-session-unavailable`, `adapter.feature-unavailable` | Role, connector, and session facts do not permit an operational action. |
| `adapter.snapshot-visual-binding`, `adapter.teambrain-not-agent` | Operations truth attempts to own visual/roster leakage or turns TeamBrain into an employee. |
| `adapter.forbidden-proposal` | A proposed interaction is not allowed by the role, feature, or review policy. |

These codes are not recoded as `presentation.*`. A renderer may preserve and
display them, but cannot turn a stale stream into working, infer a missing role,
or execute a proposal after an adapter rejection.

W3.4 reconciliation diagnostics remain adapter-owned:

| Code | Originating rule |
| --- | --- |
| `adapter.clock-skew` | The injected external clock moves backward or the supplied operations snapshot is newer than that clock. |
| `adapter.cursor-ahead-of-snapshot` | The restored high-water cursor is newer than the delivered durable operations truth. |
| `adapter.external-input-expired`, `adapter.external-input-future` | An operations event is outside its explicit validity window; expired input is consumed without execution and future input remains pending. |
| `adapter.intent-stale`, `adapter.operation-expired` | A decorative/handoff intent or queued operation expires while the client is reloading or disconnected. |
| `adapter.queue-item-conflict`, `adapter.queue-item-resurrection` | A durable queue update changes payload identity or attempts to reopen terminal work. |
| `adapter.reconciliation-invalid` | The two-clock checkpoint, event policy, cursor, or event window is contradictory or invalid. |

These diagnostics preserve the existing `adapter.sequence-gap`,
`adapter.stream-epoch-changed`, `adapter.cursor-too-old`,
`adapter.stream-mismatch`, `adapter.event-digest-conflict`, and
`adapter.late-event` ownership. Current-truth rebasing reports the durable
reason and does not synthesize historical presentation or handoff intents.

Session D asset diagnostics are stable and asset-pipeline-owned:

| Code | Originating rule |
| --- | --- |
| `asset.style-scale-invalid` | Native density or a world/furniture/character scale is outside the profile contract |
| `asset.style-palette-invalid` | Palette roles or bounded color variance are invalid |
| `asset.style-padding-invalid` | Canvas padding is negative, asymmetric beyond the profile, or inconsistent |
| `asset.style-light-invalid` | Light/shadow vectors or policy are invalid |
| `asset.style-shadow-invalid` | Shadow opacity, vector, or separation policy is invalid |
| `asset.style-zoom-invalid` | Zoom stops are non-positive, duplicated, or not strictly ordered |
| `asset.source-hash-mismatch` | A source or recipe digest does not match the declared immutable input |
| `asset.provenance-missing` | Source, recipe, license, commercial review, or reviewer evidence is missing |
| `asset.export-recipe-missing` | A family has no exact deterministic export recipe |
| `asset.orphan-reference` | A source, recipe, runtime, atlas, catalog, review, or bundle record has no owner |
| `asset.render-part-sibling-order` | Siblings do not have a unique stable order under one parent |
| `asset.atlas-reference-missing` | A catalog frame or atlas entry is not closed at the exact version |
| `asset.bundle-reference-missing` | A scene bundle names a catalog asset that is not admitted by that catalog |
| `asset.migration-failed` | A version migration lacks context, mapping, or compatible geometry |
| `asset.semantic-variant-unsupported` | A character/facility composite has no compatible variant or approved fallback |

## Debug evidence

A bug report can include the validated world definition, initial snapshot,
ordered trace, engine/schema versions, state hashes, diagnostic list, viewport,
and approved screenshot. It must exclude credentials, connector payload secrets,
browser profiles, cookies, and unrelated operational records.

## Failure policy

Development may use labeled geometric placeholders. Production never replaces a
missing approved runtime asset with legacy or unrelated pixels. Unknown
operational state maps to unavailable with a diagnostic, never working or idle.
