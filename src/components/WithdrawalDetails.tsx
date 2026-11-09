import { getProvider, getRouteSources } from "@/lib/withdrawals/catalog";
import {
  getAppliedWithdrawalFees,
  getAppliedWithdrawalFeesUsd,
  getReceiptTotal,
  withdrawalMoney,
  type ReceiptEstimate,
} from "@/lib/withdrawals/presentation";
import type { FeeRule } from "@/types/withdrawals";

function feeTerms(rule: FeeRule | null | undefined, currency: string) {
  if (!rule) return "";
  const percent = rule.percent
    ? `${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 6 }).format(rule.percent)}%`
    : "";
  const fixed = rule.fixed
    ? percent
      ? `${withdrawalMoney(rule.fixed, currency)} fijo`
      : "cargo fijo"
    : "";
  const bounds = [
    rule.min !== undefined && `mín. ${withdrawalMoney(rule.min, currency)}`,
    rule.max !== undefined && `máx. ${withdrawalMoney(rule.max, currency)}`,
  ].filter(Boolean);
  return [[percent, fixed].filter(Boolean).join(" + "), ...bounds]
    .filter(Boolean)
    .join(" · ");
}

export function WithdrawalDetails({
  receipt,
  grossUsd,
  fees,
}: {
  receipt: ReceiptEstimate;
  grossUsd: number;
  fees?: Record<string, FeeRule | null>;
}) {
  const { result } = receipt;
  const total = getReceiptTotal(grossUsd, receipt);
  const sources = getRouteSources(result.route);
  const discount =
    result.totalDiscountUsd ?? getAppliedWithdrawalFeesUsd(result);
  const rows = [
    {
      label: "Sueldo bruto (antes del retiro)",
      amount: withdrawalMoney(grossUsd, "USD"),
    },
    ...getAppliedWithdrawalFees(result).map(({ step, fee, manual }) => ({
      label: [
        step.label,
        feeTerms(manual ? fees?.[step.id] : step.fee, step.inputCurrency),
      ]
        .filter(Boolean)
        .join(" · "),
      amount: `−${withdrawalMoney(fee!, step.inputCurrency)}`,
    })),
    ...(result.totalDiscountUsd !== null || discount > 0
      ? [
          {
            label:
              discount < 0
                ? "Diferencia a favor"
                : total.partial
                  ? "Total descontado (parcial)"
                  : "Total descontado",
            amount: `${discount > 0 ? "−" : ""}${withdrawalMoney(Math.abs(discount), "USD")}`,
          },
        ]
      : []),
    ...(total.amount !== null
      ? [
          {
            label: total.partial ? "Subtotal estimado" : "Neto estimado",
            amount: withdrawalMoney(total.amount, total.currency),
          },
        ]
      : []),
  ];
  return (
    <details className="min-w-0 border-t border-zinc-200 pt-3 text-sm dark:border-white/10">
      <summary className="w-fit cursor-pointer font-medium text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white">
        Ver detalle
      </summary>
      <div className="mt-3 space-y-3">
        <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          {result.route.path.map((id) => getProvider(id).name).join(" → ")}
        </p>
        <dl className="space-y-2 text-xs">
          {rows.map(({ label, amount }, index) => (
            <div
              key={`${index}:${label}`}
              className="flex flex-wrap justify-between gap-x-4 gap-y-1 last:border-t last:border-zinc-200 last:pt-2 last:font-semibold dark:last:border-white/10"
            >
              <dt>{label}</dt>
              <dd className="income-value tabular-nums">{amount}</dd>
            </div>
          ))}
        </dl>
        {!result.complete && (
          <p className="text-xs leading-5 text-amber-700 dark:text-amber-300">
            {result.issues[0] ?? "Faltan datos para estimar el neto."}
          </p>
        )}
        {sources.length > 0 && (
          <p className="flex flex-wrap items-center gap-x-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            Fuentes oficiales:{" "}
            {sources.map((source, index) => (
              <a
                key={source.id}
                href={source.url}
                title={source.title}
                aria-label={source.title}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                {index + 1}
              </a>
            ))}
          </p>
        )}
      </div>
    </details>
  );
}
