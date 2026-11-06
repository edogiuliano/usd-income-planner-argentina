import { format, isValid, parseISO } from "date-fns";
import {
  parseMoneyInput,
  parseNumberInput,
  parseDayCountInput,
} from "@/lib/inputNumbers";
import type { CalculationData, PaymentType } from "@/types";
import { normalizeMonthlyCycle, readMonthlyCycle } from "@/lib/monthlyCycles";

export const todayIso = () => format(new Date(), "yyyy-MM-dd");
export const isDateOnly = (value: unknown): value is string =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  isValid(parseISO(value));

export function restoreSavedForm(
  draft: string | null,
  lastValid: string | null,
  savedMonthlyCycle?: string | null,
): unknown {
  for (const raw of [draft, lastValid]) {
    try {
      const value: unknown = JSON.parse(raw ?? "null");
      if (parseSavedCalculation(value))
        return savedMonthlyCycle != null
          ? {
              ...(value as object),
              monthlyCycle: readMonthlyCycle(savedMonthlyCycle),
            }
          : value;
    } catch {
      /* Try the last valid snapshot if the draft cannot be recovered. */
    }
  }
  return null;
}

// Accept the existing string-based form payload; results are always recomputed, never cached.
export function parseSavedCalculation(value: unknown): CalculationData | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  if (!["minute", "hour", "day", "monthly"].includes(String(data.paymentType)))
    return null;
  const paymentType = data.paymentType as PaymentType;
  const rawRate = String(data.rate ?? "");
  const rawHours = String(data.hoursPerDay ?? "");
  const money = rawRate.replace(/\s/g, "");
  const validMoney =
    /^\d+(?:[.,]\d+)?$/.test(money) ||
    /^\d{1,3}(?:\.\d{3})+(?:,\d+)?$/.test(money) ||
    /^\d{1,3}(?:,\d{3})+(?:\.\d+)?$/.test(money);
  if (!validMoney || !/^\d+(?:[.,]\d+)?$/.test(rawHours.trim())) return null;
  const rate =
    typeof data.rate === "number"
      ? data.rate
      : parseMoneyInput(rawRate, paymentType);
  const hoursPerDay = parseNumberInput(rawHours);
  if (
    !Number.isFinite(rate) ||
    rate < 0 ||
    !Number.isFinite(hoursPerDay) ||
    hoursPerDay < 0 ||
    hoursPerDay > 24
  )
    return null;
  if (
    !isDateOnly(data.startDate) ||
    !isDateOnly(data.endDate) ||
    data.endDate < data.startDate
  )
    return null;
  const leave = data.timeOffDays as Record<string, unknown> | undefined;
  return {
    monthlyCycle: normalizeMonthlyCycle(data.monthlyCycle),
    paymentType,
    rate,
    hoursPerDay,
    startDate: data.startDate,
    endDate: data.endDate,
    freeWeekdays: Array.isArray(data.freeWeekdays)
      ? [
          ...new Set(
            data.freeWeekdays.filter(
              (day): day is number =>
                Number.isInteger(day) && day >= 0 && day <= 6,
            ),
          ),
        ]
      : [0, 6],
    timeOffDays: {
      vtoDays: parseDayCountInput(String(leave?.vtoDays ?? 0)),
      ptoDays: parseDayCountInput(String(leave?.ptoDays ?? 0)),
    },
  };
}
