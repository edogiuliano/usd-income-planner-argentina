export type PaymentType = "minute" | "hour" | "day" | "monthly";

export type CountryCode = "ar" | "cl" | "uy" | "mx" | "bo" | "br" | "co" | "ve";

export type TimeOffDays = {
  vtoDays: number;
  ptoDays: number;
};

export type ExchangeRate = {
  casa: string;
  name: string;
  buy: number;
  sell: number;
  currencyCode: string;
  locale: string;
  updatedAt: string;
};

export type CycleDays = {
  totalDays: number;
  workedDays: number;
  freeDays: number;
  payableDays: number;
  scheduledWorkDays: number;
  vtoDays: number;
  ptoDays: number;
};

export type IncomeResult = {
  baseIncomeUsd: number;
  unpaidLeaveDeductionUsd: number;
  totalIncomeUsd: number;
  totalHours: number;
  averageDailyIncomeUsd: number;
  averageHourlyIncomeUsd: number;
  paidDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
};

export type CalculatorInput = {
  paymentType: PaymentType;
  rate: number;
  hoursPerDay: number;
  workedDays: number;
  scheduledWorkDays?: number;
  paidLeaveDays?: number;
  unpaidLeaveDays?: number;
};
