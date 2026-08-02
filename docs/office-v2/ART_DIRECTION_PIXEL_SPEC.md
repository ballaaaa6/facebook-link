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

## Versioned numeric style profile

`style-profile.schema.json` owns the measurable `office-style-profile-v1`
contract. It records character standing and seated envelopes, furniture and
structure scale, wall/cutaway height, native canvas classes, transparent
padding, palette roles and bounded variance, outline width, light and shadow
vectors, material-edge rules, detail-density bands, signage/font policy,
contact/socket tolerance, native scale, zoom stops, and nearest-neighbor
filtering. The profile is versioned and referenced by exact ID/version from
asset families and sprite frames.

The Phase 1 fixture is an engineering specification and is not a visual-owner
approval. A product-owner review must approve generated scale, palette,
light/shadow, density, and alpha boards before final pixels or a production
family are admitted. A reference image or adjective is never a measurable
style contract.

## Locked family brief

Before creating a family, record:

- viewpoint and projection compatibility;
- world scale and pixel density;
- canvas and transparent padding policy;
- palette roles and maximum uncontrolled color variance;
- outline, edge, material, lighting, and shadow rules;
- the authoritative geometry ID/version for footprint, anchor basis,
  orientations, and world/sub-cell sockets;
- asset-owned sprite origin, pixel contacts, frame bounds, visual height, and
  presentation attachments;
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
- A frame owns only sprite-pixel facts; footprint, clearance, world sockets,
  use slots, and orientation transforms remain in the referenced geometry.
- Atlas trimming and rotation are forbidden by the first versioned atlas
  contract until a later version proves their invariance.

## Review order

Review silhouette and scale first, geometry and contacts second, palette and
materials third, animation fourth, and populated composition last. A beautiful
contact sheet cannot pass if its geometry reference or pixel-contact agreement
is wrong.

## Acceptance

An asset passes only when neutral-board geometry, alpha edges, world placement,
depth contacts, required states, provenance, and runtime import all pass. Owner
visual approval is an additional gate, not a replacement for technical evidence.
