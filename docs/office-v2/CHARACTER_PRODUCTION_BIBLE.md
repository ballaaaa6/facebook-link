# Character Production Bible

## Character family

A character family separates identity, body art, animation clips, attachments,
selection feedback, and operational meaning. A character skin never determines
agent identity or task state.

## Production board

Record canvas size, world height range, ground contact, silhouette envelope,
palette roles, outline, lighting direction, supported facings, mirror policy,
clip tags, frame durations, attachment sockets, and reduced-motion states before
drawing the final sheet.

## Minimum first character

- Required screen facings: north-east, south-east, south-west, and north-west,
  mapped from world north, east, south, and west by Decision 0008.
- Required mirror metadata: an explicitly reviewed policy for every mirrored
  frame; mirroring never changes world-facing semantics.
- Required clips: idle, move, interact, and blocked feedback.
- Required attachments: one held-item socket and one interaction alignment
  socket per supported facing.
- Required fallback: an approved static frame inside the same family version.

## Animation constraints

Movement distance and interaction completion come from simulation ticks. Frames
preserve the ground-contact point within the declared tolerance. Anticipation,
overshoot, idle variation, effects, and sound are presentation only.

## Acceptance

Review the isolated contact sheet, motion at native and supported zoom stops,
socket alignment, crossing behind and in front of furniture, reduced motion,
all four world-to-screen facing mappings, asymmetric mirror rejection, and
missing-clip failure before placing the character in a populated room.
