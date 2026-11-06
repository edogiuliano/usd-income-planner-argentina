import type { PaymentType } from "@/types";

export function parseNumberInput(value: string): number {
  if (!value) return 0;
  const normalized = value.replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseMoneyInput(
  value: string,
  paymentType: PaymentType,
): number {
  const compact = value.replace(/\s/g, "");
  let normalized = compact;
  if (compact.includes(",") && compact.includes(".")) {
    const decimal =
      compact.lastIndexOf(",") > compact.lastIndexOf(".") ? "," : ".";
    normalized = compact
      .replace(decimal === "," ? /\./g : /,/g, "")
      .replace(",", ".");
  } else if (
    paymentType === "monthly" &&
    /^\d{1,3}(?:\.\d{3})+$/.test(compact)
  ) {
    normalized = compact.replace(/\./g, "");
  } else {
    normalized = compact.replace(",", ".");
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseDayCountInput(value: string): number {
  return Math.max(Math.trunc(parseNumberInput(value)), 0);
}
