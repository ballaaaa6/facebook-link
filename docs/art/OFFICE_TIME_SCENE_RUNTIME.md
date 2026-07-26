# Office Time and Window Scene Runtime

Status: Implemented for the modern Office C scene  
Scope: Runtime clock hands, seasonal window plates, and the modern background layer

## Purpose

The modern office background is a fixed architectural plate. Time-dependent
visuals are composited above it so the wall clock and the outside view can
change without regenerating or replacing the room.

The scene uses:

```text
modern background
+ seasonal/time-of-day window viewport
+ blank clock face
+ runtime hour hand
+ runtime minute hand
+ furniture, characters, and other map objects
```

## Locked geometry

The source background is `1672 x 941` pixels. The inner blue window viewport is
locked to:

```json
{
  "x": 528,
  "y": 133,
  "width": 507,
  "height": 209
}
```

The runtime manifest is
`assets/art/backgrounds/windows/office-window-viewport-v1.json`.
Window plates must contain only the outside view. The frame, wall, trim, and
interior lighting remain part of the modern background.

The clock face is mounted on the central structural post, centered over the
right-angle junction where the upper trim meets the post. It is intentionally
slightly smaller than the original upper-left placement so the post remains
visually dominant. Its source reference rectangle is:

```json
{
  "x": 1065,
  "y": 90,
  "width": 80,
  "height": 80
}
```

## Clock contract

Use three independent layers:

```text
clock-face-v1.png
clock-hour-hand-runtime-v1.png
clock-minute-hand-runtime-v1.png
```

The normalized hand layers share the same square canvas and center pivot as
the face. The renderer rotates the hand layers; it does not generate
minute-specific or hour-specific images.

Angles are calculated from the configured IANA timezone:

```ts
hourAngle = (hour % 12) * 30 + minute * 0.5 + second / 120
minuteAngle = minute * 6 + second * 0.1
```

The web scene currently uses `Asia/Bangkok` and refreshes at the next minute
boundary. The calculation includes seconds so a later smooth animation can be
enabled without changing the asset contract.

## Window contract

The current runtime uses a four-season visual calendar:

```text
spring, summer, autumn, winter
```

Month mapping is:

```text
March–May       spring
June–August     summer
September–November autumn
December–February winter
```

Time-of-day mapping is:

```text
05:00–08:59     dawn
09:00–16:59     day
17:00–19:59     evening
20:00–04:59     night
```

The renderer selects one of sixteen exact-fit plates:

```text
office-window-{season}-{timeOfDay}-v2.png
```

All plates use the same skyline composition and viewport dimensions. A change
of season or time-of-day changes only the selected plate; the wall, frame,
furniture anchors, navigation, and collision geometry do not move.

## Layer order

The modern office scene renders in this order:

```text
modern background plate
window view plate
blank clock face
clock hour hand
clock minute hand
zone overlays
map objects and furniture
characters and companions
inspection UI
```

The legacy map `wall-clock` object is intentionally removed. The runtime clock
is a scene layer so it can remain fixed to the modern background while its
hands change independently.

## Fallback and QA

- If time-zone formatting fails, use the configured default timezone and the
  `day` window plate.
- If a window plate is missing, fall back to the `summer-day` plate.
- Reduced-motion preferences may disable smooth transitions, but the clock
  still updates at minute boundaries.
- Test at `00:00`, `05:00`, `09:00`, `17:00`, and `20:00`.
- Test both hand pivots at `12:00`, `03:15`, `06:30`, and `09:45`.
- The window frame must remain visible on all viewport sizes.
