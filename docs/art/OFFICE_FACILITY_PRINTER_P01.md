# Office Facility Printer P01

Status: F3 owner-approved; isolated F4-F8 production authorized

Revision: `p01-generated-motion-preflight-r02`

Authority:
`assets/game/manifests/office-facility-printer-p01.json`

Builder:
`scripts/build-office-facility-printer-p01.py`

Checker:
`scripts/office-facility-printer-p01-check.mjs`

## Scope and stop

Printer P01 replaces the prior desktop-printer and credenza plan with one
fresh large floor-standing multifunction copier family. The visual preflight
uses:

- physical scale `2 x 2 x 4` tiles;
- fixed `2 x 2` floor footprint;
- `3 x 4` render box;
- front orientation only;
- one front approach tile;
- one user per instance; and
- two planned instances with independent reservations.

The exact r02 batch passed F3 owner review on 2026-07-30. It builds no 18-character
production matrix, no thirty-second contention proof, no F8 decision, and no
active Printer reservation slots. Facility v1 remains `18/20`. The approval
authorizes production to build the two independent slots needed to
reach `20/20`. F9-F10 remain blocked.

## Fresh source authority

Both source images were created with the built-in `image_gen` workflow:

1. `01-printer-front-anchor-chroma.png` is a text-only fresh identity.
2. `02-printer-motion-parts-chroma.png` references only the first source and
   provides the same shell identity plus isolated local motion children.

Both use a flat `#ff00ff` chroma-key background. The deterministic builder
removes that key locally and records both source hashes. It uses no original
master, processed printer, credenza, foreign-family, rejected candidate, side
view, Active Office, repair, or missing-asset fallback pixels.

The exact prompts and reference relationship are recorded in:

`assets/art/layout-references/office-facility-family-v1/printer-p01/source/IMAGEGEN_PROMPTS.md`

## Visual identity

P01 is a substantial freestanding office copier:

- warm off-white rigid outer shell;
- dark navy lower chassis and output bay;
- restrained cyan and teal activity accents;
- broad scanner lid;
- local angled control screen;
- central output opening;
- lower paper drawers; and
- no logo, text, baked paper, or baked envelope.

The shell remains visually and spatially unchanged during all motion.

## Modular motion formula

The composition contract is:

```text
immutableShell
+ statusViewport[frame]
+ scannerLight[frame]
+ outputTray[state]
+ outputChild[state]
```

The screen and scanner light use an invoked processing seam loop:

```text
A -> B -> C -> D -> A
```

Only those two local children change during processing. The shell, base pivot,
sort pivot, footprint, collision geometry, output socket, and world anchor
remain fixed.

The output tray is a finite action, not an ambient loop:

```text
idle
-> wake
-> processing
-> tray-half
-> tray-open
-> output-ready
-> pickup
-> tray-half
-> tray-closed
-> idle
```

An interruption before pickup removes the facility output, reverses the tray,
and releases the reservation. An interruption after pickup closes the tray
before the held prop and reservation are released.

## Existing I01/H01 reuse

P01 uses I01 `interact-front` and creates no new character pose, root socket,
hand socket, facility-specific coordinate system, magic offset, or fallback
socket.

The selected job determines the H01 output once per visit:

| Job | H01 output |
| --- | --- |
| `print-document` | `held.paper-sheet` |
| `prepare-mail` | `held.envelope` |

The first preflight placed `prop.visualCenterSocket` at the midpoint of both
hands. The coordinates were mathematically centered, but the prop alpha did
not visibly touch either hand. The owner rejected that presentation.

Revision r02 uses the already-recorded primary grip on both sides through the
`primary-grip-to-primary-grip` rule:

```text
propOrigin =
  actor.primaryGripSocket
  - prop.primaryGripSocket

propOrigin + prop.primaryGripSocket
  == actor.primaryGripSocket

attachmentDelta = [0,0]
```

The facility output first parents to `facility.output.primary` at `[48,66]`.
Pickup reparents the same child to `actor.hand.primary.grip`. The secondary
hand coordinate remains recorded for review, but it no longer pulls the item
into the middle of the torso. The job output never changes randomly from one
animation frame to another.

The Anna preview proves both props on held frames 2, 3, and 4: six exact
primary-grip cases, six `[0,0]` deltas, zero midpoint placements, zero magic
offsets, and zero fallback sockets.

## Spatial preview

| Contract | Value |
| --- | --- |
| Runtime canvas | `96 x 128` pixels |
| Base and sort pivot | `[48,124]` |
| Output socket | `[48,66]` |
| Footprint cells | four |
| Stand | `[0,2]` |
| Front approach | `[0,3]` |
| Exit | `[1,3]` |
| Route | `[1,3] -> [0,3] -> [0,2]` |
| Route collisions | zero |

The two-instance preview does not place either copier in a room. It only proves
that one accepted family can later own `printer-01` and `printer-02`, with one
capacity-one reservation per instance.

## F3 review package

1. `01-clean-front-identity.png`
2. `02-source-ownership-alpha.png`
3. `03-modular-parts.png`
4. `04-scale-2x2x4.png`
5. `05-footprint-approach-routes.png`
6. `06-processing-seam-loop.png`
7. `07-finite-output-sequence.png`
8. `08-i01-h01-two-instance-preview.png`
9. `09-primary-grip-frame-proof.png`
10. `printer-p01-processing-loop.gif`
11. `printer-p01-anna-paper.gif`
12. `printer-p01-anna-envelope.gif`

The files live under:

`assets/art/layout-references/office-facility-family-v1/printer-p01/`

The manifest records every review hash, image size, GIF frame count, and frame
duration. F3 approval applies to this exact revision and evidence set. The
manifest pins all twelve hashes; a changed file invalidates production authority.

## Authorized production work

F3 approval authorizes, but does not itself complete:

- the complete 18-character by six-frame I01 matrix;
- paper and envelope primary-grip overlay validation;
- two independent capacity-one reservations;
- a thirty-second three-user, two-instance blocked/failure/release/retry scenario;
- both interruption paths;
- close-ups, routes, roster, handoff, and timeline evidence; and
- a separate F8 owner decision.

Only F8 approval of that production package may activate the two Printer
slots and advance Facility v1 from `18/20` to `20/20`.

The authorized production package is documented in
`docs/art/OFFICE_FACILITY_PRINTER_P01_PRODUCTION.md`.

## Reproduction and validation

```bash
npm run art:facility:printer:p01
npm run art:facility:printer:p01:rebuild:check
npm run art:facility:printer:p01:check
```

The builder owns only the Printer P01 processed and review directories. It
does not modify the furniture-only room, map, runtime registry, or Active
Office.
