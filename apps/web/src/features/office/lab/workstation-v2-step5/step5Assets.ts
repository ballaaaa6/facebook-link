import deskPublicSide from "../../../../../../../assets/game/processed/office-workstation-v2/desk.workstation.modern.v2.back.png";
import deskPublicBase from "../../../../../../../assets/game/processed/office-workstation-v2/desk.workstation.modern.v2.back.base.png";
import deskPublicForeground from "../../../../../../../assets/game/processed/office-workstation-v2/desk.workstation.modern.v2.back.foreground.png";
import deskPublicRear from "../../../../../../../assets/game/processed/office-workstation-v2/desk.workstation.modern.v2.back.rear.png";
import deskPublicSurface from "../../../../../../../assets/game/processed/office-workstation-v2/desk.workstation.modern.v2.back.surface.png";
import deskSeatSide from "../../../../../../../assets/game/processed/office-workstation-v2/desk.workstation.modern.v2.front.png";
import deskSeatBase from "../../../../../../../assets/game/processed/office-workstation-v2/desk.workstation.modern.v2.front.base.png";
import deskSeatForeground from "../../../../../../../assets/game/processed/office-workstation-v2/desk.workstation.modern.v2.front.foreground.png";
import deskSeatRear from "../../../../../../../assets/game/processed/office-workstation-v2/desk.workstation.modern.v2.front.rear.png";
import deskSeatSurface from "../../../../../../../assets/game/processed/office-workstation-v2/desk.workstation.modern.v2.front.surface.png";
import chairBackSource from "../../../../../../../assets/game/processed/office-library-modern-bright-v1/chair-office-modern-v1/chair.office.modern.back.png";
import chairFrontSource from "../../../../../../../assets/game/processed/office-library-modern-bright-v1/chair-office-modern-v1/chair.office.modern.front.png";
import chairBackBackrest from "../../../../../../../assets/game/processed/office-workstation-v2/step5-r02/chair.office.modern.back.backrest.png";
import chairBackSeatBase from "../../../../../../../assets/game/processed/office-workstation-v2/step5-r02/chair.office.modern.back.seat-base.png";
import chairFrontBackrest from "../../../../../../../assets/game/processed/office-workstation-v2/step5-r02/chair.office.modern.front.backrest.png";
import chairFrontSeatBase from "../../../../../../../assets/game/processed/office-workstation-v2/step5-r02/chair.office.modern.front.seat-base.png";
import keyboardSource from "../../../../../../../assets/game/processed/office-facility-v1-lab/derived/keyboard.only.png";
import keyboardFull from "../../../../../../../assets/game/processed/office-workstation-v2/step5-r02/keyboard.workstation.full-tight.png";
import monitorBack from "../../../../../../../assets/game/processed/office-library-modern-bright-v1/env-01-workstation-static/monitor.back.png";
import monitorFront from "../../../../../../../assets/game/processed/office-library-modern-bright-v1/env-01-workstation-static/monitor.front.png";
import einstein from "../../../../../../../assets/game/characters/einstein/runtime-spritesheet-v3.webp";
import einstein2x from "../../../../../../../assets/game/characters/einstein/runtime-spritesheet-v3@2x.webp";

export const step5DeskComposites = { publicSide: deskPublicSide, seatSide: deskSeatSide } as const;
export const step5DeskParts = {
  publicSide: { rear: deskPublicRear, surface: deskPublicSurface, base: deskPublicBase, foreground: deskPublicForeground },
  seatSide: { rear: deskSeatRear, surface: deskSeatSurface, base: deskSeatBase, foreground: deskSeatForeground },
} as const;
export const step5ChairAssets = {
  front: { source: chairFrontSource, backrest: chairFrontBackrest, seatBase: chairFrontSeatBase },
  back: { source: chairBackSource, backrest: chairBackBackrest, seatBase: chairBackSeatBase },
} as const;
export const step5MonitorAssets = { front: monitorFront, back: monitorBack } as const;
export const step5KeyboardAssets = { source: keyboardSource, full: keyboardFull } as const;
export const step5EinsteinAssets = { sheet: einstein, sheet2x: einstein2x } as const;
