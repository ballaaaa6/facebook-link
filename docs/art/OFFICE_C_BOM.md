# Warm Studio Vertical Slice BOM

## Production Rule

Only assets referenced by `assets/game/maps/office-c-v1.json` are rendered for the first vertical slice. Extra catalog variants remain deferred until a real layout requires them.

## Core Furniture

| Asset | Initial quantity | Notes |
| --- | ---: | --- |
| Standard desk, up-facing | 7 | Shared by research and release agents. |
| Creative desk, up-facing | 2 | Uses equipment overlays for copy and visual work. |
| NOC desk, up-facing | 1 | Uses multi-monitor and network overlays. |
| Office chair, up-facing | 10 | Seat point and foreground mask are shared. |
| Mission table | 1 | Central handoff and review location. |
| Meeting chair | 4 | Added around the mission table for handoff reviews. |
| Sectional sofa | 1 | Lounge idle location. |
| Lounge chair | 2 | Extends the lounge to five or more physical seats. |
| Coffee counter | 1 | Shared interaction point. |
| Low bookshelf | 4 | Zone boundaries and visual storage. |
| Filing cabinet | 3 | Research, creative, and NOC storage. |
| Planter divider | 4 | Soft zone separation without walls. |
| Staff locker | 1 | Shared personal storage at the lounge entrance. |
| Coat rack | 1 | Bags and outerwear by the entrance. |
| Refrigerator | 1 | Pantry cold storage. |
| Microwave | 1 | Pantry reheating point. |
| Sink | 1 | Pantry cleanup point. |
| Pantry shelf | 1 | Dry goods and cups. |
| Round pet bed | 1 | Mascot idle location. |

## Equipment Overlay Targets

- Standard single-monitor workstation (4).
- Dual-monitor analytics workstation (1).
- Creative drawing-tablet workstation (1).
- Visual production monitor and camera station (1).
- Multi-device publishing preview station (1).
- NOC multi-monitor console (1).
- Server racks, network stack, printer, coffee machine, water dispenser, CCTV, and studio light.
- UPS and cable trays for the NOC and publishing workstation.
- Whiteboard and wall display for mission review.
- First-aid kit, smoke detectors, and emergency lights.

## Rendered Scene Layers

The map's `objects` array is the source of truth for the visible office scene. Each object has either a logical grid position or a parent/slot attachment, plus a rendering layer and anchor. The web renderer resolves image scale and physical support (`floor`, `wall`, `ceiling`, `desk-surface`, `table-surface`, `counter-surface`, `credenza-surface`, or `rack-surface`) through the office asset registry so furniture, equipment, decor, and characters keep believable proportions across responsive viewports.

Desk equipment must attach to its workstation rather than duplicate the desk coordinates. Wall equipment must use a wall anchor, and floor props must use a bottom contact point. Storage props stay at zone edges so the central mission and walking lanes remain clear.

## Code-Generated Assets

- Floors, walls, rugs, glass partitions, collision geometry, and simple shadows.
- Monitor content, charts, task status, server LEDs, alert glow, coffee steam, and camera rotation.
- Theme A/B palette maps, lighting overlays, and UI color tokens.

## Utility Additions

The office utility sheet is a deterministic SVG asset batch for small, geometry-simple objects that do not require another raster generation pass. It adds meeting seating, pantry appliances, storage, presentation surfaces, recycling, and safety equipment while keeping the same warm-studio palette.
