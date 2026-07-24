# Runtime character roster

The pilot office renders ten active agent characters plus one companion. Each directory contains the local Petdex `spritesheet.webp`, preserved v1 derivatives, active v2 1x/2x runtime sheets, and its source `pet.json`; `registry.json` is the runtime mapping used by the web app.

The active v2 pipeline treats the roster as smooth illustrated raster art, not
pixel art. Its 96 x 104 px 1x frames use Lanczos downsampling with a mild
sharpening pass; its 192 x 208 px 2x frames preserve detail for high-density
displays. CSS `image-set` selects the density tier and normal image rendering
performs any remaining downscale.

These Petdex characters are prototype-only and remain marked `pending-commercial-review`. Before a public or paid release, replace any character whose commercial rights are not explicitly cleared while keeping the same 8x9 sheet geometry and role mapping.

The office map owns placement. Every agent has a `seat`, `stand`, and desk `collision` rectangle so rendering can keep characters out of furniture and preserve a future pathfinding boundary.
