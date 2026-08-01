# Generated Office V2 contracts

This directory is reserved for TypeScript generated from accepted schemas in
`docs/office-v2/schemas/` by `scripts/office-v2-contracts-generate.mjs`.

W0.1 intentionally generates no types from the ambiguous V1 schemas. W1.1
generates accepted V2 schemas with
`npm run office:v2:contracts:generate` and verifies committed bytes with
`npm run office:v2:contracts:check`. Do not add hand-written TypeScript here.
