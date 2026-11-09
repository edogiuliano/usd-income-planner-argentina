import { convertUsd, operationLabel } from "@/lib/conversion";
import { formatCurrency } from "@/lib/formatters";
import {
  formatWithdrawalOutcomes,
  getReceiptOutcomes,
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
  const outcomes = getReceiptOutcomes(grossUsd, receipt);
  const kind = receipt?.feeCases?.kind;
  const partial = outcomes.some((outcome) => outcome.partial) || unavailable;
  const mainAmounts = formatWithdrawalOutcomes(
    outcomes.map(({ amount }) => amount),
    kind,
    (amount) => withdrawalMoney(amount, outcomes[0].currency),
    "Pendiente de estimar",
  );
  const converted =
    ready && primaryRate
      ? formatWithdrawalOutcomes(
          outcomes.map(({ amount, currency, result }) =>
            result?.finalAmount != null &&
            result.route.currency === primaryRate.currencyCode
              ? result.finalAmount
              : amount !== null && currency === "USD"
                ? convertUsd(amount, primaryRate, operation)
                : null,
          ),
          kind,
          (amount) =>
            `${formatCurrency(amount, primaryRate.currencyCode, primaryRate.locale)} ${primaryRate.currencyCode}`,
          "—",
        )
      : "—";
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
          className={`income-value font-bold leading-tight tabular-nums text-emerald-700 dark:text-emerald-300 ${outcomes.length > 1 ? "text-2xl sm:text-3xl" : "text-4xl sm:text-5xl"}`}
          data-withdrawal={ready ? (partial ? "partial" : "final") : undefined}
        >
          {ready ? mainAmounts : "..."}
        </p>
      </div>
      {primaryRate?.currencyCode !== "USD" &&
        outcomes[0].currency !== primaryRate?.currencyCode && (
          <div className="mt-2 min-w-0" data-income="converted">
            <p className="income-value text-xl font-semibold leading-snug tabular-nums text-zinc-700 dark:text-zinc-200 sm:text-2xl">
              ≈ {converted}
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
      {ready &&
        receipt &&
        (kind || receipt.result.route.receiverCostsUnverified) && (
          <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            {kind === "average" &&
              "Estimación con la comisión promedio relevada. "}
            {kind === "range" && "Escenarios con la comisión mínima y máxima. "}
            {kind === "alternatives" &&
              "Dos comisiones posibles, no acumulables. "}
            {receipt.result.route.receiverCostsUnverified &&
              "El destino puede aplicar cargos adicionales."}
          </p>
        )}
    </div>
  );
}
