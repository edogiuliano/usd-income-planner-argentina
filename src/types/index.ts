export type PaymentType = "minute" | "hour" | "day" | "monthly";

export type CountryCode = "ar" | "cl" | "uy" | "mx" | "bo" | "br" | "co" | "ve";

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
};

export type IncomeResult = {
  totalIncomeUsd: number;
  totalHours: number;
  averageDailyIncomeUsd: number;
  averageHourlyIncomeUsd: number;
};

export type CalculatorInput = {
  paymentType: PaymentType;
  rate: number;
  hoursPerDay: number;
  workedDays: number;
};
