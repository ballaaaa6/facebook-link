import deskPublicBase from "../../../../../../../assets/game/processed/office-workstation-v3/step5-r04/desk.workstation.modern.v3.public.base.png";
import deskPublicForeground from "../../../../../../../assets/game/processed/office-workstation-v3/step5-r04/desk.workstation.modern.v3.public.foreground.png";
import deskPublicRear from "../../../../../../../assets/game/processed/office-workstation-v3/step5-r04/desk.workstation.modern.v3.public.rear.png";
import deskPublicSurface from "../../../../../../../assets/game/processed/office-workstation-v3/step5-r04/desk.workstation.modern.v3.public.surface.png";
import deskSeatBase from "../../../../../../../assets/game/processed/office-workstation-v3/step5-r04/desk.workstation.modern.v3.seat.base.png";
import deskSeatForeground from "../../../../../../../assets/game/processed/office-workstation-v3/step5-r04/desk.workstation.modern.v3.seat.foreground.png";
import deskSeatRear from "../../../../../../../assets/game/processed/office-workstation-v3/step5-r04/desk.workstation.modern.v3.seat.rear.png";
import deskSeatSurface from "../../../../../../../assets/game/processed/office-workstation-v3/step5-r04/desk.workstation.modern.v3.seat.surface.png";
import chairBackForeground from "../../../../../../../assets/game/processed/office-workstation-v3/step5-r04/chair.office.modern.v3.back.foreground.png";
import chairBackRear from "../../../../../../../assets/game/processed/office-workstation-v3/step5-r04/chair.office.modern.v3.back.rear.png";
import chairBackSeat from "../../../../../../../assets/game/processed/office-workstation-v3/step5-r04/chair.office.modern.v3.back.seat.png";
import chairFrontForeground from "../../../../../../../assets/game/processed/office-workstation-v3/step5-r04/chair.office.modern.v3.front.foreground.png";
import chairFrontRear from "../../../../../../../assets/game/processed/office-workstation-v3/step5-r04/chair.office.modern.v3.front.rear.png";
import chairFrontSeat from "../../../../../../../assets/game/processed/office-workstation-v3/step5-r04/chair.office.modern.v3.front.seat.png";
import keyboard from "../../../../../../../assets/game/processed/office-workstation-v3/step5-r04/keyboard.workstation.v3.full.png";
import monitorBack from "../../../../../../../assets/game/processed/office-workstation-v3/step5-r04/monitor.workstation.v3.back.png";
import monitorFront from "../../../../../../../assets/game/processed/office-workstation-v3/step5-r04/monitor.workstation.v3.front.png";
import einstein from "../../../../../../../assets/game/characters/einstein/runtime-spritesheet-v3.webp";
import einstein2x from "../../../../../../../assets/game/characters/einstein/runtime-spritesheet-v3@2x.webp";
import officeBackground from "../../../../../../../assets/art/backgrounds/office-c-background-modern-v3.png";

export const r04DeskParts = {
  public: { rear: deskPublicRear, surface: deskPublicSurface, base: deskPublicBase, foreground: deskPublicForeground },
  seat: { rear: deskSeatRear, surface: deskSeatSurface, base: deskSeatBase, foreground: deskSeatForeground },
} as const;
export const r04ChairParts = {
  front: { rear: chairFrontRear, seat: chairFrontSeat, foreground: chairFrontForeground },
  back: { rear: chairBackRear, seat: chairBackSeat, foreground: chairBackForeground },
} as const;
export const r04Equipment = { keyboard, monitorBack, monitorFront } as const;
export const r04Actor = { sheet: einstein, sheet2x: einstein2x } as const;
export { officeBackground };
