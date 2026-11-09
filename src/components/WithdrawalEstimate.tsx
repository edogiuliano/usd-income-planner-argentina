import { convertUsd, operationLabel } from "@/lib/conversion";
import { formatCurrency } from "@/lib/formatters";
import {
  getReceiptTotal,
  withdrawalMoney,
  type ReceiptEstimate,
} from "@/lib/withdrawals/presentation";
import type { ExchangeOperation, ExchangeRate } from "@/types";

export function WithdrawalEstimate({
  grossUsd,
  receipt,
  primaryRate,
  operation,
  isLoadingRates = false,
  ratesError = null,
  ready = true,
  unavailable = false,
}: {
  grossUsd: number;
  receipt: ReceiptEstimate | null;
  primaryRate: ExchangeRate | null;
  operation: ExchangeOperation;
  isLoadingRates?: boolean;
  ratesError?: string | null;
  ready?: boolean;
  unavailable?: boolean;
}) {
  const total = getReceiptTotal(grossUsd, receipt);
  const partial = total.partial || unavailable;
  const converted =
    ready && primaryRate && total.amount !== null && total.currency === "USD"
      ? convertUsd(total.amount, primaryRate, operation)
      : null;
  return (
    <div
      className="income-totals min-w-0 border-b border-zinc-200 pb-5 dark:border-white/10"
      aria-label="Total estimado a recibir"
      aria-live="polite"
      aria-atomic="true"
    >
      {ready && partial && (
        <p
          role="status"
          className="mb-2 text-xs font-medium leading-5 text-amber-700 dark:text-amber-300"
        >
          Estimación parcial ·{" "}
          {unavailable
            ? "importe antes del retiro, sin tarifas verificadas."
            : "hay datos del retiro pendientes. Consultá Ver detalle."}
        </p>
      )}
      <div className="min-w-0" data-income="total-usd">
        <p
          className="income-value text-4xl font-bold leading-tight tabular-nums text-emerald-700 dark:text-emerald-300 sm:text-5xl"
          data-withdrawal={ready ? (partial ? "partial" : "final") : undefined}
        >
          {ready
            ? total.amount !== null
              ? withdrawalMoney(total.amount, total.currency)
              : "Pendiente de estimar"
            : "..."}
        </p>
      </div>
      {primaryRate?.currencyCode !== "USD" &&
        total.currency !== primaryRate?.currencyCode && (
          <div className="mt-2 min-w-0" data-income="converted">
            <p className="income-value text-xl font-semibold leading-snug tabular-nums text-zinc-700 dark:text-zinc-200 sm:text-2xl">
              ≈{" "}
              {converted !== null && primaryRate
                ? `${formatCurrency(converted, primaryRate.currencyCode, primaryRate.locale)} ${primaryRate.currencyCode}`
                : "—"}
            </p>
            <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
              {isLoadingRates
                ? "Actualizando cotización..."
                : primaryRate
                  ? `${primaryRate.name} · ${primaryRate.isReference ? "Referencia única" : operationLabel(operation)}. Conversión orientativa, no garantizada por la plataforma.`
                  : (ratesError ?? "Cotización no disponible")}
            </p>
          </div>
        )}
      {!ready && (
        <p
          role="status"
          className="mt-2 text-xs text-zinc-500 dark:text-zinc-400"
        >
          Recuperando tu retiro...
        </p>
      )}
      {ready && receipt && receipt.nominalCurrencies.length > 0 && (
        <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          {receipt.nominalCurrencies.join(" / ")} · equivalencia nominal 1:1 con
          USD, no garantizada.
        </p>
      )}
    </div>
  );
}
