import deskBackBase from "../../../../../../assets/game/processed/office-workstation-v1/desk.modular.back.base.png";
import deskBackForeground from "../../../../../../assets/game/processed/office-workstation-v1/desk.modular.back.foreground.png";
import deskBackRear from "../../../../../../assets/game/processed/office-workstation-v1/desk.modular.back.rear.png";
import deskBackSurface from "../../../../../../assets/game/processed/office-workstation-v1/desk.modular.back.surface.png";
import deskFrontBase from "../../../../../../assets/game/processed/office-workstation-v1/desk.modular.front.base.png";
import deskFrontForeground from "../../../../../../assets/game/processed/office-workstation-v1/desk.modular.front.foreground.png";
import deskFrontRear from "../../../../../../assets/game/processed/office-workstation-v1/desk.modular.front.rear.png";
import deskFrontSurface from "../../../../../../assets/game/processed/office-workstation-v1/desk.modular.front.surface.png";
import deskLeftBase from "../../../../../../assets/game/processed/office-workstation-v1/desk.modular.left.base.png";
import deskLeftForeground from "../../../../../../assets/game/processed/office-workstation-v1/desk.modular.left.foreground.png";
import deskLeftRear from "../../../../../../assets/game/processed/office-workstation-v1/desk.modular.left.rear.png";
import deskLeftSurface from "../../../../../../assets/game/processed/office-workstation-v1/desk.modular.left.surface.png";
import deskRightBase from "../../../../../../assets/game/processed/office-workstation-v1/desk.modular.right.base.png";
import deskRightForeground from "../../../../../../assets/game/processed/office-workstation-v1/desk.modular.right.foreground.png";
import deskRightRear from "../../../../../../assets/game/processed/office-workstation-v1/desk.modular.right.rear.png";
import deskRightSurface from "../../../../../../assets/game/processed/office-workstation-v1/desk.modular.right.surface.png";
import chairBack from "../../../../../../assets/game/processed/office-library-modern-bright-v1/chair-office-modern-v1/chair.office.modern.back.png";
import chairFront from "../../../../../../assets/game/processed/office-library-modern-bright-v1/chair-office-modern-v1/chair.office.modern.front.png";
import keyboardMouse from "../../../../../../assets/game/processed/equipment-c-v1/keyboard.mouse.png";
import monitorBack from "../../../../../../assets/game/processed/office-library-modern-bright-v1/env-01-workstation-static/monitor.back.png";
import monitorFront from "../../../../../../assets/game/processed/office-library-modern-bright-v1/env-01-workstation-static/monitor.front.png";
import screenA from "../../../../../../assets/game/processed/office-library-modern-bright-v1/env-09-phase2-completion-architecture/screen.theme.system.a.png";
import screenB from "../../../../../../assets/game/processed/office-library-modern-bright-v1/env-09-phase2-completion-architecture/screen.theme.system.b.png";
import screenC from "../../../../../../assets/game/processed/office-library-modern-bright-v1/env-09-phase2-completion-architecture/screen.theme.system.c.png";
import screenD from "../../../../../../assets/game/processed/office-library-modern-bright-v1/env-09-phase2-completion-architecture/screen.theme.system.d.png";
import type { WorkstationOrientation } from "./workstationBundleRuntime";

export const deskPartAssets: Record<WorkstationOrientation, Record<"rear" | "surface" | "base" | "foreground", string>> = {
  front: { rear: deskFrontRear, surface: deskFrontSurface, base: deskFrontBase, foreground: deskFrontForeground },
  back: { rear: deskBackRear, surface: deskBackSurface, base: deskBackBase, foreground: deskBackForeground },
  left: { rear: deskLeftRear, surface: deskLeftSurface, base: deskLeftBase, foreground: deskLeftForeground },
  right: { rear: deskRightRear, surface: deskRightSurface, base: deskRightBase, foreground: deskRightForeground },
};

export const chairAssets = { front: chairFront, back: chairBack } as const;
export const monitorAssets = { front: monitorFront, back: monitorBack } as const;
export const screenFrames = [screenA, screenB, screenC, screenD] as const;
export { keyboardMouse };
