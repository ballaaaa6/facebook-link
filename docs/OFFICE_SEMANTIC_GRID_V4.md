# Office Semantic Grid v4

Status: Complete and current
Updated: 2026-07-29

Office Semantic Grid v4 is the Active Office background. It preserves all
1,032 semantic cell assignments and the v2 window and floor corrections while
fixing the rejected v3 left-pillar base.

## Completed pillar alignment

| Pillar | Semantic range | Exact target rectangle | Source crop |
| --- | --- | --- | --- |
| Left | `A1:B11` | `x 0..77`, `y 0..430` | `x 0..83`, `y 0..415` |
| Center | `AB1:AD11` | `x 1050..1166`, `y 0..430` | `x 1065..1145`, `y 0..441` |
| Right | `AP1:AQ11` | `x 1594..1671`, `y 0..430` | `x 1585..1671`, `y 0..441` |

The left source crop ends immediately after the original wood base. Only that
wood and base are stretched to fill `A1:B11`; carpet pixels are not included.
Row 12 begins at pixel `y=431`, so all three pillars stop before it.

## Active runtime

- Current background:
  `assets/art/backgrounds/office-c-background-modern-v6-current.png`
- Runtime consumer:
  `apps/web/src/features/office/components/officeSceneRuntime.ts`
- Window overlay: `x=527`, `y=133`, `width=470`, `height=204`
- Clock overlay: `x=1069`, `y=90`, `width=80`, `height=80`
- Active navigation and collision data continue to use
  `assets/game/maps/office-c-v2.json`; this promotion changes the background
  and its overlay references, not gameplay geometry.

Run `npm run art:office-semantic-grid:v4` to rebuild the completed background
and review images. Run `npm run art:office-semantic-grid:v4:check` for the
portable hash and contract check used by CI.
