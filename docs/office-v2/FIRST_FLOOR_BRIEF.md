# Office V2 First-Floor Product Brief

- Status: accepted product target; implementation remains gated
- Target: `hq-ground-floor-v1`
- Capacity: 10 canonical role stations, 15 validated actor slots
- Presentation: original warm 2:1 isometric pixel-art cutaway office

## Outcome

Build one coherent ground-floor headquarters that makes the AutoPost Facebook
operation understandable at a glance. The floor contains the complete working
loop, shared facilities, circulation, and a bounded exterior street scene. It is
not a decorative background with actors positioned by hand; it is a versioned
world assembled from reusable rooms, structures, furniture, characters, and
interaction definitions.

The floor assigns facilities for the ten canonical operational roles. The live
view instantiates only records supplied by the operations adapter and respects
each role's feature flag. The current configuration enables six roles and
disables Attribution Builder, Gemini Copywriter, Flow Visual Producer, and
Publisher. A disabled role is unavailable or its station is empty; it is never
shown working or converted to idle.

The world and renderer must also pass a 15-actor capacity fixture so future
roles can be added without redesigning the floor. Empty capacity remains empty.
The presentation never creates fake employees or fake work to make the office
look busy.

## Site and building envelope

The first delivered world contains:

- one large ground-floor interior with bounded work and shared zones;
- an entrance connected to an exterior sidewalk and road;
- non-walkable exterior context such as curb, planting, street furniture, and
  a city backdrop, kept separate from authoritative indoor occupancy;
- a reserved vertical-circulation core for a future stair or lift;
- a camera composition that shows the complete floor on the pilot desktop and
  preserves inspectability at compact and phone viewports.

The exterior is presentation context in the first release. Vehicles and street
pedestrians, if later added, require their own simulation contract and cannot be
baked into the office world as unexplained activity.

Before a second floor is implemented, add a versioned building definition with
stable building and floor identifiers, per-floor world bounds, vertical links,
cross-floor routing policy, camera selection, loading, saves, and migration.
Elevation alone is not a multi-floor model.

## Operational zones

| Zone | Operational meaning | Initial actors | Minimum facilities |
| --- | --- | --- | --- |
| Discovery pod | Discover and score Shopee candidates | Market Scout, Product Ranker | two workstations, candidate board, evidence display |
| Strategy and analytics | Select winners, plan experiments, and measure results | Growth Strategist, Performance Analyst | two workstations, metrics wall, strategy table |
| Creative studio | Produce copy and visual content through supervised browser work | Gemini Copywriter, Flow Visual Producer | two workstations, creative review display, artifact shelf |
| Attribution and publishing | Create attributed links, schedule, publish, and reconcile | Attribution Builder, Publisher | two workstations, schedule board, publication console |
| Review room | Validate links, content, policy, duplication, and human gates | QA Editor and human-review focus | review table, approval display, waiting positions |
| Reliability station | Monitor browser sessions and recovery state | Session Keeper | service workstation, session-health display, equipment rack |
| Shared support | Meetings, waiting, breaks, and non-authoritative idle presentation | all roles | meeting table, pantry, water, coffee, lounge seating |
| Expansion capacity | Preserve usable growth from ten to fifteen actors | no launch actors | five unassigned home-facility bays with power, clearance, and legal routes |
| Circulation and entry | Legal routes between every required interaction | all roles | entrance, corridors, waiting cells, reserved stair or lift core |

TeamBrain is a command-console facility in the shared or strategy area, not an
eleventh employee. It may show answers and action proposals from the existing
control plane but cannot execute a connector.

Zone names are presentation and navigation metadata. Workflow stages remain
owned by operational records and do not change because an actor enters a room.

## Canonical role and facility plan

| Durable stage or concern | Canonical role | Home facility | Visible responsibility |
| --- | --- | --- | --- |
| `discovered` | Market Scout | discovery workstation | inspect candidates and evidence |
| `scored` | Product Ranker | ranking workstation | compare and rank candidates |
| `selected` | Growth Strategist | strategy workstation and review table | apply the active strategy and expose a winner decision |
| `link_ready` | Attribution Builder | attribution workstation | prepare and inspect the attributed-link result |
| `content_queued` and `content_ready` | Gemini Copywriter and Flow Visual Producer | copy workstation and visual station | show two independent jobs and their joined handoff |
| `qa_approved` | QA Editor | QA workstation and review table | inspect content, link, policy, and human-review state |
| `scheduled` and `published` | Publisher | publishing console | inspect schedule, provider result, and reconciliation |
| `measured` | Performance Analyst | analytics workstation | inspect joined metrics and feed a recommendation back to strategy |
| Cross-stage session health | Session Keeper | reliability workstation | expose browser-session health and the diagnostic owner |

`WORKFLOWS.md` currently assigns winner selection to Growth Strategist while
the Product Ranker catalog description also says it selects winners. Phase 1
must make those sources agree before this mapping becomes an adapter contract.
The floor plan reserves the facilities but does not resolve a data-ownership
conflict through animation.

## Workflow-to-world grammar

The durable workflow remains:

```text
discovered -> scored -> selected -> link_ready -> content_queued
-> content_ready -> qa_approved -> scheduled -> published -> measured
```

Each handoff may create a presentation intent: leave a workstation, carry or
display a versioned prop, move to a legal approach cell, interact, release the
reservation, and return to an assigned or shared facility. The visual handoff
never advances the durable workflow. It reflects an accepted event received
through the operations adapter.

The six display states use one semantic grammar across every role:

- `working`: use the role's assigned work or facility interaction;
- `waiting`: remain at a legal workstation or declared waiting position and
  show the known dependency;
- `review`: focus the review room and expose the existing human-review UI;
- `blocked`: stop at a safe legal position and expose the diagnostic owner;
- `unavailable`: show stale or disconnected presentation without pretending to
  be idle;
- `idle`: choose only deterministic presentation activities that have no
  operational meaning, such as sitting, coffee, or a short lounge visit.

Decorative behavior uses a separate seeded random stream and yields immediately
when an operational intent arrives.

## Initial interaction catalog

| Interaction | Owner | Capacity and required behavior |
| --- | --- | --- |
| Work at assigned station | workstation | one actor; seated and standing variants share one task truth |
| Inspect candidate or metric board | display | one or more declared approach sockets; read-only |
| Review artifact | review table or display | bounded queue; human approval remains in control-plane UI |
| Create content | creative station | one actor; visual clip cannot claim external browser completion |
| Prepare attributed link | attribution station | one actor; held-link prop is presentation only |
| Schedule or reconcile publication | publication console | one actor; never calls Meta directly |
| Inspect session health | reliability station | one actor; stale and recovery states remain explicit |
| Sit, drink, or rest | shared facility | decorative only; cancellation releases every reservation |
| Enter or leave floor | entrance | initial spawn and despawn boundary; no unexplained street simulation |

Every interaction is data that references a geometry-owned use slot for
approach cells, facing, and sockets, while its behavior owns duration, capacity,
cancellation, and result events. No interaction may copy spatial facts or
require a component-specific pixel offset.

## Minimum reusable asset catalog

The first floor is complete only when these versioned families exist and pass
the asset gate.

### Environment

- floor surfaces and transition edges for work, review, service, lounge,
  sidewalk, curb, and road presentation;
- wall straights, corners, ends, cutaway parts, doors, windows, glass partitions,
  columns, and the reserved vertical-circulation shell;
- exterior backdrop, planting, entrance, street dressing, and lighting parts
  that do not alter occupancy.

### Furniture and facilities

- connected workstation system, office chairs, meeting and review tables;
- display boards, schedule and metrics displays, storage, shelving, printer,
  equipment rack, water station, coffee and pantry units;
- lounge seating, coffee tables, bins, plants, and a small set of approved
  decorative props;
- one TeamBrain command console whose UI remains owned by the control panel;
- role-specific facility states only where a generic workstation cannot express
  the required interaction.

### Characters and props

- one original modular character body contract with all required facings,
  semantic clips, contact point, and attachment sockets;
- ten launch identities expressed through approved original variants while
  preserving the same geometry and animation contract;
- held props for documents, link or review cards, drink, and device states;
- selection, waiting, review, blocked, stale, and handoff feedback that remains
  understandable without color or motion alone.

Architecture, furniture, character, prop, and effect layers remain independent.
A generated full-scene image is a mood reference, not a runtime asset source.

## Composition requirements

- Required routes stay open when all 15 actor slots are occupied.
- Workstations, chairs, sockets, and held props align through shared geometry.
- Dense decoration uses declared prop slots and never creates hidden collision.
- Every room has a visual focal point, readable boundary, and controlled detail
  density without embedding operational truth in background pixels.
- Tall furniture, glass, walls, plants, and characters pass front/behind depth
  boards and cutaway rules.
- In-world signage uses original project naming and a controlled pixel-font
  system; generated or proprietary branding is not baked into runtime art.

## Delivery acceptance

The first floor is accepted only when:

1. all ten role-to-facility bindings are validated, every supplied production
   actor maps to a durable adapter record, disabled roles stay absent or
   unavailable, and deterministic simulated records remain lab-only;
2. the same map passes deterministic 1-, 10-, and 15-actor traces;
3. all required facilities remain reachable and exclusive sockets never have
   two owners;
4. the complete AutoPost workflow can be followed through visible handoffs in a
   deterministic test trace;
5. every runtime pixel belongs to an approved versioned asset family;
6. the room passes depth, cutaway, picking, responsive, accessibility, and
   reduced-motion acceptance;
7. the pilot desktop meets the recorded renderer budget and smaller viewports
   retain semantic parity;
8. Dashboard, Settings, API, Discord, and the automation runner still build and
   operate with the Office renderer absent.

## Non-goals for the first floor

- The Office does not execute Shopee, Gemini, Google Flow, or Meta actions.
- It does not simulate fake business outcomes, fake staff, a street economy, or
  autonomous visitors.
- It does not include a general-purpose room editor or user construction mode.
- It does not implement a second floor, lift routing, or cross-floor queues yet.
- It does not reproduce a proprietary game's characters, pixels, branding,
  palette, layout, or signature composition.
