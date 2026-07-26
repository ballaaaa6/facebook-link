import officeBackground from "../../../../../../assets/art/backgrounds/office-c-background-modern-v3.png";
import clockFace from "../../../../../../assets/art/props/clock/clock-face-v1.png";
import clockHourHand from "../../../../../../assets/art/props/clock/clock-hour-hand-runtime-v1.png";
import clockMinuteHand from "../../../../../../assets/art/props/clock/clock-minute-hand-runtime-v1.png";
import springDawn from "../../../../../../assets/art/backgrounds/windows/office-window-spring-dawn-v2.png";
import springDay from "../../../../../../assets/art/backgrounds/windows/office-window-spring-day-v2.png";
import springEvening from "../../../../../../assets/art/backgrounds/windows/office-window-spring-evening-v2.png";
import springNight from "../../../../../../assets/art/backgrounds/windows/office-window-spring-night-v2.png";
import summerDawn from "../../../../../../assets/art/backgrounds/windows/office-window-summer-dawn-v2.png";
import summerDay from "../../../../../../assets/art/backgrounds/windows/office-window-summer-day-v2.png";
import summerEvening from "../../../../../../assets/art/backgrounds/windows/office-window-summer-evening-v2.png";
import summerNight from "../../../../../../assets/art/backgrounds/windows/office-window-summer-night-v2.png";
import autumnDawn from "../../../../../../assets/art/backgrounds/windows/office-window-autumn-dawn-v2.png";
import autumnDay from "../../../../../../assets/art/backgrounds/windows/office-window-autumn-day-v2.png";
import autumnEvening from "../../../../../../assets/art/backgrounds/windows/office-window-autumn-evening-v2.png";
import autumnNight from "../../../../../../assets/art/backgrounds/windows/office-window-autumn-night-v2.png";
import winterDawn from "../../../../../../assets/art/backgrounds/windows/office-window-winter-dawn-v2.png";
import winterDay from "../../../../../../assets/art/backgrounds/windows/office-window-winter-day-v2.png";
import winterEvening from "../../../../../../assets/art/backgrounds/windows/office-window-winter-evening-v2.png";
import winterNight from "../../../../../../assets/art/backgrounds/windows/office-window-winter-night-v2.png";
import {
  officeSceneTimeAt,
  type OfficeSceneTime,
  type OfficeSeason,
  type OfficeTimeOfDay,
} from "./officeSceneTime";

export { officeSceneTimeAt };
export type { OfficeSceneTime, OfficeSeason, OfficeTimeOfDay };

export const officeSceneAssets = {
  background: officeBackground,
  clockFace,
  clockHourHand,
  clockMinuteHand,
} as const;

export const officeSceneReference = {
  width: 1672,
  height: 941,
  window: { x: 528, y: 133, width: 507, height: 209 },
  clock: { x: 1065, y: 90, width: 80, height: 80 },
} as const;

const windowViews: Record<OfficeSeason, Record<OfficeTimeOfDay, string>> = {
  spring: { dawn: springDawn, day: springDay, evening: springEvening, night: springNight },
  summer: { dawn: summerDawn, day: summerDay, evening: summerEvening, night: summerNight },
  autumn: { dawn: autumnDawn, day: autumnDay, evening: autumnEvening, night: autumnNight },
  winter: { dawn: winterDawn, day: winterDay, evening: winterEvening, night: winterNight },
};

export function officeWindowViewFor(time: Pick<OfficeSceneTime, "season" | "timeOfDay">) {
  return windowViews[time.season][time.timeOfDay];
}
