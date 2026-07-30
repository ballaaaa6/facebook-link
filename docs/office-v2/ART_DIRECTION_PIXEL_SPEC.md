# Art Direction and Pixel Specification

## Original visual language

Office V2 uses original characters, furniture, architecture, palette, composition,
and branding. Genre references may guide readability and management-game density,
but no proprietary pixel, character identity, exact room layout, or signature
composition is reproduced.

The accepted target is an original warm **2:1 dimetric/isometric pixel-art
management simulation** shown as a building cutaway. It is not orthographic
top-down art and it is not an attempt to reproduce a named studio's visual
identity. `FIRST_FLOOR_BRIEF.md` owns the target scene; this document owns the
measurable family rules.

## Pending numeric style profile

Bulk art remains blocked until Phase 1 records a versioned style profile with
character height, furniture and doorway scale, wall height, native canvas
classes, palette roles, outline width, light and shadow vector, transparent
padding, detail-density bands, and supported zoom stops. A reference image or
adjective is not a measurable style contract.

## Locked family brief

Before creating a family, record:

- viewpoint and projection compatibility;
- world scale and pixel density;
- canvas and transparent padding policy;
- palette roles and maximum uncontrolled color variance;
- outline, edge, material, lighting, and shadow rules;
- anchor, ground contact, footprint, height, and sockets;
- required orientations, variants, clips, and review board;
- target viewport and nearest-neighbor scaling behavior.

These values are versioned. A changed viewpoint or density creates a new family
version rather than silent rework.

## Pixel integrity

- Runtime scaling uses approved integer or tested camera scales.
- Filtering and compression must preserve intended hard edges.
- Semi-transparent edge pixels are validated against light and dark boards.
- Shadows and effects are separate when they need independent depth or state.
- Decorative overhang never changes geometry metadata.

## Review order

Review silhouette and scale first, geometry and contacts second, palette and
materials third, animation fourth, and populated composition last. A beautiful
contact sheet cannot pass if footprint, anchor, or sockets are wrong.

## Acceptance

An asset passes only when neutral-board geometry, alpha edges, world placement,
depth contacts, required states, provenance, and runtime import all pass. Owner
visual approval is an additional gate, not a replacement for technical evidence.
