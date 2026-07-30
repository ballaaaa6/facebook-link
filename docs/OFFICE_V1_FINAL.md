# Office V1 Final Baseline

Status: Frozen historical runtime baseline
Closed: 2026-07-30
Tag: `office-v1-final-2026-07-30`

## Final runtime identity

- Runtime consumer:
  `apps/web/src/features/office/components/officeSceneRuntime.ts`
- Runtime map: `assets/game/maps/office-c-v2.json`
- Semantic authority: `assets/game/maps/office-semantic-grid-v6.json`
- Active background:
  `assets/art/backgrounds/office-c-background-modern-v8-current.png`
- Active background SHA-256:
  `d0c0ef48c22fd40747b63017e6a24593da1eab1186dfb5d45c3a50853b674f56`
- Historical rollback background:
  `assets/art/backgrounds/office-c-background-modern-v7-current.png`

The promoted V8 current background is byte-identical to the reviewed
`office-c-background-modern-v8-owner-review.png` candidate. No new V1
furniture, character, equipment, facility, or decor pixels are introduced by
the promotion.

## Freeze boundary

Office V1 is retained only as a reproducible historical product baseline and
rollback point. New Office Engine V2 work must not import or reinterpret the
following V1 implementation details:

- the DOM/CSS renderer and its z-index calculations;
- `office-c-v2.json` placement and navigation data;
- the V1 runtime asset registry;
- scene-specific offsets and workstation layering helpers;
- rejected or superseded layout candidates; or
- V1 furniture, equipment, facility, and decor pixels except where the root
  production rules explicitly authorize an independently versioned source.

The versioned backend `OfficeSnapshot` contract, agent identities, workflow
state, and read-model boundary remain eligible shared product inputs because
they do not define V1 spatial or rendering behavior.

## Verification and rollback

The final tag is created only after targeted Semantic Grid checks, generated
art-lock verification, web tests, production build, full `npm run check`,
responsive visual QA, and a Cloudflare deployment dry run pass.

Rollback uses the annotated `office-v1-final-2026-07-30` tag. Do not reopen
or amend the tagged V1 history; create a separately reviewed successor if a
historical correction is ever required.
