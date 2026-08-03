# P5-W6.5-R1 — 2:1 Dimetric Workstation Proof Family

Status: **IN PROGRESS — visual contract frozen; pixel rework not yet
integrated**

## Purpose

Replace the rejected `workstation-basic/v1` front-facing proof candidate with a
new, versioned `workstation-basic/v2` candidate that matches the accepted
Office V2 2:1 dimetric/isometric projection while reusing the accepted factory,
admission validator, review-board generator, and registry tools.

`workstation-basic/v1` is immutable rejected historical evidence. Do not edit,
delete, regenerate in place, or copy its outputs into v2.

## Contract lock

Pixel production is permitted only after the frozen contract in
`docs/office-v2/WORKSTATION_BASIC_V2_VISUAL_CONTRACT.md` and its machine-readable
counterpart at
`assets/office-v2/contracts/workstation-basic/v2/visual-contract.json` are
integrated. The contract locks projection, camera quadrant, visible faces,
axis vectors, canvas/tile relation, slopes, contacts, socket projection,
lighting, seams, masks, nearest-neighbor rendering, and prohibited sources.

## Owned write set

- `assets/office-v2/contracts/workstation-basic/v2/`
- `assets/office-v2/sources/workstation-basic/v2/`
- `assets/office-v2/recipes/workstation-basic/v2/`
- `assets/office-v2/reports/workstation-basic/v2/`
- `scripts/office-v2-asset-family-proof-v2.mjs`
- `scripts/office-v2-asset-family-proof-v2.test.mjs`
- this task's rework status record

Review-only generated evidence may include enlarged native-scale/connectivity
boards, three-workstation seam composition, seated actor/contact overlay, and
light/dark background previews, but all remains under `reports/` and outside
runtime/manifests.

## Forbidden changes

- Do not modify `workstation-basic/v1` files or hashes.
- Do not modify the accepted factory, admission validator, registry, board
  generator, or workflow skills unless a focused failing test proves an
  executable defect.
- Do not write `assets/office-v2/runtime/` or `assets/office-v2/manifests/`.
- Do not use reference/legacy pixels, renderer pixels, scene-specific offsets,
  or a front-facing/orthographic substitute.
- Do not start Phase 6 or change `main`.

## Acceptance

- v2 source, recipe, contract, provenance, geometry, and output paths are
  versioned and reproducible.
- The generated frames visibly use the locked 2:1 dimetric slopes and expose
  top, south, and east planes from the fixed southeast camera quadrant.
- Masks `0`, `2`, `8`, and `10` differ only in the locked east-west cap/seam
  states and preserve common origin, ground contact, and seated socket.
- Enlarged native-scale/connectivity boards, the `[2,10,8]` seam composition,
  seated overlay, and light/dark previews are byte-stable review evidence.
- Two clean factory builds are byte-identical and all existing factory,
  admission, board, and registry focused tests remain green.
- v2 remains `spec-only`; owner review is still required before admission.
