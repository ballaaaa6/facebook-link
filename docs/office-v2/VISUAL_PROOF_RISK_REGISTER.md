# Office V2 Visual Proof Risk Register

Status: open
Owners: presentation QA, asset pipeline, and runtime admission owners
Review point: before each T4-T6 promotion

## Purpose

This register makes visual-proof risks explicit before characters, furniture,
or production scene assets are built at scale. It routes each risk to a phase
and evidence type. It does not change geometry, renderer, asset, or runtime
contracts.

Allowed status values are open, mitigated, accepted, and closed. A risk cannot
be marked closed without a committed evidence reference and an owner decision.

## Active risks

| ID | Risk | Impact | Gate | Planned evidence | Owner | Status |
| --- | --- | --- | --- | --- | --- | --- |
| VR-001 | Projection or ground-contact drift makes sprites appear off-grid or float | High | P2/T4 | Projection round-trip cases, ground-contact board, and golden screenshots | World and presentation owners | open |
| VR-002 | Depth or occlusion ordering hides an actor behind furniture incorrectly | High | T4/T6 | Render-part DAG, depth/tie-break cases, and approved scene goldens | Renderer owner | open |
| VR-003 | Sprite origin, socket, or contact anchor does not match geometry | High | T5 | Neutral geometry board, contact-point tolerances, and runtime admission report | Asset pipeline owner | open |
| VR-004 | Rotated geometry occupancy disagrees with the visual asset footprint | High | P2/T5 | Asymmetric placement fixtures, rotated asset family manifest, and agreement report | World and asset owners | open |
| VR-005 | Connected workstation seams or masks expose gaps or doubled edges | Medium | T5 | Masks 0, 2, 8, and 10, seam matrix, and exported atlas review | Furniture asset owner | open |
| VR-006 | Alpha edges, palette roles, or lighting drift across asset families | Medium | T5 | Light/dark palette boards, alpha inspection, and export validation | Visual owner and asset pipeline | open |
| VR-007 | Mobile viewport, camera, or inverse picking makes the office unusable | High | T4 | Desktop, compact, and phone screenshots plus input/picking tests | Presentation owner | open |
| VR-008 | Missing or unapproved assets silently fall back at runtime | High | T5/T6 | Fail-closed admission tests, manifest audit, and negative fixtures | Runtime admission owner | open |
| VR-009 | Renderer lifecycle, context loss, or resource cleanup causes stale or blank scenes | High | T4 | Mount/unmount, resize, context-loss, and cleanup evidence | Renderer owner | open |
| VR-010 | Scene density harms readability, accessibility, reduced motion, or performance | Medium | T4/T6 | Density matrix, accessibility review, reduced-motion behavior, and performance samples | Presentation QA | open |
| VR-011 | Atlas trimming or filtering changes pixel scale and creates seams | Medium | T5 | Atlas metadata, nearest-neighbor export checks, and scale review | Asset pipeline owner | open |
| VR-012 | Character animation or held-prop contact breaks the approved geometry relationship | Medium | T5/T7 | Turnaround/contact sheets, clip tests, and interaction-use-slot evidence | Character asset owner | open |

## Review rules

- Phase 2 may address geometry and deterministic depth inputs only; it does not
  close visual risks.
- T4 owns renderer, viewport, camera, lifecycle, and integrated presentation
  proof.
- T5 owns visual asset production, export, provenance, seams, alpha, atlas,
  sockets, and runtime admission evidence.
- T6 owns integrated scene proof and release-level readability/performance
  evidence.
- T7 owns later character/furniture expansion and animation-specific proof.
- A failed visual proof blocks the relevant promotion even when the code
  appears complete.

Each review should update the status, evidence reference, owner, and date. New
risks discovered during visual proof must be added before the affected gate is
marked passed.
