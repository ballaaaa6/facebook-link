# Core Furniture C v2

## Table-only meeting asset

`table.meeting.empty.png` was generated with the built-in image generator using
the approved Concept C reference and the previous meeting-table raster as
geometry references.

Prompt:

> Precise object edit for a production game asset. Remove every chair from the
> meeting-table reference. Preserve the warm oak tabletop, pixel-art outline,
> top-down three-quarter perspective, lighting, proportions, and table legs.
> Output the table only on a flat #ff00ff chroma-key background, with no labels,
> text, floor, room, people, extra props, shadows beyond the object's own
> contact treatment, or watermark.

The chroma key was removed locally, the result was resized to the declared
integer render box, quantized, and checked for alpha bounds and chroma residue.
