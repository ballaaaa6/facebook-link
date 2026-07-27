import chairBack from "../../../../../../assets/game/processed/office-library-modern-bright-v1/chair-office-modern-v1/chair.office.modern.back.png";
import chairFront from "../../../../../../assets/game/processed/office-library-modern-bright-v1/chair-office-modern-v1/chair.office.modern.front.png";
import lampDesk from "../../../../../../assets/game/processed/office-library-modern-bright-v1/env-01-workstation-static/lamp.desk.png";
import keyboardOnly from "../../../../../../assets/game/processed/office-facility-v1-lab/derived/keyboard.only.png";
import mugStack from "../../../../../../assets/game/processed/office-library-modern-bright-v1/env-11-comfort-personal-detail/mug.stack.png";
import monitorBack from "../../../../../../assets/game/processed/office-library-modern-bright-v1/env-01-workstation-static/monitor.back.png";
import monitorFront from "../../../../../../assets/game/processed/office-library-modern-bright-v1/env-01-workstation-static/monitor.front.png";
import papersStack from "../../../../../../assets/game/processed/office-library-modern-bright-v1/env-01-workstation-static/papers.stack.png";
import phoneDesk from "../../../../../../assets/game/processed/office-library-modern-bright-v1/env-01-workstation-static/phone.desk.png";
import stationeryCup from "../../../../../../assets/game/processed/office-library-modern-bright-v1/env-11-comfort-personal-detail/stationery.cup.png";
import deskViewerBack from "../../../../../../assets/game/processed/office-facility-v1-lab/derived/desk.workstation.viewer-back.v5.png";
import deskViewerFront from "../../../../../../assets/game/processed/office-facility-v1-lab/derived/desk.workstation.viewer-front.v5.png";
import chairForeground from "../../../../../../assets/game/processed/office-interactions-v1/foreground-masks/chair-office-modern-foreground.png";
import type {
  OfficeAssetDefinition,
  OfficeAssetSlot,
} from "../components/officeAssetRegistry";

export const modernOfficeLabAssetSourcePrefix =
  "assets/game/processed/office-library-modern-bright-v1/";
export const modernOfficeLabDerivedAssetSourcePrefix =
  "assets/game/processed/office-facility-v1-lab/derived/";

export const modernOfficeLabAssetRegistry: Record<string, OfficeAssetDefinition> = {
  "desk.workstation.viewer-front.v5": {
    file: deskViewerFront,
    physicalScale: { width: 5, depth: 4, height: 2.4 },
    renderBox: { width: 5, height: 4 },
    fit: "fill",
    footprint: { width: 5, depth: 4 },
    layer: "furniture",
    anchor: "center",
    supports: ["floor"],
    slotSet: "rectangular-workstation-viewer-front",
  },
  "desk.workstation.viewer-back.v5": {
    file: deskViewerBack,
    physicalScale: { width: 5, depth: 4, height: 2.4 },
    renderBox: { width: 5, height: 4 },
    fit: "fill",
    footprint: { width: 5, depth: 4 },
    layer: "furniture",
    anchor: "center",
    supports: ["floor"],
    slotSet: "rectangular-workstation-viewer-back",
  },
  "chair.office.modern.front": {
    file: chairFront,
    physicalScale: { width: 1, depth: 1, height: 2 },
    renderBox: { width: 1, height: 2 },
    footprint: { width: 1, depth: 1 },
    layer: "furniture",
    anchor: "bottom-center",
    supports: ["floor"],
  },
  "chair.office.modern.back": {
    file: chairBack,
    physicalScale: { width: 1, depth: 1, height: 2 },
    renderBox: { width: 1, height: 2 },
    footprint: { width: 1, depth: 1 },
    layer: "furniture",
    anchor: "bottom-center",
    supports: ["floor"],
  },
  "monitor.front": {
    file: monitorFront,
    physicalScale: { width: 1.4, depth: 0.5, height: 1.4 },
    renderBox: { width: 1.4, height: 1.4 },
    footprint: { width: 2, depth: 1 },
    layer: "equipment",
    anchor: "bottom-center",
    supports: ["desk-surface"],
  },
  "monitor.back": {
    file: monitorBack,
    physicalScale: { width: 1.4, depth: 0.5, height: 1.4 },
    renderBox: { width: 1.4, height: 1.4 },
    footprint: { width: 2, depth: 1 },
    layer: "equipment",
    anchor: "bottom-center",
    supports: ["desk-surface"],
  },
  "keyboard.only": {
    file: keyboardOnly,
    physicalScale: { width: 0.9, depth: 0.45, height: 0.5 },
    renderBox: { width: 0.9, height: 0.5 },
    footprint: { width: 1, depth: 1 },
    layer: "equipment",
    anchor: "bottom-center",
    supports: ["desk-surface"],
  },
  "lamp.desk": deskProp(lampDesk, "decor"),
  "papers.stack": deskProp(papersStack, "decor"),
  "phone.desk": deskProp(phoneDesk, "equipment"),
  "mug.stack": deskProp(mugStack, "decor"),
  "stationery.cup": deskProp(stationeryCup, "decor"),
};

function deskProp(
  file: string,
  layer: OfficeAssetDefinition["layer"],
): OfficeAssetDefinition {
  return {
    file,
    physicalScale: { width: 0.75, depth: 0.75, height: 0.75 },
    renderBox: { width: 0.75, height: 0.75 },
    footprint: { width: 1, depth: 1 },
    layer,
    anchor: "bottom-center",
    supports: ["desk-surface"],
  };
}

const propColumns = [
  { side: "left", xValues: [-2, -1] },
  { side: "right", xValues: [1, 2] },
] as const;

const employeeRelativeRows = ["far", "middle", "near"] as const;

function rectangularWorkstationSlots(
  farY: number,
  middleY: number,
  nearY: number,
): Record<string, OfficeAssetSlot> {
  const rowY = { far: farY, middle: middleY, near: nearY };
  const slots: Record<string, OfficeAssetSlot> = {
    monitor: { x: 0, y: farY, surface: "desk-surface" },
    keyboard: { x: 0, y: middleY, surface: "desk-surface" },
  };
  for (const { side, xValues } of propColumns) {
    for (const row of employeeRelativeRows) {
      for (const [columnIndex, x] of xValues.entries()) {
        slots[`prop-${side}-${row}-${columnIndex + 1}`] = {
          x,
          y: rowY[row],
          surface: "desk-surface",
        };
      }
    }
  }
  return slots;
}

export const modernOfficeLabSlotSets: Record<string, Record<string, OfficeAssetSlot>> = {
  "rectangular-workstation-viewer-back": rectangularWorkstationSlots(1, 0, -1),
  "rectangular-workstation-viewer-front": rectangularWorkstationSlots(-1, 0, 1),
};

export const modernOfficeLabAllowedAssetIds = Object.freeze(
  Object.keys(modernOfficeLabAssetRegistry),
);

export const modernOfficeChairForeground = {
  id: "chair.office.modern.foreground",
  file: chairForeground,
  renderBox: { width: 1, height: 2 },
} as const;
