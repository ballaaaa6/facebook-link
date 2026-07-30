# Characters, Animation, and Held Props

## Character definition

A character definition references an original asset family and declares identity,
world scale, ground contact, facing set, semantic clip map, attachment sockets,
and accessibility label. Character appearance never supplies operational identity.

## Minimum animation set

The first character needs only the facings required by the first slice and clips
for idle, move, interact, and blocked feedback. Missing semantic clips use an
explicit approved static state; they never fall back to another branch or asset.

Clips are data containing frames, duration, loop mode, and presentation events.
They do not complete tasks or move the world actor.

## Facing

Facing is simulation or interaction state expressed in world directions. The
presentation layer maps it to available art, including a documented mirror policy
when permitted by the art specification.

## Held props

Held items are separate entities attached through named character and object
sockets. Attachment metadata declares ownership, front/behind ordering, transfer,
and interruption behavior. Props are not permanently painted into a general
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
