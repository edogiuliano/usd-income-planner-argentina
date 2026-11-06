export type PaymentType = "minute" | "hour" | "day" | "monthly";

export type CountryCode =
  "ar" | "cl" | "uy" | "mx" | "bo" | "br" | "co" | "ve" | "other";

export type TimeOffDays = {
  vtoDays: number;
  ptoDays: number;
};

export type ProjectionHorizon = "3" | "6" | "12" | "year";

export type ExchangeRate = {
  casa: string;
  name: string;
  buy: number;
  sell: number;
  currencyCode: string;
  locale: string;
  updatedAt: string;
  isReference?: boolean;
};

export type ExchangeOperation = "sell-usd" | "buy-usd";

export type MonthlyCycle = {
  startDay: number;
  endDay: number | "last";
};

export type CalculationData = {
  monthlyCycle?: MonthlyCycle;
  paymentType: PaymentType;
  rate: number;
  hoursPerDay: number;
  freeWeekdays: number[];
  timeOffDays: TimeOffDays;
  startDate: string;
  endDate: string;
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
  monthlyCycle?: MonthlyCycle;
  paymentType: PaymentType;
  rate: number;
  hoursPerDay: number;
  workedDays: number;
  scheduledWorkDays?: number;
  paidLeaveDays?: number;
  unpaidLeaveDays?: number;
  startDate?: string;
  endDate?: string;
};

export type PtoBalance = {
  hireDate: string;
  asOfDate: string;
  accruedPtoDays: number;
  usedPtoDays: number;
  availablePtoDays: number;
  nextPtoDate: string | null;
};

export type VacationPlan = {
  totalVacationDays: number;
  vacationWorkDays: number;
  vacationFreeDays: number;
  availablePtoDays: number;
  ptoDays: number;
  vtoDays: number;
  missingPtoDays: number;
  nextMissingPtoDate: string | null;
};

export type VacationProjectionInput = {
  startDate: string;
  endDate: string;
  selectedDates?: string[];
  keepUncoveredAsVto: boolean;
};

export type MonthlyProjection = {
  monthKey: string;
  monthLabel: string;
  startDate: string;
  endDate: string;
  cycleDays: CycleDays;
  income: IncomeResult;
  vacation?: VacationPlan;
};
