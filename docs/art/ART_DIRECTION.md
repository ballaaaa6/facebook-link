# Office Art Direction

## Status

Concept C (Warm Studio) was selected on 2026-07-23 as the production art direction. Concepts A and B remain archived as future theme references.

These images are visual references, not production tilemaps. The selected concept will be decomposed into modular 32 px-grid architecture, furniture, equipment, decoration, and animation assets.

## Shared Requirements

- One connected open-plan office floor, not ten isolated rooms.
- One 24-column work floor that communicates Research & Growth, Creative,
  Release, and Systems/NOC through equipment and accents rather than separate
  room islands.
- One 12-column support floor containing service, pantry, lounge, mascot, and
  mission-review areas.
- Exactly ten active work seats with two reserved workstation modules.
- Short, collision-free walking routes between related teams.
- Top-down pixel-art perspective with consistent object scale and lighting.
- Responsive presentation: the Office scene keeps the existing task inspector
  beside it on desktop; mobile initially shows the complete work floor and
  scrolls horizontally to the support floor.
- Runtime text, charts, task status, and UI chrome must be rendered by code, not baked into artwork.
- All environment render boxes, floor footprints, map coordinates, and
  attachment offsets use integer tile units. Transparent art may occupy less
  than its declared render box.
- Production assets must be original, transparent where appropriate, atlas-ready, and validated before use.
- Work and support zones remain visually distinct through floor treatment and
  furniture grouping, not a wall or divider line.
- Workstations are assemblies: independent chair, desk, seated actor, monitor,
  keyboard, and optional equipment overlays.

## Concept A: Bright Operations

File: `assets/art/style-concepts/office-concept-a-bright-operations.png`

Strengths:

- Highest environmental readability.
- Clear ten-seat allocation and generous circulation.
- Neutral palette leaves room for colorful agent sprites.
- Strong fit for an always-on operational dashboard.

Risks:

- The central meeting footprint is larger than necessary.
- The office footprint is wide, so mobile must use a camera viewport rather than fit-to-width scaling.

## Concept B: Tech Operations

File: `assets/art/style-concepts/office-concept-b-tech-operations.png`

Strengths:

- Strongest automation/NOC identity.
- Compact workflow layout and short handoff routes.
- Excellent visual distinction between research, creative, release, and infrastructure work.

Risks:

- Dark floor values can reduce contrast for dark or blue agent sprites.
- Requires a brighter mobile render palette and accessible status highlights.

## Concept C: Warm Studio

File: `assets/art/style-concepts/office-concept-c-warm-studio.png`

Strengths:

- Best mobile readability and character contrast.
- Feels like a real office while retaining a polished management-game character.
- Clear team neighborhoods without heavy walls.
- Warm palette supports long-duration dashboard viewing.

Risks:

- The concept contains an illustrative mascot that must not be baked into production environment assets.
- The final production version should reduce decorative plants and preserve more walking space.

## Locked Direction

- Production default: Concept C (Warm Studio).
- Theme architecture: enabled from the first implementation.
- Future Theme A: Bright Operations skin using shared geometry and interactions.
- Future Theme B: Tech Operations skin using shared geometry and interactions.
- Concept A and B images remain references; they are not independent production asset sets.
- Shared furniture geometry, collision boxes, interaction anchors, and animation contracts must not change between themes.

## Production Guardrails

1. Lock one concept as the single style anchor.
2. Measure the imported Petdex sprite bounds before finalizing furniture scale.
3. Produce isolated assets by category instead of generating a complete sprite sheet in one pass.
4. Remove flat chroma-key backgrounds locally and validate alpha edges.
5. Quantize approved assets to the locked palette and align them to the world grid.
6. Store collisions, interaction anchors, seat points, facing direction, and foreground masks in asset manifests.
7. Render automated desktop and mobile test scenes before accepting any asset batch.
8. Never overwrite approved assets; create versioned replacements and update the manifest deliberately.

## Delivered Vertical Slice

The active Concept C scene now contains ten assembled workstations, two reserved
future modules, a support floor, a table-only meeting asset with four separate
chairs, and an independently animated mascot. Desktop and mobile camera
demonstrations are part of acceptance testing. The next art gate is a
purpose-built seated typing sheet for each character identity; the current
single-frame seated state intentionally reuses accepted source art behind desk
foreground masks.
