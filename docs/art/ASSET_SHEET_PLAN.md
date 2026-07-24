# Controlled Asset Sheet Plan

## Goal

Reduce generation latency without sacrificing usable geometry. Static furniture and props are generated as controlled 4x4 asset sheets. Identity-sensitive character work animations use one character per sheet.

## Shared Sheet Contract

- Square contact sheet with a logical 4x4 grid.
- One isolated asset or frame per cell.
- Large uniform magenta chroma-key background.
- No cell labels, text, logos, watermarks, ground planes, cast shadows, or overlapping assets.
- Generous empty padding around every object.
- Fixed top-down perspective, light direction, outline weight, and Concept C palette.
- Cell order is defined outside the image in a JSON manifest.
- Failed cells are regenerated as a targeted row or smaller sheet; accepted cells are not regenerated.

## Environment Sheets

1. `env-01-core-furniture`: four furniture families by four orientations.
2. `env-02-workstations`: computer, monitor, laptop, printer families by idle/active/waiting/error states.
3. `env-03-research-creative`: sixteen zone-specific research and creative props.
4. `env-04-release-noc`: sixteen publishing, QA, networking, and server props.
5. `env-05-lounge-large`: sofa, coffee counter, tables, storage, and mascot-resting furniture.
6. `env-06-decor-small`: plants, cups, documents, boxes, bins, lamps, and small decoration.
7. `env-07-animated-mechanical`: four mechanical props with four key frames each.
8. `env-08-animated-ambient`: four ambient props with four key frames each.
9. `office-utility-c-v1`: deterministic vector utility props for meeting, pantry, storage, presentation, and safety.

Floors, walls, rugs, glass partitions, and simple architectural tiles are generated deterministically from the locked palette so their edges tile perfectly. They are not delegated to image generation.

Small geometry-simple utility props may use authored SVGs when a controlled raster sheet would add no visual value. They still require a manifest, registry entry, and validation report.

## Character Sheets

- One selected character per image-generation call.
- Four columns: seated idle, typing left, typing right, mouse/review.
- Rows are reserved for controlled revisions or additional frames of the same character only.
- Original character image is always supplied as the identity anchor.
- Left/right movement mirrors are created at runtime where safe.
- Chair movement, sitting transition, and standing transition are code-driven to avoid generating unnecessary frames.

## Extraction Pipeline

1. Remove chroma key from the full sheet.
2. Slice by manifest cell coordinates.
3. Find visible bounds inside each cell.
4. Add canonical padding and align to the 32 px world grid.
5. Quantize to the locked palette.
6. Validate alpha, bounds, palette, perspective, and anchor safety.
7. Pack accepted assets into atlases.
8. Record collisions and interaction anchors separately from theme images.

## Theme Strategy

- Concept C is the authored source skin.
- Theme A and B initially use palette maps, material tokens, lighting overlays, and UI variables.
- Shared geometry and animation manifests remain unchanged.
- Only genuinely theme-specific props are generated later, preferably one controlled sheet per theme.

## Acceptance Gate

Run one calibration sheet first. Continue with 4x4 batching only if at least 12 of 16 cells are usable and perspective-consistent. Otherwise reduce density to a 3x3 sheet before producing the remaining categories.

## Estimated Generation Work

- C environment: eight controlled sheets.
- Pilot character: one sheet for the vertical slice.
- Full active roster: ten character sheets total.
- Initial image generation: approximately 30-90 minutes depending on retries.
- Extraction and asset QA are separate from generation and are expected to take longer than the raw image calls.
