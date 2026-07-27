import type { AgentPresentation, OfficeMapDefinition } from "../officeTypes";

export const modernOfficeLabId = "office-modern-workstation-part1-lab";
export const modernOfficeLabAssetLibraryId = "office-library-modern-bright-v1";
export const modernOfficeLabStabilitySamples = [0, 10, 20, 30] as const;

export const modernOfficeLabRows = {
  "row-a": {
    label: "Far row · faces viewer",
    agentIds: [
      "market-scout",
      "product-ranker",
      "growth-strategist",
      "performance-analyst",
      "gemini-copywriter",
    ],
    pose: "working-front-seated",
    desk: "desk.workstation.front",
    chair: "chair.office.modern.front",
    monitor: "monitor.back",
    facing: "down",
  },
  "row-b": {
    label: "Near row · faces away",
    agentIds: [
      "flow-visual-producer",
      "link-attribution",
      "qa-editor",
      "publisher",
      "session-keeper",
    ],
    pose: "working-back-seated",
    desk: "desk.workstation.back",
    chair: "chair.office.modern.back",
    monitor: "monitor.front",
    facing: "up",
  },
} as const;

export function modernOfficeLabRowFor(agentId: string) {
  return Object.values(modernOfficeLabRows).find(({ agentIds }) =>
    (agentIds as readonly string[]).includes(agentId));
}

export function createModernOfficeLabPresentations(
  map: OfficeMapDefinition,
): Readonly<Record<string, AgentPresentation>> {
  return Object.fromEntries(
    map.workstations.map((station) => {
      const row = modernOfficeLabRowFor(station.id);
      if (!row) throw new Error(`No Part 1 seating row for ${station.id}`);
      return [
        station.id,
        {
          position: station.seat,
          state: row.pose,
          seated: true,
        },
      ];
    }),
  );
}

export function modernOfficeLabPresentationAt(
  elapsedSeconds: number,
  map: OfficeMapDefinition,
) {
  if (elapsedSeconds < 0) throw new Error("Part 1 lab time cannot be negative");
  return createModernOfficeLabPresentations(map);
}
