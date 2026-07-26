# Runtime character roster

The pilot office renders ten active agent characters plus one companion. Each directory contains the source or local `spritesheet.webp`, preserved v1 derivatives where applicable, active v2 1x/2x runtime sheets, and its source `pet.json`; `registry.json` is the runtime mapping used by the web app. Characters that are no longer in the active roster remain in this directory as archived prototype art until a replacement is approved.

The active v2 pipeline treats the roster as smooth illustrated raster art, not
pixel art. Its 96 x 104 px 1x frames use Lanczos downsampling with a mild
sharpening pass; its 192 x 208 px 2x frames preserve detail for high-density
displays. CSS `image-set` selects the density tier and normal image rendering
performs any remaining downscale.

These Petdex characters are prototype-only and remain marked `pending-commercial-review`. Before a public or paid release, replace any character whose commercial rights are not explicitly cleared while keeping the same 8x9 sheet geometry and role mapping.

New character work starts from an approved Petdex-compatible base atlas. Missing
office actions are added as controlled extension rows and packed into a versioned
atlas. The interim facility pilot is an 8x13 atlas with four facility rows; the
final workstation contract is 8x15 after adding the required
`working-back-seated` and `working-front-seated` rows. Einstein's accepted
seated-working source is the morphology and anchor reference for those rows.

The office map owns placement. Every agent has a `seat`, `stand`, and desk `collision` rectangle so rendering can keep characters out of furniture and preserve a future pathfinding boundary.

## Imported Petdex candidate packs

The following Petdex packs are downloaded into this directory as source-only
prototype assets. They are intentionally excluded from `registry.json` and are
not rendered by the active office until a role mapping, state review, and
commercial-use review are complete.

| Directory | Display name | Source | License status |
| --- | --- | --- | --- |
| `lian-3` | Lian | https://petdex.dev/pets/lian-3 | `pending-commercial-review` |
| `baobao-2` | Baobao | https://petdex.dev/pets/baobao-2 | `pending-commercial-review` |
| `itachi` | Itachi | https://petdex.dev/pets/itachi | `pending-commercial-review` |
| `gugugaga` | 咕咕嘎嘎 | https://petdex.dev/pets/gugugaga | `pending-commercial-review` |
| `miku` | Miku | https://petdex.dev/pets/miku | `pending-commercial-review` |
| `qq-penguin` | QQ Penguin | https://petdex.dev/pets/qq-penguin | `pending-commercial-review` |
| `nai-long` | The Yellow Fat - Nailong 奶龙 | https://petdex.dev/pets/nai-long | `pending-commercial-review` |
| `asuka-2` | Asuka | https://petdex.dev/pets/asuka-2 | `pending-commercial-review` |
| `jesus` | Jesus | https://petdex.dev/pets/jesus | `pending-commercial-review` |
| `anna` | Anna | https://petdex.dev/pets/anna | `pending-commercial-review` |

Each pack preserves the upstream `pet.json` and `spritesheet.webp` downloaded
with `npx petdex install <slug>`. Petdex notes that submitted pets are
user-created fan art and may not carry rights to underlying IP; keep these
assets internal until cleared.
