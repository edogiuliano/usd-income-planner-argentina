import { differenceInDays, getDay, parseISO } from "date-fns";
import type { CycleDays, TimeOffDays } from "@/types";

const clampDayCount = (value: number, max: number) => {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(Math.trunc(value), 0), Math.max(max, 0));
};

export function getCycleDays(
  startDate: string,
  endDate: string,
  freeWeekdays: number[],
  timeOffDays: TimeOffDays = { vtoDays: 0, ptoDays: 0 }
): CycleDays {
  const start = parseISO(startDate);
  const end = parseISO(endDate);

  const totalDays = differenceInDays(end, start) + 1;

  let scheduledWorkDays = 0;
  let freeDays = 0;

  if (totalDays <= 0) {
    return {
      totalDays,
      workedDays: totalDays,
      freeDays,
      payableDays: 0,
      scheduledWorkDays: totalDays,
      vtoDays: 0,
      ptoDays: 0,
    };
  }

  for (let i = 0; i < totalDays; i++) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + i);
    const weekday = getDay(currentDate);

    if (freeWeekdays.includes(weekday)) {
      freeDays++;
    } else {
      scheduledWorkDays++;
    }
  }

  const vtoDays = clampDayCount(timeOffDays.vtoDays, scheduledWorkDays);
  const ptoDays = clampDayCount(timeOffDays.ptoDays, scheduledWorkDays - vtoDays);
  const workedDays = scheduledWorkDays - vtoDays - ptoDays;
  const payableDays = workedDays + ptoDays;

  return {
    totalDays,
    workedDays,
    freeDays,
    payableDays,
    scheduledWorkDays,
    vtoDays,
    ptoDays,
  };
}
