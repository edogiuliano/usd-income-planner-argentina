import { formatCurrency } from "@/lib/formatters";
import { estimateWithdrawal, roundMoney } from "@/lib/withdrawals/engine";
import { getConversionRate } from "@/lib/conversion";
import { getRouteSteps } from "@/lib/withdrawals/catalog";
import type { CountryCode, ExchangeOperation, ExchangeRate } from "@/types";
import type {
  WithdrawalResult,
  WithdrawalRoute,
  WithdrawalScenario,
} from "@/types/withdrawals";

const nominalDollarAssets = ["USDC", "USDc", "USDs"];

export type ReceiptEstimate = {
  result: WithdrawalResult;
  usdValues: Record<string, number>;
  referenceRates: Record<string, number>;
  nominalCurrencies: string[];
};

// Reference assumptions are display-only: never persist them as a provider quote.
export function estimateReceipt(input: {
  grossUsd: number;
  country: CountryCode;
  route: WithdrawalRoute;
  scenario?: Partial<WithdrawalScenario>;
  primaryRate: ExchangeRate | null;
  operation: ExchangeOperation;
  asOfDate: string;
}): ReceiptEstimate {
  const scenario = input.scenario ?? {};
  const steps = getRouteSteps(input.route);
  const reference = input.primaryRate
    ? getConversionRate(input.primaryRate, input.operation)
    : null;
  const usdValues: Record<string, number> = {};
  for (const currency of nominalDollarAssets) usdValues[currency] = 1;
  if (input.primaryRate && reference)
    usdValues[input.primaryRate.currencyCode] = 1 / reference;
  Object.assign(usdValues, scenario.usdValues, { USD: 1 });
  const rates = { ...scenario.rates };
  const referenceRates: Record<string, number> = {};
  for (const step of steps) {
    if (
      step.inputCurrency === step.outputCurrency ||
      rates[step.id] !== undefined
    )
      continue;
    const from = usdValues[step.inputCurrency],
      to = usdValues[step.outputCurrency];
    if (Number.isFinite(from) && from > 0 && Number.isFinite(to) && to > 0) {
      const rate = from / to;
      if (Number.isFinite(rate) && rate > 0)
        rates[step.id] = referenceRates[step.id] = rate;
    }
  }
  return {
    result: estimateWithdrawal({
      ...input,
      steps,
      scenario: { ...scenario, rates },
      usdValues,
    }),
    usdValues,
    referenceRates,
    nominalCurrencies: [
      ...new Set(
        steps.flatMap((step) => [step.inputCurrency, step.outputCurrency]),
      ),
    ].filter(
      (currency) =>
        nominalDollarAssets.includes(currency) &&
        scenario.usdValues?.[currency] === undefined,
    ),
  };
}

export function getReceiptTotal(
  grossUsd: number,
  receipt: ReceiptEstimate | null,
) {
  if (!receipt) return { amount: grossUsd, currency: "USD", partial: false };
  if (receipt.result.complete)
    return { amount: receipt.result.netUsd, currency: "USD", partial: false };
  const preview = getWithdrawalPreview(receipt.result);
  const amount = preview.amount ?? receipt.result.steps[0]?.input ?? null;
  const unitValue = receipt.usdValues[preview.currency];
  return amount !== null && Number.isFinite(unitValue) && unitValue > 0
    ? { amount: roundMoney(amount * unitValue), currency: "USD", partial: true }
    : { amount, currency: preview.currency, partial: true };
}

export function withdrawalMoney(amount: number, currency: string) {
  return ["USDc", "USDC", "USDs"].includes(currency)
    ? `${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 6 }).format(amount)} ${currency}`
    : formatCurrency(amount, currency, "es-AR");
}

function* calculatedStages(result: WithdrawalResult) {
  let currency = "USD";
  for (const item of result.steps) {
    if (item.input === null || item.step.inputCurrency !== currency) break;
    const successful = item.output !== null && !item.pending;
    const awaitingFx =
      item.output === null &&
      item.rate === null &&
      item.step.inputCurrency !== item.step.outputCurrency &&
      item.fee !== null &&
      item.fee <= item.input &&
      item.input >= (item.step.minimumAmount ?? 0);
    if (!successful && !awaitingFx) break;
    const amount = successful
      ? item.output
      : roundMoney(item.input - item.fee!, item.step.inputCurrency);
    currency = successful ? item.step.outputCurrency : item.step.inputCurrency;
    yield { item, amount, currency };
    if (!successful) break;
  }
}

export function getAppliedWithdrawalFees(result: WithdrawalResult) {
  return Array.from(calculatedStages(result), ({ item }) => item).filter(
    (item) => item.fee !== null && item.fee > 0,
  );
}

export function getAppliedWithdrawalFeesUsd(result: WithdrawalResult) {
  return (
    result.totalFeeUsd ??
    roundMoney(
      getAppliedWithdrawalFees(result).reduce(
        (total, item) => total + (item.feeUsd ?? 0),
        0,
      ),
    )
  );
}

// Expose only balances already calculated by the engine, never skip an unknown stage.
export function getWithdrawalPreview(result: WithdrawalResult) {
  let amount: number | null = null;
  let currency = "USD";
  const fees: Record<string, number> = {};
  for (const stage of calculatedStages(result)) {
    const { item } = stage;
    if (item.fee !== null && item.fee > 0) {
      fees[item.step.inputCurrency] = roundMoney(
        (fees[item.step.inputCurrency] ?? 0) + item.fee,
        item.step.inputCurrency,
      );
    }
    amount = stage.amount;
    currency = stage.currency;
  }
  const destinationKnown =
    result.steps.length > 0 &&
    result.steps.every((item) => item.output !== null && !item.pending) &&
    currency === result.route.currency;
  return { amount, currency, fees, destinationKnown };
}

export function recommendWithdrawal(
  current: ReceiptEstimate,
  alternatives: ReceiptEstimate[],
  primaryRate: ExchangeRate | null,
  operation: ExchangeOperation,
) {
  const rate = primaryRate && getConversionRate(primaryRate, operation);
  const comparableUsd = ({ result, referenceRates }: ReceiptEstimate) => {
    // A market reference can illustrate a payout, but cannot establish its execution cost.
    if (
      !result.complete ||
      result.stale ||
      result.finalAmount === null ||
      Object.keys(referenceRates).length
    )
      return null;
    const currency = result.route.currency;
    const unitValue =
      currency === "USD" || nominalDollarAssets.includes(currency)
        ? 1
        : rate && primaryRate?.currencyCode === currency
          ? 1 / rate
          : null;
    if (unitValue === null) return null;
    const net = roundMoney(result.finalAmount * unitValue);
    return Number.isFinite(net) ? net : null;
  };
  const currentNet = comparableUsd(current);
  if (currentNet === null) return null;
  let best: { route: WithdrawalRoute; net: number } | null = null;
  for (const alternative of alternatives) {
    if (alternative.result.route.id === current.result.route.id) continue;
    const net = comparableUsd(alternative);
    if (net !== null && (!best || net > best.net))
      best = { route: alternative.result.route, net };
  }
  if (!best) return null;
  return best.net > currentNet
    ? {
        kind: "saving" as const,
        route: best.route,
        savingsUsd: roundMoney(best.net - currentNet),
      }
    : { kind: "best" as const };
}
