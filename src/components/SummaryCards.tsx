import { formatCurrency, formatNumber, formatUsd } from "@/lib/formatters";
import {
  convertUsd,
  getConversionRate,
  operationLabel,
} from "@/lib/conversion";
import type {
  CycleDays,
  ExchangeOperation,
  ExchangeRate,
  IncomeResult,
  PaymentType,
} from "@/types";

interface SummaryCardsProps {
  cycleDays: CycleDays;
  incomeResult: IncomeResult;
  paymentType?: PaymentType;
  primaryRate: ExchangeRate | null;
  operation: ExchangeOperation;
  isLoadingRates: boolean;
  ratesError: string | null;
}

export function SummaryCards({
  cycleDays,
  incomeResult,
  paymentType,
  primaryRate,
  operation,
  isLoadingRates,
  ratesError,
}: SummaryCardsProps) {
  const converted = primaryRate
    ? convertUsd(incomeResult.totalIncomeUsd, primaryRate, operation)
    : null;
  const statistics = [
    ["📆", "Días trabajados", formatNumber(cycleDays.workedDays)],
    ["🏖️", "Francos", formatNumber(cycleDays.freeDays)],
    ["⏱️", "Horas trabajadas", formatNumber(incomeResult.totalHours)],
    ["📅", "Días del ciclo", formatNumber(cycleDays.totalDays)],
    ...(cycleDays.ptoDays > 0
      ? [["🌴", "PTO pagos", formatNumber(cycleDays.ptoDays)]]
      : []),
    ["⏸️", "VTO sin pago", formatNumber(cycleDays.vtoDays)],
    [
      "💵",
      "Promedio diario USD",
      formatUsd(incomeResult.averageDailyIncomeUsd),
    ],
    ...(paymentType !== "hour"
      ? [
          [
            "⚡",
            "Promedio horario USD",
            formatUsd(incomeResult.averageHourlyIncomeUsd),
          ],
        ]
      : []),
  ];
  return (
    <div>
      <div className="income-totals grid min-w-0 gap-6 border-b border-zinc-200 pb-6 dark:border-white/10 xl:grid-cols-2">
        <div className="min-w-0" data-income="total-usd">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            💵 Ingreso total USD
          </p>
          <p className="income-value mt-2 text-3xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
            {formatUsd(incomeResult.totalIncomeUsd)}
          </p>
        </div>
        {primaryRate?.currencyCode !== "USD" && (
          <div className="min-w-0" data-income="converted">
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              💱 Equivalente en {primaryRate?.currencyCode ?? "moneda local"}
            </p>
            <p className="income-value mt-2 text-2xl font-bold tabular-nums">
              {converted !== null && primaryRate
                ? formatCurrency(
                    converted,
                    primaryRate.currencyCode,
                    primaryRate.locale,
                  )
                : "—"}
            </p>
            <p
              className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400"
              role="status"
            >
              {isLoadingRates
                ? "Actualizando cotización..."
                : (ratesError ??
                  (primaryRate
                    ? `${primaryRate.name} · ${primaryRate.isReference ? "Referencia única" : operationLabel(operation)} · ${formatCurrency(getConversionRate(primaryRate, operation) ?? 0, primaryRate.currencyCode, primaryRate.locale)} / USD`
                    : "Cotización no disponible"))}
            </p>
          </div>
        )}
      </div>
      {incomeResult.unpaidLeaveDeductionUsd > 0 && (
        <div className="mt-4 flex flex-wrap justify-between gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          <span>Descuento VTO incluido</span>
          <strong>−{formatUsd(incomeResult.unpaidLeaveDeductionUsd)}</strong>
        </div>
      )}
      <dl className="mt-6 grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
        {statistics.map(([icon, label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
              <span aria-hidden="true" className="mr-1.5">
                {icon}
              </span>
              {label}
            </dt>
            <dd className="mt-1 break-words text-lg font-semibold tabular-nums">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
