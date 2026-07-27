import chairBack from "../../../../../../assets/game/processed/office-library-modern-bright-v1/chair-office-modern-v1/chair.office.modern.back.png";
import chairFront from "../../../../../../assets/game/processed/office-library-modern-bright-v1/chair-office-modern-v1/chair.office.modern.front.png";
import deskBack from "../../../../../../assets/game/processed/office-library-modern-bright-v1/env-01-workstation-static/desk.workstation.back.png";
import deskFront from "../../../../../../assets/game/processed/office-library-modern-bright-v1/env-01-workstation-static/desk.workstation.front.png";
import keyboardOnly from "../../../../../../assets/game/processed/office-facility-v1-lab/derived/keyboard.only.png";
import monitorBack from "../../../../../../assets/game/processed/office-library-modern-bright-v1/env-01-workstation-static/monitor.back.png";
import monitorFront from "../../../../../../assets/game/processed/office-library-modern-bright-v1/env-01-workstation-static/monitor.front.png";
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
    physicalScale: { width: 1.2, depth: 0.5, height: 0.65 },
    renderBox: { width: 1.2, height: 0.65 },
    footprint: { width: 1, depth: 1 },
    layer: "equipment",
    anchor: "bottom-center",
    supports: ["desk-surface"],
  },
};

export const modernOfficeLabSlotSets: Record<string, Record<string, OfficeAssetSlot>> = {
  "modern-workstation-front": {
    monitor: { x: 0, y: -0.55, surface: "desk-surface" },
    keyboard: { x: 0, y: -0.3, surface: "desk-surface" },
    "prop-front-left": { x: -1, y: -0.1, surface: "desk-surface" },
    "prop-front-right": { x: 1, y: -0.1, surface: "desk-surface" },
    "prop-rear-left": { x: -1, y: -0.55, surface: "desk-surface" },
    "prop-rear-right": { x: 1, y: -0.55, surface: "desk-surface" },
  },
  "modern-workstation-back": {
    monitor: { x: 0, y: -0.55, surface: "desk-surface" },
    keyboard: { x: 0, y: -0.3, surface: "desk-surface" },
    "prop-front-left": { x: -1, y: -0.1, surface: "desk-surface" },
    "prop-front-right": { x: 1, y: -0.1, surface: "desk-surface" },
    "prop-rear-left": { x: -1, y: -0.55, surface: "desk-surface" },
    "prop-rear-right": { x: 1, y: -0.55, surface: "desk-surface" },
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
