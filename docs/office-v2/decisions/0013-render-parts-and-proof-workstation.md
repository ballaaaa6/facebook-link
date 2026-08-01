# Decision 0013 — Render Parts and Proof Workstation

- Status: accepted
- Date: 2026-08-01
- Owners: contracts, world, presentation, and asset pipeline

## Context

The V1 depth fixture places a cabinet `upper` part after every world actor, while
the furniture brief limits the first workstation to an east-west family and the
historical connected-desk fixture also contains vertical masks. Treating either
V1 example as a universal production rule would make tall-object occlusion and
the first asset commission contradictory.

## Options considered

- Put every upper sprite in one global band: simple sorting, but a tall object
  can cover an actor that is geometrically in front.
- Split objects with component-specific ordering code: visually flexible, but
  creates manual renderer exceptions and competing geometry.
- Use an acyclic render-part dependency graph and admit only the workstation
  masks the proof family can demonstrate: explicit, fail-closed, and testable.

## Decision

Adopt render composition version `office-render-parts-v1` and proof workstation
contract `office-proof-workstation-v1`.

A multipart semantic entity references explicit render parts. Each part names
its parent attachment, coordinate space, pixel depth contact, stable sibling
tie-break, semantic pick owner, hit/alpha policy, and declared depth
dependencies. The compiled dependency graph must be acyclic. Splitting a sprite
does not create a second world entity, interaction owner, pick result, footprint,
or occupancy record.

The shared `world` band remains the default interleaving space for actors and
ordinary furniture. A global `upper` band is not a universal solution for
overhang or height. Ordinary tall or multipart furniture must resolve actor
front/behind relationships through its registered contacts and dependency
policy rather than drawing all upper parts after all actors.

Composition policies remain distinct:

- structures retain one structural identity and may expose declared lower,
  occluding, and cutaway parts without changing collision;
- glass declares transparency, pick ownership, structural state, and depth
  dependencies explicitly rather than inheriting opaque-wall behavior;
- cutaway is a deterministic presentation state that hides or fades declared
  parts and never deletes world geometry;
- effects use their approved attachment and effect policy and cannot reorder
  simulation entities or become an interaction owner;
- tall furniture stays in world-relative depth unless an explicit validated
  dependency requires another part relationship.

Decision 0009 remains authoritative for geometry. Render parts, variants,
cutaways, glass, and effects cannot change occupancy, clearance, navigation,
use-slot geometry, reservations, or simulation state.

The proof workstation supports exactly these local east-west neighbor masks:

| Mask | Meaning |
| --- | --- |
| `0` | isolated |
| `2` | east neighbor |
| `8` | west neighbor |
| `10` | east and west neighbors |

North, south, vertical-middle, corner, tee, and cross arrangements are not
silently rotated or approximated. Placement or family validation fails with
`connectivity.unsupported-mask` and includes family/version, instance, mask,
and neighbor evidence.

The existing `fixtures/connected-desk.json`, V1 schemas, and V1 depth fixture
remain frozen historical evidence. The V1 vertical cases and global-upper
example are not proof-workstation or general multipart acceptance. The new V2
fixture proves the bounded east-west table without rewriting history.

W1.2 will reserve stable render-part references and reject attachment cycles in
definition-bundle closure. W4.2 will add the full sprite-frame/render-part
contracts and structure, glass, cutaway, effect, tall-object, and actor-crossing
fixtures. Roadmap Phase 4 later implements a renderer port; Wave 6 in roadmap
Phase 5 produces the proof workstation asset family.

## Consequences

The first asset family has an unambiguous commissionable mask set, and later
multipart rendering cannot hide an occlusion defect behind a coarse global
band. Existing V1 evidence remains loadable only under its V1 meaning.

This decision and fixture do not admit a runtime asset, render a scene, select a
renderer, implement connectivity placement, or prove multipart occlusion. Asset
admission remains basic and renderer admission remains none.

## Evidence

`RENDERING_DEPTH_OCCLUSION.md`, `CONNECTIVITY_AUTO_TILING.md`, and
`FURNITURE_PRODUCTION_BIBLE.md` own the canonical rules.
`fixtures/proof-workstation-connectivity-v2.json` executes masks 0, 2, 8, and
10. `fixtures/invalid/proof-workstation-unsupported-mask.json` proves exact
`connectivity.unsupported-mask` failure for north/south and corner requests.
W4.2 retains the full render-part and occlusion evidence obligation.
