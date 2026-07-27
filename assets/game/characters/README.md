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

The first post-Einstein morphology pilot is complete in staging. Doraemon v4
adds only rows 13-14 to its accepted 8x13 atlas. Anna v3 and AI Workbot v3 add
rows 9-14 in the canonical order and demonstrate that the Einstein motion
semantics transfer to both a human-like silhouette and a compact non-human
robot. The active Office registry still imports Doraemon v3, Anna v2, and AI
Workbot v2; promotion waits for the replacement interior pass.

The remaining fourteen selected characters now also have staging-only v3
8x15 atlases. Their six generated source strips, 1x/2x packs, previews, derived
hand anchors, and provisional seat offsets are indexed by
`assets/game/manifests/character-roster-8x15-batch.json`. Legacy source-only
packs receive normalized runtime-v2 base files before extension; all decoded
base rows retain exact visible RGBA and alpha values. RGB beneath zero-alpha
pixels is canonicalized for comparison because lossless WebP does not preserve
invisible RGB bytes. These v3 files are not referenced by
`registry.json` or the active Office character registry.

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
