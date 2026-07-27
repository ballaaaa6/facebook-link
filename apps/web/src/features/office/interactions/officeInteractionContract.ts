export const characterRows15 = {
  idle: 0,
  "walk-right": 1,
  "walk-left": 2,
  waving: 3,
  celebrating: 4,
  failed: 5,
  waiting: 6,
  working: 7,
  review: 8,
  "working-back": 9,
  "interact-front": 10,
  "inspect-front": 11,
  "lounge-front": 12,
  "working-back-seated": 13,
  "working-front-seated": 14,
} as const;

export type CharacterRow15 = keyof typeof characterRows15;

export const heldPropIds = [
  "held.water-cup-clear",
  "held.water-cup-blue",
  "held.water-bottle",
  "held.coffee-mug",
  "held.takeaway-cup",
  "held.tea-cup",
  "held.soda-can",
  "held.juice-box",
  "held.snack-bag",
  "held.yogurt-box",
  "held.paper-sheet",
  "held.envelope",
  "held.label-card",
  "held.tablet",
  "held.notebook",
  "held.smartphone",
] as const;

export type HeldPropId = (typeof heldPropIds)[number];
export type HeldPropChoice = HeldPropId | null;

export type FacilityInteractionId =
  | "water"
  | "coffee"
  | "vending"
  | "refrigerator"
  | "printer"
  | "mission-review"
  | "sofa"
  | "massage-chair"
  | "arcade"
  | "server-rack";

export const facilityPropPools: Record<FacilityInteractionId, readonly HeldPropChoice[]> = {
  water: ["held.water-cup-clear", "held.water-cup-blue", "held.water-bottle"],
  coffee: ["held.coffee-mug", "held.takeaway-cup", "held.tea-cup"],
  vending: ["held.soda-can", "held.juice-box", "held.water-bottle"],
  refrigerator: ["held.water-bottle", "held.juice-box", "held.yogurt-box"],
  printer: ["held.paper-sheet", "held.envelope", "held.label-card"],
  "mission-review": ["held.tablet", "held.paper-sheet", "held.notebook"],
  sofa: ["held.smartphone", "held.notebook", "held.coffee-mug"],
  "massage-chair": ["held.smartphone", "held.notebook", null],
  arcade: [null],
  "server-rack": ["held.tablet", null],
};

export interface HeldPropSelection {
  agentId: string;
  facilitySlotId: string;
  visitIndex: number;
  facility: FacilityInteractionId;
  previous?: HeldPropChoice;
}

function stableHash(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function selectHeldProp({
  agentId,
  facilitySlotId,
  visitIndex,
  facility,
  previous,
}: HeldPropSelection): HeldPropChoice {
  const pool = facilityPropPools[facility];
  const candidates = previous === undefined || pool.length === 1
    ? pool
    : pool.filter((candidate) => candidate !== previous);
  const seed = `${agentId}:${facilitySlotId}:${visitIndex}`;
  return candidates[stableHash(seed) % candidates.length] ?? null;
}

export const interactFrontHandAnchors1x = [
  { x: 48, y: 72 },
  { x: 34, y: 63 },
  { x: 43, y: 64 },
  { x: 42, y: 62 },
  { x: 39, y: 59 },
  { x: 43, y: 69 },
] as const;

export function heldPropAtInteractFrame(
  prop: HeldPropChoice,
  frame: number,
): HeldPropChoice {
  return frame >= 2 && frame <= 4 ? prop : null;
}

export interface FacilityVerticalSliceContract {
  action: CharacterRow15;
  durationSeconds: number;
  propPool: FacilityInteractionId;
  facilityOverlay: string | null;
  foregroundMask: string | null;
}

export const facilityVerticalSlice: Record<string, FacilityVerticalSliceContract> = {
  water: {
    action: "interact-front",
    durationSeconds: 6,
    propPool: "water",
    facilityOverlay: "dispenser.water.loop",
    foregroundMask: null,
  },
  vending: {
    action: "interact-front",
    durationSeconds: 6,
    propPool: "vending",
    facilityOverlay: "vending.machine.loop.item-neutral",
    foregroundMask: null,
  },
  printer: {
    action: "interact-front",
    durationSeconds: 6,
    propPool: "printer",
    facilityOverlay: "printer.label.loop",
    foregroundMask: null,
  },
  review: {
    action: "working-front-seated",
    durationSeconds: 8,
    propPool: "mission-review",
    facilityOverlay: null,
    foregroundMask: "table.meeting.foreground",
  },
  sofa: {
    action: "lounge-front",
    durationSeconds: 10,
    propPool: "sofa",
    facilityOverlay: null,
    foregroundMask: "sofa.modern.three-seat.foreground",
  },
  massage: {
    action: "lounge-front",
    durationSeconds: 12,
    propPool: "massage-chair",
    facilityOverlay: null,
    foregroundMask: "chair.massage.modern.foreground",
  },
  server: {
    action: "inspect-front",
    durationSeconds: 7,
    propPool: "server-rack",
    facilityOverlay: "server.rack.loop",
    foregroundMask: null,
  },
  arcade: {
    action: "interact-front",
    durationSeconds: 8,
    propPool: "arcade",
    facilityOverlay: "machine.arcade.loop",
    foregroundMask: null,
  },
};
