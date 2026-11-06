import type { ExchangeOperation, ExchangeRate } from "@/types";

export const normalizeRateId = (id: string) =>
  id.toLowerCase().replace(/-\d+$/, "");

export function selectPreferredRate(
  rates: ExchangeRate[],
  preferred = "cripto",
) {
  return (
    rates.find(
      (rate) => normalizeRateId(rate.casa) === normalizeRateId(preferred),
    ) ??
    rates[0] ??
    null
  );
}

export function getConversionRate(
  rate: ExchangeRate,
  operation: ExchangeOperation = "sell-usd",
) {
  const value = operation === "sell-usd" ? rate.buy : rate.sell;
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function convertUsd(
  amount: number,
  rate: ExchangeRate,
  operation: ExchangeOperation = "sell-usd",
) {
  const value = getConversionRate(rate, operation);
  return value === null ? null : amount * value;
}

export const operationLabel = (operation: ExchangeOperation) =>
  operation === "sell-usd"
    ? "Vender USD · compra de la entidad"
    : "Comprar USD · venta de la entidad";
