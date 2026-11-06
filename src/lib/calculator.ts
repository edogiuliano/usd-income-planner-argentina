import type { CalculatorInput, IncomeResult } from "@/types";
import { getWorkCycleFraction } from "@/lib/monthlyCycles";
import {
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  getDaysInMonth,
  isValid,
  min,
  parseISO,
  startOfMonth,
} from "date-fns";

export function getCalendarMonthFraction(
  startDate: string,
  endDate: string,
): number {
  let current = parseISO(startDate);
  const end = parseISO(endDate);
  if (!isValid(current) || !isValid(end) || current > end) return 0;
  let months = 0;
  while (current <= end) {
    const segmentEnd = min([endOfMonth(current), end]);
    months +=
      (differenceInCalendarDays(segmentEnd, current) + 1) /
      getDaysInMonth(current);
    current = startOfMonth(addMonths(current, 1));
  }
  return months;
}

export function calculateIncome(input: CalculatorInput): IncomeResult {
  const {
    paymentType,
    rate,
    hoursPerDay,
    workedDays,
    scheduledWorkDays = workedDays,
    paidLeaveDays = 0,
    unpaidLeaveDays = 0,
  } = input;

  let totalIncomeUsd = 0;
  let baseIncomeUsd = 0;
  let unpaidLeaveDeductionUsd = 0;
  const totalHours = workedDays * hoursPerDay;
  const paidDays = workedDays + paidLeaveDays;
  const effectiveScheduledWorkDays = Math.max(
    scheduledWorkDays,
    paidDays + unpaidLeaveDays,
  );

  switch (paymentType) {
    case "minute": {
      const minutesPerDay = hoursPerDay * 60;
      baseIncomeUsd = rate * minutesPerDay * effectiveScheduledWorkDays;
      unpaidLeaveDeductionUsd = rate * minutesPerDay * unpaidLeaveDays;
      totalIncomeUsd = rate * minutesPerDay * paidDays;
      break;
    }

    case "hour":
      baseIncomeUsd = rate * hoursPerDay * effectiveScheduledWorkDays;
      unpaidLeaveDeductionUsd = rate * hoursPerDay * unpaidLeaveDays;
      totalIncomeUsd = rate * hoursPerDay * paidDays;
      break;

    case "day":
      baseIncomeUsd = rate * effectiveScheduledWorkDays;
      unpaidLeaveDeductionUsd = rate * unpaidLeaveDays;
      totalIncomeUsd = rate * paidDays;
      break;

    case "monthly":
      baseIncomeUsd =
        rate *
        (input.startDate && input.endDate
          ? input.monthlyCycle
            ? getWorkCycleFraction(
                input.startDate,
                input.endDate,
                input.monthlyCycle,
              )
            : getCalendarMonthFraction(input.startDate, input.endDate)
          : 1);
      unpaidLeaveDeductionUsd =
        effectiveScheduledWorkDays > 0
          ? baseIncomeUsd * (unpaidLeaveDays / effectiveScheduledWorkDays)
          : 0;
      totalIncomeUsd = baseIncomeUsd - unpaidLeaveDeductionUsd;
      break;
  }

  const averageDailyIncomeUsd = paidDays > 0 ? totalIncomeUsd / paidDays : 0;
  const averageHourlyIncomeUsd =
    totalHours > 0 ? totalIncomeUsd / totalHours : 0;

  return {
    baseIncomeUsd,
    unpaidLeaveDeductionUsd,
    totalIncomeUsd,
    totalHours,
    averageDailyIncomeUsd,
    averageHourlyIncomeUsd,
    paidDays,
    paidLeaveDays,
    unpaidLeaveDays,
  };
}
