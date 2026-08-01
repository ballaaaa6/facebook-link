# Decision 0007 — Package Ownership and Import Boundaries

- Status: accepted
- Date: 2026-08-01
- Owners: architecture, contracts, world, simulation, operations adapter, and presentation

## Context

Office V2 has intentionally remained inside an empty Web feature while the
clean-room knowledge pack matured. W0.1 must establish stable package ownership
before V2 schemas generate TypeScript, a persistent world or simulation exists,
or a renderer is selected. Without an enforced boundary, schema types, geometry,
simulation state, operational records, and React presentation could acquire
competing owners.

The approved boundary must preserve the conceptual separation of world,
simulation, projection, operations adaptation, and presentation without adding
an unapproved fifth Office package.

## Options considered

- Keep all Office code in the Web feature: minimal setup, but it would let React
  and renderer choices own domain behavior and would make headless evidence
  application-dependent.
- Combine world, simulation, and operations in one engine package: fewer
  manifests, but operational truth and deterministic engine state would share a
  dependency boundary and could not be tested or replaced independently.
- Use four pure packages plus a Web composition root: slightly more workspace
  structure, but every contract and dependency direction can be enforced before
  behavior is implemented.

## Decision

Approve exactly these Office code roots and package names:

| Root | Package or boundary | Owner |
| --- | --- | --- |
| `packages/office-v2-contracts` | `@affiliate-ops/office-v2-contracts` | Cross-layer Office types, references, versions, and diagnostic envelopes |
| `packages/office-v2-world` | `@affiliate-ops/office-v2-world` | Immutable world definitions, geometry, topology, placement, scene compilation, and pure projection mathematics |
| `packages/office-v2-simulation` | `@affiliate-ops/office-v2-simulation` | Commands, mutable simulation state, navigation execution, interactions, facilities, queues, snapshots, and replay |
| `packages/office-v2-operations` | `@affiliate-ops/office-v2-operations` | Translation of shared operational contracts into versioned Office adapter inputs |
| `apps/web/src/features/office-v2` | Web composition boundary | React presentation, camera and input adapters, renderer port implementations, accessibility, and package composition |

The conceptual projection layer remains separate inside the world package: its
renderer-neutral contracts belong to Office contracts and its pure transforms
belong to a dedicated world module. Camera state, browser input, and drawing
remain presentation concerns. A separate projection package would require a
superseding decision and a narrow clean-room-root change.

Dependency arrows point from a consumer to what it may import:

```text
office-v2-world      -> office-v2-contracts
office-v2-simulation -> office-v2-world + office-v2-contracts
office-v2-operations -> @affiliate-ops/contracts + office-v2-contracts
web/office-v2        -> office-v2-contracts + world + simulation + operations
```

`office-v2-contracts` has no Office package dependency. Operations must not
import world or simulation. Cross-package relative imports are forbidden; a
package consumes another package only through its public bare package name.
Package source and manifests are both part of the dependency graph.

All four packages are headless. They must not import applications, services,
React, a renderer implementation, database or storage implementations,
connectors, provider implementations, or the automation runner. No application
or service may be imported back through a relative, type-only, static, dynamic,
or package-manifest dependency. The Web feature may compose all four packages,
but no package may import the Web feature.

Canonical schemas and generated TypeScript have one direction:

```text
docs/office-v2/schemas/
  -> scripts/office-v2-contracts-generate.mjs
  -> packages/office-v2-contracts/src/generated/
```

Schema files are authored only in the canonical documentation root. Generated
TypeScript is script-owned and never hand-maintained as a parallel contract.
W0.1 reserves this boundary but does not create the generator or generate from
the ambiguous V1 `position` contracts. Generation begins with the accepted V2
schemas in W1.1.

New Office roots or dependency edges require a superseding decision. The exact
root and its narrow clean-room allowance must be introduced in the same commit.

## Consequences

The initial packages are scaffolds only; this decision does not authorize world
or simulation behavior, schema V1 type generation, a renderer, or runtime
assets. No data or snapshot migration occurs. Fast-check, PixiJS, and Playwright
remain uninstalled and unadmitted, so property/model and reducer/replay evidence
remain zero.

The extra workspace manifests add a small maintenance cost. In return, package
manifests, bare imports, relative imports, and clean-room roots can fail before
an architectural leak reaches a runtime build.

## Evidence

`docs/REPOSITORY_LAYOUT.md`, `docs/ARCHITECTURE.md`, the Office clean-room gate,
the architecture gate, exact negative boundary tests, package type checks, and
the full repository gate own acceptance evidence for this decision.
