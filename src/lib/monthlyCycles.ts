import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  format,
  getDaysInMonth,
  isValid,
  max,
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

export function normalizeMonthlyCycle(value: unknown): MonthlyCycle {
  if (!value || typeof value !== "object") return { ...DEFAULT_MONTHLY_CYCLE };
  const cycle = value as Partial<MonthlyCycle>;
  const fallback = cycleFromStartDay(cycle.startDay ?? 1);
  const endDay = cycle.endDay;
  return {
    startDay: fallback.startDay,
    endDay:
      endDay === "last" ||
      (typeof endDay === "number" &&
        Number.isInteger(endDay) &&
        endDay >= 1 &&
        endDay <= 31)
        ? endDay
        : fallback.endDay,
  };
}

export function readMonthlyCycle(raw: string | null): MonthlyCycle {
  try {
    return normalizeMonthlyCycle(JSON.parse(raw ?? "null"));
  } catch {
    return { ...DEFAULT_MONTHLY_CYCLE };
  }
}

const toIsoDate = (date: Date) => format(date, "yyyy-MM-dd");

function dateInMonth(month: Date, day: number | "last") {
  const first = startOfMonth(month);
  const actualDay =
    day === "last"
      ? getDaysInMonth(first)
      : Math.min(day, getDaysInMonth(first));
  return addDays(first, actualDay - 1);
}

export function getCycleForClosingMonth(month: Date, config: MonthlyCycle) {
  const cycle = normalizeMonthlyCycle(config);
  const previousMonth = addMonths(startOfMonth(month), -1);
  const crossesMonth = cycle.endDay !== "last" && cycle.startDay > cycle.endDay;
  // Short months can clip both bounds to the same date; never share a paid day.
  const start = crossesMonth
    ? max([
        dateInMonth(previousMonth, cycle.startDay),
        addDays(dateInMonth(previousMonth, cycle.endDay), 1),
      ])
    : dateInMonth(month, cycle.startDay);
  return {
    startDate: toIsoDate(start),
    endDate: toIsoDate(dateInMonth(month, cycle.endDay)),
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
    target > dateInMonth(target, cycle.endDay)
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
  const cycle = normalizeMonthlyCycle(config);
  // Same-month ranges select the calendar month, even after their closing day.
  if (cycle.endDay === "last" || cycle.startDay <= cycle.endDay) {
    return getCycleForClosingMonth(
      addMonths(startOfMonth(parseISO(today)), offset),
      cycle,
    );
  }
  const current = getMonthlyCycleContaining(today, cycle);
  return offset === 0
    ? current
    : shiftMonthlyCycle(current.startDate, cycle, offset);
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
    const cycleStart = parseISO(cycle.startDate);
    const segmentStart = max([current, cycleStart]);
    const segmentEnd = min([cycleEnd, end]);
    if (segmentStart <= segmentEnd) {
      const fullDays = differenceInCalendarDays(cycleEnd, cycleStart) + 1;
      cycles +=
        (differenceInCalendarDays(segmentEnd, segmentStart) + 1) / fullDays;
    }
    current = addDays(cycleEnd, 1);
  }
  return cycles;
}
