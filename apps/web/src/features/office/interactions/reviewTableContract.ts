import type { CharacterRow15 } from "./officeInteractionContract";

export interface ReviewTableSeat {
  id: string;
  side: "front" | "rear";
  seat: { x: number; y: number };
  approach: { x: number; y: number };
  action: CharacterRow15;
}

export const reviewTableModernContract = {
  id: "review-table-modern-four-seat",
  facilityObjectId: "table.review.long.modern",
  reservationCapacity: 4,
  tableRenderBox: { width: 4, height: 2 },
  facilityFootprint: { width: 4, depth: 3 },
  navigationClearance: { width: 4, depth: 5 },
  chairs: {
    front: "chair.office.modern.back",
    rear: "chair.office.modern.front",
  },
  seats: [
    {
      id: "review.rear-left",
      side: "rear",
      seat: { x: 1, y: -1 },
      approach: { x: 1, y: -2 },
      action: "working-front-seated",
    },
    {
      id: "review.rear-right",
      side: "rear",
      seat: { x: 3, y: -1 },
      approach: { x: 3, y: -2 },
      action: "working-front-seated",
    },
    {
      id: "review.front-left",
      side: "front",
      seat: { x: 1, y: 1 },
      approach: { x: 1, y: 2 },
      action: "working-back-seated",
    },
    {
      id: "review.front-right",
      side: "front",
      seat: { x: 3, y: 1 },
      approach: { x: 3, y: 2 },
      action: "working-back-seated",
    },
  ] satisfies ReviewTableSeat[],
} as const;
