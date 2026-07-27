import chairBack from "../../../../../../assets/game/processed/office-library-modern-bright-v1/chair-office-modern-v1/chair.office.modern.back.png";
import chairFront from "../../../../../../assets/game/processed/office-library-modern-bright-v1/chair-office-modern-v1/chair.office.modern.front.png";
import deskBack from "../../../../../../assets/game/processed/office-library-modern-bright-v1/env-01-workstation-static/desk.workstation.back.png";
import deskFront from "../../../../../../assets/game/processed/office-library-modern-bright-v1/env-01-workstation-static/desk.workstation.front.png";
import keyboardMouse from "../../../../../../assets/game/processed/office-library-modern-bright-v1/env-01-workstation-static/keyboard.mouse.png";
import monitorBack from "../../../../../../assets/game/processed/office-library-modern-bright-v1/env-01-workstation-static/monitor.back.png";
import monitorFront from "../../../../../../assets/game/processed/office-library-modern-bright-v1/env-01-workstation-static/monitor.front.png";
import chairForeground from "../../../../../../assets/game/processed/office-interactions-v1/foreground-masks/chair-office-modern-foreground.png";
import type {
  OfficeAssetDefinition,
  OfficeAssetSlot,
} from "../components/officeAssetRegistry";

export const modernOfficeLabAssetSourcePrefix =
  "assets/game/processed/office-library-modern-bright-v1/";

export const modernOfficeLabAssetRegistry: Record<string, OfficeAssetDefinition> = {
  "desk.workstation.front": {
    file: deskFront,
    physicalScale: { width: 3, depth: 2, height: 2 },
    renderBox: { width: 3, height: 2 },
    footprint: { width: 3, depth: 2 },
    layer: "furniture",
    anchor: "center",
    supports: ["floor"],
    slotSet: "modern-workstation-front",
  },
  "desk.workstation.back": {
    file: deskBack,
    physicalScale: { width: 3, depth: 2, height: 2 },
    renderBox: { width: 3, height: 2 },
    footprint: { width: 3, depth: 2 },
    layer: "furniture",
    anchor: "center",
    supports: ["floor"],
    slotSet: "modern-workstation-back",
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
    physicalScale: { width: 2, depth: 1, height: 2 },
    renderBox: { width: 2, height: 2 },
    footprint: { width: 2, depth: 1 },
    layer: "equipment",
    anchor: "bottom-center",
    supports: ["desk-surface"],
  },
  "monitor.back": {
    file: monitorBack,
    physicalScale: { width: 2, depth: 1, height: 2 },
    renderBox: { width: 2, height: 2 },
    footprint: { width: 2, depth: 1 },
    layer: "equipment",
    anchor: "bottom-center",
    supports: ["desk-surface"],
  },
  "keyboard.mouse": {
    file: keyboardMouse,
    physicalScale: { width: 2, depth: 1, height: 1 },
    renderBox: { width: 2, height: 1 },
    footprint: { width: 2, depth: 1 },
    layer: "equipment",
    anchor: "bottom-center",
    supports: ["desk-surface"],
  },
};

export const modernOfficeLabSlotSets: Record<string, Record<string, OfficeAssetSlot>> = {
  "modern-workstation-front": {
    monitor: { x: 0, y: 0, surface: "desk-surface" },
    keyboard: { x: 0, y: 1, surface: "desk-surface" },
  },
  "modern-workstation-back": {
    monitor: { x: 0, y: 0, surface: "desk-surface" },
    keyboard: { x: 0, y: 1, surface: "desk-surface" },
  },
};

export const modernOfficeLabAllowedAssetIds = Object.freeze(
  Object.keys(modernOfficeLabAssetRegistry),
);

export const modernOfficeChairForeground = {
  id: "chair.office.modern.foreground",
  file: chairForeground,
  renderBox: { width: 1, height: 2 },
} as const;
