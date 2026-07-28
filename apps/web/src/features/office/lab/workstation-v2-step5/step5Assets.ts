import deskBack from "../../../../../../../assets/game/processed/office-workstation-v2/desk.workstation.modern.v2.back.png";
import deskBackBase from "../../../../../../../assets/game/processed/office-workstation-v2/desk.workstation.modern.v2.back.base.png";
import deskBackForeground from "../../../../../../../assets/game/processed/office-workstation-v2/desk.workstation.modern.v2.back.foreground.png";
import deskBackRear from "../../../../../../../assets/game/processed/office-workstation-v2/desk.workstation.modern.v2.back.rear.png";
import deskBackSurface from "../../../../../../../assets/game/processed/office-workstation-v2/desk.workstation.modern.v2.back.surface.png";
import deskFront from "../../../../../../../assets/game/processed/office-workstation-v2/desk.workstation.modern.v2.front.png";
import deskFrontBase from "../../../../../../../assets/game/processed/office-workstation-v2/desk.workstation.modern.v2.front.base.png";
import deskFrontForeground from "../../../../../../../assets/game/processed/office-workstation-v2/desk.workstation.modern.v2.front.foreground.png";
import deskFrontRear from "../../../../../../../assets/game/processed/office-workstation-v2/desk.workstation.modern.v2.front.rear.png";
import deskFrontSurface from "../../../../../../../assets/game/processed/office-workstation-v2/desk.workstation.modern.v2.front.surface.png";
import chairBack from "../../../../../../../assets/game/processed/office-library-modern-bright-v1/chair-office-modern-v1/chair.office.modern.back.png";
import chairFront from "../../../../../../../assets/game/processed/office-library-modern-bright-v1/chair-office-modern-v1/chair.office.modern.front.png";
import chairForeground from "../../../../../../../assets/game/processed/office-interactions-v1/foreground-masks/chair-office-modern-foreground.png";
import keyboard from "../../../../../../../assets/game/processed/office-facility-v1-lab/derived/keyboard.only.png";
import monitorBack from "../../../../../../../assets/game/processed/office-library-modern-bright-v1/env-01-workstation-static/monitor.back.png";
import monitorFront from "../../../../../../../assets/game/processed/office-library-modern-bright-v1/env-01-workstation-static/monitor.front.png";
import einstein from "../../../../../../../assets/game/characters/einstein/runtime-spritesheet-v3.webp";
import einstein2x from "../../../../../../../assets/game/characters/einstein/runtime-spritesheet-v3@2x.webp";

export const step5DeskComposites = { front: deskFront, back: deskBack } as const;
export const step5DeskParts = {
  front: { rear: deskFrontRear, surface: deskFrontSurface, base: deskFrontBase, foreground: deskFrontForeground },
  back: { rear: deskBackRear, surface: deskBackSurface, base: deskBackBase, foreground: deskBackForeground },
} as const;
export const step5ChairAssets = { front: chairFront, back: chairBack, foreground: chairForeground } as const;
export const step5MonitorAssets = { front: monitorFront, back: monitorBack } as const;
export const step5KeyboardAsset = keyboard;
export const step5EinsteinAssets = { sheet: einstein, sheet2x: einstein2x } as const;
