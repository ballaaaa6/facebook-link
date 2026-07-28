# Office Workstation Coordinate, Socket, and Occlusion System

Status: Owner-approved placement authority
Approved: 2026-07-28
Revision: R05-r02 P0-P3

This document is the authoritative manual for composing the current Office
desk, monitor, keyboard, real chair, and existing seated characters. The
approved proof is isolated from Active Office. It authorizes reuse of these
rules; it does not authorize new character art, new poses, hand sockets, other
furniture, or Active Office promotion.

## Authority order

When two Office files disagree about workstation placement, use this order:

1. `assets/game/manifests/office-workstation-step5-r05-r02.json`;
2. `assets/game/manifests/office-character-seat-sockets-v1.json`;
3. this manual;
4. `docs/art/OFFICE_2D_GEOMETRY_PRINCIPLES.md` for shared geometry concepts;
5. approved R05-r02 clean and debug evidence.

R01, R02, R03, R04, R05 calibration, R05 final, Candidate r01, Workstation
Bundle v1, Office Map v2, and their screenshots are historical or rejected
evidence. They must not supply current coordinates, layer order, seat contact,
desk-row distance, or promotion permission.

## Independent contracts

Every placeable object keeps these values separate:

1. `occupancy`: top-down world cells reserved for collision;
2. `supportPlane`: the physical surface that accepts a child object;
3. `renderBounds`: the visible bitmap envelope, including allowed overflow;
4. `localSocket`: a semantic pixel point inside a sprite;
5. `depthRole`: the object's physical relationship to nearby objects.

Canvas dimensions and alpha bounds are never collision geometry. A desk may
use a `96 x 128` authoring canvas while reserving a `3 x 2` floor footprint
and exposing a `96 x 64` support plane.

## Coordinate spaces

- World X increases right.
- World Y increases toward the viewer.
- World Z increases upward.
- One tile equals 32 authoring pixels.
- World positions use tile units; local sockets use integer sprite pixels.
- Perspective convergence and orientation-specific magic offsets are
  forbidden.

```text
screenX = worldX * 32
screenY = worldY * 32 - worldZ * 32
```

Every supported placement resolves center-to-center through semantic sockets:

```text
drawOrigin = project(worldSocket.xyz) - localSocket.xy
```

Do not align two sprites by assigning the same top-left coordinate unless
their contract explicitly defines the same local socket, which the current
person/chair contract does not.

## Approved physical ruler

| Component | Occupancy or reservation | Logical volume | Approved pixel rule |
| --- | --- | --- | --- |
| Person | `1 x 1` floor cell | `1 x 1 x 3` | Existing `96 x 104` frame; hair, clothing, and limbs may overflow |
| Chair | Same `1 x 1` cell as person | `1 x 1 x 2` | Existing real chair pixels on a `96 x 112` composition canvas |
| Desk | `3 x 2` floor cells | `3 x 2 x 2` | `96 x 64` complete tabletop inside a `96 x 128` render canvas |
| Monitor | Actor-far `3 x 1` band | Upright supported child | Existing `52 x 40` visual, centered by base socket `[26,40]` |
| Keyboard | Actor-near center `1 x 1` cell | Flat supported child | Existing `48 x 24` visual; horizontal overflow stays inside the tabletop |

The monitor reserves a three-cell band for layout exclusion but does not fill
all three cells visually. The monitor's base socket, not its bitmap top-left,
is centered on the middle support cell. The keyboard reserves one cell while
its proportional 48-pixel width may extend eight pixels to either side.

## Person and chair placement

The chair and person share one floor cell but remain separate physical and
render objects. The chair seat socket is `[48,80]`; the chair floor socket is
`[48,112]`.

The actor contact is recorded for every seat-capable character, orientation,
and animation frame:

```text
chairSeatSocketWorld = chairWorldOrigin + chairSeatSocketLocal
actorDrawOrigin = project(chairSeatSocketWorld)
                - actorSeatContactLocal
```

The required draw split is:

```text
chair-behind
actor
chair-foreground
```

The actor's recorded seat contact must resolve to the chair seat with
`delta = [0,0]` in every frame. A back-facing coat, tail, hair mass, or
non-human silhouette does not justify a shared offset. It receives its own
measured local contact.

The socket manifest audits nineteen character directories. Eighteen 8x15
atlases provide front and back contacts for six frames, totaling 216 records.
Boba's 11-row companion atlas has no seated work rows and is explicitly
`not-applicable`; no replacement pose is created.

## Actor-relative station orientation

Orientation names describe the actor's position relative to the desk, not an
asset filename:

```text
far station, actor north of desk:
[ actor + chair ]
[ keyboard: actor-near center cell ]
[ monitor: actor-far three-cell band ]

near station, actor south of desk:
[ monitor: actor-far three-cell band ]
[ keyboard: actor-near center cell ]
[ actor + chair ]
```

Historical `.front` and `.back` filenames have no authority over public-side,
seat-side, monitor-facing, or actor-facing meaning. Verify visible features
and use the semantic station orientation.

## Layer order

Far station, back to front:

```text
chair-behind
actor
chair-foreground
desk-rear
desk-surface
keyboard
monitor-back
desk-base
desk-foreground
```

Near station, back to front:

```text
desk-rear
desk-surface
monitor-front
keyboard
desk-base
desk-foreground
chair-behind
actor
chair-foreground
```

The far keyboard draws before the upright monitor because the monitor is
physically closer to the viewer in their projected overlap. Flat and upright
children must not share a generic "place on desk" layer.

## Joining desks

A depthwise pair advances by the physical desk depth:

```text
nearDeskOrigin = farDeskOrigin + [0, 2, 0] tiles
screen origin delta = [0,64] pixels
```

Do not advance by the `128`-pixel render-canvas height. At the accepted
64-pixel join:

- both complete `3 x 2` tabletops remain visible;
- the tabletop gap is zero;
- the near tabletop occludes the far desk's base, drawers, and legs in the
  shared projected band;
- the far desk base visible behind the near top is zero pixels.

Horizontal desk columns advance by the physical width:

```text
nextDeskOrigin = currentDeskOrigin + [3, 0, 0] tiles
```

Each tabletop remains its own physical object. Their edges touch without a
gap or footprint overlap.

## Acceptance invariants

Any derived workstation scene must prove all of the following:

- person/chair seat delta is `[0,0]` for all rendered frames;
- all 18 seat-capable characters resolve through the socket manifest;
- Boba is not assigned a seated station;
- depthwise desk origin delta is exactly 64 pixels;
- horizontal desk origin delta is exactly 96 pixels;
- tabletop gap and footprint overlap are both zero;
- far equipment order is `keyboard`, then `monitor-back`;
- monitor base is centered on the middle cell of its reservation;
- keyboard pixels stay inside the `96 x 64` support plane;
- no canvas or alpha rectangle becomes collision geometry;
- no new character, pose, chair, desk, monitor, or keyboard pixels are made;
- Active Office remains byte-identical until a separately approved promotion.

## Explicitly rejected methods

Never use these methods as a shortcut:

- a `5 x 4` workstation footprint or `5 x 3` support plane;
- a 30-pixel-deep tabletop described as `3 x 2`;
- a 128-pixel depthwise station step;
- a shared person/chair top-left origin;
- one universal back-facing pelvis offset;
- monitor or keyboard placement from bitmap corners;
- keyboard-over-monitor draw order in a far station;
- character, chair, equipment, or prop pixels baked into the desk;
- an old ten-seat map patched with offsets.

## Change procedure

The approved R05-r02 manifests and proof images are immutable inputs to the
next phase. A later change must create a new revision, state which invariant
changed, provide clean and debug before/after evidence, pass the automated
authority gate, and receive an explicit owner decision. Never silently alter
this accepted baseline to make a larger scene pass.
