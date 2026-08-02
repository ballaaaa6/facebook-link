# Generated Office V2 contracts

This directory is reserved for TypeScript generated from accepted schemas in
`docs/office-v2/schemas/` by `scripts/office-v2-contracts-generate.mjs`.

W0.1 intentionally generates no types from the ambiguous V1 schemas. W1.1 and
W1.2 generate accepted V2 schemas with
`npm run office:v2:contracts:generate` and verifies committed bytes with
`npm run office:v2:contracts:check`. Do not add hand-written TypeScript here.

The W1.5 registry emits `common-v2.ts`, `geometry.ts`,
`entity-definition-v2.ts`, `entity-instance.ts`, `definition-bundle.ts`,
`building.ts`, `room-template.ts`, `scene-plan.ts`, `world-v2.ts`,
`compiled-building.ts`, and `compilation-report.ts`. Session D adds generated
types for `style-profile`, `asset-family-v2`, `sprite-frame`, `render-part`,
`source-set`, `export-recipe`, `asset-review`, `asset-migration`, `atlas`,
`asset-catalog`, `scene-bundle`, `character-definition`, and
`semantic-variant`. Cross-schema Office references become deterministic
type-only imports; schema cycles, descriptor collisions, and unexpected
generated files fail closed.
