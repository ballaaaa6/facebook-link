# Office Reference Migration Roadmap

Status: Planned  
Owner: Art and office-rendering workstream  
Scope: Visual migration of the office scene to the latest orthographic pixel-art reference

## 1. Target direction

The current visual target is
`assets/art/layout-references/office-modern-operations-target-v2.png`.
The modern architectural plate remains
`assets/art/backgrounds/office-c-background-modern-v2.png`; the target image
does not replace the layered runtime background.

The target office uses a straight orthographic pixel-art presentation:

- Workstations occupy the left and center of the room.
- A compact relaxation area occupies the right side.
- Desks, monitors, chairs, props, and characters are rendered as separate layers.
- Characters can sit at desks and work while facing away from the camera.
- Furniture supports orientation-aware placement and collision footprints.
- Small ambient animations add life without moving the furniture anchor.
- Existing pathfinding, workflow state, agent registry, inspector UI, and control-plane boundaries remain in place.

The reference is a composition and visual-language target. It is not a single baked background image.

## 2. Non-goals

This migration does not require:

- Replacing the existing API, database, workflow, or agent contracts.
- Rebuilding pathfinding from scratch.
- Embedding HUD labels from the reference into the room background.
- Creating a unique physical workstation model for every employee.
- Giving every decorative prop a full animation set.
- Generating all final assets before the first in-game vertical slice passes.

## 3. Locked visual contracts

Before producing a large asset batch, lock these values:

- Tile size and world-grid scale.
- Character standing height and seated visible height.
- Desk height and workstation module footprint.
- Monitor inner viewport size.
- Pixel outline thickness and palette.
- Lighting direction and shadow language.
- Sprite anchor conventions.
- Orientation names: `front`, `back`, `left`, `right`.

Every asset must declare at least:

```json
{
  "id": "office-desk-v1",
  "orientation": "front",
  "footprint": {
    "width": 4,
    "depth": 2
  },
  "anchor": {
    "x": 2,
    "y": 2
  }
}
```

For a 90-degree side orientation, a rectangular footprint swaps width and depth:

```json
{
  "orientation": "left",
  "footprint": {
    "width": 2,
    "depth": 4
  }
}
```

Non-rectangular objects must use an orientation-specific collision mask instead of relying on a simple swap.

## 4. Delivery strategy

Use a vertical slice before a full-room rebuild:

1. One desk, chair, monitor, screen overlay, and seated CEO.
2. Validate anchors, occlusion, scale, collision, and screen animation in the running office.
3. Only then replicate the workstation to the full employee cluster.

This prevents a flawed asset or layer contract from being copied across ten workstations.

## 5. Phase roadmap

### Phase 0 — Art bible and contracts

Deliverables:

- Locked tile/grid scale.
- Locked character and furniture scale rules.
- Orientation and footprint contract.
- Anchor and occlusion conventions.
- Monitor viewport dimensions.
- Palette, outline, and lighting notes.

Acceptance criteria:

- A designer can place a new furniture asset without inventing local coordinate rules.
- A sprite can be normalized without using its alpha bounding-box center as the world anchor.

### Phase 1 — Workstation vertical slice

Create only:

- One bare office desk.
- One modern ergonomic office chair family with a locked up-facing and
  down-facing view; keep left/right turnaround views available for later
  rotation.
- One monitor shell.
- Keyboard and mouse props.
- One screen theme with three keyframes.
- CEO seated-back working pose.
- Desk foreground mask.

Create and validate the chair before generating character seated extensions.
The chair establishes the seat height, pelvis contact point, lower-body
occlusion, and the foreground mask that every character must share.

Layer order:

```text
desk base
monitor shell
screen overlay
keyboard and mouse
seated character
desk foreground mask
```

Acceptance criteria:

- The monitor does not disappear when the desk orientation changes.
- The character is seated at the chair contact point.
- The desk masks the lower body correctly.
- The screen overlay is visible at the intended in-game size.
- No layer jumps when the screen frame changes.

### Phase 2 — Modular furniture and screen assets

#### Desk

Create one desk design with:

```text
desk-front
desk-back
desk-left
desk-right
```

The desk is a bare furniture asset. Do not bake the monitor, keyboard, mouse, plants, or employee into it.

#### Monitor shell

Create one monitor housing with:

```text
monitor-front
monitor-back
monitor-left
monitor-right
```

The housing owns the bezel, stand, and shell. It does not own screen content.

#### Screen overlays

Create five reusable themes:

1. Coding editor.
2. Analytics dashboard.
3. Document/content workspace.
4. Chat/support inbox.
5. System/management dashboard.

Each theme has three keyframes:

```text
A -> B -> C
```

Runtime playback uses a ping-pong loop:

```text
A -> B -> C -> B -> A
```

Keep the monitor inner viewport fixed. Only local screen content changes. At final in-game scale, the animated region should occupy roughly 20–35% of the visible screen pixels so the movement survives character occlusion and downscaling.

Suggested screen animation classes:

- Coding: highlighted lines, cursor, and progress movement.
- Analytics: chart bars, line point, and status ring.
- Document: progress bar, highlighted panel, or thumbnail transition.
- Chat: a message bubble and unread indicator.
- System: CPU/memory bars, status dots, and warning indicators.

Do not use a full-screen redesign between frames.

### Phase 3 — Depth, occlusion, and motion integration

Update the office renderer so visual order is explicit:

```text
wall and floor
rear furniture
monitor shell
screen overlay
character body
foreground furniture mask
front props
```

Required implementation work:

- Mark workstation presentations as seated when an agent is at a desk.
- Add foreground masks for furniture that hides seated lower bodies.
- Keep world anchors separate from sprite visual offsets.
- Keep animated overlays anchored to the monitor viewport.
- Ensure z-index/depth sorting follows world position and layer role.
- Keep stationary animation overlays from changing the furniture anchor.

### Phase 4 — Map and room composition

Keep the current room size unless validation proves it is too small. Recompose the existing grid into:

- Work zone: approximately 26–28 columns on the left and center.
- Relax zone: approximately 8–10 columns on the right.

Initial workstation layout:

```text
5 workstations across
5 workstations across
```

Reserve a future expansion row or module slots so capacity can grow without moving existing employees.

Every workstation module should contain:

- Desk footprint.
- Chair footprint.
- Seat point.
- Work interaction point.
- Monitor mount point.
- Foreground mask.
- Orientation.

Keep at least one navigable aisle between workstation rows and a clear route into the relaxation area.

### Phase 5 — Relaxation area

Build the right-side zone after the workstation slice passes.

Priority assets:

1. Sofa.
2. Coffee table.
3. Water dispenser.
4. Vending machine.
5. Bookshelf.
6. Plants.
7. Rug.
8. Wall decoration.

Only interaction-relevant props need behavior initially:

- Water dispenser.
- Vending machine.
- Lounge/sofa.

Optional ambient animations:

- Water dispenser button light.
- Vending display light.
- Server or printer status light.
- Very subtle plant or lamp motion.

### Phase 6 — Character pose and scale migration

Required standard poses per character:

- Idle front.
- Walk down/front.
- Walk up/back.
- Walk left.
- Walk right.
- Working-back seated.
- Review-back seated.
- Relax seated or standing.
- Interact standing.
- Optional reaction or wave.

Anchor rules:

- Standing poses anchor at the feet.
- Seated poses anchor at the seat or pelvis contact point.
- Waving changes the arm/upper body inside a stable body anchor.
- Do not center frames using the visible alpha bounds.

Migration order:

1. CEO.
2. One additional test employee.
3. Full employee roster.
4. Exceptional or non-standard characters.

### Phase 7 — Role-based monitor variety

Assign screen themes by role so five adjacent employees do not show identical displays:

```text
developer    -> coding
analyst      -> analytics
content      -> document
support      -> chat
manager      -> system
```

Use a per-monitor phase offset so all displays do not animate in sync:

```json
{
  "monitor": "office-monitor-v1",
  "screenTheme": "analytics",
  "keyframes": ["analytics-a", "analytics-b", "analytics-c"],
  "loop": "ping-pong",
  "frameDurationMs": 700,
  "phaseOffsetMs": 240
}
```

### Phase 8 — Interactions and ambient polish

Add interactions in this order:

1. Work at workstation.
2. Drink water.
3. Use vending machine.
4. Lounge or talk in the relaxation area.
5. Inspect server/printer or other optional props.

Keep ambient motion independent from navigation and character movement. An animated LED or screen must never change its world anchor.

### Phase 9 — Full-room QA

Test with:

- Ten employees active at once.
- Five workstations in each row.
- Mixed desk orientations.
- A full screen-theme set.
- Seated, walking, and interaction transitions.
- Relaxation-area navigation.
- Mobile and narrow viewport sizes.

Check:

- No desk collision overlap.
- Side orientations swap footprints correctly.
- Back views do not show front-only props.
- Monitor shells and screen overlays share the same viewport.
- Screen motion remains visible at 1:1 game scale.
- Ping-pong loops have no seam.
- Characters do not jump when changing state.
- No magenta fringe or alpha halo remains.
- No duplicate animation timers or unnecessary duplicated atlas pixels.

## 6. Asset production rules

Use these batch sizes:

- Workstation, monitor, server rack, and other interaction-critical assets: one asset per reference sheet.
- General furniture: three to five assets per sheet.
- Simple decoration: up to ten assets per concept sheet.

Treat large AI-generated sheets as source references. Before runtime use, every selected asset must be cropped, background-cleaned, normalized, anchored, footprinted, and validated.

For static assets, use aliases instead of storing duplicate animation pixels:

```json
{
  "frames": ["static", "static", "static"]
}
```

For animated assets, store only true keyframes and let the runtime play the ping-pong sequence.

## 7. Definition of done

The migration is complete when:

- The room reads as an orthographic office with work left/center and relaxation right.
- Ten workstations can be placed without collision overlap.
- Desk, monitor, screen content, chair, and character are separate composable layers.
- Furniture orientation changes its footprint correctly.
- CEO and the standard roster can work in a seated-back pose.
- Five screen themes animate visibly at the final monitor size.
- Screen loops use `A-B-C-B-A` without a visible seam.
- Main workstation, water, vending, and lounge interactions work.
- The existing control panel and workflow behavior remain intact.
- Asset validation and the repository check suite pass.

## 8. Recommended execution order

```text
1. Lock art and coordinate contracts.
2. Build one modular workstation.
3. Add one visible screen animation.
4. Fix seated anchors and occlusion.
5. Validate the workstation in the running office.
6. Recompose the map into a 5x2 employee cluster.
7. Add the other four screen themes.
8. Migrate the character roster.
9. Build the relaxation area.
10. Add interactions and ambient motion.
11. Run full-room and responsive QA.
```

The highest-risk work is not the number of furniture images. It is the shared contract between asset scale, monitor viewport, seated character anchors, foreground masks, and grid collision. Lock those interfaces first; the rest becomes repeatable asset production.
