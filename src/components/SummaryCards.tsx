import { formatNumber, formatUsd } from "@/lib/formatters";
import { WithdrawalEstimate } from "@/components/WithdrawalEstimate";
import {
  getReceiptDiscountLabel,
  withdrawalMoney,
  type ReceiptEstimate,
} from "@/lib/withdrawals/presentation";
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
  receipt: ReceiptEstimate | null;
  ready: boolean;
  unavailable: boolean;
}

export function SummaryCards({
  cycleDays,
  incomeResult,
  paymentType,
  primaryRate,
  operation,
  isLoadingRates,
  ratesError,
  receipt,
  ready,
  unavailable,
}: SummaryCardsProps) {
  const discounts = [
    [
      "Descuento VTO incluido",
      incomeResult.unpaidLeaveDeductionUsd > 0
        ? `−${withdrawalMoney(incomeResult.unpaidLeaveDeductionUsd, "USD")}`
        : null,
    ],
    [
      "Comisiones de retiro incluidas",
      ready ? getReceiptDiscountLabel(receipt) : null,
    ],
  ] as const;
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
      <WithdrawalEstimate
        grossUsd={incomeResult.totalIncomeUsd}
        receipt={receipt}
        primaryRate={primaryRate}
        operation={operation}
        isLoadingRates={isLoadingRates}
        ratesError={ratesError}
        ready={ready}
        unavailable={unavailable}
      />
      {discounts
        .filter(([, amount]) => amount !== null)
        .map(([label, amount]) => (
          <div
            key={label}
            className="mt-3 flex flex-wrap justify-between gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
          >
            <span>{label}</span>
            <strong className="tabular-nums">{amount}</strong>
          </div>
        ))}
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
