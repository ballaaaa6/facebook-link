# Characters, Animation, and Held Props

## Character definition

A character definition references an authoritative geometry profile and an
original asset family, then declares identity, facing compatibility, semantic
clip map, and accessibility label. Geometry owns the world scale and
world/sub-cell sockets. The asset owns frame bounds and pixel contacts that are
validated against those references. Character appearance never supplies
operational identity.

`character-definition.schema.json` owns reusable identity and compatibility
references. `semantic-variant.schema.json` maps an identity/role combination
to an operational state, semantic animation state, held-prop state, facility
state, connectivity mask, and interaction socket. These axes are separate so a
role change does not silently create a new identity or a new durable task.
Every composite key resolves to an exact versioned asset variant or to an
explicit static fallback.

## Minimum animation set

The first character needs only the facings required by the first slice and clips
for idle, move, interact, and blocked feedback. Missing semantic clips use an
explicit approved static state; they never fall back to another branch or asset.

Clips are data containing frames, duration, loop mode, and presentation events.
They do not complete tasks or move the world actor.

## Facing

Facing is simulation or interaction state expressed as world `north`, `east`,
`south`, or `west`. Under `office-projection-v1`, presentation maps them to
`north-east`, `south-east`, `south-west`, and `north-west` respectively. The
mapping is owned by Decision 0008 rather than individual clips or components.

Mirror policy is separate presentation metadata. A mirrored frame still
represents the mapped screen facing and cannot rewrite the actor's world-facing
state. The V1 animation schema remains frozen; the later versioned character
contract will distinguish world-facing inputs from screen-facing art keys.

## Held props

Held items are separate entities attached through named geometry socket
references and asset-owned pixel contacts. Attachment metadata declares
ownership, front/behind ordering, transfer, and interruption behavior without
redefining a world socket. Props are not permanently painted into a general
character sheet.

## Readability

Characters keep a consistent world scale, silhouette range, contact point, and
outline treatment. Selection, focus, blocked state, and reduced motion must be
understandable without relying only on animation or color.

## Required evidence

- Clip timing cannot alter simulation traces.
- Every frame preserves the approved contact-point tolerance.
- Socket attachment passes all required facings and mirrored cases.
- Interrupted handoffs leave one declared owner for every held item.
- Missing clips and assets fail with an identifiable definition and version.
- Unsupported semantic variants and workstation masks fail with stable
  diagnostics rather than nearest-looking pixels.
