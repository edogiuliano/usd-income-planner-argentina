import { differenceInCalendarDays, isValid, parseISO } from "date-fns";
import type { CountryCode } from "@/types";
import type {
  FeeRule,
  WithdrawalResult,
  WithdrawalRoute,
  WithdrawalScenario,
  WithdrawalStep,
  WithdrawalStepResult,
} from "@/types/withdrawals";

const precision = (currency: string) => {
  if (["USDc", "USDs", "USDC", "USDT"].includes(currency)) return 1e6;
  return ["BTC", "ETH", "SOL", "DASH"].includes(currency) ? 1e8 : 100;
};
export const roundMoney = (amount: number, currency = "USD") =>
  Math.round((amount + Number.EPSILON) * precision(currency)) /
  precision(currency);
const finiteNonnegative = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;
const positive = (value: unknown): value is number =>
  finiteNonnegative(value) && value > 0;

export function isValidFee(rule: unknown): rule is FeeRule {
  if (!rule || typeof rule !== "object") return false;
  const fee = rule as FeeRule;
  if (fee.percent === undefined && fee.fixed === undefined) return false;
  if (
    [fee.percent, fee.fixed, fee.min, fee.max].some(
      (value) => value !== undefined && !finiteNonnegative(value),
    )
  )
    return false;
  if ((fee.percent ?? 0) > 100) return false;
  return fee.min === undefined || fee.max === undefined || fee.min <= fee.max;
}

export function calculateFee(amount: number, rule: FeeRule, currency = "USD") {
  if (!finiteNonnegative(amount) || !isValidFee(rule))
    throw new Error("Invalid withdrawal fee");
  let fee = amount * ((rule.percent ?? 0) / 100) + (rule.fixed ?? 0);
  fee = Math.max(fee, rule.min ?? 0);
  if (rule.max !== undefined) fee = Math.min(fee, rule.max);
  if (!Number.isFinite(fee)) throw new Error("Fee overflow");
  return roundMoney(fee, currency);
}

export function isCatalogStale(verifiedAt: string, asOfDate: string) {
  const verified = parseISO(verifiedAt),
    asOf = parseISO(asOfDate);
  return (
    !isValid(verified) ||
    !isValid(asOf) ||
    differenceInCalendarDays(asOf, verified) > 90
  );
}

type WithdrawalInput = {
  grossUsd: number;
  country: CountryCode;
  route: WithdrawalRoute;
  steps: WithdrawalStep[];
  scenario?: Partial<WithdrawalScenario>;
  usdValues?: Record<string, number>;
  asOfDate: string;
};

export function estimateWithdrawal(input: WithdrawalInput): WithdrawalResult {
  const { route, scenario = {} } = input;
  const stale = isCatalogStale(route.verifiedAt, input.asOfDate);
  const issues: string[] = [];
  if (
    route.availability === "unconfirmed" ||
    !route.countries.includes(input.country)
  )
    issues.push("La ruta no está verificada para este país.");
  if (!finiteNonnegative(input.grossUsd))
    issues.push("El monto bruto no es válido.");
  if (
    input.steps.length !== route.steps.length ||
    input.steps.some((step, index) => step.id !== route.steps[index])
  )
    issues.push("La ruta está incompleta.");
  let balance: number | null = issues.length
    ? null
    : roundMoney(input.grossUsd);
  let currentCurrency = "USD";
  let knownFeesUsd = 0;
  let missingFeeValuation = false;
  // USD is always exactly USD. A user cannot replace this base valuation.
  const usdValues: Record<string, number> = {
    ...input.usdValues,
    ...scenario.usdValues,
    USD: 1,
  };
  const results: WithdrawalStepResult[] = [];

  for (const step of input.steps) {
    const before = balance;
    let pending = false;
    if (step.inputCurrency !== currentCurrency) {
      issues.push(`${step.label}: las monedas de la ruta no coinciden.`);
      pending = true;
      balance = null;
    }
    if (
      step.minimumAmount !== undefined &&
      before !== null &&
      before < step.minimumAmount
    ) {
      issues.push(
        `${step.label}: mínimo ${step.minimumAmount} ${step.inputCurrency}.`,
      );
      pending = true;
      balance = null;
    }
    const manualRule = scenario.fees?.[step.id];
    const manual = manualRule !== undefined;
    const official =
      step.feeStatus === "listed" || (step.feeStatus === "official" && !stale);
    const included = step.feeStatus === "included-in-rate";
    const catalogRule =
      step.feeTiers && before !== null
        ? (step.feeTiers.find(
            ({ below, above }) =>
              (below === undefined || before < below) &&
              (above === undefined || before > above),
          )?.fee ?? null)
        : step.fee;
    const rule = manual
      ? manualRule
      : official || included
        ? catalogRule
        : null;
    let fee: number | null = null;
    if (!rule || !isValidFee(rule)) {
      issues.push(
        `${step.label}: costo pendiente de confirmar${stale && step.feeStatus === "official" ? " (tarifa antigua)" : ""}.`,
      );
      pending = true;
      balance = null;
    } else if (before !== null) {
      try {
        fee = calculateFee(before, rule, step.inputCurrency);
      } catch {
        issues.push(`${step.label}: cargo fuera de rango.`);
        pending = true;
        balance = null;
      }
      if (fee !== null && fee > before) {
        issues.push(`${step.label}: el saldo no alcanza para cubrir el cargo.`);
        pending = true;
        balance = null;
      } else if (balance !== null && fee !== null)
        balance = roundMoney(before - fee, step.inputCurrency);
    } else if ((rule.percent ?? 0) === 0) {
      fee = calculateFee(0, rule, step.inputCurrency);
    }
    const unitValue = usdValues[step.inputCurrency];
    const feeUsd =
      fee === 0
        ? 0
        : fee !== null && positive(unitValue)
          ? fee * unitValue
          : null;
    if (feeUsd !== null && Number.isFinite(feeUsd)) knownFeesUsd += feeUsd;
    else if (fee !== null && fee > 0) missingFeeValuation = true;

    const needsFx = step.inputCurrency !== step.outputCurrency;
    const rate = needsFx ? (scenario.rates?.[step.id] ?? null) : 1;
    if (needsFx && !positive(rate)) {
      issues.push(`${step.label}: cotización pendiente de confirmar.`);
      pending = true;
      balance = null;
    } else if (balance !== null && rate !== null) {
      balance = roundMoney(balance * rate, step.outputCurrency);
      if (!Number.isFinite(balance)) {
        issues.push(`${step.label}: monto fuera de rango.`);
        pending = true;
        balance = null;
      }
    }
    if (
      step.maximumOutput !== undefined &&
      balance !== null &&
      balance > step.maximumOutput
    ) {
      issues.push(
        `${step.label}: supera el máximo de ${step.maximumOutput} ${step.outputCurrency}.`,
      );
      pending = true;
      balance = null;
    }
    results.push({
      step,
      input: before,
      fee,
      feeRule: rule,
      feeUsd,
      output: balance,
      rate,
      manual,
      pending,
    });
    currentCurrency = step.outputCurrency;
  }
  if (currentCurrency !== route.currency)
    issues.push("La moneda final no coincide con el destino.");
  const finalUnitValue = usdValues[route.currency];
  if (!positive(finalUnitValue) || missingFeeValuation)
    issues.push(
      "Falta la cotización de referencia para expresar el resultado en USD.",
    );
  if (
    balance !== null &&
    positive(finalUnitValue) &&
    (!Number.isFinite(balance * finalUnitValue) ||
      !Number.isFinite(knownFeesUsd))
  )
    issues.push("El monto o la cotización excede el rango del simulador.");
  const complete = balance !== null && issues.length === 0;
  const netUsd = complete ? roundMoney(balance! * finalUnitValue) : null;
  const totalFeeUsd = complete ? roundMoney(knownFeesUsd) : null;
  const totalDiscountUsd =
    netUsd === null ? null : roundMoney(input.grossUsd - netUsd);
  const fxDifferenceUsd =
    totalDiscountUsd === null || totalFeeUsd === null
      ? null
      : roundMoney(totalDiscountUsd - totalFeeUsd);
  return {
    route,
    steps: results,
    complete,
    issues: [...new Set(issues)],
    stale,
    finalAmount: complete ? balance : null,
    netUsd,
    totalFeeUsd,
    knownFeesUsd: roundMoney(knownFeesUsd),
    totalDiscountUsd,
    fxDifferenceUsd,
  };
}

export function estimateWithdrawalCases(input: WithdrawalInput) {
  const step = input.steps.find((item) => item.variableFee);
  const tariff = step?.variableFee;
  if (!step || !tariff || input.scenario?.fees?.[step.id] !== undefined)
    return null;
  const amounts =
    tariff.kind === "range"
      ? [tariff.min, tariff.max]
      : tariff.kind === "alternatives"
        ? tariff.amounts
        : [tariff.amount];
  return {
    kind: tariff.kind,
    cases: amounts.map((fee) => ({
      fee,
      result: estimateWithdrawal({
        ...input,
        steps: input.steps.map((item) =>
          item === step
            ? { ...item, fee: { fixed: fee }, feeStatus: "listed" }
            : item,
        ),
      }),
    })),
  };
}

export function rankWithdrawals(results: WithdrawalResult[], currency: string) {
  return results
    .filter(
      (result) =>
        result.complete &&
        result.route.currency === currency &&
        result.finalAmount !== null,
    )
    .sort((a, b) => b.finalAmount! - a.finalAmount!);
}
