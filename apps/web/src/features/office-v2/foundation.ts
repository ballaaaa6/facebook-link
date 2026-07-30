export const officeEngineLayers = [
  {
    id: "world",
    title: "World model",
    responsibility: "Own coordinates, bounds, occupancy, anchors, and immutable scene definitions.",
  },
  {
    id: "simulation",
    title: "Simulation",
    responsibility: "Own actor intent, movement, task state, time, and deterministic state transitions.",
  },
  {
    id: "projection",
    title: "Projection",
    responsibility: "Convert world coordinates to screen coordinates without changing world state.",
  },
  {
    id: "presentation",
    title: "Presentation",
    responsibility: "Render approved assets, depth, animation, input feedback, and accessibility UI.",
  },
] as const;

export const officeEngineEntryGates = [
  "One documented coordinate and projection model",
  "One deterministic scene fixture with no visual assets",
  "Movement and occupancy tests before character art",
  "Depth and interaction tests before furniture production",
  "New asset provenance and validation before runtime import",
] as const;

export type OfficeEngineLayerId = (typeof officeEngineLayers)[number]["id"];
