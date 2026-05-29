import type { CalculatorInput, IncomeResult } from "@/types";

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
  const effectiveScheduledWorkDays = Math.max(scheduledWorkDays, paidDays + unpaidLeaveDays);

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
      baseIncomeUsd = rate;
      unpaidLeaveDeductionUsd =
        effectiveScheduledWorkDays > 0 ? rate * (unpaidLeaveDays / effectiveScheduledWorkDays) : 0;
      totalIncomeUsd = baseIncomeUsd - unpaidLeaveDeductionUsd;
      break;
  }

  const averageDailyIncomeUsd = paidDays > 0 ? totalIncomeUsd / paidDays : 0;
  const averageHourlyIncomeUsd = totalHours > 0 ? totalIncomeUsd / totalHours : 0;

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
