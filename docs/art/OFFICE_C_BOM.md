# Warm Studio Office BOM

## Production Rule

Only assets referenced by `assets/game/maps/office-c-v2.json` are rendered for the active integer-grid scene. Extra catalog variants remain deferred until a real layout requires them.

## Core Furniture

| Asset | Initial quantity | Notes |
| --- | ---: | --- |
| Standard desk, up-facing | 7 | Shared by research and release agents. |
| Creative desk, up-facing | 2 | Uses equipment overlays for copy and visual work. |
| NOC desk, up-facing | 1 | Uses multi-monitor and network overlays. |
| Office chair, up-facing | 10 | Seat point and foreground mask are shared. |
| Empty meeting table | 1 | Table-only raster; seats are never baked into it. |
| Meeting chair | 4 | Independent seats around the meeting table. |
| Sectional sofa | 1 | Lounge idle location. |
| Coffee counter | 1 | Shared interaction point. |
| Printer credenza | 1 | Printing facility with supported surface attachment. |
| Server rack | 2 | Systems support equipment. |
| Water dispenser | 1 | Shared interaction point. |
| Tall plant | 4 | Work-floor rhythm and edge framing. |
| Small plant | 7 | Desk spacing and support-floor decoration. |
| Planter divider | 1 | Soft support-zone structure without a wall. |
| Round pet bed | 1 | Mascot idle location. |
| Entry rug | 1 | Code-rendered entry cue; no decorative door. |

## Equipment Overlay Targets

- Standard single-monitor workstation (4).
- Dual-monitor analytics workstation (1).
- Creative drawing-tablet workstation (1).
- Visual production monitor and camera station (1).
- Multi-device publishing preview station (1).
- NOC multi-monitor console (1).
- Server racks, printer, coffee machine, water dispenser, camera, and studio light.

## Rendered Scene Layers

The map's `objects` array is the source of truth for the visible office scene. Each object has either a logical grid position or a parent/slot attachment, plus a rendering layer and anchor. The web renderer resolves image scale and physical support (`floor`, `wall`, `ceiling`, `desk-surface`, `table-surface`, `counter-surface`, `credenza-surface`, or `rack-surface`) through the office asset registry so furniture, equipment, decor, and characters keep believable proportions across responsive viewports.

Desk equipment must attach to its workstation rather than duplicate the desk coordinates. Wall equipment must use a wall anchor, and floor props must use a bottom contact point. Storage props stay at zone edges so the central mission and walking lanes remain clear.

## Code-Generated Assets

- Floors, walls, rugs, collision geometry, and simple shadows.
- Monitor content, charts, task status, server LEDs, alert glow, coffee steam, and camera rotation.
- Theme A/B palette maps, lighting overlays, and UI color tokens.

## Retired Utility Batch

`office-utility-c-v1` remains archived for provenance but is not imported by the
active Office runtime. Its flat SVG presentation did not match the shaded Warm
Studio raster language. New visible furniture must be produced against Concept
C, extracted to transparent raster output, registered with integer geometry,
and accepted through desktop and mobile scene review.
