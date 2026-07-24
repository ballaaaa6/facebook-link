# Runtime character roster

The pilot office renders ten active agent characters plus one companion. Each directory contains the local Petdex `spritesheet.webp`, a lossless nearest-neighbor `runtime-spritesheet.webp`, and its source `pet.json`; `registry.json` is the runtime mapping used by the web app. Runtime sheets use 48 x 52 px frames so the browser does not repeatedly resample the 192 x 208 px source frames while characters animate.

These Petdex characters are prototype-only and remain marked `pending-commercial-review`. Before a public or paid release, replace any character whose commercial rights are not explicitly cleared while keeping the same 8x9 sheet geometry and role mapping.

The office map owns placement. Every agent has a `seat`, `stand`, and desk `collision` rectangle so rendering can keep characters out of furniture and preserve a future pathfinding boundary.
