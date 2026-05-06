import type { PaymentType, IncomeResult, CalculatorInput } from "@/types";

export function calculateIncome(input: CalculatorInput): IncomeResult {
  const { paymentType, rate, hoursPerDay, workedDays } = input;

  let totalIncomeUsd = 0;
  let totalHours = 0;

  switch (paymentType) {
    case "minute":
      const minutesPerDay = hoursPerDay * 60;
      const dailyIncome = rate * minutesPerDay;
      totalIncomeUsd = dailyIncome * workedDays;
      totalHours = workedDays * hoursPerDay;
      break;

    case "hour":
      totalIncomeUsd = rate * hoursPerDay * workedDays;
      totalHours = workedDays * hoursPerDay;
      break;

    case "day":
      totalIncomeUsd = rate * workedDays;
      totalHours = workedDays * hoursPerDay;
      break;

    case "monthly":
      totalIncomeUsd = rate;
      totalHours = workedDays * hoursPerDay;
      break;
  }

  const averageDailyIncomeUsd =
    workedDays > 0 ? totalIncomeUsd / workedDays : 0;

  const averageHourlyIncomeUsd =
    totalHours > 0 ? totalIncomeUsd / totalHours : 0;

  return {
    totalIncomeUsd,
    totalHours,
    averageDailyIncomeUsd,
    averageHourlyIncomeUsd,
  };
}
