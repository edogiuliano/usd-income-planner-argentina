import { getProvider, getRouteSources } from "@/lib/withdrawals/catalog";
import {
  getAppliedWithdrawalFees,
  getAppliedWithdrawalFeesUsd,
  getReceiptOutcomes,
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
}: {
  receipt: ReceiptEstimate;
  grossUsd: number;
}) {
  const { result } = receipt;
  const outcomes = getReceiptOutcomes(grossUsd, receipt);
  const total = outcomes[0];
  const multiple = outcomes.length > 1;
  const sources = getRouteSources(result.route);
  const discount =
    result.totalDiscountUsd ?? getAppliedWithdrawalFeesUsd(result);
  const rows = [
    {
      label: "Sueldo bruto (antes del retiro)",
      amount: withdrawalMoney(grossUsd, "USD"),
    },
    ...(multiple
      ? outcomes.map(({ result: scenario, amount, currency }, index) => ({
          label: `Con comisión de ${withdrawalMoney(receipt.feeCases!.cases[index].fee, "USD")}`,
          amount:
            scenario?.finalAmount != null && scenario.route.group === "local"
              ? withdrawalMoney(scenario.finalAmount, scenario.route.currency)
              : amount === null
                ? "Saldo insuficiente"
                : withdrawalMoney(amount, currency),
        }))
      : getAppliedWithdrawalFees(result, true).map(
          ({ step, fee, feeRule }) => ({
            label:
              step.variableFee?.kind === "average"
                ? "Comisión SWIFT promedio"
                : [step.label, feeTerms(feeRule, step.inputCurrency)]
                    .filter(Boolean)
                    .join(" · "),
            amount:
              fee === 0
                ? "Sin cargo"
                : `−${withdrawalMoney(fee!, step.inputCurrency)}`,
          }),
        )),
    ...(!multiple && (result.totalDiscountUsd !== null || discount > 0)
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
    ...(!multiple && total.amount !== null
      ? [
          {
            label: total.partial ? "Subtotal estimado" : "Neto estimado",
            amount: withdrawalMoney(total.amount, total.currency),
          },
        ]
      : []),
    ...(result.finalAmount !== null && result.route.currency !== "USD"
      ? [
          {
            label: "Saldo en destino",
            amount: withdrawalMoney(result.finalAmount, result.route.currency),
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
        <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          {result.route.conditions}
        </p>
        {result.complete &&
          result.steps.some(
            ({ step }) =>
              receipt.referenceRates[step.id] !== undefined &&
              !receipt.nominalCurrencies.includes(step.outputCurrency),
          ) && (
            <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
              Saldo de destino orientativo con la cotización de la app.
            </p>
          )}
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
        {!multiple && !result.complete && (
          <p className="text-xs leading-5 text-amber-700 dark:text-amber-300">
            {result.steps[0]?.step.feeStatus === "pending" && !receipt.feeCases
              ? "Comisión a confirmar."
              : (result.issues[0] ?? "Faltan datos para estimar el neto.")}
          </p>
        )}
        {sources.length > 0 && (
          <p className="flex flex-wrap items-center gap-x-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            Fuentes:{" "}
            {sources.map((source, index) =>
              source.url ? (
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
              ) : (
                <span key={source.id}>{source.title}</span>
              ),
            )}
          </p>
        )}
      </div>
    </details>
  );
}
