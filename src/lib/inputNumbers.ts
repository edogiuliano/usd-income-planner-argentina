import type { PaymentType } from "@/types";

export function parseNumberInput(value: string): number {
  if (!value) return 0;
  const normalized = value.replace(",", ".");
  const parsed = parseFloat(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function parseMoneyInput(value: string, paymentType: PaymentType): number {
  if (paymentType !== "monthly") {
    return parseNumberInput(value);
  }

  const normalized = value.replace(/\./g, "").replace(",", ".");
  const parsed = parseFloat(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function parseDayCountInput(value: string): number {
  return Math.max(Math.trunc(parseNumberInput(value)), 0);
}
