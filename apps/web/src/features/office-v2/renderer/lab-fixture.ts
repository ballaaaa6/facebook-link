import { createPresentationSnapshot } from "./presentation-snapshot.ts";

export type LabSnapshot = Parameters<typeof createPresentationSnapshot>[0];
export const LAB_FLOOR = { id: { kind: "floor", value: "ground-floor" }, version: 1 } as LabSnapshot["entities"][number]["transform"]["floor"];
export const LAB_BOUNDS = { floor: LAB_FLOOR, width: 20, depth: 16, maxElevation: 2 };
const STATES: readonly LabSnapshot["entities"][number]["semanticState"][] = ["working", "waiting", "review", "blocked", "unavailable", "idle"];

/** Shared fixture-only actor profile used by the QA lab and browser benchmark. */
export function createFixtureSnapshot(actorCount: number, revision: number): LabSnapshot {
  return createPresentationSnapshot({
    schemaVersion: "office-presentation-snapshot-v1",
    snapshotId: { kind: "snapshot", value: `renderer-qa-${actorCount}-${revision}` },
    world: { id: "hq-ground-floor-v1", version: 1 },
    tick: 42 + revision,
    worldHash: "e".repeat(64),
    entities: Array.from({ length: actorCount }, (_, index) => {
      const entityId = `actor-${String(index + 1).padStart(2, "0")}`;
      const state = STATES[index % STATES.length]!;
      const freshness = index % 17 === 0 ? "unavailable" : index % 11 === 0 ? "stale" : index % 13 === 0 ? "reconnecting" : "live";
      return {
        entityId: { kind: "entity-instance", value: entityId },
        transform: {
          floor: LAB_FLOOR,
          position: {
            space: "floor-local-sub-cell",
            floor: LAB_FLOOR,
            coordinate: { space: "sub-cell", x: 2 + (index % 10) * 8, y: 2 + Math.floor(index / 10) * 8, elevation: 0 },
          },
        },
        semanticState: state,
        renderParts: ["actor-body-v1", "actor-feedback-v1"],
        label: index === 0 ? "Market Scout with a deliberately long semantic label for accessibility verification" : `Agent ${entityId}`,
        selection: { selected: index === 0, focused: index === 0 },
        freshness,
      };
    }),
    migration: { fromVersion: "office-presentation-snapshot-v0", effect: "reject-and-rehash" },
  } as unknown as LabSnapshot);
}
