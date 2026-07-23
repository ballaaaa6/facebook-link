# Warm Studio Vertical Slice BOM

## Production Rule

Only assets referenced by `assets/game/maps/office-c-v1.json` are produced for the first vertical slice. Extra catalog variants are deferred until a real layout requires them.

## Core Furniture

| Asset | Initial quantity | Notes |
| --- | ---: | --- |
| Standard desk, up-facing | 7 | Shared by research and release agents. |
| Creative desk, up-facing | 2 | Uses equipment overlays for copy and visual work. |
| NOC desk, up-facing | 1 | Uses multi-monitor and network overlays. |
| Office chair, up-facing | 10 | Seat point and foreground mask are shared. |
| Mission table | 1 | Central handoff and review location. |
| Sectional sofa | 1 | Lounge idle location. |
| Coffee counter | 1 | Shared interaction point. |
| Low bookshelf | 4 | Zone boundaries and visual storage. |
| Filing cabinet | 3 | Research, release, and NOC storage. |
| Planter divider | 4 | Soft zone separation without walls. |
| Round pet bed | 1 | Mascot idle location. |

## Equipment Overlay Targets

- Standard single-monitor workstation.
- Dual-monitor analytics workstation.
- Creative drawing-tablet workstation.
- Visual production monitor and camera station.
- Multi-device publishing preview station.
- NOC multi-monitor console.
- Server rack, router, UPS, printer, coffee machine, water dispenser, CCTV, and studio light.

## Code-Generated Assets

- Floors, walls, rugs, glass partitions, collision geometry, and simple shadows.
- Monitor content, charts, task status, server LEDs, alert glow, coffee steam, and camera rotation.
- Theme A/B palette maps, lighting overlays, and UI color tokens.
