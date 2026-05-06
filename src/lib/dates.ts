import { differenceInDays, parseISO, getDay } from "date-fns";
import type { CycleDays } from "@/types";

export function getCycleDays(
  startDate: string,
  endDate: string,
  freeWeekdays: number[]
): CycleDays {
  const start = parseISO(startDate);
  const end = parseISO(endDate);

  const totalDays = differenceInDays(end, start) + 1;

  let workedDays = 0;
  let freeDays = 0;

  if (totalDays <= 0) {
    return { totalDays, workedDays: totalDays, freeDays };
  }

  for (let i = 0; i < totalDays; i++) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + i);
    const weekday = getDay(currentDate);

    if (freeWeekdays.includes(weekday)) {
      freeDays++;
    } else {
      workedDays++;
    }
  }

  return { totalDays, workedDays, freeDays };
}
