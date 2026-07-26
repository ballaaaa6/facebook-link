# Office Asset Creation Guide

Status: Production guide  
Scope: Office assets created for the latest orthographic pixel-art reference  
Related plan: `docs/art/OFFICE_REF_MIGRATION_ROADMAP.md`

## 1. Purpose

This guide defines the repeatable workflow for creating, extracting, registering, and validating office furniture, equipment, screen overlays, and character poses.

The latest office reference is a layered, orthographic scene. It is not a single background image. Every interactive or visible object must be created so it can be placed, rotated, occluded, animated, and validated independently.

For the office migration, this guide takes precedence over older office-specific sheet layouts. Generic chroma-key extraction and 32 px grid rules remain applicable.

## 2. Production principles

1. Build one calibrated vertical slice before producing a large batch.
2. Separate physical furniture from equipment and screen content.
3. Treat `anchor`, `footprint`, and `viewport` as contracts, not visual guesses.
4. Generate one consistent turnaround for an object before generating animation.
5. Animate local details while keeping the world anchor and silhouette stable.
6. Use aliases for static frames instead of duplicating identical pixel data.
7. Use original designs with no copied brands, logos, characters, or UI layouts.
8. Treat generated sheets as source material; crop, normalize, and validate before runtime use.

## 3. Shared visual contract

Lock these values before creating production assets:

- 32 px integer world tile grid.
- Orthographic straight-on pixel-art presentation.
- Concept C warm studio palette unless a theme-specific exception is approved.
- Consistent dark outline weight.
- Consistent upper-left light direction.
- No baked runtime labels, HUD, task text, or branded UI.
- No perspective convergence or isometric camera.
- No transparent padding changes between animation frames.

Use the same pixel scale for every view of one asset. Do not create the front at one camera distance and the back at another.

## 4. Asset classes

### 4.1 Furniture

Furniture defines physical room geometry and collision:

- Desk.
- Chair.
- Sofa.
- Coffee table.
- Bookshelf.
- Vending machine.
- Water dispenser.
- Server rack.

Furniture must have an explicit floor footprint and an anchor.

### 4.2 Equipment

Equipment is a separate object attached to furniture or placed on the floor:

- Monitor shell.
- Keyboard.
- Mouse.
- Printer.
- Camera.
- Network equipment.

Equipment must declare its parent attachment or floor anchor. Do not bake equipment into a desk if the equipment can vary by employee role.

### 4.3 Screen overlays

Screen overlays are content-only images placed inside a monitor shell's fixed viewport:

- Coding.
- Analytics.
- Document.
- Chat/support.
- System dashboard.

Screen overlays must not contain a monitor bezel, stand, desk, or keyboard.

### 4.4 Characters

Characters are animated actors with independent world anchors:

- Standing movement.
- Seated work.
- Review.
- Relax.
- Interaction.

The seated anchor is the seat or pelvis contact point, not the center of the visible alpha bounds.

## 5. Furniture creation workflow

### Step 1 — Define the physical contract

Before prompting, write the intended dimensions:

```json
{
  "id": "office-desk-v1",
  "renderBox": {
    "width": 4,
    "height": 2
  },
  "footprint": {
    "width": 4,
    "depth": 2
  },
  "anchor": "center"
}
```

`renderBox` is the visible image area. `footprint` is the floor contact area used for collision. A tall object can have a small floor footprint and a taller render box.

### Step 2 — Create the turnaround

For reusable furniture, create one consistent design in four views:

```text
front
back
left
right
```

For rectangular furniture rotated 90 degrees:

```text
front/back: width 4, depth 2
left/right: width 2, depth 4
```

Do not assume a simple rectangle for irregular furniture. Use orientation-specific masks when arms, protrusions, wheels, or attached props change the collision shape.

Required turnaround invariants:

- Front and back preserve the same overall width.
- Left and right preserve the same depth.
- The object uses one consistent height and material design.
- Front-only props do not appear in the back view.
- Side views show depth rather than a compressed front view.
- All views share a common baseline and anchor.

### Step 3 — Extract the physical asset

After generation:

1. Remove the chroma-key background.
2. Crop each orientation into its own cell.
3. Preserve the dark outline.
4. Normalize to the declared render box.
5. Align the declared anchor to the integer grid.
6. Record the footprint and any foreground mask.
7. Validate front/back/side proportions at 1:1 scale.

### Step 4 — Add optional animation

Do not animate the entire furniture silhouette. Add a separate overlay for local motion:

- Server LEDs.
- Vending display.
- Water dispenser button.
- Printer paper.
- Lamp brightness.
- Fan or status indicator.

The base furniture must retain the same anchor, dimensions, and collision footprint in every frame.

## 6. Equipment and monitor workflow

### 6.1 Monitor shell

Create a monitor shell independently:

```text
monitor-front
monitor-back
monitor-left
monitor-right
```

The shell contains:

- Bezel.
- Housing.
- Stand.
- Buttons or indicator light if physically visible.

The shell does not contain role-specific screen content.

### 6.2 Screen viewport

Measure the inner screen rectangle from the front monitor shell and lock it:

```json
{
  "monitor": "office-monitor-v1",
  "viewport": {
    "x": 8,
    "y": 6,
    "width": 52,
    "height": 30
  }
}
```

Every screen theme and frame must use this exact viewport size. Do not let the generator choose a different screen rectangle per theme.

### 6.3 Screen themes

Start with five themes so five adjacent workstations can look different:

1. Coding editor.
2. Analytics dashboard.
3. Document/content workspace.
4. Chat/support inbox.
5. System/management dashboard.

Each theme has three keyframes:

```text
A, B, C
```

Runtime playback is ping-pong:

```text
A -> B -> C -> B -> A
```

The first and final states must be visually related. Keep 65–75% of the screen layout static and animate a visible 20–35% region.

Recommended motion:

- Coding: highlighted block or progress line moves several rows.
- Analytics: large bars, line point, and status ring change.
- Document: progress bar, section highlight, or thumbnail moves.
- Chat: one message bubble enters and an unread badge changes.
- System: CPU/memory bars and status dots pulse.

Avoid:

- Cursor-only animation that disappears at small scale.
- Full-screen redesign between frames.
- Screen content that scrolls forever without returning.
- A direct `C -> A` cut when the endpoints are visually different.

### 6.4 Screen overlay extraction

Screen overlays must contain only the content rectangle. Remove:

- Monitor bezel.
- Monitor frame.
- Stand.
- Desk.
- Keyboard.

The runtime composes:

```text
monitor shell
+ screen overlay
```

Store true keyframes once:

```json
{
  "keyframes": ["analytics-a", "analytics-b", "analytics-c"],
  "loop": "ping-pong",
  "frameDurationMs": 700
}
```

Do not store duplicate copies of `B` merely to represent the return leg.

## 7. Character creation workflow

### 7.1 Standard pose contract

Every production character should support the following semantic states where applicable:

```text
idle-front
walk-down
walk-up
walk-left
walk-right
working-back-seated
review-back-seated
relax-seated-or-standing
interact-standing
reaction-or-wave
```

The first vertical slice only needs:

```text
walk in four directions
working-back-seated
review-back-seated
idle-front
```

Add optional reactions after the workstation anchor is stable.

### 7.2 Character anchors

Standing characters anchor at the feet. Seated characters anchor at the seat or pelvis contact point.

Do not:

- Center a frame using its visible alpha bounds.
- Shift the whole body when an arm moves.
- Use the standing foot anchor for a seated pose.
- Hide a standing character behind a desk as a substitute for a seated pose.

For action poses such as waving, keep the body anchor fixed and move only the hand or upper body inside the same frame envelope.

### 7.3 Character prompt requirements

Character prompts must specify:

- Original character identity.
- Straight orthographic game sprite style.
- Fixed body proportions.
- Exact pose.
- Stable feet/pelvis anchor.
- No extra props unless requested.
- No text, logos, or watermark.
- Same frame size and baseline across the sheet.

For a seated-back work pose, explicitly request:

- Back-facing head and shoulders.
- Hands reaching toward the keyboard.
- Lower body hidden by the desk foreground.
- Pelvis aligned to the chair contact point.
- Stable silhouette across the animation frames.

### 7.4 Character extraction

After generation:

1. Remove chroma key.
2. Slice frames by manifest.
3. Normalize the canonical standing and seated boxes separately.
4. Align standing feet and seated pelvis/seat anchors.
5. Validate row-to-row scale.
6. Pack accepted frames into the character atlas.
7. Record any per-character scale override explicitly.

## 8. Prompt templates

### 8.1 Furniture turnaround

```text
Create one original orthographic pixel-art [FURNITURE] as a four-view turnaround:
front, back, left side, right side.
Use one exact design and preserve width, depth, height, material, outline,
lighting direction, and anchor across every view.
The front and back have the same width. The side views correctly rotate the
object and expose its depth. Front-only props must not appear in the back view.
Place one isolated object per equal cell on a flat #FF00FF chroma-key background.
No people, room, text, logos, watermark, perspective, or isometric camera.
```

### 8.2 Screen animation

```text
Create a screen-content-only sprite strip for a fixed [WIDTH]x[HEIGHT] viewport.
Produce three keyframes A, B, C of one [THEME] dashboard.
Keep the viewport, toolbar, sidebar, and major layout fixed.
Animate one large readable region so 20–35% of the pixels visibly change from A to C.
Design the sequence for runtime ping-pong playback A-B-C-B-A.
Do not include a monitor bezel, stand, desk, keyboard, text labels outside the UI,
logos, watermark, or any object outside the viewport.
```

### 8.3 Character turnaround

```text
Create one original [CHARACTER] in a fixed orthographic game-sprite sheet.
Preserve body proportions, frame size, baseline, feet anchor, and silhouette.
Include idle-front, walk-up, walk-down, walk-left, walk-right, and
working-back-seated poses.
For the seated pose, align the pelvis to the chair contact point and keep the
lower body ready to be hidden by the desk foreground mask.
No identity drift, extra props, logos, text, watermark, or perspective.
```

## 9. Naming and manifest conventions

Use English, stable, descriptive names:

```text
office-desk-v1-front.webp
office-desk-v1-back.webp
office-desk-v1-left.webp
office-desk-v1-right.webp

office-monitor-v1-front.webp
screen-analytics-v1-a.webp
screen-analytics-v1-b.webp
screen-analytics-v1-c.webp

ceo-kai-working-back-v1.webp
ceo-kai-review-back-v1.webp
```

Suggested furniture manifest:

```json
{
  "id": "office-desk-v1",
  "orientations": {
    "front": "office-desk-v1-front",
    "back": "office-desk-v1-back",
    "left": "office-desk-v1-left",
    "right": "office-desk-v1-right"
  },
  "footprints": {
    "front": { "width": 4, "depth": 2 },
    "back": { "width": 4, "depth": 2 },
    "left": { "width": 2, "depth": 4 },
    "right": { "width": 2, "depth": 4 }
  },
  "anchor": "center",
  "foregroundMask": "office-desk-v1-front-mask"
}
```

Suggested workstation manifest:

```json
{
  "id": "workstation-v1",
  "desk": "office-desk-v1",
  "chair": "office-chair-v1",
  "monitor": "office-monitor-v1",
  "screenTheme": "analytics",
  "screenLoop": "ping-pong",
  "seatAnchor": { "x": 2, "y": 3 },
  "interactionAnchor": { "x": 2, "y": 4 }
}
```

## 10. QA checklist

### Geometry

- [ ] All views use the same intended object design.
- [ ] Front/back width matches.
- [ ] Side depth matches.
- [ ] Footprint is integer-aligned.
- [ ] Irregular objects use orientation-specific masks.
- [ ] Anchor does not change between frames.

### Layering

- [ ] Desk, monitor, screen, props, and character are separate.
- [ ] Foreground mask hides the seated lower body.
- [ ] Screen overlay is clipped to the monitor viewport.
- [ ] Back views do not show front-only props.

### Animation

- [ ] Static assets use aliases rather than duplicate pixels.
- [ ] Animated assets keep a fixed silhouette.
- [ ] Screen movement is visible at final 1:1 size.
- [ ] Screen playback uses `A-B-C-B-A`.
- [ ] No direct endpoint seam is visible.
- [ ] Independent phase offsets prevent synchronized displays.

### Extraction

- [ ] Chroma key is removed.
- [ ] No magenta fringe or alpha halo remains.
- [ ] Transparent padding does not alter the floor footprint.
- [ ] Render box and collision footprint are recorded separately.
- [ ] Accepted files are packed and registered.

### In-game review

- [ ] One workstation works before batching.
- [ ] Ten workstations do not overlap.
- [ ] Characters can reach, sit, work, and leave.
- [ ] Screen content remains readable behind the character.
- [ ] Furniture remains stable when orientation changes.
- [ ] Mobile and narrow viewports remain usable.

## 11. Recommended production order

```text
1. Lock grid, palette, viewport, and anchor contracts.
2. Create and validate one bare desk.
3. Create and validate one monitor shell.
4. Create one analytics screen strip and test ping-pong playback.
5. Create one chair and one seated-back character pose.
6. Assemble and validate one workstation in the running office.
7. Produce the remaining four screen themes.
8. Produce the remaining workstation furniture and equipment.
9. Migrate the character roster.
10. Build the relaxation-area asset set.
11. Add ambient animations and interactions.
12. Run the full-room QA gate.
```

The best quality and speed come from locking the shared interfaces first. Once the desk, monitor viewport, screen overlay, seated anchor, and foreground mask are correct, the rest of the office becomes controlled asset production instead of repeated one-off fixes.
