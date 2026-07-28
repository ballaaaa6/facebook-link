import chairBackForeground from "../../../../../../../assets/game/processed/office-workstation-v3/step5-r05-final/chair.office.modern.r05.back.foreground.png";
import chairBackRear from "../../../../../../../assets/game/processed/office-workstation-v3/step5-r05-final/chair.office.modern.r05.back.rear.png";
import chairFrontForeground from "../../../../../../../assets/game/processed/office-workstation-v3/step5-r05-final/chair.office.modern.r05.front.foreground.png";
import chairFrontRear from "../../../../../../../assets/game/processed/office-workstation-v3/step5-r05-final/chair.office.modern.r05.front.rear.png";
import deskPublicBase from "../../../../../../../assets/game/processed/office-workstation-v3/step5-r04/desk.workstation.modern.v3.public.base.png";
import deskPublicForeground from "../../../../../../../assets/game/processed/office-workstation-v3/step5-r04/desk.workstation.modern.v3.public.foreground.png";
import deskPublicRear from "../../../../../../../assets/game/processed/office-workstation-v3/step5-r04/desk.workstation.modern.v3.public.rear.png";
import deskPublicSurface from "../../../../../../../assets/game/processed/office-workstation-v3/step5-r04/desk.workstation.modern.v3.public.surface.png";
import deskSeatBase from "../../../../../../../assets/game/processed/office-workstation-v3/step5-r04/desk.workstation.modern.v3.seat.base.png";
import deskSeatForeground from "../../../../../../../assets/game/processed/office-workstation-v3/step5-r04/desk.workstation.modern.v3.seat.foreground.png";
import deskSeatRear from "../../../../../../../assets/game/processed/office-workstation-v3/step5-r04/desk.workstation.modern.v3.seat.rear.png";
import deskSeatSurface from "../../../../../../../assets/game/processed/office-workstation-v3/step5-r04/desk.workstation.modern.v3.seat.surface.png";
import keyboard from "../../../../../../../assets/game/processed/office-workstation-v3/step5-r04/keyboard.workstation.v3.full.png";
import monitorBack from "../../../../../../../assets/game/processed/office-workstation-v3/step5-r04/monitor.workstation.v3.back.png";
import monitorFront from "../../../../../../../assets/game/processed/office-workstation-v3/step5-r04/monitor.workstation.v3.front.png";
import officeBackground from "../../../../../../../assets/art/backgrounds/office-c-background-modern-v3.png";

export const r05ChairParts = {
  back: { foreground: chairBackForeground, rear: chairBackRear },
  front: { foreground: chairFrontForeground, rear: chairFrontRear },
} as const;

export const r05DeskParts = {
  public: { base: deskPublicBase, foreground: deskPublicForeground, rear: deskPublicRear, surface: deskPublicSurface },
  seat: { base: deskSeatBase, foreground: deskSeatForeground, rear: deskSeatRear, surface: deskSeatSurface },
} as const;

export const r05Equipment = { keyboard, monitorBack, monitorFront } as const;
export { officeBackground as r05OfficeBackground };
