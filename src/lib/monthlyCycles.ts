import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  format,
  getDaysInMonth,
  isValid,
  min,
  parseISO,
  startOfMonth,
} from "date-fns";
import type { MonthlyCycle } from "@/types";

export const DEFAULT_MONTHLY_CYCLE: MonthlyCycle = {
  startDay: 1,
  endDay: "last",
};
export const MONTHLY_CYCLE_STORAGE_KEY = "usd-planner-monthly-cycle";

export function cycleFromStartDay(day: number): MonthlyCycle {
  return Number.isInteger(day) && day >= 1 && day <= 31
    ? { startDay: day, endDay: day === 1 ? "last" : day - 1 }
    : { ...DEFAULT_MONTHLY_CYCLE };
}

export function cycleFromEndDay(day: number | "last"): MonthlyCycle {
  return day === "last" || day === 31
    ? { ...DEFAULT_MONTHLY_CYCLE }
    : cycleFromStartDay(day + 1);
}

export function normalizeMonthlyCycle(value: unknown): MonthlyCycle {
  if (!value || typeof value !== "object") return { ...DEFAULT_MONTHLY_CYCLE };
  const cycle = value as Partial<MonthlyCycle>;
  return cycleFromStartDay(cycle.startDay ?? 1);
}

export function readMonthlyCycle(raw: string | null): MonthlyCycle {
  try {
    return normalizeMonthlyCycle(JSON.parse(raw ?? "null"));
  } catch {
    return { ...DEFAULT_MONTHLY_CYCLE };
  }
}

const toIsoDate = (date: Date) => format(date, "yyyy-MM-dd");

// Closing dates are the shared boundary: deriving each start from the previous
// close avoids independent day-clamping overlaps in February and 30-day months.
function closingDate(month: Date, cycle: MonthlyCycle) {
  const first = startOfMonth(month);
  const day =
    cycle.endDay === "last"
      ? getDaysInMonth(first)
      : Math.min(cycle.endDay, getDaysInMonth(first));
  return addDays(first, day - 1);
}

export function getCycleForClosingMonth(month: Date, config: MonthlyCycle) {
  const cycle = normalizeMonthlyCycle(config);
  return {
    startDate: toIsoDate(
      addDays(closingDate(addMonths(startOfMonth(month), -1), cycle), 1),
    ),
    endDate: toIsoDate(closingDate(month, cycle)),
  };
}

export function getMonthlyCycleContaining(
  date: string,
  config: MonthlyCycle = DEFAULT_MONTHLY_CYCLE,
) {
  const target = parseISO(date);
  if (!isValid(target)) throw new Error("Invalid cycle date");
  const cycle = normalizeMonthlyCycle(config);
  const closingMonth =
    target > closingDate(target, cycle)
      ? addMonths(startOfMonth(target), 1)
      : target;
  return getCycleForClosingMonth(closingMonth, cycle);
}

export function shiftMonthlyCycle(
  startDate: string,
  config: MonthlyCycle,
  offset: number,
) {
  const current = getMonthlyCycleContaining(startDate, config);
  return getCycleForClosingMonth(
    addMonths(startOfMonth(parseISO(current.endDate)), offset),
    config,
  );
}

export function getMonthlyQuickPeriod(
  today: string,
  config: MonthlyCycle,
  offset = 0,
) {
  const current = getMonthlyCycleContaining(today, config);
  return offset === 0
    ? current
    : shiftMonthlyCycle(current.startDate, config, offset);
}

export function getWorkCycleFraction(
  startDate: string,
  endDate: string,
  config: MonthlyCycle,
) {
  let current = parseISO(startDate);
  const end = parseISO(endDate);
  if (!isValid(current) || !isValid(end) || current > end) return 0;
  let cycles = 0;
  while (current <= end) {
    const cycle = getMonthlyCycleContaining(toIsoDate(current), config);
    const cycleEnd = parseISO(cycle.endDate);
    const segmentEnd = min([cycleEnd, end]);
    const fullDays =
      differenceInCalendarDays(cycleEnd, parseISO(cycle.startDate)) + 1;
    cycles += (differenceInCalendarDays(segmentEnd, current) + 1) / fullDays;
    current = addDays(cycleEnd, 1);
  }
  return cycles;
}
