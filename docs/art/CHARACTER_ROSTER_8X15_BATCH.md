# Character Roster 8x15 Batch

## Scope

This staging batch completes the canonical six-row Office extension for the
fourteen selected characters that remained after the Einstein, Doraemon, Anna,
and AI Workbot proofs. It does not promote any atlas into the active Office.

The batch covers:

- standard human-like: Asuka, Jesus, Miku, Rem, and Ruri;
- stylized human-like: Itachi, Lian, Taffy, Yinyue, and Noir;
- compact costume: Baobao and Gugugaga;
- non-human: Nai-long and QQ Penguin.

All assets remain prototype-only where their PetDex source is marked
`pending-commercial-review`.

## Contract

Each accepted 8x9 base receives these rows in order:

| Row | State | Active frames | Empty cells |
| --- | --- | --- | --- |
| 9 | `working-back` | 6 | 6-7 |
| 10 | `interact-front` | 6 | 6-7 |
| 11 | `inspect-front` | 6 | 6-7 |
| 12 | `lounge-front` | 6 | 6-7 |
| 13 | `working-back-seated` | 6 | 6-7 |
| 14 | `working-front-seated` | 6 | 6-7 |

The final geometry is 768x1560 at 1x and 1536x3120 at 2x. Furniture, props,
chairs, desks, masks, and facility art remain separate layers. Generated
extension strips contain only the character on a magenta key background.

## Build and QA

Run:

```bash
python scripts/process-character-roster-batch.py
```

The build:

1. creates runtime-v2 base derivatives for source-only legacy packs;
2. extracts and chroma-keys six sprites from every extension strip;
3. normalizes each morphology without changing the accepted base rows;
4. packs lossless v3 1x/2x atlases and previews;
5. records provisional interaction hand anchors and seat offsets;
6. emits one visual contact sheet for all 84 extension rows.

Acceptance results:

- 84/84 source strips extract to exactly six frames;
- all fourteen atlases contain 15 rows and 8 columns;
- visible RGBA and alpha in the first nine rows remain exact; invisible RGB
  beneath zero-alpha pixels is canonicalized because lossless WebP does not
  preserve it;
- cells 6 and 7 of every extension row remain empty;
- all assets are cataloged as `staging-only`;
- neither `characterRegistry.ts` nor the active Office map imports the v3
  batch.

The machine-readable record is
`assets/game/manifests/character-roster-8x15-batch.json`. The visual QA board is
`assets/game/processed/character-roster-8x15-batch-v1/qa/extension-rows-contact-sheet.png`.

## Promotion gate

Owner decision on 2026-07-27 freezes the current character library and completed
pose assets for internal prototype use. The recorded provisional anchors and
seat offsets are accepted for prototype integration; promotion does not require
a full-roster calibration pass. Correct an individual anchor or offset only
after a reproducible visible placement, occlusion, or interaction defect is
observed. All affected identities remain `pending-commercial-review`, and this
prototype acceptance does not authorize public, paid, or commercial use.
