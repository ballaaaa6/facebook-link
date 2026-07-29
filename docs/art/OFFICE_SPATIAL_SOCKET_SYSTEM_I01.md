# Office Spatial Socket System I01

Status: F0-F8 passed; owner-approved
Updated: 2026-07-29
Scope: Isolated coordinates, action sockets, held props, and attachment resolver

## Decision boundary

I01 is the development-only spatial authority for semantic sprite attachment.
It does not modify Active Office, approve public use of prototype characters,
approve a furniture-only room or Active Office promotion. The owner approved
the exact I01/H01 front-overlay manifests and review hashes on 2026-07-29.

The system replaces fixed scene coordinates with explicit local sockets. A
front-overlay prop matches its deterministic alpha-bounds `visual.center` to
the primary hand, or to the midpoint of both hands for a wide prop. A
character, prop, or facility may move without changing the attachment rule.

## Authority set

| Authority | Purpose | Status |
| --- | --- | --- |
| `office-spatial-authority-i01.json` | World/local rules, policies, matrix and movement proof | Owner-approved |
| `office-character-action-sockets-i01.json` | Per-character, per-frame `interact-front` sockets | Owner-approved |
| `office-held-props-h01.json` | Fresh native-scale held assets and visual-center sockets | Owner-approved |
| `office-character-seat-sockets-v1.json` | Existing owner-approved seated contacts | Referenced, unchanged |
| `office-furniture-seating-s01.json` | Existing owner-approved seating batch | Referenced, unchanged |

The TypeScript authority is
`packages/contracts/src/officeSpatialProduction.ts`. The pure resolver is
implemented in `packages/contracts/src/officeSpatialAttachment.ts`. A staging
web adapter lives in
`apps/web/src/features/office/spatial/officeAttachmentResolver.ts`; Active
Office does not import it.

## Coordinate model

World coordinates and local sprite coordinates remain separate:

- world X increases right;
- world Y increases toward the viewer;
- world Z increases upward;
- one world tile projects to 32 runtime pixels;
- local sockets use integer 1x runtime pixels from the sprite top-left; and
- 2x authoring coordinates are derived by multiplying the 1x authority by two.

```text
screenX = worldX * 32
screenY = worldY * 32 - worldZ * 32

entityOrigin = project(worldPosition) - rootSocket
parentSocketWorld = parentOrigin + parentLocalSocket
childOrigin = parentSocketWorld - childLocalSocket
```

The resolved invariant is:

```text
childOrigin + childVisualCenterSocket == parentOrigin + actorHandTarget
attachmentDelta == [0,0]
```

Normalized coordinates, center-to-center attachment, per-scene attachment
offsets, per-character runtime scale, and missing-socket fallbacks are
forbidden.

## Character sockets

All 18 current Office prototype characters are measured independently on
`interact-front`, row 10, frames 0-5. Each frame records:

- `rootSocket`;
- `primaryGripSocket`;
- `secondaryGripSocket`;
- hold state; and
- a source-exact hand foreground mask retained as calibration evidence.

The authority contains 108 frame records and 54 masks for held frames 2, 3,
and 4. Front-overlay presentation never draws those masks. Character
morphology is handled by measured local coordinates, not runtime scale or a
character-specific facility offset.

The prototype character sheets retain `pendingCommercialReview`. Socket
calibration does not change that restriction.

## Held Props H01

H01 contains 16 item-neutral props. Each prop is freshly extracted from:

`assets/art/layout-references/held-props-modern-bright-v1-source.png`

SHA-256:

`b696f5934be0db3111fe19fe31ab3ec18a80ac204157613f9ac24dc5f7bd60d7`

The audit admits all 16 exact records through
`salvage-full-master-overlay`. The builder reads the original master and never
uses the historical processed held-prop files as pixel inputs.

Each prop locks:

- a `20 x 20` runtime canvas and `40 x 40` authoring canvas;
- native runtime scale `1`;
- one primary grip and an optional secondary grip for legacy calibration;
- a deterministic `visualCenterSocket` derived from runtime alpha bounds;
- an actor target rule of primary hand or two-hand midpoint;
- one of `single-body`, `single-handle`, or `two-hand-wide`; and
- attachment mode and layer role `front-overlay`.

The original master, ownership mask, source cutout, authoring asset, runtime
asset, and review evidence are hash-locked.

## Front-overlay presentation rule

An actor-held prop uses this draw order:

```text
actor-body
held-prop
```

No actor or hand layer is drawn after the held prop. Every non-transparent
prop pixel therefore remains visible. This presentation deliberately favors
clear item readability over finger occlusion. The coordinate resolver still
moves the prop with the per-character, per-frame hand socket.

Facility output may use a different parent and layer order before pickup. The
attachment parent is part of the action timeline and must switch explicitly.

## Furniture and facility sockets

Every new placeable family must keep its world transform, root socket,
footprint, sort socket, interaction target, output sockets, effect origins,
support sockets, and viewport origins distinct. A family declares only the
sockets it owns.

Vending U01-r03 is the first upright front-overlay proof. It defines:

| Socket | Runtime local point |
| --- | --- |
| `base.floor` | `[32,96]` |
| `sort.floor` | `[32,96]` |
| `interaction.target` | `[48,96]` |
| `output.primary` | `[32,78]` |
| `effect.origin` | `[27,81]` |
| `viewport.origin` | `[10,32]` |

Existing owner-approved seat contacts remain authoritative for seated
attachments. I01 references them instead of silently rewriting approved
seating hashes.

## Validation evidence

The deterministic isolated lab proves:

- 18 characters;
- 6 action frames per character;
- 16 held props;
- 3 held frames;
- 864 visible character-frame-prop cases;
- 54 absent-state cases;
- 54 source-exact foreground masks;
- four world positions;
- 3,456 movement cases;
- zero attachment-delta failures;
- zero runtime-scale failures;
- zero missing-mask failures; and
- zero foreground-mask uses in front-overlay composition;
- zero visible-alpha failures; and
- zero prop-follow failures.

Review output includes the coordinate transform, three character calibration
pages, H01 grip catalog, source ownership, layer decomposition, nine full
matrix pages, and world-movement proof.

## Reproduction

```bash
npm run art:spatial:i01
npm run art:spatial:i01:rebuild:check
npm run art:spatial:i01:check
```

The rebuild check compares every generated byte on the producer workstation.
The portable CI check validates contracts, hashes, exact file sets, review
evidence, approval state, and Active Office isolation without requiring
Pillow or platform fonts.

## F8 owner decision

The owner reviewed the I01/H01 evidence as one exact hash set and approved:

- socket crosses correspond to the visible hands for all 18 characters;
- visual centers attach sensibly at native scale;
- every prop remains fully visible above the actor;
- the full matrix remains readable across morphologies;
- movement preserves the attachment; and
- no center-anchor or scene-offset fallback is needed.

Each manifest records its own `ownerDecision` dated 2026-07-29. This approval
authorizes the socket/front-overlay contract for the next isolated facility
family. It does not approve commercial character rights, F9 room composition,
F10 runtime integration, or an Active Office import.
