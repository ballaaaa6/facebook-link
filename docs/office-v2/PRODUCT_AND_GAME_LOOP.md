# Office V2 Product and Game Loop

## Product promise

Office V2 is a readable management-game view of affiliate operations. It makes
work, waiting, review, handoffs, and system health understandable at a glance.
It is not the operational database and it never invents completed work.

The intended feeling is compact, warm, lively, and original. References to
existing management games describe a genre, not a visual target to copy.

## Primary user loop

1. Open Office and understand current team state without interaction.
2. Select an actor, facility, or alert to inspect its operational meaning.
3. Follow a task, dependency, queue, or failure through the room.
4. Propose an allowed action through the existing control plane.
5. Review the result in operational records and see the world update.

## Visible state contract

Every visual state must map to one of these meanings:

- `working`: an audited task is actively progressing;
- `waiting`: a known dependency or schedule blocks progress;
- `review`: a human decision is required;
- `blocked`: the system can explain why progress cannot continue;
- `unavailable`: data is missing, stale, or disconnected;
- `idle`: no current assignment exists.

Animation may emphasize a state but cannot change its meaning.

## First playable slice

The first complete slice contains one small room, one actor, one workstation,
one task, one reachable interaction, one unreachable case, and one inspector.
It must work first with geometric placeholders and then with one approved
original asset family without changing simulation behavior.

## Non-goals for the foundation

- No room editor, procedural city, economy, combat, or multiplayer.
- No direct connector execution from the visual engine.
- No copied proprietary characters, furniture, maps, palette, or layout.
- No large art batch before one end-to-end asset family passes.
- No fake activity used to make the room appear busy.

## Product acceptance

A user must be able to distinguish working, waiting, review, blocked, and stale
states without reading source code. The same snapshot must communicate the same
meaning on desktop and phone, even when the camera composition differs.
