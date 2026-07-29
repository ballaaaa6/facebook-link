# Office Facility Printer P01 Production

Status: F8 owner review pending

Revision: `p01-production-r01`

Authority:
`assets/game/manifests/office-facility-printer-p01-production.json`

Builder:
`scripts/build-office-facility-printer-p01-production.py`

Checker:
`scripts/office-facility-printer-p01-production-check.mjs`

## Scope and stop

This isolated F4-F8 package consumes only the exact twelve review hashes from
the owner-approved `p01-generated-motion-preflight-r02`. It creates no new
image, repairs no pixels, reads no foreign family, and imports nothing into
the furniture-only room, map, runtime registry, or Active Office.

F4-F7 pass. F8 remains pending owner review, so both planned Printer
reservation slots remain inactive. Facility v1 therefore remains `18/20`.
Approval of this exact production review set would activate two capacity-one
instances and reach the `20/20` target. F9-F10 remain blocked.

## Geometry and instances

The accepted family retains:

- physical scale `2 x 2 x 4`;
- floor footprint `2 x 2`;
- render box `3 x 4`;
- runtime canvas `96 x 128`;
- base and sort pivot `[48,124]`;
- output socket `[48,66]`; and
- front-only interaction through I01 `interact-front`.

One family owns two planned instances:

| Instance | Footprint origin | Stand | Approach | Exit | Capacity |
| --- | --- | --- | --- | --- | ---: |
| `printer-01` | `[0,0]` | `[0,2]` | `[0,3]` | `[1,3]` | 1 |
| `printer-02` | `[5,0]` | `[5,2]` | `[5,3]` | `[6,3]` | 1 |

The route cells are outside each footprint. The reservation key is the
instance ID, so both machines may be occupied concurrently while neither
instance exceeds capacity one.

## Modular motion

The production composition is unchanged:

```text
immutableShell
+ statusViewport[frame]
+ scannerLight[frame]
+ outputTray[state]
+ outputChild[state]
```

Processing is an invoked seam loop:

```text
A -> B -> C -> D -> A
```

Every transition changes pixels, while the changed-pixel count outside the
screen and scanner regions is zero. The processing endpoint is the exact same
A state.

The tray is a finite reversible action:

```text
closed -> half -> open -> half -> closed
```

Every transition changes pixels, with zero changed pixels outside the tray
region. Shell movement, pivot drift, footprint drift, collision changes, and
endpoint mismatch are all zero.

The output child follows:

```text
none
-> facility.output.primary
-> actor.hand.primary.grip
-> none
```

A failure before pickup removes the facility output, reverses the tray, never
creates a held prop, and releases the reservation. An interruption after
pickup closes the tray before removing the held prop and releasing the
reservation.

## 108 base poses and 108 prop cases

The base matrix is:

```text
18 characters x 6 I01 frames = 108 poses
```

Every case resolves:

```text
actorOrigin = worldRoot - actor.rootSocket
actorOrigin + actor.rootSocket = worldRoot
```

All 108 root deltas, pivot deltas, route failures, and per-character offsets
are zero.

The paper/envelope matrix is:

```text
18 characters x 3 held frames x 2 H01 props = 108 prop cases
```

Each case uses `primary-grip-to-primary-grip`:

```text
propOrigin =
  actor.primaryGripSocket
  - prop.primaryGripSocket

propOrigin + prop.primaryGripSocket
  == actor.primaryGripSocket
```

All 108 primary-grip deltas are `[0,0]`. All prop primary sockets touch prop
alpha exactly. Actor sockets are on or within three Manhattan pixels of actor
hand alpha across the full roster. There are zero clipped props, midpoint
placements, foreground masks, magic offsets, or fallback sockets.

The job chooses the output once per visit:

| Job | H01 output |
| --- | --- |
| `print-document` | `held.paper-sheet` |
| `prepare-mail` | `held.envelope` |

## Thirty-second reservation proof

The deterministic simulation uses three users and both instances:

1. actor A reserves `printer-01`;
2. actor B concurrently reserves `printer-02`;
3. actor C is blocked while both are occupied;
4. actor A fails before pickup, the output is removed, the tray closes, and
   the first reservation is released;
5. actor C retries `printer-01` successfully and completes a paper handoff;
6. actor B picks up an envelope, is interrupted, closes the tray first, then
   removes the held prop and releases `printer-02`; and
7. actor C closes and releases `printer-01`.

The 31 samples from second 0 through second 30 prove:

- maximum concurrent reservations: 2;
- maximum reservations per instance: 1;
- blocked attempts: 1;
- failures: 1;
- releases: 3;
- successful retries: 1;
- handoffs: 2;
- route collisions: 0;
- reservations at end: 0; and
- orphan props at end: 0.

## F8 review package

The fourteen PNG boards cover the approved hash lock, clean states, parts,
two-instance geometry, seam loop, finite tray action, output lifecycle,
routes, 108-pose roster, 108 grip cases, close-ups, alpha-contact metrics,
interruption paths, and the thirty-second timeline.

Three GIFs show the paper interaction, envelope interaction, and two-printer
contention sequence:

- `printer-p01-production-paper.gif`;
- `printer-p01-production-envelope.gif`; and
- `printer-p01-production-contention.gif`.

All seventeen files live under:

`assets/art/layout-references/office-facility-family-v1/printer-p01-production/`

The manifest pins every hash, image size, GIF frame count, and duration. F8
approval must refer to this exact revision and review set.

## Reproduction and validation

```bash
npm run art:facility:printer:p01:production
npm run art:facility:printer:p01:production:rebuild:check
npm run art:facility:printer:p01:production:check
```

No Printer slot, F9 room placement, map change, or Active Office change is
part of this production batch.
