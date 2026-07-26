export type OfficeSeason = "spring" | "summer" | "autumn" | "winter";
export type OfficeTimeOfDay = "dawn" | "day" | "evening" | "night";

export interface OfficeSceneTime {
  hour: number;
  minute: number;
  second: number;
  season: OfficeSeason;
  timeOfDay: OfficeTimeOfDay;
  hourAngle: number;
  minuteAngle: number;
}

const partValue = (parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) => {
  const value = parts.find((part) => part.type === type)?.value;
  return value ? Number(value) : 0;
};

function seasonForMonth(month: number): OfficeSeason {
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

function timeOfDayForHour(hour: number): OfficeTimeOfDay {
  if (hour >= 5 && hour < 9) return "dawn";
  if (hour >= 9 && hour < 17) return "day";
  if (hour >= 17 && hour < 20) return "evening";
  return "night";
}

export function officeSceneTimeAt(
  date: Date,
  timeZone = "Asia/Bangkok",
): OfficeSceneTime {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    month: "2-digit",
  }).formatToParts(date);
  const hour = partValue(parts, "hour");
  const minute = partValue(parts, "minute");
  const second = partValue(parts, "second");
  return {
    hour,
    minute,
    second,
    season: seasonForMonth(partValue(parts, "month")),
    timeOfDay: timeOfDayForHour(hour),
    hourAngle: ((hour % 12) * 30) + (minute * 0.5) + (second / 120),
    minuteAngle: (minute * 6) + (second * 0.1),
  };
}
