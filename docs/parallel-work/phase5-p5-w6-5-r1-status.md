# P5-W6.5-R1 Status

- Task: `P5-W6.5-R1` — 2:1 dimetric workstation proof family
- Status: **IN_PROGRESS**
- Integration base: `61f45a4` (`docs(office-v2): freeze workstation v2 visual contract`)
- Previous family: `workstation-basic/v1`, explicitly rejected and preserved as
  immutable historical evidence
- Owner review for v1: geometry `rework-required`, visual `rejected`,
  commercial `pending`
- Contract: `docs/office-v2/WORKSTATION_BASIC_V2_VISUAL_CONTRACT.md`
- Machine contract:
  `assets/office-v2/contracts/workstation-basic/v2/visual-contract.json`
- Runtime/manifests: closed; v2 is spec-only

## Scope lock

The rework may create only the v2 source, recipe, deterministic proof-family
runner/test, and v2 report evidence required by the frozen contract. It must
not modify v1 evidence, accepted factory/validator/registry/skill code, main,
runtime, or manifests.

No v2 pixels were produced before the contract commit `61f45a4`.

## Required evidence

The v2 handoff must include masks `0/2/8/10`, enlarged native-scale and
connectivity boards, `[2,10,8]` three-workstation seam composition, seated
actor/contact overlay, light/dark previews, two clean byte-identical builds,
explicit spec-only review state, focused tests, Office preflight, assets gate,
diff hygiene, and full `npm run check`.
