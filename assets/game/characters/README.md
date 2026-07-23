# Runtime character roster

The pilot office renders ten active agent characters plus one companion. Each directory contains the local Petdex `spritesheet.webp` and its source `pet.json`; `registry.json` is the runtime mapping used by the web app.

These Petdex characters are prototype-only and remain marked `pending-commercial-review`. Before a public or paid release, replace any character whose commercial rights are not explicitly cleared while keeping the same 8x9 sheet geometry and role mapping.

The office map owns placement. Every agent has a `seat`, `stand`, and desk `collision` rectangle so rendering can keep characters out of furniture and preserve a future pathfinding boundary.
